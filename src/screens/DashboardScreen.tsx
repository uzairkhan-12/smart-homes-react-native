import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { deviceStorageService } from '../services/DeviceStorageService';
import { SensorDevice } from '../types';

const CONTAINER_PADDING = 16;
const CARD_GAP = 12;

const DashboardScreen: React.FC = () => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const [configuredDevices, setConfiguredDevices] = useState<SensorDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [deviceStates, setDeviceStates] = useState<{ [key: string]: boolean }>({});

  // Calculate responsive card widths based on current screen dimensions
  const getCardWidth = (itemsPerRow: number) => {
    const totalGap = CARD_GAP * (itemsPerRow - 1);
    const availableWidth = SCREEN_WIDTH - (CONTAINER_PADDING * 2) - totalGap;
    return availableWidth / itemsPerRow;
  };

  // Re-render when screen dimensions change (rotation)
  useEffect(() => {
    // This effect will trigger whenever SCREEN_WIDTH changes (on rotation)
    console.log('Screen dimensions updated:', { SCREEN_WIDTH, SCREEN_HEIGHT });
  }, [SCREEN_WIDTH, SCREEN_HEIGHT]);

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
      
      // Initialize device states
      const initialStates: { [key: string]: boolean } = {};
      devices.forEach(device => {
        if (device.type === 'light' || device.type === 'ac') {
          initialStates[device.id] = false;
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
      setDeviceStates(prev => ({
        ...prev,
        [deviceId]: !prev[deviceId]
      }));

      console.log(`Toggling ${deviceType} ${deviceId} to ${!deviceStates[deviceId]}`);
      
      // TODO: Replace with actual Home Assistant API call
    } catch (error) {
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
      case 'temperature': return '🌡️';
      case 'humidity': return '💧';
      case 'door': return '🚪';
      case 'light': return isOn ? '💡' : '💡';
      case 'camera': return '📹';
      case 'ac': return isOn ? '❄️' : '⛄';
      case 'security': return '🔒';
      default: return '📱';
    }
  };

  const getDeviceTypeLabel = (type: string): string => {
    switch (type) {
      case 'water': return 'Water Sensor';
      case 'radar': return 'Radar Sensor';
      case 'temp_humidity': return 'Temp & Humidity';
      case 'temperature': return 'Temperature';
      case 'humidity': return 'Humidity';
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
      return isDark ? '#4CAF50' : '#2E7D32';
    }
    return isDark ? '#666' : '#999';
  };

  const getStatusText = (isOn: boolean): string => {
    return isOn ? 'ON' : 'OFF';
  };

  // Filter devices by type
  const temperatureSensors = configuredDevices.filter((device: any) => device.type === 'temperature');
  const humiditySensors = configuredDevices.filter((device: any) => device.type === 'humidity');
  const tempHumiditySensors = configuredDevices.filter(device => device.type === 'temp_humidity');
  const lights = configuredDevices.filter(device => device.type === 'light');
  const cameras = configuredDevices.filter(device => device.type === 'camera');
  const radarSensors = configuredDevices.filter(device => device.type === 'radar');
  const waterSensors = configuredDevices.filter(device => device.type === 'water');
  const acs = configuredDevices.filter(device => device.type === 'ac');
  const doorSensors = configuredDevices.filter(device => device.type === 'door');
  const securitySensors = configuredDevices.filter(device => device.type === 'security');

  const renderDeviceCard = (device: SensorDevice, itemsPerRow: number = 2) => {
    const isOn = deviceStates[device.id] || false;
    const isToggleable = device.type === 'light' || device.type === 'ac';
    const cardWidth = getCardWidth(itemsPerRow);
    
    return (
      <View key={device.id} style={[styles.card, { width: cardWidth }]}>
        <View style={[styles.deviceCard, isDarkTheme && styles.deviceCardDark]}>
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
              <Text style={[styles.deviceName, isDarkTheme && styles.textDark]} numberOfLines={1}>
                {device.name}
              </Text>
              <Text style={[styles.deviceType, isDarkTheme && styles.textSecondaryDark]} numberOfLines={1}>
                {getDeviceTypeLabel(device.type)}
              </Text>
            </View>
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
                style={styles.switch}
              />
            </View>
          )}
          
          <View style={[styles.entityContainer, isDarkTheme && styles.entityContainerDark]}>
            <Text style={[styles.entityValue, isDarkTheme && styles.textDark]} numberOfLines={1}>
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
        </View>
      </View>
    );
  };

  const renderCameraCard = (camera: SensorDevice) => {
    const cardWidth = getCardWidth(2);
    
    return (
      <View key={camera.id} style={[styles.card, { width: cardWidth }]}>
        <View style={[styles.deviceCard, isDarkTheme && styles.deviceCardDark]}>
          <View style={styles.deviceHeader}>
            <Text style={styles.cameraIcon}>📹</Text>
            <View style={styles.deviceInfo}>
              <Text style={[styles.deviceName, isDarkTheme && styles.textDark]} numberOfLines={1}>
                {camera.name}
              </Text>
              <Text style={[styles.deviceType, isDarkTheme && styles.textSecondaryDark]} numberOfLines={1}>
                Camera
              </Text>
            </View>
          </View>
          <View style={[styles.cameraPreview, isDarkTheme && styles.cameraPreviewDark]}>
            <Text style={[styles.cameraPlaceholder, isDarkTheme && styles.textSecondaryDark]}>
              Live View
            </Text>
          </View>
          <View style={[styles.entityContainer, isDarkTheme && styles.entityContainerDark]}>
            <Text style={[styles.entityValue, isDarkTheme && styles.textDark]} numberOfLines={1}>
              {camera.entity}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderGridSection = (title: string, devices: SensorDevice[], icon: string, itemsPerRow: number = 2) => {
    if (devices.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkTheme && styles.textDark]}>
          {icon} {title} ({devices.length})
        </Text>
        <View style={[styles.grid, { gap: CARD_GAP }]}>
          {devices.map((device) => renderDeviceCard(device, itemsPerRow))}
        </View>
      </View>
    );
  };

  const renderCameraSection = (cameras: SensorDevice[]) => {
    if (cameras.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkTheme && styles.textDark]}>
          📹 Cameras ({cameras.length})
        </Text>
        <View style={[styles.grid, { gap: CARD_GAP }]}>
          {cameras.map((camera) => renderCameraCard(camera))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDarkTheme && styles.loadingContainerDark]}>
        <Text style={[styles.loadingText, isDarkTheme && styles.textDark]}>Loading dashboard...</Text>
      </View>
    );
  }

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
          contentContainerStyle={styles.scrollContent}
        >
          {/* Environment Sensors - Temperature & Humidity */}
          {(temperatureSensors.length > 0 || humiditySensors.length > 0 || tempHumiditySensors.length > 0) && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkTheme && styles.textDark]}>
                🌡️ Environment
              </Text>
              <View style={[styles.grid, { gap: CARD_GAP }]}>
                {[...temperatureSensors, ...humiditySensors, ...tempHumiditySensors]
                  .map((device) => renderDeviceCard(device, 2))}
              </View>
            </View>
          )}

          {/* Lights - 2 per row */}
          {renderGridSection('Lights', lights, '💡', 2)}

          {/* Cameras - Special layout */}
          {renderCameraSection(cameras)}

          {/* Radar Sensors - 3 per row */}
          {renderGridSection('Radar Sensors', radarSensors, '📡', 3)}

          {/* Water Sensors - 4 per row */}
          {renderGridSection('Water Sensors', waterSensors, '💧', 4)}

          {/* Other devices */}
          {renderGridSection('Air Conditioners', acs, '❄️', 2)}
          {renderGridSection('Door Sensors', doorSensors, '🚪', 2)}
          {renderGridSection('Security Systems', securitySensors, '🔒', 2)}

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
    paddingHorizontal: CONTAINER_PADDING,
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
  scrollContent: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    marginBottom: CARD_GAP,
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 160,
    flex: 1,
  },
  deviceCardDark: {
    backgroundColor: '#1e1e1e',
    shadowOpacity: 0.3,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#f8f9fa',
  },
  deviceIconContainerActive: {
    transform: [{ scale: 1.05 }],
  },
  deviceIcon: {
    fontSize: 20,
  },
  cameraIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  deviceType: {
    fontSize: 12,
    color: '#666',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  switch: {
    transform: [{ scale: 0.8 }],
  },
  entityContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  entityContainerDark: {
    backgroundColor: '#2a2a2a',
  },
  entityValue: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#333',
  },
  actionContainer: {
    marginTop: 'auto',
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonOn: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  toggleButtonOff: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
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
    fontSize: 12,
    fontWeight: '600',
  },
  toggleButtonTextOn: {
    color: '#2E7D32',
  },
  toggleButtonTextOff: {
    color: '#666',
  },
  // Camera specific styles
  cameraPreview: {
    height: 80,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cameraPreviewDark: {
    backgroundColor: '#2a2a2a',
  },
  cameraPlaceholder: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
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