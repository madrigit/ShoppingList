const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const firestore = admin.firestore();

// ===== Authentication Functions =====

// Create user in Firestore after email signup
exports.createUser = functions.https.onCall(async (rawData, context) => {
  const data = rawData.data;
  console.log("createUser function called with data:", data);
  try {
    // Validate data
    if (!data.uid || !data.email || !data.name) {
      throw new functions.https.HttpsError(
          "invalid-argument",
          "The function must be called with uid, email, and name arguments.",
      );
    }

    // Create user document in Firestore
    await firestore.collection("users").doc(data.uid).set({
      email: data.email,
      name: data.name,
      id: data.uid,
      facebookId: data.authProvider === "facebook" ? data.facebookId || "" : "",
      googleId: data.authProvider === "google" ? data.googleId || "" : "",
      invites: [],
      groups: [],
      creationDate: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {success: true};
  } catch (error) {
    console.error("Error creating user:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Handle Google authentication (check if user exists, create if not)
exports.handleGoogleAuth = functions.https.onCall(async (data, context) => {
  try {
    // Validate data
    if (!data.uid || !data.googleId) {
      throw new functions.https.HttpsError(
          "invalid-argument",
          "The function must be called with uid and googleId arguments.",
      );
    }

    // Check if user exists with this Google ID
    const googleIdQuery = await firestore
        .collection("users")
        .where("googleId", "==", data.googleId)
        .limit(1)
        .get();

    // If no user found with Google ID, check by email
    if (googleIdQuery.empty && data.email) {
      const emailQuery = await firestore
          .collection("users")
          .where("email", "==", data.email)
          .limit(1)
          .get();

      // User found by email, update with Google ID
      if (!emailQuery.empty) {
        const userDoc = emailQuery.docs[0];
        await userDoc.ref.update({
          googleId: data.googleId,
        });
        return {success: true};
      }
    // User found by Google ID
    } else if (!googleIdQuery.empty) {
      return {success: true};
    }

    // No user found, create new user
    await firestore.collection("users").doc(data.uid).set({
      email: data.email || "",
      name: data.name || "",
      id: data.uid,
      facebookId: "",
      googleId: data.googleId,
      invites: [],
      groups: [],
      creationDate: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {success: true};
  } catch (error) {
    console.error("Error handling Google auth:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Handle Facebook authentication (check if user exists, create if not)
exports.handleFacebookAuth = functions.https.onCall(async (data, context) => {
  try {
    // Validate data
    if (!data.uid || !data.facebookId) {
      throw new functions.https.HttpsError(
          "invalid-argument",
          "The function must be called with uid and facebookId arguments.",
      );
    }

    // Check if user exists with this Facebook ID
    const facebookIdQuery = await firestore
        .collection("users")
        .where("facebookId", "==", data.facebookId)
        .limit(1)
        .get();

    // If no user found with Facebook ID, check by email
    if (facebookIdQuery.empty && data.email) {
      const emailQuery = await firestore
          .collection("users")
          .where("email", "==", data.email)
          .limit(1)
          .get();

      // User found by email, update with Facebook ID
      if (!emailQuery.empty) {
        const userDoc = emailQuery.docs[0];
        await userDoc.ref.update({
          facebookId: data.facebookId,
        });
        return {success: true};
      }
    // User found by Facebook ID
    } else if (!facebookIdQuery.empty) {
      return {success: true};
    }

    // No user found, create new user
    await firestore.collection("users").doc(data.uid).set({
      email: data.email || "",
      name: data.name || "",
      id: data.uid,
      facebookId: data.facebookId,
      googleId: "",
      invites: [],
      groups: [],
      creationDate: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {success: true};
  } catch (error) {
    console.error("Error handling Facebook auth:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// ===== User Functions =====

// Get user data
exports.getUserData = functions.https.onCall(async (data, context) => {
  try {
    // Ensure authenticated
    if (!data.auth) {
      throw new functions.https.HttpsError(
          "unauthenticated",
          "The function must be called while authenticated.",
      );
    }

    // Validate data
    if (!data.uid) {
      throw new functions.https.HttpsError(
          "invalid-argument",
          "The function must be called with a uid argument.",
      );
    }

    // Ensure user is requesting their own data
    if (data.uid !== data.auth.uid) {
      throw new functions.https.HttpsError(
          "permission-denied",
          "You can only access your own user data.",
      );
    }

    // Get user data
    const userDoc = await firestore.collection("users").doc(data.uid).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
          "not-found",
          "User not found.",
      );
    }

    return userDoc.data();
  } catch (error) {
    console.error("Error getting user data:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Get user"s groups
exports.getUserGroups = functions.https.onCall(async (data, context) => {
  try {
    // Ensure authenticated
    if (!data.auth) {
      throw new functions.https.HttpsError(
          "unauthenticated",
          "The function must be called while authenticated.",
      );
    }

    // Validate data
    if (!data.data.uid) {
      throw new functions.https.HttpsError(
          "invalid-argument",
          "The function must be called with a uid argument.",
      );
    }

    // Ensure user is requesting their own data
    if (data.data.uid !== data.auth.uid) {
      throw new functions.https.HttpsError(
          "permission-denied",
          "You can only access your own groups.",
      );
    }

    // Get user"s groups
    const userDoc = await firestore.collection("users")
        .doc(data.data.uid).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
          "not-found",
          "User not found.",
      );
    }

    const userData = userDoc.data();
    return userData.groups || [];
  } catch (error) {
    console.error("Error getting user groups:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// ===== Group Functions =====

// Check if group name exists for user
exports.checkGroupNameExists = functions.https.onCall(async (data, context) => {
  try {
    // Ensure authenticated
    if (!data.auth) {
      throw new functions.https.HttpsError(
          "unauthenticated",
          "The function must be called while authenticated.",
      );
    }

    // Validate data
    if (!data.uid || !data.name) {
      throw new functions.https.HttpsError(
          "invalid-argument",
          "The function must be called with uid and name arguments.",
      );
    }

    // Ensure user is checking their own groups
    if (data.uid !== data.auth.uid) {
      throw new functions.https.HttpsError(
          "permission-denied",
          "You can only check your own groups.",
      );
    }

    // Get user"s groups
    const userDoc = await firestore.collection("users").doc(data.uid).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
          "not-found",
          "User not found.",
      );
    }

    const userData = userDoc.data();
    const groupName = data.name.trim();

    // Check if group name exists
    const exists = (userData.groups || []).some(
        (group) => group.name.toLowerCase() === groupName.toLowerCase(),
    );

    return {exists};
  } catch (error) {
    console.error("Error checking group name:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Create new group
exports.createGroup = functions.https.onCall(async (data, context) => {
  console.log("Context:", context);
  console.log("Data:", data);
  try {
    // Ensure authenticated
    if (!data.auth) {
      throw new functions.https.HttpsError(
          "unauthenticated",
          "The function must be called while authenticated.",
      );
    }
    console.log("Passed auth check");
    // Validate data
    if (!data.data.uid || !data.data.name) {
      throw new functions.https.HttpsError(
          "invalid-argument",
          "The function must be called with uid and name arguments.",
      );
    }
    console.log("Passed input check");
    // Ensure user is creating group for themselves
    if (data.data.uid !== data.auth.uid) {
      throw new functions.https.HttpsError(
          "permission-denied",
          "You can only create groups for yourself.",
      );
    }
    console.log("Passed uid match");
    // Get user data
    const userDoc = await firestore.collection("users")
        .doc(data.auth.uid).get();
    console.log("fetched userDoc:", userDoc);
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
          "not-found",
          "User not found.",
      );
    }

    const userData = userDoc.data();
    const groupName = data.data.name.trim();

    // Check if group name already exists for this user
    const groupExists = (userData.groups || []).some(
        (group) => group.name.toLowerCase() === groupName.toLowerCase(),
    );

    if (groupExists) {
      throw new functions.https.HttpsError(
          "already-exists",
          "You already have a group with this name.",
      );
    }

    // Create new group
    const groupRef = firestore.collection("groups").doc();
    const groupId = groupRef.id;
    const timestamp = Date.now();

    // Group data
    await groupRef.set({
      id: groupId,
      name: groupName,
      creationDate: timestamp,
      members: [
        {
          id: data.auth.uid,
          name: userData.name,
          joinDate: timestamp,
        },
      ],
      shoppingList: [],
      history: [],
    });
    console.log("Group created");

    // Update user"s groups array
    const newGroup = {
      id: groupId,
      name: groupName,
    };

    await firestore.collection("users").doc(data.auth.uid).update({
      groups: admin.firestore.FieldValue.arrayUnion(newGroup),
    });
    console.log("Added group to user");

    return {
      success: true,
      group: newGroup,
    };
  } catch (error) {
    console.error("Error creating group:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Get group details
exports.getGroupDetails = functions.https.onCall(async (data, context) => {
  try {
    // Ensure authenticated
    if (!data.auth) {
      throw new functions.https.HttpsError(
          "unauthenticated",
          "The function must be called while authenticated.",
      );
    }

    // Validate data
    if (!data.groupId) {
      throw new functions.https.HttpsError(
          "invalid-argument",
          "The function must be called with a groupId argument.",
      );
    }

    // Get group data
    const groupDoc = await firestore.collection("groups")
        .doc(data.groupId).get();

    if (!groupDoc.exists) {
      throw new functions.https.HttpsError(
          "not-found",
          "Group not found.",
      );
    }

    const groupData = groupDoc.data();

    // Check if user is a member of the group
    const isMember = groupData.members
        .some((member) => member.id === data.auth.uid);

    if (!isMember) {
      throw new functions.https.HttpsError(
          "permission-denied",
          "You are not a member of this group.",
      );
    }

    return groupData;
  } catch (error) {
    console.error("Error getting group details:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

exports.initializeShoppingLists =
functions.https.onCall(async (data, context) => {
  try {
    // Ensure authenticated
    if (!data.auth) {
      throw new functions.https.HttpsError(
          "unauthenticated",
          "The function must be called while authenticated.",
      );
    }

    // Get all groups
    const groupsSnapshot = await firestore.collection("groups").get();

    // Update each group without a shopping list
    const updatePromises = [];

    groupsSnapshot.forEach((groupDoc) => {
      const groupData = groupDoc.data();

      // If group doesn't have a shopping list or history array, add them
      if (!groupData.shoppingList || !Array.isArray(groupData.shoppingList)) {
        updatePromises.push(
            firestore.collection("groups").doc(groupDoc.id).update({
              shoppingList: [],
            }),
        );
      }

      if (!groupData.history || !Array.isArray(groupData.history)) {
        updatePromises.push(
            firestore.collection("groups").doc(groupDoc.id).update({
              history: [],
            }),
        );
      }
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    return {success: true, message: `Updated ${updatePromises.length} groups`};
  } catch (error) {
    console.error("Error initializing shopping lists:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Send an invitation to a user
exports.sendInvitation = functions.https.onCall(async (data, context) => {
  try {
    // Ensure authenticated
    if (!data.auth) {
      throw new functions.https.HttpsError(
          "unauthenticated",
          "The function must be called while authenticated.",
      );
    }

    // Validate data
    if (!data.data.groupId || !data.data.email) {
      throw new functions.https.HttpsError(
          "invalid-argument",
          "The function must be called with groupId and email arguments.",
      );
    }

    // Get inviter details
    const inviterId = data.auth.uid;
    const inviterDoc = await firestore.collection("users").doc(inviterId).get();

    if (!inviterDoc.exists) {
      throw new functions.https.HttpsError(
          "not-found",
          "Inviter user not found.",
      );
    }

    const inviterData = inviterDoc.data();

    // Get group details
    const groupDoc = await firestore.collection("groups")
        .doc(data.data.groupId).get();

    if (!groupDoc.exists) {
      throw new functions.https.HttpsError(
          "not-found",
          "Group not found.",
      );
    }

    const groupData = groupDoc.data();

    // Check if inviter is a member of the group
    const isMember = groupData.members
        .some((member) => member.id === inviterId);

    if (!isMember) {
      throw new functions.https.HttpsError(
          "permission-denied",
          "You are not a member of this group.",
      );
    }

    // Find the invitee
    const inviteeQuerySnapshot = await firestore
        .collection("users")
        .where("email", "==", data.data.email)
        .limit(1)
        .get();

    if (inviteeQuerySnapshot.empty) {
      throw new functions.https.HttpsError(
          "not-found",
          "No user found with the provided email address.",
      );
    }

    const inviteeDoc = inviteeQuerySnapshot.docs[0];
    const inviteeData = inviteeDoc.data();
    const inviteeId = inviteeDoc.id;

    // Check if invitee is already a member of the group
    const isAlreadyMember = groupData.members
        .some((member) => member.id === inviteeId);

    if (isAlreadyMember) {
      throw new functions.https.HttpsError(
          "already-exists",
          "User is already a member of this group.",
      );
    }

    // Check if invitation already exists
    const hasInvite = (inviteeData.invites || [])
        .some((invite) => invite.groupId === data.data.groupId);

    if (hasInvite) {
      throw new functions.https.HttpsError(
          "already-exists",
          "User has already been invited to this group.",
      );
    }

    // Create invitation
    const inviteId = firestore.collection("invites")
        .doc().id; // Generate a unique ID
    const invitation = {
      id: inviteId,
      groupId: data.data.groupId,
      groupName: groupData.name,
      inviterId: inviterId,
      inviterName: inviterData.name,
      timestamp: Date.now(),
    };

    // Add invitation to invitee's invites array
    await firestore.collection("users").doc(inviteeId).update({
      invites: admin.firestore.FieldValue.arrayUnion(invitation),
    });

    return {success: true};
  } catch (error) {
    console.error("Error sending invitation:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Accept an invitation
exports.acceptInvitation = functions.https.onCall(async (data, context) => {
  try {
    // Ensure authenticated
    if (!data.auth) {
      throw new functions.https.HttpsError(
          "unauthenticated",
          "The function must be called while authenticated.",
      );
    }

    // Validate data
    if (!data.data.inviteId) {
      throw new functions.https.HttpsError(
          "invalid-argument",
          "The function must be called with an inviteId argument.",
      );
    }

    const userId = data.auth.uid;

    // Get user data with invitation
    const userDoc = await firestore.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
          "not-found",
          "User not found.",
      );
    }

    const userData = userDoc.data();

    // Find the invitation
    const invitation = (userData.invites || [])
        .find((invite) => invite.id === data.data.inviteId);

    if (!invitation) {
      throw new functions.https.HttpsError(
          "not-found",
          "Invitation not found.",
      );
    }

    // Get group data
    const groupDoc = await firestore.collection("groups")
        .doc(invitation.groupId).get();

    if (!groupDoc.exists) {
      // Remove invalid invitation
      await firestore.collection("users").doc(userId).update({
        invites: admin.firestore.FieldValue.arrayRemove(invitation),
      });

      throw new functions.https.HttpsError(
          "not-found",
          "Group not found.",
      );
    }

    const groupData = groupDoc.data();

    // Transaction to update both user and group
    await firestore.runTransaction(async (transaction) => {
      // Add user to group members
      const groupRef = firestore.collection("groups").doc(invitation.groupId);

      // Check if user is already a member of the group
      const isAlreadyMember = groupData.members
          .some((member) => member.id === userId);

      if (!isAlreadyMember) {
        const newMember = {
          id: userId,
          name: userData.name,
          joinDate: Date.now(),
        };

        transaction.update(groupRef, {
          members: admin.firestore.FieldValue.arrayUnion(newMember),
        });
      }

      // Add group to user's groups
      const userRef = firestore.collection("users").doc(userId);

      const userGroup = {
        id: invitation.groupId,
        name: groupData.name,
      };

      // Remove invitation
      transaction.update(userRef, {
        groups: admin.firestore.FieldValue.arrayUnion(userGroup),
        invites: admin.firestore.FieldValue.arrayRemove(invitation),
      });
    });

    return {success: true};
  } catch (error) {
    console.error("Error accepting invitation:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Decline an invitation
exports.declineInvitation = functions.https.onCall(async (data, context) => {
  try {
    // Ensure authenticated
    if (!data.data.auth) {
      throw new functions.https.HttpsError(
          "unauthenticated",
          "The function must be called while authenticated.",
      );
    }

    // Validate data
    if (!data.data.inviteId) {
      throw new functions.https.HttpsError(
          "invalid-argument",
          "The function must be called with an inviteId argument.",
      );
    }

    const userId = data.auth.uid;

    // Get user data with invitation
    const userDoc = await firestore.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
          "not-found",
          "User not found.",
      );
    }

    const userData = userDoc.data();

    // Find the invitation
    const invitation = (userData.invites || [])
        .find((invite) => invite.id === data.data.inviteId);

    if (!invitation) {
      throw new functions.https.HttpsError(
          "not-found",
          "Invitation not found.",
      );
    }

    // Remove invitation
    await firestore.collection("users").doc(userId).update({
      invites: admin.firestore.FieldValue.arrayRemove(invitation),
    });

    return {success: true};
  } catch (error) {
    console.error("Error declining invitation:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
