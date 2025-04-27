import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

// Context
import { AuthContext } from '../context/AuthContext';
import { LoadingContext } from '../context/LoadingContext';
import ErrorMessage from '../components/ErrorMessage';

export default function InvitesScreen() {
  const { user } = useContext(AuthContext);
  const { showLoading, hideLoading } = useContext(LoadingContext);
  const navigation = useNavigation();
  
  // Get status bar height for Android
  const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;
  
  // State
  const [invites, setInvites] = useState([]);
  const [networkError, setNetworkError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Load invites
  useEffect(() => {
    if (!user) return;
    
    showLoading('Loading invitations...');
    
    // Set up real-time listener for the user document
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setInvites(userData.invites || []);
          hideLoading();
        } else {
          console.log('User not found');
          hideLoading();
        }
      },
      (error) => {
        console.error('Error loading invitations:', error);
        setNetworkError('Failed to load invitations. Please check your connection.');
        hideLoading();
      }
    );
    
    // Clean up listener
    return () => unsubscribe();
  }, [user]);
  
  // Handle accept invitation
  const handleAccept = async (invite) => {
    try {
      showLoading('Accepting invitation...');
      
      const acceptInvitation = httpsCallable(functions, 'acceptInvitation');
      const result = await acceptInvitation({
        inviteId: invite.id
      });
      
      if (result.data.success) {
        setSuccessMessage('Invitation accepted successfully!');
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } else {
        setNetworkError(result.data.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setNetworkError('Failed to accept invitation. Please try again.');
    } finally {
      hideLoading();
    }
  };
  
  // Handle decline invitation
  const handleDecline = async (invite) => {
    try {
      showLoading('Declining invitation...');
      
      const declineInvitation = httpsCallable(functions, 'declineInvitation');
      const result = await declineInvitation({
        inviteId: invite.id
      });
      
      if (result.data.success) {
        setSuccessMessage('Invitation declined');
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } else {
        setNetworkError(result.data.error || 'Failed to decline invitation');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      setNetworkError('Failed to decline invitation. Please try again.');
    } finally {
      hideLoading();
    }
  };
  
  // Render invitation item
  const renderInviteItem = ({ item }) => (
    <View style={styles.inviteItem}>
      <View style={styles.inviteInfo}>
        <Text style={styles.groupName}>{item.groupName}</Text>
        <Text style={styles.inviterName}>Invited by: {item.inviterName}</Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => handleDecline(item)}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAccept(item)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <View style={[styles.container, { paddingTop: STATUSBAR_HEIGHT }]}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: 12 }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invitations</Text>
        <View style={styles.placeholderView} />
      </View>
      
      {/* Invitations List */}
      <FlatList
        data={invites}
        renderItem={renderInviteItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No invitations</Text>
          </View>
        )}
      />
      
      {/* Network Error */}
      {networkError ? (
        <ErrorMessage 
          message={networkError} 
          autoHide={true}
          style={styles.networkError}
        />
      ) : null}
      
      {/* Success Message */}
      {successMessage ? (
        <View style={styles.successMessageContainer}>
          <Text style={styles.successMessageText}>{successMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    padding: 4,
    width: 32,
  },
  placeholderView: {
    width: 32,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  inviteItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  inviteInfo: {
    marginBottom: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  inviterName: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  declineButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  declineButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  acceptButton: {
    backgroundColor: '#6200ee',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  networkError: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  successMessageContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successMessageText: {
    color: '#fff',
    fontSize: 16,
  },
});