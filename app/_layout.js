import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import LoadingSpinner from './components/LoadingSpinner';

export default function RootLayout() {
  return (
    <AuthProvider>
      <LoadingProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
          <LoadingSpinner />
        </SafeAreaProvider>
      </LoadingProvider>
    </AuthProvider>
  );
}