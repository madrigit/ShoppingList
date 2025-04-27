import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

// Context
import AuthProvider, { AuthContext } from '../context/AuthContext';
import LoadingProvider, { LoadingContext } from '../context/LoadingContext';

// API
import { signOut } from '../../api/auth';

const CustomDrawerContent = (props) => {
  const { user } = useContext(AuthContext);
  const { showLoading, hideLoading } = useContext(LoadingContext);
  const router = useRouter();
  const pathname = usePathname();
  // State for invites count
  const [invitesCount, setInvitesCount] = useState(0);
  
  // Handle sign out
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Sign Out',
          onPress: async () => {
            showLoading('Signing out...');
            try {
              const result = await signOut();

              if (result.success) {
                hideLoading();
                router.replace("/auth");
              }
              // Router will handle redirect via root index.js when auth state changes
            } catch (error) {
              hideLoading();
              console.error('Error signing out:', error);
            } finally {
              hideLoading();
            }
          }
        }
      ]
    );
  };

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
  
  return (
    <SafeAreaView style={styles.container}>
      <DrawerContentScrollView {...props}>
        <View style={styles.header}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileIconText}>
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
            </Text>
          </View>
          <Text style={styles.displayName}>
            {user?.displayName || user?.email || 'User'}
          </Text>
          <Text style={styles.email}>
            {user?.email || ''}
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.menuItems}>
          {/* My Groups */}
          <TouchableOpacity
            style={[
              styles.menuItem, 
              pathname === '/(app)' && styles.activeMenuItem
            ]}
            onPress={() => {
              props.navigation.navigate('index');
            }}
          >
            <Ionicons 
              name="layers-outline" 
              size={22} 
              color={pathname === '/(app)' ? "#6200ee" : "#666"} 
            />
            <Text 
              style={[
                styles.menuItemText, 
                pathname === '/(app)' && styles.activeMenuItemText
              ]}
            >
              My Groups
            </Text>
          </TouchableOpacity>
          
          {/* Invites - with notification badge */}
          <TouchableOpacity
            style={[
              styles.menuItem, 
              pathname === '/(app)/invites' && styles.activeMenuItem
            ]}
            onPress={() => {
              props.navigation.navigate('invites');
            }}
          >
            <View style={styles.iconContainer}>
              <Ionicons 
                name="mail-outline" 
                size={22} 
                color={pathname === '/(app)/invites' ? "#6200ee" : "#666"} 
              />
              {invitesCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {invitesCount > 9 ? '9+' : invitesCount}
                  </Text>
                </View>
              )}
            </View>
            <Text 
              style={[
                styles.menuItemText, 
                pathname === '/(app)/invites' && styles.activeMenuItemText
              ]}
            >
              Invitations
            </Text>
            {invitesCount > 0 && (
              <View style={styles.textBadge} />
            )}
          </TouchableOpacity>
          
          {/* Settings */}
          <TouchableOpacity
            style={[
              styles.menuItem, 
              pathname === '/(app)/settings' && styles.activeMenuItem
            ]}
            onPress={() => {
              props.navigation.navigate('settings');
            }}
          >
            <Ionicons 
              name="settings-outline" 
              size={22} 
              color={pathname === '/(app)/settings' ? "#6200ee" : "#666"} 
            />
            <Text 
              style={[
                styles.menuItemText, 
                pathname === '/(app)/settings' && styles.activeMenuItemText
              ]}
            >
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={22} color="#f44336" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileIconText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  displayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  menuItems: {
    padding: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  activeMenuItem: {
    backgroundColor: '#f0e5ff',
  },
  menuItemText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  activeMenuItemText: {
    color: '#6200ee',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  signOutText: {
    fontSize: 16,
    color: '#f44336',
    marginLeft: 12,
  },
  iconContainer: {
    position: 'relative',
  },
  badgeContainer: {
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
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  textBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F44336',
    marginLeft: 8,
  }
});

export default CustomDrawerContent;