import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DashboardHeaderProps {
  avgTemperature?: number;
  avgHumidity?: number;
  onTempHumidityDetailsPress?: () => void;
}

export default function DashboardHeader({ 
  avgTemperature, 
  avgHumidity, 
  onTempHumidityDetailsPress 
}: DashboardHeaderProps) {
  const { logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
useEffect(() => {
  const updateTime = () => {
    const now = new Date();
    setCurrentTime(now);
    
    // Calculate milliseconds until next minute
    const seconds = now.getSeconds();
    const millisecondsUntilNextMinute = (60 - seconds) * 1000;
    
    return setTimeout(updateTime, millisecondsUntilNextMinute);
  };

  const timer = updateTime();
  return () => clearTimeout(timer);
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

  const handleSettingsPress = () => {
    router.push('/(tabs)/settings');
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
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 24,
    },
    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#1a1a1a',
    },
    statLabel: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
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
      <View style={dynamicStyles.topRow}>
        <View style={dynamicStyles.leftSection}>
          <View style={dynamicStyles.statsContainer}>
            {/* Average Temperature */}
            <TouchableOpacity
              style={dynamicStyles.statItem}
              onPress={onTempHumidityDetailsPress}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="thermometer-outline" 
                size={16} 
                color={isDark ? '#f59e0b' : '#f97316'} 
              />
              <View>
                <Text style={dynamicStyles.statValue}>
                  {avgTemperature ? `${avgTemperature.toFixed(1)}°` : '--°'}
                </Text>
                <Text style={dynamicStyles.statLabel}>Avg Temp</Text>
              </View>
            </TouchableOpacity>

            {/* Average Humidity */}
            <TouchableOpacity
              style={dynamicStyles.statItem}
              onPress={onTempHumidityDetailsPress}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="water-outline" 
                size={16} 
                color={isDark ? '#3b82f6' : '#2563eb'} 
              />
              <View>
                <Text style={dynamicStyles.statValue}>
                  {avgHumidity ? `${avgHumidity.toFixed(1)}%` : '--%'}
                </Text>
                <Text style={dynamicStyles.statLabel}>Avg Humidity</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={dynamicStyles.rightSection}>
          {/* Time and Date */}
          <View style={dynamicStyles.timeContainer}>
            <Text style={dynamicStyles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={dynamicStyles.dateText}>{formatDate(currentTime)}</Text>
          </View>

          {/* Settings Button */}
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
