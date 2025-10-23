import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface UniversalHeaderProps {
  title?: string;
}

export default function UniversalHeader({ title = 'Smart Home' }: UniversalHeaderProps) {
  const { logout } = useAuth();
  const { theme, currentTheme, setTheme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleSettingsPress = () => {
    router.push('/(tabs)/settings');
  };

  const handleDashboardPress = () => {
    router.push('/(tabs)');
  };

  // Check if we're on the dashboard page to show settings icon
  const isDashboardPage = pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
  const isSettingsPage = pathname === '/(tabs)/settings';

  const dynamicStyles = StyleSheet.create({
    header: {
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      paddingTop: insets.top,
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
      shadowColor: isDark ? '#000000' : '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 8,
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
    },
    leftSection: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#ffffff' : '#1a1a1a',
    },
    subtitle: {
      fontSize: 14,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 2,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: isDark ? '#000000' : '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    logoutButton: {
      backgroundColor: isDark ? '#dc2626' : '#ef4444',
    },
  });

  return (
    <View style={dynamicStyles.header}>
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.leftSection}>
          <Text style={dynamicStyles.title}>{title}</Text>
          <Text style={dynamicStyles.subtitle}>Welcome back!</Text>
        </View>

        <View style={dynamicStyles.rightSection}>
          {/* Navigation Button - Settings icon on dashboard, Dashboard icon on settings */}
          {isDashboardPage && (
            <TouchableOpacity
              style={dynamicStyles.iconButton}
              onPress={handleSettingsPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name="settings-outline"
                size={22}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
            </TouchableOpacity>
          )}
          {isSettingsPage && (
            <TouchableOpacity
              style={dynamicStyles.iconButton}
              onPress={handleDashboardPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name="home-outline"
                size={22}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
            </TouchableOpacity>
          )}

          {/* Theme Toggle Button */}
          <TouchableOpacity
            style={dynamicStyles.iconButton}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                theme === 'system' 
                  ? 'phone-portrait-outline'
                  : isDark 
                    ? 'sunny' 
                    : 'moon'
              }
              size={22}
              color={isDark ? '#fbbf24' : '#1f2937'}
            />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={[dynamicStyles.iconButton, dynamicStyles.logoutButton]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons
              name="log-out-outline"
              size={22}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}