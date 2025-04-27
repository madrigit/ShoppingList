import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CustomDrawerContent from '../components/CustomDrawerContent';

export default function AppLayout() {
  return (
    <SafeAreaProvider>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false, // We're using our own custom headers
          drawerStyle: {
            backgroundColor: '#fff',
            width: 280,
          },
        }}
      >
        <Drawer.Screen 
          name="index" 
          options={{
            drawerLabel: "My Groups",
            title: "My Groups",
          }}
        />
        <Drawer.Screen 
          name="invites" 
          options={{
            drawerLabel: "Invitations",
            title: "Invitations",
          }}
        />
        <Drawer.Screen 
          name="settings" 
          options={{
            drawerLabel: "Settings",
            title: "Settings",
          }}
        />
        <Drawer.Screen 
          name="group/[id]" 
          options={{
            drawerLabel: "Group Details",
            title: "Group Details",
            drawerItemStyle: { display: 'none' }, // Hide from drawer
          }}
        />
      </Drawer>
    </SafeAreaProvider>
  );
}