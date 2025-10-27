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
    });
  };

  const dynamicStyles = StyleSheet.create({
    header: {
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      paddingTop: insets.top + 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 3,
      elevation: 4,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    leftSection: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoIcon: {
      width: 65,
      height: 65,
      borderRadius: 14,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    logoImage: {
      width: 65,
      height: 65,
      borderRadius: 12,
    },
    statsContainer: {
      flex: 1,
    },
    statItem: {
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    statPair: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    statItemSingle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#ffffff' : '#1a1a1a',
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    timeContainer: {
      alignItems: 'flex-end',
      marginRight: 6,
      minWidth: 70,
    },
    timeText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: isDark ? '#ffffff' : '#1a1a1a',
    },
    dateText: {
      fontSize: 10,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 1,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoutButton: {
      backgroundColor: isDark ? '#dc2626' : '#ef4444',
    },
  });

  return (
    <View style={dynamicStyles.header}>
      <View style={dynamicStyles.topRow}>
        <View style={dynamicStyles.leftSection}>
          {/* Logo */}
          <View style={dynamicStyles.logoContainer}>
            <View style={dynamicStyles.logoIcon}>
              <Image 
                source={isDark ? require('@/assets/images/whitelogo.png') : require('@/assets/images/PMLogo.png')}
                style={dynamicStyles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Temperature & Humidity Stats - Single Line */}
          <View style={dynamicStyles.statsContainer}>
            <TouchableOpacity
              style={dynamicStyles.statItem}
              onPress={onTempHumidityDetailsPress}
              activeOpacity={0.7}
            >
              <View style={dynamicStyles.statPair}>
                {/* Temperature */}
                <View style={dynamicStyles.statItemSingle}>
                  <Ionicons 
                    name="thermometer-outline" 
                    size={18} 
                    color={isDark ? '#f59e0b' : '#f97316'} 
                  />
                  <Text style={dynamicStyles.statValue}>
                    {avgTemperature ? `${avgTemperature.toFixed(1)}°` : '--°'}
                  </Text>
                </View>

                {/* Humidity */}
                <View style={dynamicStyles.statItemSingle}>
                  <Ionicons 
                    name="water-outline" 
                    size={18} 
                    color={isDark ? '#3b82f6' : '#2563eb'} 
                  />
                  <Text style={dynamicStyles.statValue}>
                    {avgHumidity ? `${avgHumidity.toFixed(1)}%` : '--%'}
                  </Text>
                </View>
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
              size={18}
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
              size={18}
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
              size={18}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}