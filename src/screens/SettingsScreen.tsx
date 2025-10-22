import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch
} from 'react-native';
import { deviceStorageService } from '../services/DeviceStorageService';
import { StoredDevices, SensorDevice } from '../types';
import { Ionicons } from '@expo/vector-icons'; // Make sure to install expo/vector-icons

interface CollapsibleSection {
  [key: string]: boolean;
}

const SettingsScreen: React.FC = () => {
  const [devices, setDevices] = useState<StoredDevices | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<CollapsibleSection>({
    waterSensors: false,
    radarSensors: false,
    tempHumiditySensors: false,
    doorSensor: false,
    lights: false,
    cameras: false,
    acs: false,
    security: false,
  });

  useEffect(() => {
    loadDevices();
    loadThemePreference();
  }, []);

  const loadDevices = async () => {
    try {
      const loadedDevices = await deviceStorageService.loadDevices();
      setDevices(loadedDevices);
    } catch (error) {
      Alert.alert('Error', 'Failed to load device settings');
    } finally {
      setLoading(false);
    }
  };

  const loadThemePreference = async () => {
    try {
      // Load theme preference from storage
      const savedTheme = await deviceStorageService.loadThemePreference();
      setIsDarkTheme(savedTheme === 'dark');
    } catch (error) {
      // Default to light theme if loading fails
      setIsDarkTheme(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    try {
      // Save theme preference to storage
      await deviceStorageService.saveThemePreference(newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference');
    }
  };

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

 const updateDevice = async (
  deviceType: keyof StoredDevices,
  deviceId: string,
  field: 'name' | 'entity',
  value: string
) => {
  if (!devices) return;

  // Optimistically update UI
  setDevices(prevDevices => {
    if (!prevDevices) return prevDevices;
    
    const updatedDevices = { ...prevDevices };
    
    if (deviceType === 'doorSensor' || deviceType === 'security') {
      if (updatedDevices[deviceType] && updatedDevices[deviceType].id === deviceId) {
        updatedDevices[deviceType] = {
          ...updatedDevices[deviceType],
          [field]: value
        } as SensorDevice;
      }
    } else {
      const deviceArray = [...(updatedDevices[deviceType] as SensorDevice[])];
      const deviceIndex = deviceArray.findIndex(device => device.id === deviceId);
      if (deviceIndex !== -1) {
        deviceArray[deviceIndex] = {
          ...deviceArray[deviceIndex],
          [field]: value
        };
        updatedDevices[deviceType] = deviceArray as any;
      }
    }
    
    return updatedDevices;
  });

  // Save to storage in background
  try {
    await deviceStorageService.updateDevice(deviceType, deviceId, { [field]: value });
  } catch (error) {
    Alert.alert('Error', 'Failed to save device settings');
    // Revert on error by reloading from storage
    loadDevices();
  }
};

  const renderDeviceInput = (device: SensorDevice, deviceType: keyof StoredDevices) => (
    <View key={device.id} style={[styles.deviceContainer, isDarkTheme && styles.deviceContainerDark]}>
      <Text style={[styles.deviceLabel, isDarkTheme && styles.textDark]}>{device.name}</Text>
      <TextInput
        style={[styles.input, isDarkTheme && styles.inputDark]}
        placeholder="Device Name"
        placeholderTextColor={isDarkTheme ? '#888' : '#999'}
        value={device.name}
        onChangeText={(value) => updateDevice(deviceType, device.id, 'name', value)}
      />
      <TextInput
        style={[styles.input, isDarkTheme && styles.inputDark]}
        placeholder="Entity ID (e.g., sensor.water_level_1)"
        placeholderTextColor={isDarkTheme ? '#888' : '#999'}
        value={device.entity}
        onChangeText={(value) => updateDevice(deviceType, device.id, 'entity', value)}
        autoCapitalize="none"
      />
    </View>
  );

  const renderDeviceSection = (title: string, devices: SensorDevice[], deviceType: keyof StoredDevices) => (
    <View style={[styles.section, isDarkTheme && styles.sectionDark]}>
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => toggleSection(deviceType)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionTitleContainer}>
          <Text style={[styles.sectionTitle, isDarkTheme && styles.textDark]}>{title}</Text>
          <Text style={[styles.deviceCount, isDarkTheme && styles.textSecondaryDark]}>
            {devices.length} device{devices.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <Ionicons 
          name={collapsedSections[deviceType] ? "chevron-down" : "chevron-up"} 
          size={20} 
          color={isDarkTheme ? "#fff" : "#666"} 
        />
      </TouchableOpacity>
      
      {!collapsedSections[deviceType] && (
        <View style={styles.devicesList}>
          {devices.map(device => renderDeviceInput(device, deviceType))}
        </View>
      )}
    </View>
  );

  const renderSingleDeviceSection = (title: string, device: SensorDevice | null, deviceType: keyof StoredDevices) => {
    if (!device) return null;
    
    return (
      <View style={[styles.section, isDarkTheme && styles.sectionDark]}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection(deviceType)}
          activeOpacity={0.7}
        >
          <Text style={[styles.sectionTitle, isDarkTheme && styles.textDark]}>{title}</Text>
          <Ionicons 
            name={collapsedSections[deviceType] ? "chevron-down" : "chevron-up"} 
            size={20} 
            color={isDarkTheme ? "#fff" : "#666"} 
          />
        </TouchableOpacity>
        
        {!collapsedSections[deviceType] && (
          <View style={styles.devicesList}>
            {renderDeviceInput(device, deviceType)}
          </View>
        )}
      </View>
    );
  };

  const saveAllSettings = async () => {
    if (!devices) return;

    try {
      await deviceStorageService.saveDevices(devices);
      Alert.alert('Success', 'All settings have been saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const expandAllSections = () => {
    setCollapsedSections({
      waterSensors: false,
      radarSensors: false,
      tempHumiditySensors: false,
      doorSensor: false,
      lights: false,
      cameras: false,
      acs: false,
      security: false,
    });
  };

  const collapseAllSections = () => {
    setCollapsedSections({
      waterSensors: true,
      radarSensors: true,
      tempHumiditySensors: true,
      doorSensor: true,
      lights: true,
      cameras: true,
      acs: true,
      security: true,
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDarkTheme && styles.loadingContainerDark]}>
        <Text style={isDarkTheme && styles.textDark}>Loading settings...</Text>
      </View>
    );
  }

  if (!devices) {
    return (
      <View style={[styles.loadingContainer, isDarkTheme && styles.loadingContainerDark]}>
        <Text style={isDarkTheme && styles.textDark}>Failed to load settings</Text>
      </View>
    );
  }

  const themeStyles = isDarkTheme ? darkStyles : lightStyles;

  return (
    <KeyboardAvoidingView 
      style={[styles.container, isDarkTheme && styles.containerDark]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, isDarkTheme && styles.headerDark]}>
          <View style={styles.headerTop}>
            <Text style={[styles.title, isDarkTheme && styles.textDark]}>Smart Home Settings</Text>
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
            Configure your sensors and devices
          </Text>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.quickActionButton, isDarkTheme && styles.quickActionButtonDark]}
              onPress={expandAllSections}
            >
              <Ionicons name="expand-outline" size={16} color={isDarkTheme ? "#fff" : "#007AFF"} />
              <Text style={[styles.quickActionText, isDarkTheme && styles.textDark]}>Expand All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionButton, isDarkTheme && styles.quickActionButtonDark]}
              onPress={collapseAllSections}
            >
              <Ionicons name="contract-outline" size={16} color={isDarkTheme ? "#fff" : "#007AFF"} />
              <Text style={[styles.quickActionText, isDarkTheme && styles.textDark]}>Collapse All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Device Sections */}
        {renderDeviceSection('Water Sensors', devices.waterSensors, 'waterSensors')}
        {renderDeviceSection('Radar Sensors', devices.radarSensors, 'radarSensors')}
        {renderDeviceSection('Temperature & Humidity', devices.tempHumiditySensors, 'tempHumiditySensors')}
        {renderSingleDeviceSection('Door Sensor', devices.doorSensor, 'doorSensor')}
        {renderDeviceSection('Lights', devices.lights, 'lights')}
        {renderDeviceSection('Cameras', devices.cameras, 'cameras')}
        {renderDeviceSection('Air Conditioners', devices.acs, 'acs')}
        {renderSingleDeviceSection('Security System', devices.security, 'security')}

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, isDarkTheme && styles.saveButtonDark]} 
          onPress={saveAllSettings}
          activeOpacity={0.8}
        >
          <Ionicons name="save-outline" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save All Settings</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
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
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  themeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  quickActionButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  quickActionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  sectionDark: {
    backgroundColor: '#1e1e1e',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  deviceCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  devicesList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  deviceContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deviceContainerDark: {
    borderBottomColor: '#2a2a2a',
  },
  deviceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputDark: {
    borderColor: '#333',
    backgroundColor: '#2a2a2a',
    color: '#fff',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonDark: {
    backgroundColor: '#1565C0',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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

const lightStyles = StyleSheet.create({});
const darkStyles = StyleSheet.create({});

export default SettingsScreen;