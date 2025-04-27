import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

// Get current user data from Firestore
export const getCurrentUser = async (uid) => {
  try {
    const getUserData = httpsCallable(functions, 'getUserData');
    const result = await getUserData({ uid });
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update user profile
export const updateUserProfile = async (uid, userData) => {
  try {
    const updateProfile = httpsCallable(functions, 'updateUserProfile');
    const result = await updateProfile({ uid, ...userData });
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get user's groups
export const getUserGroups = async (uid) => {
  try {
    const getGroups = httpsCallable(functions, 'getUserGroups');
    const result = await getGroups({ uid });
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get user's invites
export const getUserInvites = async (uid) => {
  try {
    const getInvites = httpsCallable(functions, 'getUserInvites');
    const result = await getInvites({ uid });
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Search user's groups
export const searchUserGroups = async (uid, searchTerm) => {
  try {
    const searchGroups = httpsCallable(functions, 'searchUserGroups');
    const result = await searchGroups({ uid, searchTerm });
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};