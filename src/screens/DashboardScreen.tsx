import { AcCard, AcSettingsModal, BinarySensorCard, CameraCard, DeviceSection, LightCard } from '@/components';
import DashboardHeader from '@/components/ui/DashboardHeader';
import TempHumidityDetailsModal from '@/components/ui/TempHumidityDetailsModal';
import { useTheme } from '@/context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { BinarySensorData, ClimateData, LightData, SensorData, SensorDevice } from '../../types';
import { deviceStorageService } from '../services/DeviceStorageService';
import { HomeAssistantData, homeAssistantService } from '../services/HomeAssistantService';
import { ensureCorrectCameraConfig } from '../utils/configurationFixer';

// Import components

const CONTAINER_PADDING = 16;
const CARD_GAP = 12;

const DashboardScreen: React.FC = () => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { isDark: isDarkTheme } = useTheme();
  const [configuredDevices, setConfiguredDevices] = useState<SensorDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Home Assistant data state
  const [haData, setHaData] = useState<HomeAssistantData>({
    binarySensorData: {},
    climateData: {},
    lightData: {},
    sensorData: {}
  });
  const [isConnected, setIsConnected] = useState(false);
  
  const [acModalVisible, setAcModalVisible] = useState(false);
  const [selectedAc, setSelectedAc] = useState<SensorDevice | null>(null);
  const [tempHumidityModalVisible, setTempHumidityModalVisible] = useState(false);
  const [avgTemperature, setAvgTemperature] = useState<number>(0);
  const [avgHumidity, setAvgHumidity] = useState<number>(0);

  // Connect to HomeAssistant WebSocket service
  useEffect(() => {
    // Subscribe to data updates
    const unsubscribe = homeAssistantService.subscribe((data: HomeAssistantData) => {
      setHaData(data);
      
      // Update connection status
      setIsConnected(homeAssistantService.isConnected());
    });

    // Only connect if not already connected
    if (!homeAssistantService.isConnected()) {
      homeAssistantService.connectWebSocket();
    } else {
      setIsConnected(true);
    }
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Check connection status periodically
  React.useEffect(() => {
    const connectionCheck = setInterval(() => {
      setIsConnected(homeAssistantService.isConnected());
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(connectionCheck);
  }, []);

  // Calculate responsive card widths based on current screen dimensions
  const getCardWidth = (itemsPerRow: number) => {
    // Use the exact itemsPerRow for water sensors (4), otherwise add 1 for landscape optimization
    const adjustedItemsPerRow = itemsPerRow === 4 ? 4 : Math.min(itemsPerRow + 1, 4);
    const totalGap = CARD_GAP * (adjustedItemsPerRow - 1);
    const availableWidth = SCREEN_WIDTH - (CONTAINER_PADDING * 2) - totalGap;
    return availableWidth / adjustedItemsPerRow;
  };

  // Load theme preference and devices when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadConfiguredDevices();
      // loadEntityData(); // Removed - now using WebSocket data
    }, [])
  );

  // Calculate averages whenever sensor data changes
  React.useEffect(() => {
    calculateAverages();
  }, [haData.sensorData, configuredDevices]);

  const calculateAverages = () => {
    const tempHumidityDevices = configuredDevices.filter(device => device.type === 'temp_humidity');
    
    if (tempHumidityDevices.length === 0) {
      setAvgTemperature(0);
      setAvgHumidity(0);
      return;
    }

    let totalTemp = 0;
    let totalHumidity = 0;
    let tempCount = 0;
    let humidityCount = 0;

    tempHumidityDevices.forEach(device => {
      const deviceData = getDeviceData(device);
      if (deviceData.type === 'sensor' && deviceData.data) {
        const data = deviceData.data as SensorData;
        const value = parseFloat(data.new_state);
        
        if (!isNaN(value)) {
          if (device.entity.includes('temperature') || device.entity.includes('temp')) {
            totalTemp += value;
            tempCount++;
          } else if (device.entity.includes('humidity')) {
            totalHumidity += value;
            humidityCount++;
          }
        }
      }
    });

    setAvgTemperature(tempCount > 0 ? totalTemp / tempCount : 0);
    setAvgHumidity(humidityCount > 0 ? totalHumidity / humidityCount : 0);
  };



  const loadConfiguredDevices = async () => {
    try {
      setLoading(true);
      
      // Fix camera configuration if needed (one-time fix)
      const wasFixed = await ensureCorrectCameraConfig();
      
      // Ensure radar sensors count is correct (migration helper)
      await deviceStorageService.ensureRadarSensorsCount();
      
      // Use getAllDevices to show all devices, including those without entities
      const devices = await deviceStorageService.getAllDevices();
      setConfiguredDevices(devices);
      
      // Initialize HomeAssistant service with only configured devices (those with entities) for API loading
      const configuredOnly = await deviceStorageService.getConfiguredDevices();
      
      await homeAssistantService.initializeWithConfiguredDevices(configuredOnly);
      
    } catch (error) {
      console.error('❌ Error in loadConfiguredDevices:', error);
      Alert.alert('Error', 'Failed to load configured devices');
    } finally {
      setLoading(false);
    }
  };



  // Helper function to get data for a specific device
  const getDeviceData = (device: SensorDevice) => {
    const entityId = device.entity;
    
    // First check binary sensors directly
    if (haData.binarySensorData[entityId]) {
      return { type: 'binary', data: haData.binarySensorData[entityId] };
    }
    
    // Check climate (AC)
    if (haData.climateData[entityId]) {
      return { type: 'climate', data: haData.climateData[entityId] };
    }
    
    // Check lights
    if (haData.lightData[entityId]) {
      return { type: 'light', data: haData.lightData[entityId] };
    }
    
    // Check sensors
    if (haData.sensorData[entityId]) {
      return { type: 'sensor', data: haData.sensorData[entityId] };
    }
    
    return { type: 'unknown', data: null };
  };

  const toggleDevice = async (deviceId: string, deviceType: string, entityId: string) => {
    try {
      // Use the HomeAssistant service to toggle the entity
      homeAssistantService.toggleEntity(entityId);
      
      // The state will be updated automatically through the WebSocket subscription
    } catch (error) {
      console.error('Toggle error:', error);
      Alert.alert('Error', 'Failed to toggle device');
    }
  };

  const openAcSettings = (ac: SensorDevice) => {
    setSelectedAc(ac);
    setAcModalVisible(true);
  };

  const closeAcSettings = () => {
    setAcModalVisible(false);
    setSelectedAc(null);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConfiguredDevices();
    // Entity data is now updated through WebSocket
    setRefreshing(false);
  };

  const getBinarySensorState = (device: SensorDevice): { isActive: boolean; stateText: string } => {
    // If device has no entity configured, show "Not Configured"
    if (!device.entity || device.entity.trim() === '') {
      return { isActive: false, stateText: 'Not Configured' };
    }

    const deviceData = getDeviceData(device);
    
    // Check if we have binary sensor data
    if (deviceData.type === 'binary' && deviceData.data) {
      const binaryData = deviceData.data as BinarySensorData;
      const isActive = binaryData.new_state === 'on';
      
      // Determine state text based on device type and state
      switch (device.type) {
        case 'water':
          return { 
            isActive, 
            stateText: isActive ? 'Water Detected' : 'No Water' 
          };
        case 'radar':
          return { 
            isActive, 
            stateText: isActive ? 'Motion Detected' : 'No Motion' 
          };
        case 'door':
          return { 
            isActive, 
            stateText: isActive ? 'Open' : 'Closed' 
          };
        case 'security':
          return { 
            isActive, 
            stateText: isActive ? 'Alert' : 'Secure' 
          };
        default:
          return { 
            isActive, 
            stateText: isActive ? 'Active' : 'Inactive' 
          };
      }
    }
    
    // If no data found, check if we have any data in the haData.binarySensorData object directly
    const directData = haData.binarySensorData[device.entity];
    if (directData) {
      const isActive = directData.new_state === 'on';
      switch (device.type) {
        case 'water':
          return { 
            isActive, 
            stateText: isActive ? 'Water Detected' : 'No Water' 
          };
        case 'radar':
          return { 
            isActive, 
            stateText: isActive ? 'Motion Detected' : 'No Motion' 
          };
        case 'door':
          return { 
            isActive, 
            stateText: isActive ? 'Open' : 'Closed' 
          };
        case 'security':
          return { 
            isActive, 
            stateText: isActive ? 'Alert' : 'Secure' 
          };
        default:
          return { 
            isActive, 
            stateText: isActive ? 'Active' : 'Inactive' 
          };
      }
    }
    
    return { isActive: false, stateText: 'No Data' };
  };



  // Helper function to get section configuration
  const getSectionConfig = (type: string) => {
    const configs: { [key: string]: { title: string; icon: string } } = {
      'temp_humidity': { title: 'Temperature & Humidity', icon: '🌡️' },
      'light': { title: 'Lights Control', icon: '💡' },
      'ac': { title: 'Air Conditioners', icon: '❄️' },
      'water': { title: 'Water Sensors', icon: '💧' },
      'radar': { title: 'Radar Sensors', icon: '📡' },
      'door': { title: 'Door Sensors', icon: '🚪' },
      'security': { title: 'Security Systems', icon: '🔒' },
      'camera': { title: 'Cameras', icon: '📹' }
    };
    
    return configs[type] || { title: 'Other Sensors', icon: '📊' };
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
      <DashboardHeader
        avgTemperature={avgTemperature}
        avgHumidity={avgHumidity}
        onTempHumidityDetailsPress={() => setTempHumidityModalVisible(true)}
      />

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


          {/* Control Section - Lights & AC */}
          {(() => {
            const lightDevices = configuredDevices.filter(device => device.type === 'light');
            const acDevices = configuredDevices.filter(device => device.type === 'ac');
            const allControlDevices = [...lightDevices, ...acDevices];
            
            if (allControlDevices.length === 0) return null;
            
            return (
              <DeviceSection
                title="Controls"
                devices={allControlDevices}
                icon="🎛️"
                itemsPerRow={3}
              >
                {lightDevices.map(device => {
                  const deviceData = getDeviceData(device);
                  const isOn = deviceData.type === 'light' && deviceData.data ? 
                    (deviceData.data as LightData).new_state === 'on' : false;
                  
                  return (
                    <LightCard
                      key={device.id}
                      device={device}
                      isOn={isOn}
                      onToggle={toggleDevice}
                      cardWidth={getCardWidth(3)}
                    />
                  );
                })}
                {acDevices.map(device => {
                  const deviceData = getDeviceData(device);
                  const isOn = deviceData.type === 'climate' && deviceData.data ? 
                    (deviceData.data as ClimateData).new_state !== 'off' : false;
                  const acData = deviceData.type === 'climate' ? deviceData.data as ClimateData : null;
                  
                  return (
                    <AcCard
                      key={device.id}
                      device={device}
                      isOn={isOn}
                      acData={acData}
                      onToggle={toggleDevice}
                      onOpenSettings={openAcSettings}
                      cardWidth={getCardWidth(3)}
                    />
                  );
                })}
              </DeviceSection>
            );
          })()}

           {/* Cameras */}
          {(() => {
            const devices = configuredDevices.filter(device => device.type === 'camera');
            if (devices.length === 0) return null;
            const { title, icon } = getSectionConfig('camera');
            
            return (
              <DeviceSection
                title={title}
                devices={devices}
                icon={icon}
                itemsPerRow={2}
              >
                {devices.map(camera => {
                  // Get motion and occupancy sensor entities from storage (not hardcoded)
                  let motionSensor = null;
                  let occupancySensor = null;
                  
                  // Use sensor entities from camera storage configuration
                  if (camera.motion_sensor) {
                    motionSensor = haData.binarySensorData[camera.motion_sensor];
                  }
                  
                  if (camera.occupancy_sensor) {
                    occupancySensor = haData.binarySensorData[camera.occupancy_sensor];
                  }
                  
                  // Create enhanced camera object with sensor data
                  const cameraWithSensors = {
                    ...camera,
                    motion_sensor_detected: motionSensor ? motionSensor.new_state === 'on' : false,
                    occupancy_sensor_detected: occupancySensor ? occupancySensor.new_state === 'on' : false,
                    // Keep original entity IDs for reference
                    motion_sensor_entity: camera.motion_sensor,
                    occupancy_sensor_entity: camera.occupancy_sensor
                  };
                  
                  return (
                    <CameraCard
                      key={camera.id}
                      camera={cameraWithSensors}
                      cardWidth={getCardWidth(2)}
                    />
                  );
                })}
              </DeviceSection>
            );
          })()}

          {/* Binary Sensors */}
          {['water', 'radar', 'door', 'security'].map(sensorType => {
            const devices = configuredDevices.filter(device => device.type === sensorType);
            if (devices.length === 0) return null;
            const { title, icon } = getSectionConfig(sensorType);
            
            // Show 4 water sensors and 4 radar sensors in one row, others show 2 per row
            const itemsPerRow = (sensorType === 'water' || sensorType === 'radar') ? 4 : 2;

            return (
              <DeviceSection
                key={sensorType}
                title={title}
                devices={devices}
                icon={icon}
                itemsPerRow={itemsPerRow}
              >
                {devices.map(device => {
                  const { isActive, stateText } = getBinarySensorState(device);
                  return (
                    <BinarySensorCard
                      key={device.id}
                      device={device}
                      isActive={isActive}
                      stateText={stateText}
                      cardWidth={getCardWidth(itemsPerRow)}
                    />
                  );
                })}
              </DeviceSection>
            );
          })}

         

          {/* Other Sensors */}
          {(() => {
            const devices = configuredDevices.filter(device => 
              !['temp_humidity', 'light', 'ac', 'water', 'radar', 'door', 'security', 'camera'].includes(device.type)
            );
            if (devices.length === 0) return null;
            
            return (
              <DeviceSection
                title="Other Sensors"
                devices={devices}
                icon="📊"
                itemsPerRow={2}
              >
                {devices.map(device => {
                  // For other sensor types, use a simple card display
                  const deviceData = getDeviceData(device);
                  const cardWidth = getCardWidth(2);
                  
                  return (
                    <View key={device.id} style={[styles.card, { width: cardWidth }]}>
                      <View style={[styles.deviceCard, isDarkTheme && styles.deviceCardDark]}>
                        <View style={styles.deviceHeader}>
                          <View style={[
                            styles.deviceIconContainer,
                            { backgroundColor: isDarkTheme ? '#2a2a2a' : '#f8f9fa' }
                          ]}>
                            <Text style={styles.deviceIcon}>📱</Text>
                          </View>
                          <View style={styles.deviceInfo}>
                            <Text style={[styles.deviceName, isDarkTheme && styles.textDark]} numberOfLines={1}>
                              {device.name}
                            </Text>
                            <Text style={[styles.deviceType, isDarkTheme && styles.textSecondaryDark]} numberOfLines={1}>
                              {device.type}
                            </Text>
                          </View>
                        </View>
                        
                        {/* Show sensor value if available */}
                        {deviceData.type === 'sensor' && deviceData.data && (
                          <View style={styles.sensorValueContainer}>
                            <Text style={[
                              styles.sensorValue,
                              { color: isDarkTheme ? '#fff' : '#333' }
                            ]}>
                              {(deviceData.data as SensorData).new_state}
                              <Text style={styles.sensorUnit}>
                                {(deviceData.data as SensorData).attributes.unit_of_measurement}
                              </Text>
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </DeviceSection>
            );
          })()}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      {/* AC Settings Modal */}
      <AcSettingsModal
        visible={acModalVisible}
        selectedAc={selectedAc}
        onClose={closeAcSettings}
      />

      {/* Temperature & Humidity Details Modal */}
      <TempHumidityDetailsModal
        visible={tempHumidityModalVisible}
        tempHumidityDevices={configuredDevices.filter(device => device.type === 'temp_humidity')}
        sensorData={haData.sensorData}
        onClose={() => setTempHumidityModalVisible(false)}
      />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingBottom: 20,
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
    minHeight: 180,
    flex: 1,
  },
  deviceCardDark: {
    backgroundColor: '#1e1e1e',
    shadowOpacity: 0.3,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceIcon: {
    fontSize: 20,
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
  sensorValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    flex: 1,
  },
  sensorValue: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  sensorUnit: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
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