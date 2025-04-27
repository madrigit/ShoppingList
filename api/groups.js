import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

// Create a new group
export const createGroup = async (uid, name) => {
  try {
    const createNewGroup = httpsCallable(functions, 'createGroup');
    const result = await createNewGroup({ uid, name });
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Check if group name exists for user
export const checkGroupNameExists = async (uid, name) => {
  try {
    const checkName = httpsCallable(functions, 'checkGroupNameExists');
    const result = await checkName({ uid, name });
    return { success: true, exists: result.data.exists };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get group details
export const getGroupDetails = async (groupId) => {
  try {
    const getGroup = httpsCallable(functions, 'getGroupDetails');
    const result = await getGroup({ groupId });
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Add member to group
export const inviteToGroup = async (groupId, email) => {
  try {
    const invite = httpsCallable(functions, 'inviteToGroup');
    const result = await invite({ groupId, email });
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Accept group invitation
export const acceptInvitation = async (uid, inviteId) => {
  try {
    const accept = httpsCallable(functions, 'acceptInvitation');
    const result = await accept({ uid, inviteId });
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Decline group invitation
export const declineInvitation = async (uid, inviteId) => {
  try {
    const decline = httpsCallable(functions, 'declineInvitation');
    const result = await decline({ uid, inviteId });
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};