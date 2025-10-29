import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DashboardHeaderProps {
  avgTemperature?: number;
  avgHumidity?: number;
  onTempHumidityDetailsPress?: () => void;
  isConnected?: boolean;
}

export default function DashboardHeader({
  avgTemperature,
  avgHumidity,
  onTempHumidityDetailsPress,
  isConnected = false,
}: DashboardHeaderProps) {
  const { logout, hasAdminAccess } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      const seconds = now.getSeconds();
      const msUntilNextMinute = (60 - seconds) * 1000;
      return setTimeout(updateTime, msUntilNextMinute);
    };
    const timer = updateTime();
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleSettingsPress = () => {
    router.push('/(tabs)/settings');
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  const dynamicStyles = StyleSheet.create({
    header: {
      backgroundColor: isDark ? '#111827' : '#ffffff',
      paddingTop: insets.top + 8,
      paddingHorizontal: 16,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1.5,
    },
    logoImage: {
      width: 60,
      height: 60,
      borderRadius: 12,
      resizeMode: 'contain',
    },
    timeContainer: {
      justifyContent: 'center',
    },
    timeText: {
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? '#ffffff' : '#1a1a1a',
    },
    dateText: {
      fontSize: 13,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 2,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
      flex: 1,
      flexWrap: 'nowrap',
    },
    iconButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoutButton: {
      backgroundColor: isDark ? '#dc2626' : '#ef4444',
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
    },
    statValue: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#1a1a1a',
    },
    statSubtext: {
      fontSize: 10,
      fontWeight: '400',
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: -2,
    },
    connectionIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
      borderRadius: 12,
    },
    connectionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    connectionText: {
      fontSize: 12,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#1a1a1a',
    },
  });

  return (
    <View style={dynamicStyles.header}>
      {/* Left: Logo + Time */}
      <View style={dynamicStyles.leftSection}>
        <Image
          source={
            isDark
              ? require('@/assets/images/whitelogo.png')
              : require('@/assets/images/PMLogo.png')
          }
          style={dynamicStyles.logoImage}
        />
        <View style={dynamicStyles.timeContainer}>
          <Text style={dynamicStyles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={dynamicStyles.dateText}>{formatDate(currentTime)}</Text>
        </View>
      </View>

      {/* Right: Settings + Temp/Humidity + Theme + Logout */}
      <View style={dynamicStyles.rightSection}>
        {hasAdminAccess && (
          <TouchableOpacity
            style={dynamicStyles.iconButton}
            onPress={handleSettingsPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={isDark ? '#9ca3af' : '#6b7280'}
            />
          </TouchableOpacity>
        )}

        {/* Temp & Humidity inline - 12h averages */}
        <TouchableOpacity
          onPress={onTempHumidityDetailsPress}
          style={{ flexDirection: 'row', alignItems: 'center' }}
          activeOpacity={0.8}
        >
          <View style={dynamicStyles.statItem}>
            <Ionicons
              name="thermometer-outline"
              size={18}
              color={isDark ? '#f59e0b' : '#f97316'}
            />
            <View>
              <Text style={dynamicStyles.statValue}>
                {avgTemperature ? `${avgTemperature.toFixed(1)}°C` : '--°'}
              </Text>
              <Text style={dynamicStyles.statSubtext}>12h avg</Text>
            </View>
          </View>

          <View style={dynamicStyles.statItem}>
            <Ionicons
              name="water-outline"
              size={18}
              color={isDark ? '#3b82f6' : '#2563eb'}
            />
            <View>
              <Text style={dynamicStyles.statValue}>
                {avgHumidity ? `${avgHumidity.toFixed(1)}%` : '--%'}
              </Text>
              <Text style={dynamicStyles.statSubtext}>12h avg</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* WebSocket Connection Status */}
        <View style={dynamicStyles.connectionIndicator}>
          <View
            style={[
              dynamicStyles.connectionDot,
              { backgroundColor: isConnected ? '#10b981' : '#ef4444' }
            ]}
          />
          <Text style={dynamicStyles.connectionText}>
            {isConnected ? 'Live' : 'Offline'}
          </Text>
        </View>

        {/* Theme Toggle */}
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
            size={20}
            color={isDark ? '#fbbf24' : '#1f2937'}
          />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={[dynamicStyles.iconButton, dynamicStyles.logoutButton]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
