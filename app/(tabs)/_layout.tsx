import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import UniversalFooter from '@/components/ui/UniversalFooter';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarStyle: { display: 'none' },
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
          }}
        />
      </Tabs>
      {isAuthenticated && <UniversalFooter />}
    </View>
  );
}
