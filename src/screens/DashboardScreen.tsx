import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
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

// Define types for different entity data
interface BinarySensorData {
  entity_id: string;
  old_state: string;
  new_state: string;
  user_id: string | null;
  timestamp: string;
  attributes: {
    device_class: string;
    icon?: string;
    friendly_name: string;
  };
}

interface ClimateData {
  entity_id: string;
  old_state: string;
  new_state: string;
  user_id: string | null;
  timestamp: string;
  attributes: {
    hvac_modes: string[];
    min_temp: number;
    max_temp: number;
    target_temp_step: number;
    fan_modes: string[];
    current_temperature: number | null;
    temperature: number;
    fan_mode: string;
    last_on_operation: string;
    device_code: number;
    manufacturer: string;
    supported_models: string[];
    supported_controller: string;
    commands_encoding: string;
    friendly_name: string;
    supported_features: number;
  };
}

interface LightData {
  entity_id: string;
  old_state: string;
  new_state: string;
  user_id: string | null;
  timestamp: string;
  attributes: {
    supported_color_modes: string[];
    color_mode: string;
    friendly_name: string;
    supported_features: number;
  };
}

interface SensorData {
  entity_id: string;
  old_state: string;
  new_state: string;
  user_id: string | null;
  timestamp: string;
  attributes: {
    state_class: string;
    unit_of_measurement: string;
    device_class: string;
    friendly_name: string;
  };
}

