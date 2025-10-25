import AsyncStorage from '@react-native-async-storage/async-storage';
import { SensorDevice, StoredDevices } from '../types';

const STORAGE_KEY = 'smart_home_devices';
const THEME_PREFERENCE_KEY = 'theme_preference';

class DeviceStorageService {
  // Initialize default devices structure
  private getDefaultDevices(): StoredDevices {
    return {
      waterSensors: Array.from({ length: 8 }, (_, i) => ({
        id: `water_${i + 1}`,
        name: `Water Sensor ${i + 1}`,
        entity: '',
        type: 'water' as const
      })),
      radarSensors: Array.from({ length: 4 }, (_, i) => ({
        id: `radar_${i + 1}`,
        name: `Radar Sensor ${i + 1}`,
        entity: '',
        type: 'radar' as const
      })),
      tempHumiditySensors: Array.from({ length: 2 }, (_, i) => ({
        id: `temp_humidity_${i + 1}`,
        name: `Temperature & Humidity Sensor ${i + 1}`,
        entity: '',
        type: 'temp_humidity' as const
      })),
      doorSensor: {
        id: 'door_1',
        name: 'Door Sensor',
        entity: '',
        type: 'door' as const
      },
      lights: Array.from({ length: 2 }, (_, i) => ({
        id: `light_${i + 1}`,
        name: `Light ${i + 1}`,
        entity: '',
        type: 'light' as const
      })),
      cameras: [
        {
          id: 'camera_1',
          name: 'Front Door Camera',
          entity: 'camera.front_door',
          type: 'camera' as const,
          stream_url: 'http://192.168.100.95:8123/api/camera_proxy_stream/camera.front_door',
          motion_sensor: 'binary_sensor.radar_sensor_1',
          occupancy_sensor: 'binary_sensor.frontdoor_1_person_occupancy'
        },
        {
          id: 'camera_2',
          name: 'Camera 2',
          entity: 'camera.living_room',
          type: 'camera' as const,
          stream_url: 'http://192.168.100.55:5050/api/office_demo',
          motion_sensor: 'binary_sensor.office_demo_motion',
          occupancy_sensor: 'binary_sensor.office_demo_person_occupancy'
        }
      ],
      acs: Array.from({ length: 2 }, (_, i) => ({
        id: `ac_${i + 1}`,
        name: `Air Conditioner ${i + 1}`,
        entity: '',
        type: 'ac' as const
      })),
      security: {
        id: 'security_1',
        name: 'Security System',
        entity: '',
        type: 'security' as const
      }
    };
  }

  // Save all devices to storage
  async saveDevices(devices: StoredDevices): Promise<void> {
    try {
      const jsonValue = JSON.stringify(devices);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving devices:', error);
      throw error;
    }
  }

  // Load all devices from storage
  async loadDevices(): Promise<StoredDevices> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue != null) {
        return JSON.parse(jsonValue);
      } else {
        // Return default devices if none exist
        const defaultDevices = this.getDefaultDevices();
        await this.saveDevices(defaultDevices);
        return defaultDevices;
      }
    } catch (error) {
      console.error('Error loading devices:', error);
      // Return default devices on error
      return this.getDefaultDevices();
    }
  }

  // Update a specific device
  async updateDevice(deviceType: keyof StoredDevices, deviceId: string, updates: Partial<SensorDevice>): Promise<void> {
    try {
      const devices = await this.loadDevices();
      
      if (deviceType === 'doorSensor' || deviceType === 'security') {
        if (devices[deviceType] && devices[deviceType].id === deviceId) {
          devices[deviceType] = { ...devices[deviceType], ...updates } as SensorDevice;
        }
      } else {
        const deviceArray = devices[deviceType] as SensorDevice[];
        const deviceIndex = deviceArray.findIndex(device => device.id === deviceId);
        if (deviceIndex !== -1) {
          deviceArray[deviceIndex] = { ...deviceArray[deviceIndex], ...updates };
        }
      }
      
      await this.saveDevices(devices);
    } catch (error) {
      console.error('Error updating device:', error);
      throw error;
    }
  }

  // Get all configured devices (with entities)
  async getConfiguredDevices(): Promise<SensorDevice[]> {
    try {
      const devices = await this.loadDevices();
      console.log('Loaded devices from storage:', devices);
      const allDevices: SensorDevice[] = [];

      // Add array devices
      allDevices.push(...devices.waterSensors.filter(d => d.entity.trim() !== ''));
      allDevices.push(...devices.radarSensors.filter(d => d.entity.trim() !== ''));
      allDevices.push(...devices.tempHumiditySensors.filter(d => d.entity.trim() !== ''));
      allDevices.push(...devices.lights.filter(d => d.entity.trim() !== ''));
      allDevices.push(...devices.cameras.filter(d => d.entity.trim() !== ''));
      allDevices.push(...devices.acs.filter(d => d.entity.trim() !== ''));

      // Add single devices if configured
      if (devices.doorSensor && devices.doorSensor.entity.trim() !== '') {
        allDevices.push(devices.doorSensor);
      }
      if (devices.security && devices.security.entity.trim() !== '') {
        allDevices.push(devices.security);
      }

      return allDevices;
    } catch (error) {
      console.error('Error getting configured devices:', error);
      return [];
    }
  }

  // Theme preference methods
  async saveThemePreference(theme: 'light' | 'dark'): Promise<void> {
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, theme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
      throw new Error('Failed to save theme preference');
    }
  }

  async loadThemePreference(): Promise<'light' | 'dark'> {
    try {
      const theme = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
      return (theme as 'light' | 'dark') || 'light';
    } catch (error) {
      console.error('Error loading theme preference:', error);
      return 'light';
    }
  }

  // Clear all stored data (devices and theme)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEY, THEME_PREFERENCE_KEY]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  // Clear only devices
  async clearAllDevices(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing devices:', error);
      throw error;
    }
  }

  // Clear only theme preference
  async clearThemePreference(): Promise<void> {
    try {
      await AsyncStorage.removeItem(THEME_PREFERENCE_KEY);
    } catch (error) {
      console.error('Error clearing theme preference:', error);
      throw error;
    }
  }

  // Get all storage data (for debugging or backup)
  async getAllStorageData(): Promise<{
    devices: StoredDevices | null;
    theme: 'light' | 'dark' | null;
  }> {
    try {
      const [devicesData, themeData] = await AsyncStorage.multiGet([
        STORAGE_KEY,
        THEME_PREFERENCE_KEY
      ]);

      return {
        devices: devicesData[1] ? JSON.parse(devicesData[1]) : null,
        theme: (themeData[1] as 'light' | 'dark') || null
      };
    } catch (error) {
      console.error('Error getting all storage data:', error);
      return {
        devices: null,
        theme: null
      };
    }
  }
}

export const deviceStorageService = new DeviceStorageService();