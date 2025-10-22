import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
  Switch
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deviceStorageService } from '../services/DeviceStorageService';
import { SensorDevice } from '../types';
import { Ionicons } from '@expo/vector-icons';

const DashboardScreen: React.FC = () => {
  const [configuredDevices, setConfiguredDevices] = useState<SensorDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Load theme preference and devices when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadThemePreference();
      loadConfiguredDevices();
    }, [])
  );

  const loadThemePreference = async () => {
    try {
      const theme = await deviceStorageService.loadThemePreference();
      setIsDarkTheme(theme === 'dark');
    } catch (error) {
      console.error('Failed to load theme preference');
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    try {
      await deviceStorageService.saveThemePreference(newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference');
    }
  };

  const loadConfiguredDevices = async () => {
    try {
      setLoading(true);
      const devices = await deviceStorageService.getConfiguredDevices();
      setConfiguredDevices(devices);
    } catch (error) {
      Alert.alert('Error', 'Failed to load configured devices');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConfiguredDevices();
    setRefreshing(false);
  };

  const getDeviceIcon = (type: string): string => {
    switch (type) {
      case 'water': return '💧';
      case 'radar': return '📡';
      case 'temp_humidity': return '🌡️';
      case 'door': return '🚪';
      case 'light': return '💡';
      case 'camera': return '📹';
      case 'ac': return '❄️';
      case 'security': return '🔒';
      default: return '📱';
    }
  };

  const getDeviceTypeLabel = (type: string): string => {
    switch (type) {
      case 'water': return 'Water Sensor';
      case 'radar': return 'Radar Sensor';
      case 'temp_humidity': return 'Temperature & Humidity';
      case 'door': return 'Door Sensor';
      case 'light': return 'Light';
      case 'camera': return 'Camera';
      case 'ac': return 'Air Conditioner';
      case 'security': return 'Security System';
      default: return 'Unknown Device';
    }
  };

  const renderDeviceCard = (device: SensorDevice) => (
    <TouchableOpacity 
      key={device.id} 
      style={[styles.deviceCard, isDarkTheme && styles.deviceCardDark]}
      activeOpacity={0.7}
    >
      <View style={styles.deviceHeader}>
        <Text style={styles.deviceIcon}>{getDeviceIcon(device.type)}</Text>
        <View style={styles.deviceInfo}>
          <Text style={[styles.deviceName, isDarkTheme && styles.textDark]}>{device.name}</Text>
          <Text style={[styles.deviceType, isDarkTheme && styles.textSecondaryDark]}>{getDeviceTypeLabel(device.type)}</Text>
        </View>
      </View>
      <View style={[styles.entityContainer, isDarkTheme && styles.entityContainerDark]}>
        <Text style={[styles.entityLabel, isDarkTheme && styles.textSecondaryDark]}>Entity ID:</Text>
        <Text style={[styles.entityValue, isDarkTheme && styles.textDark]}>
          {device.entity}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const groupDevicesByType = (devices: SensorDevice[]) => {
    const grouped: { [key: string]: SensorDevice[] } = {};
    devices.forEach(device => {
      if (!grouped[device.type]) {
        grouped[device.type] = [];
      }
      grouped[device.type].push(device);
    });
    return grouped;
  };

  const renderDeviceSection = (type: string, devices: SensorDevice[]) => (
    <View key={type} style={styles.section}>
      <Text style={[styles.sectionTitle, isDarkTheme && styles.textDark]}>
        {getDeviceIcon(type)} {getDeviceTypeLabel(type)}s ({devices.length})
      </Text>
      {devices.map(device => renderDeviceCard(device))}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDarkTheme && styles.loadingContainerDark]}>
        <Text style={[styles.loadingText, isDarkTheme && styles.textDark]}>Loading dashboard...</Text>
      </View>
    );
  }

  const groupedDevices = groupDevicesByType(configuredDevices);

  return (
    <View style={[styles.container, isDarkTheme && styles.containerDark]}>
      {/* Header with Theme Toggle */}
      <View style={[styles.header, isDarkTheme && styles.headerDark]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, isDarkTheme && styles.textDark]}>Smart Home Dashboard</Text>
          <View style={styles.themeContainer}>
            <Ionicons 
              name={isDarkTheme ? "moon" : "sunny"} 
              size={20} 
              color={isDarkTheme ? "#ffd700" : "#ff8c00"} 
            />
            <Switch
              value={isDarkTheme}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isDarkTheme ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>
        <Text style={[styles.subtitle, isDarkTheme && styles.textSecondaryDark]}>
          {configuredDevices.length} device{configuredDevices.length !== 1 ? 's' : ''} configured
        </Text>
      </View>

      {configuredDevices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📱</Text>
          <Text style={[styles.emptyTitle, isDarkTheme && styles.textDark]}>No Devices Configured</Text>
          <Text style={[styles.emptyMessage, isDarkTheme && styles.textSecondaryDark]}>
            Go to Settings to configure your sensors and devices with their entity IDs.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={isDarkTheme ? "#fff" : "#007AFF"}
              colors={isDarkTheme ? ["#fff"] : ["#007AFF"]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(groupedDevices).map(([type, devices]) =>
            renderDeviceSection(type, devices)
          )}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingContainerDark: {
    backgroundColor: '#121212',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerDark: {
    backgroundColor: '#1e1e1e',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  themeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
    paddingHorizontal: 4,
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deviceCardDark: {
    backgroundColor: '#1e1e1e',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  deviceType: {
    fontSize: 14,
    color: '#666',
  },
  entityContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  entityContainerDark: {
    backgroundColor: '#2a2a2a',
    borderLeftColor: '#1565C0',
  },
  entityLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  entityValue: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSpacer: {
    height: 20,
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#aaa',
  },
});

export default DashboardScreen;