const DashboardScreen: React.FC = () => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const [configuredDevices, setConfiguredDevices] = useState<SensorDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  
  // Separate states for different entity types
  const [binarySensorData, setBinarySensorData] = useState<{ [key: string]: BinarySensorData }>({});
  const [climateData, setClimateData] = useState<{ [key: string]: ClimateData }>({});
  const [lightData, setLightData] = useState<{ [key: string]: LightData }>({});
  const [sensorData, setSensorData] = useState<{ [key: string]: SensorData }>({});
  
  const [acModalVisible, setAcModalVisible] = useState(false);
  const [selectedAc, setSelectedAc] = useState<SensorDevice | null>(null);

  // Calculate responsive card widths based on current screen dimensions
  const getCardWidth = (itemsPerRow: number) => {
    const totalGap = CARD_GAP * (itemsPerRow - 1);
    const availableWidth = SCREEN_WIDTH - (CONTAINER_PADDING * 2) - totalGap;
    return availableWidth / itemsPerRow;
  };

  // Load theme preference and devices when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadThemePreference();
      loadConfiguredDevices();
      loadEntityData();
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
          old_state: 'on',
          new_state: 'off',
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

  const getDeviceIcon = (type: string, isActive: boolean = false): string => {
    switch (type) {
      case 'water': return '💧';
      case 'radar': return '📡';
      case 'temp_humidity': return '🌡️';
      case 'temperature': return '🌡️';
      case 'humidity': return '💧';
      case 'door': return '🚪';
      case 'light': return isActive ? '💡' : '💡';
      case 'camera': return '📹';
      case 'ac': return isActive ? '❄️' : '⛄';
      case 'security': return '🔒';
      default: return '📱';
    }
  };

  const getDeviceTypeLabel = (type: string): string => {
    switch (type) {
      case 'water': return 'Water Sensor';
      case 'radar': return 'Radar Sensor';
      case 'temp_humidity': return 'Temperature & Humidity';
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

  const getStatusColor = (isActive: boolean, isDark: boolean): string => {
    console.log('isActive:', isActive, 'isDark:', isDark);
    if (isActive) {
      return isDark ? '#4CAF50' : '#2E7D32'; // Green for active
    }
    return isDark ? '#666' : '#999'; // Gray for inactive
  };

  const getBinarySensorState = (device: SensorDevice): { isActive: boolean; stateText: string } => {
    const deviceData = getDeviceData(device);
    console.log('Device Data for', device.name, ':', deviceData);
    
    // Check if we have binary sensor data
    if (deviceData.type === 'binary' && deviceData.data) {
      const binaryData = deviceData.data as BinarySensorData;
      const isActive = binaryData.new_state === 'on';
      console.log('Binary Sensor State:', binaryData.new_state, 'isActive:', isActive);
      
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
      console.log('Direct Binary Sensor Data:', directData.new_state, 'isActive:', isActive);
      
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
    
    console.log('No binary sensor data found for', device.entity);
    return { isActive: false, stateText: 'No Data' };
  };

  // Find matching temperature and humidity sensors for a device
  const getTempHumidityData = (device: SensorDevice): { temperature: any; humidity: any } => {
    const deviceData = getDeviceData(device);
    
    if (deviceData.type !== 'sensor' || !deviceData.data) {
      return { temperature: null, humidity: null };
    }

    const tempData = deviceData.data as SensorData;
    let humidityData = null;

    // Try to find matching humidity sensor
    if (device.entity.includes('temperature')) {
      const humidityEntity = device.entity.replace('temperature', 'humidity');
      const humidityDeviceData = getDeviceData({ ...device, entity: humidityEntity });
      if (humidityDeviceData.type === 'sensor' && humidityDeviceData.data) {
        humidityData = humidityDeviceData.data;
      }
    } else if (device.entity.includes('temp')) {
      const humidityEntity = device.entity.replace('temp', 'humidity');
      const humidityDeviceData = getDeviceData({ ...device, entity: humidityEntity });
      if (humidityDeviceData.type === 'sensor' && humidityDeviceData.data) {
        humidityData = humidityDeviceData.data;
      }
    }

    return {
      temperature: tempData,
      humidity: humidityData
    };
  };

  const renderTempHumidityCard = (device: SensorDevice) => {
    const cardWidth = getCardWidth(2);
    const { temperature, humidity } = getTempHumidityData(device);
    
    return (
      <View key={device.id} style={[styles.card, { width: cardWidth }]}>
        <View style={[styles.deviceCard, isDarkTheme && styles.deviceCardDark]}>
          <View style={styles.deviceHeader}>
            <View style={[
              styles.deviceIconContainer,
              { backgroundColor: isDarkTheme ? '#2a2a2a' : '#f8f9fa' }
            ]}>
              <Text style={styles.deviceIcon}>
                {getDeviceIcon(device.type)}
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
          
          {/* Temperature and Humidity Display */}
          <View style={styles.tempHumidityContainer}>
            {/* Temperature */}
            <View style={styles.valueContainer}>
              <View style={styles.valueRow}>
                <Text style={styles.valueLabel}>🌡️ Temp</Text>
                <Text style={[
                  styles.value,
                  { 
                    color: temperature ? '#4FC3F7' : (isDarkTheme ? '#aaa' : '#666')
                  }
                ]}>
                  {temperature ? `${parseFloat(temperature.new_state).toFixed(1)}°` : '--'}
                </Text>
              </View>
              <View style={[
                styles.valueBar,
                { backgroundColor: isDarkTheme ? '#333' : '#e0e0e0' }
              ]}>
                <View 
                  style={[
                    styles.valueFill,
                    { 
                      backgroundColor: '#4FC3F7',
                      width: temperature ? `${Math.min((parseFloat(temperature.new_state) - 10) / 30 * 100, 100)}%` : '0%'
                    }
                  ]} 
                />
              </View>
            </View>

            {/* Humidity */}
            <View style={styles.valueContainer}>
              <View style={styles.valueRow}>
                <Text style={styles.valueLabel}>💧 Humidity</Text>
                <Text style={[
                  styles.value,
                  { 
                    color: humidity ? '#66BB6A' : (isDarkTheme ? '#aaa' : '#666')
                  }
                ]}>
                  {humidity ? `${parseFloat(humidity.new_state).toFixed(0)}%` : '--'}
                </Text>
              </View>
              <View style={[
                styles.valueBar,
                { backgroundColor: isDarkTheme ? '#333' : '#e0e0e0' }
              ]}>
                <View 
                  style={[
                    styles.valueFill,
                    { 
                      backgroundColor: '#66BB6A',
                      width: humidity ? `${Math.min(parseFloat(humidity.new_state), 100)}%` : '0%'
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          {/* Last Updated */}
          <View style={styles.lastUpdated}>
            <Text style={[styles.lastUpdatedText, isDarkTheme && styles.textSecondaryDark]}>
              {temperature || humidity ? 'Updated now' : 'No data'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderBinarySensorCard = (device: SensorDevice) => {
    const cardWidth = getCardWidth(2);
    console.log('Rendering Binary Sensor Card for', device);
    const { isActive, stateText } = getBinarySensorState(device);
    
    return (
      <View key={device.id} style={[styles.card, { width: cardWidth }]}>
        <View style={[styles.sensorCard, isDarkTheme && styles.sensorCardDark]}>
          <View style={styles.sensorHeader}>
            <View style={[
              styles.sensorIconContainer,
              isActive && styles.sensorIconContainerActive,
              { backgroundColor: isDarkTheme ? '#2a2a2a' : '#f8f9fa' }
            ]}>
              <Text style={[
                styles.sensorIcon,
                { color: getStatusColor(isActive, isDarkTheme) }
              ]}>
                {getDeviceIcon(device.type)}
              </Text>
            </View>
            <View style={styles.sensorInfo}>
              <Text style={[styles.sensorName, isDarkTheme && styles.textDark]} numberOfLines={1}>
                {device.name}
              </Text>
              <Text style={[styles.sensorType, isDarkTheme && styles.textSecondaryDark]} numberOfLines={1}>
                {getDeviceTypeLabel(device.type)}
              </Text>
            </View>
          </View>
          
          {/* State Display */}
          <View style={styles.stateContainer}>
            <View style={styles.stateIndicator}>
              <View style={[
                styles.stateDot,
                { backgroundColor: getStatusColor(isActive, isDarkTheme) }
              ]} />
              <Text style={[
                styles.stateText,
                isDarkTheme && styles.textDark,
                { color: getStatusColor(isActive, isDarkTheme) }
              ]}>
                {stateText}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderLightCard = (device: SensorDevice) => {
    const cardWidth = getCardWidth(2);
    const deviceData = getDeviceData(device);
    const isOn = deviceData.type === 'light' && deviceData.data ? (deviceData.data as LightData).new_state === 'on' : false;
    
    return (
      <View key={device.id} style={[styles.card, { width: cardWidth }]}>
        <View style={[styles.controlCard, isDarkTheme && styles.controlCardDark]}>
          <View style={styles.controlHeader}>
            <View style={[
              styles.controlIconContainer,
              isOn && styles.controlIconContainerActive,
              { backgroundColor: isDarkTheme ? '#2a2a2a' : '#f8f9fa' }
            ]}>
              <Ionicons
                name={isOn ? "bulb" : "bulb-outline"}
                size={24}
                color={isOn ? (isDarkTheme ? '#FFD700' : '#FFA000') : (isDarkTheme ? '#666' : '#999')}
              />
            </View>
            <View style={styles.controlInfo}>
              <Text style={[styles.controlName, isDarkTheme && styles.textDark]} numberOfLines={1}>
                {device.name}
              </Text>
              <Text style={[styles.controlType, isDarkTheme && styles.textSecondaryDark]} numberOfLines={1}>
                {getDeviceTypeLabel(device.type)}
              </Text>
            </View>
            <View style={styles.toggleWrapper}>
              <Switch
                value={isOn}
                onValueChange={() => toggleDevice(device.id, device.type, device.entity)}
                trackColor={{ false: '#767577', true: isDarkTheme ? '#4CAF50' : '#81C784' }}
                thumbColor={isOn ? (isDarkTheme ? '#4CAF50' : '#2E7D32') : (isDarkTheme ? '#aaa' : '#f4f3f4')}
                ios_backgroundColor="#3e3e3e"
                style={styles.controlSwitch}
              />
            </View>
          </View>
          
          {/* Status Indicator */}
          <View style={styles.statusIndicator}>
            <View style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(isOn, isDarkTheme) }
            ]} />
            <Text style={[
              styles.statusText,
              isDarkTheme && styles.textDark,
              { color: getStatusColor(isOn, isDarkTheme) }
            ]}>
              {isOn ? 'ON' : 'OFF'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderAcCard = (device: SensorDevice) => {
    const cardWidth = getCardWidth(2);
    const deviceData = getDeviceData(device);
    const isOn = deviceData.type === 'climate' && deviceData.data ? (deviceData.data as ClimateData).new_state !== 'off' : false;
    const acData = deviceData.type === 'climate' ? deviceData.data as ClimateData : null;
    
    return (
      <View key={device.id} style={[styles.card, { width: cardWidth }]}>
        <View style={[styles.controlCard, isDarkTheme && styles.controlCardDark]}>
          <View style={styles.controlHeader}>
            <View style={[
              styles.controlIconContainer,
              isOn && styles.controlIconContainerActive,
              { backgroundColor: isDarkTheme ? '#2a2a2a' : '#f8f9fa' }
            ]}>
              <Text style={[
                styles.controlIcon,
                { color: isOn ? (isDarkTheme ? '#4CAF50' : '#2E7D32') : (isDarkTheme ? '#666' : '#999') }
              ]}>
                {getDeviceIcon(device.type, isOn)}
              </Text>
            </View>
            <View style={styles.controlInfo}>
              <Text style={[styles.controlName, isDarkTheme && styles.textDark]} numberOfLines={1}>
                {device.name}
              </Text>
              <Text style={[styles.controlType, isDarkTheme && styles.textSecondaryDark]} numberOfLines={1}>
                {getDeviceTypeLabel(device.type)}
              </Text>
              {acData && isOn && (
                <Text style={[styles.acStatus, isDarkTheme && styles.textSecondaryDark]}>
                  {acData.attributes.temperature}°C • {acData.attributes.fan_mode}
                </Text>
              )}
            </View>
            <View style={styles.acControls}>
              {isOn && (
                <TouchableOpacity
                  style={[styles.settingsButton, isDarkTheme && styles.settingsButtonDark]}
                  onPress={() => openAcSettings(device)}
                >
                  <Ionicons 
                    name="settings-outline" 
                    size={18} 
                    color={isDarkTheme ? "#fff" : "#666"} 
                  />
                </TouchableOpacity>
              )}
              <View style={styles.toggleWrapper}>
                <Switch
                  value={isOn}
                  onValueChange={() => toggleDevice(device.id, device.type, device.entity)}
                  trackColor={{ false: '#767577', true: isDarkTheme ? '#4CAF50' : '#81C784' }}
                  thumbColor={isOn ? (isDarkTheme ? '#4CAF50' : '#2E7D32') : (isDarkTheme ? '#aaa' : '#f4f3f4')}
                  ios_backgroundColor="#3e3e3e"
                  style={styles.controlSwitch}
                />
              </View>
            </View>
          </View>
          
          {/* Status Indicator */}
          <View style={styles.statusIndicator}>
            <View style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(isOn, isDarkTheme) }
            ]} />
            <Text style={[
              styles.statusText,
              isDarkTheme && styles.textDark,
              { color: getStatusColor(isOn, isDarkTheme) }
            ]}>
              {isOn ? (acData?.new_state.toUpperCase() || 'ON') : 'OFF'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderAcSettingsModal = () => (
    <Modal
      visible={acModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeAcSettings}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDarkTheme && styles.modalContentDark]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDarkTheme && styles.textDark]}>
              AC Settings - {selectedAc?.name}
            </Text>
            <TouchableOpacity onPress={closeAcSettings} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={isDarkTheme ? "#fff" : "#333"} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={[styles.modalSectionTitle, isDarkTheme && styles.textDark]}>
              Temperature Control
            </Text>
            <View style={styles.tempControl}>
              <TouchableOpacity style={[styles.tempButton, isDarkTheme && styles.tempButtonDark]}>
                <Text style={[styles.tempButtonText, isDarkTheme && styles.textDark]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.tempValue, isDarkTheme && styles.textDark]}>22°C</Text>
              <TouchableOpacity style={[styles.tempButton, isDarkTheme && styles.tempButtonDark]}>
                <Text style={[styles.tempButtonText, isDarkTheme && styles.textDark]}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSectionTitle, isDarkTheme && styles.textDark]}>
              Mode
            </Text>
            <View style={styles.modeContainer}>
              {['Cool', 'Heat', 'Fan', 'Auto'].map(mode => (
                <TouchableOpacity 
                  key={mode}
                  style={[styles.modeButton, isDarkTheme && styles.modeButtonDark]}
                >
                  <Text style={[styles.modeButtonText, isDarkTheme && styles.textDark]}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalSectionTitle, isDarkTheme && styles.textDark]}>
              Fan Speed
            </Text>
            <View style={styles.modeContainer}>
              {['Low', 'Medium', 'High', 'Auto'].map(speed => (
                <TouchableOpacity 
                  key={speed}
                  style={[styles.modeButton, isDarkTheme && styles.modeButtonDark]}
                >
                  <Text style={[styles.modeButtonText, isDarkTheme && styles.textDark]}>{speed}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.saveButton, isDarkTheme && styles.saveButtonDark]}
              onPress={closeAcSettings}
            >
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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
          <View style={styles.cameraStatus}>
            <View style={[styles.statusIndicator, { backgroundColor: '#4CAF50' }]} />
            <Text style={[styles.cameraStatusText, isDarkTheme && styles.textSecondaryDark]}>
              Online
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSensorCard = (device: SensorDevice, itemsPerRow: number = 2) => {
    if (device.type === 'temp_humidity') {
      return renderTempHumidityCard(device);
    }
    if (device.type === 'light') {
      return renderLightCard(device);
    }
    if (device.type === 'ac') {
      return renderAcCard(device);
    }
    if (['water', 'radar', 'door', 'security'].includes(device.type)) {
      return renderBinarySensorCard(device);
    }

    // Default fallback for other sensor types
    const cardWidth = getCardWidth(itemsPerRow);
    const deviceData = getDeviceData(device);
    
    return (
      <View key={device.id} style={[styles.card, { width: cardWidth }]}>
        <View style={[styles.deviceCard, isDarkTheme && styles.deviceCardDark]}>
          <View style={styles.deviceHeader}>
            <View style={[
              styles.deviceIconContainer,
              { backgroundColor: isDarkTheme ? '#2a2a2a' : '#f8f9fa' }
            ]}>
              <Text style={styles.deviceIcon}>
                {getDeviceIcon(device.type)}
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
  };

  const renderGridSection = (title: string, devices: SensorDevice[], icon: string, itemsPerRow: number = 2) => {
    if (devices.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkTheme && styles.textDark]}>
          {icon} {title} ({devices.length})
        </Text>
        <View style={[styles.grid, { gap: CARD_GAP }]}>
          {devices.map((device) => renderSensorCard(device, itemsPerRow))}
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
          {/* Temperature & Humidity Sensors */}
          {renderGridSection(
            'Temperature & Humidity', 
            configuredDevices.filter(device => device.type === 'temp_humidity'), 
            '🌡️', 
            2
          )}

          {/* Control Section - Lights */}
          {renderGridSection(
            'Lights Control', 
            configuredDevices.filter(device => device.type === 'light'), 
            '💡', 
            2
          )}

          {/* Control Section - AC */}
          {renderGridSection(
            'Air Conditioners', 
            configuredDevices.filter(device => device.type === 'ac'), 
            '❄️', 
            2
          )}

          {/* Binary Sensors */}
          {renderGridSection('Water Sensors', configuredDevices.filter(device => device.type === 'water'), '💧', 2)}
          {renderGridSection('Radar Sensors', configuredDevices.filter(device => device.type === 'radar'), '📡', 2)}
          {renderGridSection('Door Sensors', configuredDevices.filter(device => device.type === 'door'), '🚪', 2)}
          {renderGridSection('Security Systems', configuredDevices.filter(device => device.type === 'security'), '🔒', 2)}

          {/* Other Sensors */}
          {renderGridSection('Other Sensors', configuredDevices.filter(device => 
            !['temp_humidity', 'light', 'ac', 'water', 'radar', 'door', 'security', 'camera'].includes(device.type)
          ), '📊', 2)}

          {/* Cameras */}
          {renderCameraSection(configuredDevices.filter(device => device.type === 'camera'))}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      {/* AC Settings Modal */}
      {renderAcSettingsModal()}
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
  // Binary Sensor Cards (Water, Radar, Door, Security)
  sensorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 100,
    flex: 1,
  },
  sensorCardDark: {
    backgroundColor: '#1e1e1e',
    shadowOpacity: 0.3,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sensorIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#f8f9fa',
  },
  sensorIconContainerActive: {
    transform: [{ scale: 1.05 }],
  },
  sensorIcon: {
    fontSize: 20,
  },
  sensorInfo: {
    flex: 1,
  },
  sensorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  sensorType: {
    fontSize: 12,
    color: '#666',
  },
  stateContainer: {
    alignItems: 'center',
  },
  stateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Control Cards (Lights & AC)
  controlCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 120,
    flex: 1,
  },
  controlCardDark: {
    backgroundColor: '#1e1e1e',
    shadowOpacity: 0.3,
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#f8f9fa',
  },
  controlIconContainerActive: {
    transform: [{ scale: 1.05 }],
  },
  controlIcon: {
    fontSize: 20,
  },
  controlInfo: {
    flex: 1,
  },
  controlName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  controlType: {
    fontSize: 12,
    color: '#666',
  },
  acStatus: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  toggleWrapper: {
    marginLeft: 'auto',
  },
  controlSwitch: {
    transform: [{ scale: 1.1 }],
  },
  acControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  settingsButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  statusIndicator: {
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalContentDark: {
    backgroundColor: '#1e1e1e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  tempControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tempButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tempButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  tempButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  tempValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  modeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDark: {
    backgroundColor: '#1565C0',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Device Cards (Temperature/Humidity and others)
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
  // Temperature & Humidity specific styles
  tempHumidityContainer: {
    marginBottom: 12,
  },
  valueContainer: {
    marginBottom: 16,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  valueLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  valueBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  valueFill: {
    height: '100%',
    borderRadius: 3,
  },
  lastUpdated: {
    marginTop: 'auto',
  },
  lastUpdatedText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  // Sensor Value Styles
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
  cameraStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cameraStatusText: {
    fontSize: 11,
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