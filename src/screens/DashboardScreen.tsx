import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { deviceStorageService } from '../services/DeviceStorageService';
import { SensorDevice } from '../types';

const DashboardScreen: React.FC = () => {
  const [configuredDevices, setConfiguredDevices] = useState<SensorDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [deviceStates, setDeviceStates] = useState<{ [key: string]: boolean }>({});

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
      
      // Initialize device states (you would replace this with actual Home Assistant state)
      const initialStates: { [key: string]: boolean } = {};
      devices.forEach(device => {
        if (device.type === 'light' || device.type === 'ac') {
          initialStates[device.id] = false; // Default to off
        }
      });
      setDeviceStates(initialStates);
    } catch (error) {
      Alert.alert('Error', 'Failed to load configured devices');
    } finally {
      setLoading(false);
    }
  };

  const toggleDevice = async (deviceId: string, deviceType: string) => {
    try {
      // Update local state immediately for responsive UI
      setDeviceStates(prev => ({
        ...prev,
        [deviceId]: !prev[deviceId]
      }));

      // Here you would call your Home Assistant service to toggle the device
      // For now, we'll just simulate it
      console.log(`Toggling ${deviceType} ${deviceId} to ${!deviceStates[deviceId]}`);
      
      // TODO: Replace with actual Home Assistant API call
      // await homeAssistantService.toggleDevice(deviceId, !deviceStates[deviceId]);
      
    } catch (error) {
      // Revert state on error
      setDeviceStates(prev => ({
        ...prev,
        [deviceId]: !prev[deviceId]
      }));
      Alert.alert('Error', `Failed to toggle ${deviceType}`);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConfiguredDevices();
    setRefreshing(false);
  };

  const getDeviceIcon = (type: string, isOn: boolean = false): string => {
    switch (type) {
      case 'water': return '💧';
      case 'radar': return '📡';
      case 'temp_humidity': return '🌡️';
      case 'door': return '🚪';
      case 'light': return isOn ? '💡' : '💡'; // Different icons for on/off
      case 'camera': return '📹';
      case 'ac': return isOn ? '❄️' : '⛄'; // Snowflake when on, snowman when off
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

  const getStatusColor = (isOn: boolean, isDark: boolean): string => {
    if (isOn) {
      return isDark ? '#4CAF50' : '#2E7D32'; // Green for on
    }
    return isDark ? '#666' : '#999'; // Gray for off
  };

  const getStatusText = (isOn: boolean): string => {
    return isOn ? 'ON' : 'OFF';
  };

  const renderDeviceCard = (device: SensorDevice) => {
    const isOn = deviceStates[device.id] || false;
    const isToggleable = device.type === 'light' || device.type === 'ac';
    
    return (
      <TouchableOpacity 
        key={device.id} 
        style={[styles.deviceCard, isDarkTheme && styles.deviceCardDark]}
        activeOpacity={0.7}
      >
        <View style={styles.deviceHeader}>
          <View style={[
            styles.deviceIconContainer,
            isToggleable && isOn && styles.deviceIconContainerActive,
            { backgroundColor: isDarkTheme ? '#2a2a2a' : '#f8f9fa' }
          ]}>
            <Text style={[
              styles.deviceIcon,
              isToggleable && { color: getStatusColor(isOn, isDarkTheme) }
            ]}>
              {getDeviceIcon(device.type, isOn)}
            </Text>
          </View>
          <View style={styles.deviceInfo}>
            <Text style={[styles.deviceName, isDarkTheme && styles.textDark]}>{device.name}</Text>
            <Text style={[styles.deviceType, isDarkTheme && styles.textSecondaryDark]}>
              {getDeviceTypeLabel(device.type)}
            </Text>
          </View>
          
          {isToggleable && (
            <View style={styles.toggleContainer}>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(isOn, isDarkTheme) }
                ]} />
                <Text style={[
                  styles.statusText,
                  isDarkTheme && styles.textDark,
                  { color: getStatusColor(isOn, isDarkTheme) }
                ]}>
                  {getStatusText(isOn)}
                </Text>
              </View>
              <Switch
                value={isOn}
                onValueChange={() => toggleDevice(device.id, device.type)}
                trackColor={{ false: '#767577', true: isDarkTheme ? '#4CAF50' : '#81C784' }}
                thumbColor={isOn ? (isDarkTheme ? '#4CAF50' : '#2E7D32') : (isDarkTheme ? '#aaa' : '#f4f3f4')}
                ios_backgroundColor="#3e3e3e"
              />
            </View>
          )}
        </View>
        
        <View style={[styles.entityContainer, isDarkTheme && styles.entityContainerDark]}>
          <Text style={[styles.entityLabel, isDarkTheme && styles.textSecondaryDark]}>Entity ID:</Text>
          <Text style={[styles.entityValue, isDarkTheme && styles.textDark]}>
            {device.entity}
          </Text>
        </View>

        {isToggleable && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                isOn ? styles.toggleButtonOn : styles.toggleButtonOff,
                isDarkTheme && (isOn ? styles.toggleButtonOnDark : styles.toggleButtonOffDark)
              ]}
              onPress={() => toggleDevice(device.id, device.type)}
            >
              <Text style={[
                styles.toggleButtonText,
                isOn ? styles.toggleButtonTextOn : styles.toggleButtonTextOff
              ]}>
                {isOn ? 'Turn Off' : 'Turn On'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
    borderRadius: 16,
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
  deviceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#f8f9fa',
  },
  deviceIconContainerActive: {
    transform: [{ scale: 1.05 }],
  },
  deviceIcon: {
    fontSize: 24,
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
  toggleContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
  actionContainer: {
    marginTop: 12,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonOn: {
    backgroundColor: '#E8F5E8',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  toggleButtonOff: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  toggleButtonOnDark: {
    backgroundColor: '#1B5E20',
    borderColor: '#4CAF50',
  },
  toggleButtonOffDark: {
    backgroundColor: '#424242',
    borderColor: '#616161',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButtonTextOn: {
    color: '#2E7D32',
  },
  toggleButtonTextOff: {
    color: '#666',
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