import { useContext, useEffect } from 'react';
import { Redirect } from 'expo-router';
import AuthProvider, { AuthContext } from './context/AuthContext';

export default function Index() {
  const { user, loading } = useContext(AuthContext);

  // For debugging
  console.log("Auth state:", { user: user?.uid, loading });

  // Show nothing while loading
  if (loading) {
    return null;
  }

  // Redirect based on authentication state
  if (user) {
    console.log("User authenticated, redirecting to app");
    return <Redirect href="/(app)" />;
  } else {
    console.log("No user, redirecting to login");
    return <Redirect href="/auth/login" />;
  }
}