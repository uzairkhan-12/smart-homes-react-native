import SettingsHeader from '@/components/ui/SettingsHeader';
import { getColors } from '@/constants/colors';
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
  View,
  useColorScheme
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
  const { theme, setTheme } = useTheme();
  const isDarkTheme = theme === 'dark' || (theme === 'system' && useColorScheme() === 'dark');
  const colors = getColors(isDarkTheme);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollView: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    header: {
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 16,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    title: { fontSize: 24, fontWeight: 'bold', color: colors.text, flex: 1 },
    subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 12 },
    themeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    quickActions: { flexDirection: 'row', gap: 12 },
    quickActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 8,
    },
    quickActionText: { fontSize: 14, color: colors.primary, fontWeight: '500' },
    section: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
      overflow: 'hidden',
    },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    sectionTitleContainer: { flex: 1 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
    deviceCount: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    devicesList: { paddingHorizontal: 16, paddingBottom: 16 },
    deviceContainer: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    deviceLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8, color: colors.textSecondary },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      fontSize: 16,
      backgroundColor: colors.surfaceSecondary,
      color: colors.text,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      marginHorizontal: 16,
      marginTop: 20,
      marginBottom: 20,
      padding: 16,
      borderRadius: 12,
    },
    saveButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
    bottomSpacer: { height: 20 },
  });
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
    <View key={device.id} style={styles.deviceContainer}>
      <Text style={styles.deviceLabel}>{device.name}</Text>
      <TextInput
        style={styles.input}
        placeholder="Device Name"
        placeholderTextColor={colors.textSecondary}
        value={device.name}
        onChangeText={(value) => updateDevice(deviceType, device.id, 'name', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Entity ID (e.g., sensor.water_level_1)"
        placeholderTextColor={colors.textSecondary}
        value={device.entity}
        onChangeText={(value) => updateDevice(deviceType, device.id, 'entity', value)}
        autoCapitalize="none"
      />
    </View>
  );

  // Camera-specific inputs
  const renderCameraInput = (camera: CameraDevice, deviceType: keyof StoredDevices) => (
    <View key={camera.id} style={styles.deviceContainer}>
      <Text style={styles.deviceLabel}>{camera.name}</Text>
      <TextInput
        style={styles.input}
        placeholder="Camera Name"
        placeholderTextColor={colors.textSecondary}
        value={camera.name}
        onChangeText={(value) => updateDevice(deviceType, camera.id, 'name', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Stream URL (e.g., rtsp://...)"
        placeholderTextColor={colors.textSecondary}
        value={camera.stream_url || ''}
        onChangeText={(value) => updateDevice(deviceType, camera.id, 'stream_url', value)}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Motion Sensor Entity ID"
        placeholderTextColor={colors.textSecondary}
        value={camera.motion_sensor || ''}
        onChangeText={(value) => updateDevice(deviceType, camera.id, 'motion_sensor', value)}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Occupancy Sensor Entity ID"
        placeholderTextColor={colors.textSecondary}
        value={camera.occupancy_sensor || ''}
        onChangeText={(value) => updateDevice(deviceType, camera.id, 'occupancy_sensor', value)}
        autoCapitalize="none"
      />
    </View>
  );

  const renderDeviceSection = (title: string, devices: SensorDevice[], deviceType: keyof StoredDevices) => (
    <View style={styles.section}>
      <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(deviceType)} activeOpacity={0.7}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.deviceCount}>
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
      <View style={styles.section}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(deviceType)} activeOpacity={0.7}>
          <Text style={styles.sectionTitle}>{title}</Text>
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
      <View style={styles.loadingContainer}>
        <Text style={{color: colors.text}}>Loading settings...</Text>
      </View>
    );
  }

  if (!devices) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{color: colors.text}}>Failed to load settings</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SettingsHeader />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.header}>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={expandAllSections}
            >
              <Ionicons name="expand-outline" size={16} color={colors.primary} />
              <Text style={styles.quickActionText}>Expand All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={collapseAllSections}
            >
              <Ionicons name="contract-outline" size={16} color={colors.primary} />
              <Text style={styles.quickActionText}>Collapse All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => setHaConfigModalVisible(true)}
            >
              <Ionicons name="settings-outline" size={16} color={colors.primary} />
              <Text style={styles.quickActionText}>HA Config</Text>
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
          style={styles.saveButton}
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

export default SettingsScreen;
