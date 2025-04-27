import React, { useState, useEffect, useContext } from 'react';
import {
  Platform,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  StatusBar as RNStatusBar
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Drawer } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';

// Context
import AuthProvider, { AuthContext } from '../context/AuthContext';
import LoadingProvider, { LoadingContext } from '../context/LoadingContext';

// Components
import CustomInput from '../components/CustomInput';
import AuthButton from '../components/AuthButton';
import ErrorMessage from '../components/ErrorMessage';

// API
import { getUserGroups, searchUserGroups } from '../../api/users';
import { createGroup, checkGroupNameExists } from '../../api/groups';

export default function MainScreen() {
  const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;
  //const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const { showLoading, hideLoading } = useContext(LoadingContext);
  const navigation = useNavigation();
  
  // State
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Create group modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupError, setGroupError] = useState('');

  const [invitesCount, setInvitesCount] = useState(0);

  // Listen for invites updates
useEffect(() => {
  if (!user) return;
  
  // Set up real-time listener for the user document to count invites
  const unsubscribe = onSnapshot(
    doc(db, 'users', user.uid),
    (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setInvitesCount(userData.invites ? userData.invites.length : 0);
      }
    },
    (error) => {
      console.error('Error loading invites count:', error);
    }
  );
  
  // Clean up listener
  return () => unsubscribe();
}, [user]);
  
  // Fetch user groups
  const fetchGroups = async () => {
    if (!user) return;
    
    showLoading('Loading groups...');
    
    try {
      const result = await getUserGroups(user.uid);
      
      if (result.success) {
        setGroups(result.data);
        setFilteredGroups(result.data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      hideLoading();
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    if (!user) return;
    
    showLoading('Loading groups...');
    
    // Get a reference to the user document
    const userRef = doc(db, 'users', user.uid);
    
    // Set up a real-time listener on the user document
    const unsubscribe = onSnapshot(userRef, (userDoc) => {
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userGroups = userData.groups || [];
        
        setGroups(userGroups);
        setFilteredGroups(userGroups);
        hideLoading();
        
        console.log('Real-time update: Groups data refreshed');
      } else {
        console.log('User document not found');
        hideLoading();
      }
    }, (error) => {
      console.error('Error listening to user document:', error);
      hideLoading();
    });
    
    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [user]);
  
  // Handle search
  const handleSearch = (text) => {
    setSearchText(text);
    
    if (!text.trim()) {
      setFilteredGroups(groups);
      return;
    }
    
    const filtered = groups.filter(
      group => group.name.toLowerCase().includes(text.toLowerCase())
    );
    
    setFilteredGroups(filtered);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    // Just wait a bit to simulate a refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };
  
  // Handle create new group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setGroupError('Group name is required');
      return;
    }
    
    // Check if group name already exists
    showLoading('Checking group name...');
    
    try {
      const checkResult = await checkGroupNameExists(user.uid, newGroupName);
      
      if (checkResult.exists) {
        setGroupError('You already have this group');
        hideLoading();
        return;
      }
      
      // Create the new group
      showLoading('Creating group...');
      const createResult = await createGroup(user.uid, newGroupName);
      
      if (createResult.success) {
        // Close modal and refresh groups
        setModalVisible(false);
        setNewGroupName('');
        setGroupError('');
        fetchGroups();
      } else {
        setGroupError('Failed to create group. Please try again.');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setGroupError('Failed to create group. Please try again.');
    } finally {
      hideLoading();
    }
  };
  
  // Render group item
  const router = useRouter();

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.groupItem}
      onPress={() => router.push(`/group/${item.id}`)}
    >
      <View style={styles.groupIcon}>
        <Text style={styles.groupIconText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#888" />
    </TouchableOpacity>
  );
  
  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="layers-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Groups Yet</Text>
      <Text style={styles.emptyStateText}>
        Create your first group to get started
      </Text>
      <AuthButton
        title="Create Group"
        onPress={() => setModalVisible(true)}
        style={styles.emptyStateButton}
      />
    </View>
  );
  
  return (
    <SafeAreaView style={[styles.container, { paddingTop: STATUSBAR_HEIGHT }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons name="menu" size={24} color="#333" />
            {invitesCount > 0 && (
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>
                  {invitesCount > 9 ? '9+' : invitesCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Groups</Text>
        <View style={styles.placeholderView} />
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search group..."
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>
      
      {/* Create Group Button */}
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.createButtonText}>Create New Group</Text>
      </TouchableOpacity>
      
      {/* Groups List */}
      <FlatList
        data={filteredGroups}
        renderItem={renderGroupItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
      
      {/* Create Group Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setNewGroupName('');
          setGroupError('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            
            <CustomInput
              label="Group Name"
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Enter group name"
              autoCapitalize="words"
              error={groupError}
            />
            
            <View style={styles.modalButtons}>
              <AuthButton
                title="Cancel"
                type="secondary"
                onPress={() => {
                  setModalVisible(false);
                  setNewGroupName('');
                  setGroupError('');
                }}
                style={styles.modalButton}
              />
              
              <AuthButton
                title="Create"
                onPress={handleCreateGroup}
                disabled={!newGroupName.trim()}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingVertical: 12,
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
    width: 32, // Fixed width to balance the layout
  },
  placeholderView: {
    width: 32, // Same width as menuButton for balance
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6200ee',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  groupIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 300,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    width: 200,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  menuIconContainer: {
    position: 'relative',
  },
  menuBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  menuBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});