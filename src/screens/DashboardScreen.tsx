import { AcCard, AcSettingsModal, BinarySensorCard, CameraCard, DeviceSection, LightCard } from '@/components';
import DashboardHeader from '@/components/ui/DashboardHeader';
import TempHumidityDetailsModal from '@/components/ui/TempHumidityDetailsModal';
import { useTheme } from '@/context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
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

// Import components

const CONTAINER_PADDING = 16;
const CARD_GAP = 12;

const DashboardScreen: React.FC = () => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { isDark: isDarkTheme } = useTheme();
  const [configuredDevices, setConfiguredDevices] = useState<SensorDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Separate states for different entity types
  const [binarySensorData, setBinarySensorData] = useState<{ [key: string]: BinarySensorData }>({});
  const [climateData, setClimateData] = useState<{ [key: string]: ClimateData }>({});
  const [lightData, setLightData] = useState<{ [key: string]: LightData }>({});
  const [sensorData, setSensorData] = useState<{ [key: string]: SensorData }>({});
  
  const [acModalVisible, setAcModalVisible] = useState(false);
  const [selectedAc, setSelectedAc] = useState<SensorDevice | null>(null);
  const [tempHumidityModalVisible, setTempHumidityModalVisible] = useState(false);
  const [avgTemperature, setAvgTemperature] = useState<number>(0);
  const [avgHumidity, setAvgHumidity] = useState<number>(0);

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
      loadEntityData();
    }, [])
  );

  // Calculate averages whenever sensor data changes
  React.useEffect(() => {
    calculateAverages();
  }, [sensorData, configuredDevices]);

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
      const devices = await deviceStorageService.getConfiguredDevices();
      setConfiguredDevices(devices);
    } catch (error) {
      Alert.alert('Error', 'Failed to load configured devices');
    } finally {
      setLoading(false);
    }
  };

  const loadEntityData = async () => {
    try {
      // TODO: Replace with actual Home Assistant API calls
      // This is mock data for demonstration using your provided examples
      
      // Binary Sensor Data
      const binaryData: { [key: string]: BinarySensorData } = {
        'binary_sensor.boardb_presence_tu_pressure': {
          entity_id: 'binary_sensor.boardb_presence_tu_pressure',
          old_state: 'off',
          new_state: 'on', // Active water detection
          user_id: null,
          timestamp: '2025-10-21T16:01:02.946201+00:00',
          attributes: {
            device_class: 'moisture',
            friendly_name: 'Water Sensor 1'
          }
        },
        'test22': {
          entity_id: 'test22',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-21T16:01:02.946201+00:00',
          attributes: {
            device_class: 'moisture',
            friendly_name: 'Water Sensor 2'
          }
        },
        'test': {
          entity_id: 'test',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-21T16:01:02.946201+00:00',
          attributes: {
            device_class: 'moisture',
            friendly_name: 'Water Sensor 3'
          }
        },
        'radar 1': {
          entity_id: 'radar 1',
          old_state: 'off',
          new_state: 'on', // Active radar detection
          user_id: null,
          timestamp: '2025-10-21T16:01:02.946201+00:00',
          attributes: {
            device_class: 'motion',
            friendly_name: 'Radar Sensor 1'
          }
        },
        'radar 2': {
          entity_id: 'radar 2',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-21T16:01:02.946201+00:00',
          attributes: {
            device_class: 'motion',
            friendly_name: 'Radar Sensor 2'
          }
        },
        'radar 3': {
          entity_id: 'radar 3',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-21T16:01:02.946201+00:00',
          attributes: {
            device_class: 'motion',
            friendly_name: 'Radar Sensor 3'
          }
        },
        'binary_sensor.frontdoor_1_person_occupancy': {
          entity_id: 'binary_sensor.frontdoor_1_person_occupancy',
          old_state: 'off',
          new_state: 'on',
          user_id: null,
          timestamp: '2025-10-21T16:01:02.946201+00:00',
          attributes: {
            device_class: 'occupancy',
            icon: 'mdi:home-outline',
            friendly_name: 'Frontdoor 1 Person occupancy'
          }
        },
        'binary_sensor.boardb_presence_tu_presence': {
          entity_id: 'binary_sensor.boardb_presence_tu_presence',
          old_state: 'off',
          new_state: 'on',
          user_id: null,
          timestamp: '2025-10-21T15:59:06.037860+00:00',
          attributes: {
            device_class: 'occupancy',
            friendly_name: 'BoardB_Presence_TU Occupancy'
          }
        },
        'binary_sensor.water_leak': {
          entity_id: 'binary_sensor.water_leak',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-21T16:01:02.946201+00:00',
          attributes: {
            device_class: 'moisture',
            friendly_name: 'Water Leak Sensor'
          }
        },
        'binary_sensor.radar_motion': {
          entity_id: 'binary_sensor.radar_motion',
          old_state: 'off',
          new_state: 'on',
          user_id: null,
          timestamp: '2025-10-21T16:01:02.946201+00:00',
          attributes: {
            device_class: 'motion',
            friendly_name: 'Radar Motion Sensor'
          }
        },
        'binary_sensor.front_door': {
          entity_id: 'binary_sensor.front_door',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-21T16:01:02.946201+00:00',
          attributes: {
            device_class: 'door',
            friendly_name: 'Front Door'
          }
        },
        'binary_sensor.security_system': {
          entity_id: 'binary_sensor.security_system',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-21T16:01:02.946201+00:00',
          attributes: {
            device_class: 'safety',
            friendly_name: 'Security System'
          }
        }
      };
      setBinarySensorData(binaryData);

      // Climate Data (AC)
      const climateData: { [key: string]: ClimateData } = {
        'climate.office_ac': {
          entity_id: 'climate.office_ac',
          old_state: 'heat_cool',
          new_state: 'heat_cool',
          user_id: '45882e54e84d4c308af1caabae6b3876',
          timestamp: '2025-10-21T15:59:57.597483+00:00',
          attributes: {
            hvac_modes: ['off', 'heat', 'cool', 'heat_cool', 'fan_only'],
            min_temp: 18.0,
            max_temp: 30.0,
            target_temp_step: 1.0,
            fan_modes: ['low', 'mid', 'high'],
            current_temperature: null,
            temperature: 22,
            fan_mode: 'low',
            last_on_operation: 'heat_cool',
            device_code: 1380,
            manufacturer: 'Midea',
            supported_models: ['Unknown'],
            supported_controller: 'Broadlink',
            commands_encoding: 'Base64',
            friendly_name: 'Office AC',
            supported_features: 393
          }
        }
      };
      setClimateData(climateData);

      // Light Data
      const lightData: { [key: string]: LightData } = {
        'light.boarda_buttonswitch_a': {
          entity_id: 'light.boarda_buttonswitch_a',
          old_state: 'off',
          new_state: 'on',
          user_id: null,
          timestamp: '2025-10-21T15:49:37.237420+00:00',
          attributes: {
            supported_color_modes: ['onoff'],
            color_mode: 'onoff',
            friendly_name: 'Board A - Button Switch - A',
            supported_features: 0
          }
        },
        'light.living_room': {
          entity_id: 'light.living_room',
          old_state: 'on',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-21T15:49:37.237420+00:00',
          attributes: {
            supported_color_modes: ['onoff'],
            color_mode: 'onoff',
            friendly_name: 'Living Room Light',
            supported_features: 0
          }
        }
      };
      setLightData(lightData);

      // Sensor Data (Temperature/Humidity)
      const sensorData: { [key: string]: SensorData } = {
        'sensor.boarda_temp_sonoff_temperature': {
          entity_id: 'sensor.boarda_temp_sonoff_temperature',
          old_state: '25.15',
          new_state: '25.18',
          user_id: null,
          timestamp: '2025-10-21T16:01:55.195652+00:00',
          attributes: {
            state_class: 'measurement',
            unit_of_measurement: '°C',
            device_class: 'temperature',
            friendly_name: 'BoardA_Temp_Sonoff Temperature'
          }
        },
        'sensor.boarda_temp_sonoff_humidity': {
          entity_id: 'sensor.boarda_temp_sonoff_humidity',
          old_state: '65',
          new_state: '65',
          user_id: null,
          timestamp: '2025-10-21T16:01:55.195652+00:00',
          attributes: {
            state_class: 'measurement',
            unit_of_measurement: '%',
            device_class: 'humidity',
            friendly_name: 'BoardA_Temp_Sonoff Humidity'
          }
        },
        'sensor.living_room_temperature': {
          entity_id: 'sensor.living_room_temperature',
          old_state: '22.5',
          new_state: '22.5',
          user_id: null,
          timestamp: '2025-10-21T16:01:55.195652+00:00',
          attributes: {
            state_class: 'measurement',
            unit_of_measurement: '°C',
            device_class: 'temperature',
            friendly_name: 'Living Room Temperature'
          }
        },
        'sensor.living_room_humidity': {
          entity_id: 'sensor.living_room_humidity',
          old_state: '45',
          new_state: '45',
          user_id: null,
          timestamp: '2025-10-21T16:01:55.195652+00:00',
          attributes: {
            state_class: 'measurement',
            unit_of_measurement: '%',
            device_class: 'humidity',
            friendly_name: 'Living Room Humidity'
          }
        }
      };
      setSensorData(sensorData);

    } catch (error) {
      console.error('Failed to load entity data');
    }
  };

  // Helper function to get data for a specific device
  const getDeviceData = (device: SensorDevice) => {
    const entityId = device.entity;
    
    // First check binary sensors directly
    if (binarySensorData[entityId]) {
      return { type: 'binary', data: binarySensorData[entityId] };
    }
    
    // Check climate (AC)
    if (climateData[entityId]) {
      return { type: 'climate', data: climateData[entityId] };
    }
    
    // Check lights
    if (lightData[entityId]) {
      return { type: 'light', data: lightData[entityId] };
    }
    
    // Check sensors
    if (sensorData[entityId]) {
      return { type: 'sensor', data: sensorData[entityId] };
    }
    
    return { type: 'unknown', data: null };
  };

  const toggleDevice = async (deviceId: string, deviceType: string, entityId: string) => {
    try {
      // For lights and AC, update the state in the corresponding data store
      if (deviceType === 'light') {
        const currentData = lightData[entityId];
        if (currentData) {
          const newState = currentData.new_state === 'on' ? 'off' : 'on';
          setLightData(prev => ({
            ...prev,
            [entityId]: {
              ...currentData,
              new_state: newState,
              old_state: currentData.new_state
            }
          }));
        }
      } else if (deviceType === 'ac') {
        const currentData = climateData[entityId];
        if (currentData) {
          const newState = currentData.new_state === 'off' ? 'heat_cool' : 'off';
          setClimateData(prev => ({
            ...prev,
            [entityId]: {
              ...currentData,
              new_state: newState,
              old_state: currentData.new_state
            }
          }));
        }
      }
      
      console.log(`Toggling ${deviceType} ${deviceId} (${entityId})`);
      
      // TODO: Replace with actual Home Assistant API call
    } catch (error) {
      Alert.alert('Error', `Failed to toggle ${deviceType}`);
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
    await loadEntityData();
    setRefreshing(false);
  };

  const getBinarySensorState = (device: SensorDevice): { isActive: boolean; stateText: string } => {
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
    
    // If no data found, check if we have any data in the binarySensorData object directly
    const directData = binarySensorData[device.entity];
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

          {/* Binary Sensors */}
          {['water', 'radar', 'door', 'security'].map(sensorType => {
            const devices = configuredDevices.filter(device => device.type === sensorType);
            if (devices.length === 0) return null;
            const { title, icon } = getSectionConfig(sensorType);
            
            // Show 4 water sensors in one row, others show 2 per row
            const itemsPerRow = sensorType === 'water' ? 4 : 2;

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
                {devices.map(camera => (
                  <CameraCard
                    key={camera.id}
                    camera={camera}
                    cardWidth={getCardWidth(2)}
                  />
                ))}
              </DeviceSection>
            );
          })()}

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
        sensorData={sensorData}
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