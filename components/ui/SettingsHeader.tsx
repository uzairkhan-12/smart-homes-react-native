import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsHeader() {
  const { logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for real-time accuracy
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  const handleDashboardPress = () => {
    router.push('/(tabs)');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const dynamicStyles = StyleSheet.create({
    header: {
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      paddingTop: insets.top + 12,
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
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
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
    timeContainer: {
      alignItems: 'flex-end',
      marginRight: 16,
    },
    timeText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#ffffff' : '#1a1a1a',
    },
    dateText: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 2,
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
          <View style={dynamicStyles.titleContainer}>
            <Ionicons 
              name="settings" 
              size={28} 
              color={isDark ? '#6366f1' : '#4f46e5'} 
            />
            <View>
              <Text style={dynamicStyles.title}>Settings</Text>
              <Text style={dynamicStyles.subtitle}>Configure your devices</Text>
            </View>
          </View>
        </View>

        <View style={dynamicStyles.rightSection}>
          {/* Time and Date */}
          <View style={dynamicStyles.timeContainer}>
            <Text style={dynamicStyles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={dynamicStyles.dateText}>{formatDate(currentTime)}</Text>
          </View>

          {/* Dashboard Button */}
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