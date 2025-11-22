import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomAlert from '@/components/ui/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';

export interface DashboardHeaderProps {
  avgTemperature?: number;
  avgHumidity?: number;
  onTemperaturePress?: () => void;
  onHumidityPress?: () => void;
  connectionState?: 'loading' | 'connected' | 'offline';
  binarySensorData?: { [key: string]: any };
  configuredSensors?: any[];
}

export default function DashboardHeader({
  avgTemperature,
  avgHumidity,
  onTemperaturePress,
  onHumidityPress,
  connectionState = 'offline',
  binarySensorData = {},
  configuredSensors = [],
}: DashboardHeaderProps) {
  const { logout, hasAdminAccess } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { alertState, showAlert, hideAlert } = useCustomAlert();

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
    showAlert({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ],
    });
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

  // Alert logic
  const checkForAlerts = () => {
    const alerts = [];

    // Temperature alert (> 22°C)
    if (avgTemperature && avgTemperature > 22) {
      alerts.push({
        type: 'temperature',
        message: `High Temperature: ${avgTemperature.toFixed(1)}°C`,
        severity: 'warning'
      });
    }

    // Humidity alert (> 40%)
    if (avgHumidity && avgHumidity > 40) {
      alerts.push({
        type: 'humidity',
        message: `High Humidity: ${avgHumidity.toFixed(1)}%`,
        severity: 'warning'
      });
    }

    // Binary sensor alerts (radar, water, security sensors that are "on")
    const alertingSensors = configuredSensors.filter(sensor => {
      if (!sensor.entity || !['radar', 'water', 'security', 'door'].includes(sensor.type)) {
        return false;
      }
      
      const sensorData = binarySensorData[sensor.entity];
      return sensorData && sensorData.new_state === 'on';
    });

    if (alertingSensors.length > 0) {
      alerts.push({
        type: 'sensors',
        message: `${alertingSensors.length} Sensor Alert${alertingSensors.length > 1 ? 's' : ''}`,
        severity: 'critical',
        sensors: alertingSensors
      });
    }

    return alerts;
  };

  const alerts = checkForAlerts();
  const hasAlerts = alerts.length > 0;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const warningAlerts = alerts.filter(a => a.severity === 'warning').length;

  // Function to get single alert message for badge display
  const getSingleAlertMessage = (alert: any) => {
    if (alert.type === 'sensors' && alert.sensors && alert.sensors.length === 1) {
      const sensor = alert.sensors[0];
      switch (sensor.type) {
        case 'water':
          return `${sensor.name} Leaking`;
        case 'door':
          return `${sensor.name} Open`;
        case 'security':
          return `${sensor.name} Alert`;
        case 'radar':
          return `${sensor.name} Detected`;
        default:
          return `${sensor.name} Active`;
      }
    } else if (alert.type === 'sensors' && alert.sensors && alert.sensors.length > 1) {
      return `${alert.sensors.length} Sensors Active`;
    } else if (alert.type === 'temperature') {
      return `High Temp ${avgTemperature?.toFixed(1)}°C`;
    } else if (alert.type === 'humidity') {
      return `High Humidity ${avgHumidity?.toFixed(1)}%`;
    }
    return 'Alert';
  };

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
      fontSize: 16,
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
    alertBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderWidth: 2,
      borderColor: hasAlerts 
        ? (criticalAlerts > 0 ? '#ef4444' : '#f59e0b')
        : '#10b981',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 4,
      maxWidth: 200,
    },
    alertBadgeText: {
      fontSize: hasAlerts && alerts.length === 1 ? 11 : 13,
      fontWeight: '700',
      color: hasAlerts 
        ? (criticalAlerts > 0 ? '#ef4444' : '#f59e0b')
        : '#10b981',
      flexShrink: 1,
    },
    alertIcon: {
      fontSize: 16,
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
          <Text style={dynamicStyles.timeText}>Binnale Data Center - Riyadh</Text>
          <Text style={dynamicStyles.dateText}>{formatDate(currentTime)} • {formatTime(currentTime)}</Text>
        </View>
      </View>

      {/* Right: Alert Badge + Settings + Temp/Humidity + Theme + Logout */}
      <View style={dynamicStyles.rightSection}>
        {/* Status Badge - Always show either alerts or all good status */}
        <TouchableOpacity
          style={dynamicStyles.alertBadge}
          onPress={() => {
            if (hasAlerts) {
              const alertMessages = alerts.map(alert => {
                if (alert.type === 'sensors' && alert.sensors) {
                  return alert.sensors.map(sensor => {
                    switch (sensor.type) {
                      case 'water':
                        return `🚰 ${sensor.name} is detecting water leakage`;
                      case 'door':
                        return `🚪 ${sensor.name} is currently open`;
                      case 'security':
                        return `🔒 ${sensor.name} security alert triggered`;
                      case 'radar':
                        return `📡 ${sensor.name} detected motion or presence`;
                      default:
                        return `⚠️ ${sensor.name} sensor is active`;
                    }
                  }).join('\n');
                } else if (alert.type === 'temperature') {
                  return `🌡️ Temperature is above normal threshold\nCurrent: ${avgTemperature?.toFixed(1)}°C (Limit: 22°C)`;
                } else if (alert.type === 'humidity') {
                  return `💧 Humidity levels are too high\nCurrent: ${avgHumidity?.toFixed(1)}% (Limit: 40%)`;
                }
                return alert.message;
              }).join('\n\n');
              
              showAlert({
                title: '⚠️ System Alert',
                message: alertMessages,
                buttons: [{ text: 'OK', style: 'default' }]
              });
            } else {
              // Show positive status message
              showAlert({
                title: '✅ System Status: All Good!',
                message: `🌟 Everything is running smoothly!\n\n🌡️ Temperature: ${avgTemperature ? `${avgTemperature.toFixed(1)}°C` : 'N/A'} (Normal)\n💧 Humidity: ${avgHumidity ? `${avgHumidity.toFixed(1)}%` : 'N/A'} (Normal)\n📡 All sensors are secure\n\n🎉 Your smart home is in perfect condition!`,
                buttons: [{ text: 'Awesome!', style: 'default' }]
              });
            }
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={hasAlerts 
              ? (criticalAlerts > 0 ? 'alert-circle' : 'warning')
              : 'checkmark-circle'
            }
            size={18}
            color={hasAlerts 
              ? (criticalAlerts > 0 ? '#ef4444' : '#f59e0b')
              : '#10b981'
            }
            style={dynamicStyles.alertIcon}
          />
          <Text style={dynamicStyles.alertBadgeText}>
            {hasAlerts 
              ? (alerts.length === 1 ? getSingleAlertMessage(alerts[0]) : `${alerts.length} Alerts`)
              : 'All Good'
            }
          </Text>
        </TouchableOpacity>

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

        {/* Temperature - 12h average */}
        <TouchableOpacity
          onPress={onTemperaturePress}
          style={dynamicStyles.statItem}
          activeOpacity={0.8}
        >
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
        </TouchableOpacity>

        {/* Humidity - 12h average */}
        <TouchableOpacity
          onPress={onHumidityPress}
          style={dynamicStyles.statItem}
          activeOpacity={0.8}
        >
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
        </TouchableOpacity>

        {/* WebSocket Connection Status */}
        <View style={dynamicStyles.connectionIndicator}>
          <View
            style={[
              dynamicStyles.connectionDot,
              { 
                backgroundColor: 
                  connectionState === 'connected' ? '#10b981' : 
                  connectionState === 'loading' ? '#f59e0b' : '#ef4444' 
              }
            ]}
          />
          <Text style={dynamicStyles.connectionText}>
            {connectionState === 'connected' ? 'Live' : 
             connectionState === 'loading' ? 'Loading' : 'Offline'}
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

      {/* Custom Alert */}
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onDismiss={hideAlert}
      />
    </View>
  );
}
