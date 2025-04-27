// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
// Replace this with the config object from your Firebase console
const firebaseConfig = {
    apiKey: "AIzaSyDU8hB3qWD8VAgPinbHsGNSI7-9l1FHm2Y",
    authDomain: "shoppinglist-v2-2d33b.firebaseapp.com",
    projectId: "shoppinglist-v2-2d33b",
    storageBucket: "shoppinglist-v2-2d33b.firebasestorage.app",
    messagingSenderId: "990754613094",
    appId: "1:990754613094:web:cecc7f2adddaa2d2918aa7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with persistence
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Cloud Functions
export const functions = getFunctions(app);

export default app;