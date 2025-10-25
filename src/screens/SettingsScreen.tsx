import SettingsHeader from '@/components/ui/SettingsHeader';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import HomeAssistantConfigModal from '../../components/Modals/HomeAssistantConfigModal';
import { deviceStorageService } from '../services/DeviceStorageService';
import { SensorDevice, StoredDevices } from '../types';

interface CollapsibleSection {
  [key: string]: boolean;
}

interface CameraDevice extends SensorDevice {
  stream_url: string;
  motion_sensor: string;
  occupancy_sensor: string;
}

const SettingsScreen: React.FC = () => {
  const { isDark: isDarkTheme } = useTheme();
  const [devices, setDevices] = useState<StoredDevices | null>(null);
  const [loading, setLoading] = useState(true);
  const [haConfigModalVisible, setHaConfigModalVisible] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<CollapsibleSection>({
    waterSensors: true,
    radarSensors: true,
    tempHumiditySensors: true,
    doorSensor: true,
    lights: true,
    cameras: true,
    acs: true,
    security: true,
  });

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      // Ensure radar sensors count is correct (migration helper)
      await deviceStorageService.ensureRadarSensorsCount();
      
      const loadedDevices = await deviceStorageService.loadDevices();
      setDevices(loadedDevices);
    } catch (error) {
      Alert.alert('Error', 'Failed to load device settings');
    } finally {
      setLoading(false);
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
    field: string,
    value: string
  ) => {
    if (!devices) return;

    // Optimistic UI update
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
        const deviceArray = [...(updatedDevices[deviceType] as any[])];
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

    try {
      await deviceStorageService.updateDevice(deviceType, deviceId, { [field]: value });
    } catch (error) {
      Alert.alert('Error', 'Failed to save device settings');
      loadDevices();
    }
  };

  // Generic device input (non-camera)
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

  // Camera-specific inputs
  const renderCameraInput = (camera: CameraDevice, deviceType: keyof StoredDevices) => (
    <View key={camera.id} style={[styles.deviceContainer, isDarkTheme && styles.deviceContainerDark]}>
      <Text style={[styles.deviceLabel, isDarkTheme && styles.textDark]}>{camera.name}</Text>
      <TextInput
        style={[styles.input, isDarkTheme && styles.inputDark]}
        placeholder="Camera Name"
        placeholderTextColor={isDarkTheme ? '#888' : '#999'}
        value={camera.name}
        onChangeText={(value) => updateDevice(deviceType, camera.id, 'name', value)}
      />
      <TextInput
        style={[styles.input, isDarkTheme && styles.inputDark]}
        placeholder="Stream URL (e.g., rtsp://...)"
        placeholderTextColor={isDarkTheme ? '#888' : '#999'}
        value={camera.stream_url || ''}
        onChangeText={(value) => updateDevice(deviceType, camera.id, 'stream_url', value)}
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, isDarkTheme && styles.inputDark]}
        placeholder="Motion Sensor Entity ID"
        placeholderTextColor={isDarkTheme ? '#888' : '#999'}
        value={camera.motion_sensor || ''}
        onChangeText={(value) => updateDevice(deviceType, camera.id, 'motion_sensor', value)}
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, isDarkTheme && styles.inputDark]}
        placeholder="Occupancy Sensor Entity ID"
        placeholderTextColor={isDarkTheme ? '#888' : '#999'}
        value={camera.occupancy_sensor || ''}
        onChangeText={(value) => updateDevice(deviceType, camera.id, 'occupancy_sensor', value)}
        autoCapitalize="none"
      />
    </View>
  );

  const renderDeviceSection = (title: string, devices: SensorDevice[], deviceType: keyof StoredDevices) => (
    <View style={[styles.section, isDarkTheme && styles.sectionDark]}>
      <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(deviceType)} activeOpacity={0.7}>
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
          {deviceType === 'cameras'
            ? (devices as CameraDevice[]).map(cam => renderCameraInput(cam, deviceType))
            : devices.map(dev => renderDeviceInput(dev, deviceType))}
        </View>
      )}
    </View>
  );

  const renderSingleDeviceSection = (title: string, device: SensorDevice | null, deviceType: keyof StoredDevices) => {
    if (!device) return null;
    return (
      <View style={[styles.section, isDarkTheme && styles.sectionDark]}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(deviceType)} activeOpacity={0.7}>
          <Text style={[styles.sectionTitle, isDarkTheme && styles.textDark]}>{title}</Text>
          <Ionicons
            name={collapsedSections[deviceType] ? "chevron-down" : "chevron-up"}
            size={20}
            color={isDarkTheme ? "#fff" : "#666"}
          />
        </TouchableOpacity>

        {!collapsedSections[deviceType] && (
          <View style={styles.devicesList}>{renderDeviceInput(device, deviceType)}</View>
        )}
      </View>
    );
  };

  const saveAllSettings = async () => {
    if (!devices) return;
    try {
      await deviceStorageService.saveDevices(devices);
      Alert.alert(
        'Success', 
        'All settings have been saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)')
          }
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const expandAllSections = () => {
    const expanded: any = {};
    Object.keys(collapsedSections).forEach(key => (expanded[key] = false));
    setCollapsedSections(expanded);
  };

  const collapseAllSections = () => {
    const collapsed: any = {};
    Object.keys(collapsedSections).forEach(key => (collapsed[key] = true));
    setCollapsedSections(collapsed);
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

  return (
    <KeyboardAvoidingView
      style={[styles.container, isDarkTheme && styles.containerDark]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SettingsHeader />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={[styles.header, isDarkTheme && styles.headerDark]}>
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
            <TouchableOpacity
              style={[styles.quickActionButton, isDarkTheme && styles.quickActionButtonDark]}
              onPress={() => setHaConfigModalVisible(true)}
            >
              <Ionicons name="settings-outline" size={16} color={isDarkTheme ? "#fff" : "#007AFF"} />
              <Text style={[styles.quickActionText, isDarkTheme && styles.textDark]}>HA Config</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Device Sections */}
        {renderDeviceSection('Water Sensors', devices.waterSensors, 'waterSensors')}
        {renderDeviceSection('Radar Sensors', devices.radarSensors, 'radarSensors')}
        {renderDeviceSection('Temperature & Humidity', devices.tempHumiditySensors, 'tempHumiditySensors')}
        {renderSingleDeviceSection('Door Sensor', devices.doorSensor, 'doorSensor')}
        {renderDeviceSection('Lights', devices.lights, 'lights')}
        {renderDeviceSection('Cameras', devices.cameras as any, 'cameras')}
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
      
      {/* Home Assistant Configuration Modal */}
      <HomeAssistantConfigModal
        visible={haConfigModalVisible}
        onClose={() => setHaConfigModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  containerDark: { backgroundColor: '#121212' },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingContainerDark: { backgroundColor: '#121212' },
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
  headerDark: { backgroundColor: '#1e1e1e' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', flex: 1 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 12 },
  themeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickActions: { flexDirection: 'row', gap: 12 },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  quickActionButtonDark: { backgroundColor: '#2a2a2a' },
  quickActionText: { fontSize: 14, color: '#007AFF', fontWeight: '500' },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  sectionDark: { backgroundColor: '#1e1e1e' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  sectionTitleContainer: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  deviceCount: { fontSize: 14, color: '#666', marginTop: 2 },
  devicesList: { paddingHorizontal: 16, paddingBottom: 16 },
  deviceContainer: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  deviceContainerDark: { borderBottomColor: '#2a2a2a' },
  deviceLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#555' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputDark: { borderColor: '#333', backgroundColor: '#2a2a2a', color: '#fff' },
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
  },
  saveButtonDark: { backgroundColor: '#1565C0' },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  bottomSpacer: { height: 20 },
  textDark: { color: '#fff' },
  textSecondaryDark: { color: '#aaa' },
});

export default SettingsScreen;
