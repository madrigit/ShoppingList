import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signOut as firebaseSignOut
  } from 'firebase/auth';
  import { httpsCallable } from 'firebase/functions';
  import { auth, functions } from '../firebase';
  
  // Email/Password Sign In
  export const signInWithEmail = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful, user:", userCredential.user.uid);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };
  
  // Email/Password Sign Up
  export const signUpWithEmail = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Call Cloud Function to create user in Firestore
      const createUserInFirestore = httpsCallable(functions, 'createUser');
      const createUserParams = {
        uid: userCredential.user.uid,
        email: email,
        name: name,
        authProvider: 'email'
      };
      await createUserInFirestore(createUserParams);
      
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Google Sign In
  export const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Call Cloud Function to check/create user in Firestore
      const handleGoogleAuth = httpsCallable(functions, 'handleGoogleAuth');
      await handleGoogleAuth({
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName,
        googleId: result.user.providerData[0].uid
      });
      
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Facebook Sign In
  export const signInWithFacebook = async () => {
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Call Cloud Function to check/create user in Firestore
      const handleFacebookAuth = httpsCallable(functions, 'handleFacebookAuth');
      await handleFacebookAuth({
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName,
        facebookId: result.user.providerData[0].uid
      });
      
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  // Sign Out
  export const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };