import AsyncStorage from '@react-native-async-storage/async-storage';
import { SensorDevice, StoredDevices } from '../types';

const STORAGE_KEY = 'smart_home_devices';
const THEME_PREFERENCE_KEY = 'theme_preference';

class DeviceStorageService {
  // Initialize default devices structure
  private getDefaultDevices(): StoredDevices {
    return {
      waterSensors: Array.from({ length: 3 }, (_, i) => ({
        id: `water_${i + 1}`,
        name: `Water Sensor ${i + 1}`,
        entity: '',
        type: 'water'
      })),
      radarSensors: Array.from({ length: 4 }, (_, i) => ({
        id: `radar_${i + 1}`,
        name: `Radar Sensor ${i + 1}`,
        entity: '',
        type: 'radar'
      })),
      tempHumiditySensors: Array.from({ length: 2 }, (_, i) => ({
        id: `temp_humidity_${i + 1}`,
        name: `Temperature & Humidity Sensor ${i + 1}`,
        entity: '',
        type: 'temp_humidity'
      })),
      doorSensor: {
        id: 'door_1',
        name: 'Front Door',
        entity: '',
        type: 'door'
      },
      lights: [
        {
          id: 'light_1',
          name: 'Board A Button Switch A',
          entity: 'light.boarda_buttonswitch_a',
          type: 'light'
        },
        {
          id: 'light_2',
          name: 'Living Room Light',
          entity: 'light.living_room',
          type: 'light'
        },
        {
          id: 'light_3',
          name: 'Office Light',
          entity: 'light.office_light_grill43',
          type: 'light'
        }
      ],
      cameras: [
        {
          id: 'camera_1',
          name: 'Front Door Camera',
          entity: 'camera.front_door',
          type: 'camera',
          stream_url: 'http://192.168.100.95:8123/api/camera_proxy_stream/camera.front_door',
          motion_sensor: 'binary_sensor.frontdoor_1_motion',
          occupancy_sensor: 'binary_sensor.frontdoor_1_person_occupancy'
        } as SensorDevice,
        {
          id: 'camera_2',
          name: 'Office Camera',
          entity: 'camera.office_demo',
          type: 'camera',
          stream_url: 'http://192.168.100.55:5050/api/office_demo',
          motion_sensor: 'binary_sensor.office_demo_motion',
          occupancy_sensor: 'binary_sensor.office_demo_person_occupancy'
        } as SensorDevice
      ],
      acs: [
        {
          id: 'ac_1',
          name: 'Office AC',
          entity: 'climate.office_ac',
          type: 'ac'
        },
        {
          id: 'ac_2',
          name: 'Living Room AC',
          entity: 'climate.living_room_ac',
          type: 'ac'
        }
      ],
      security: {
        id: 'security_1',
        name: 'Security System',
        entity: '',
        type: 'security'
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

  // Get all configured devices (with entities or additional sensors)
  async getConfiguredDevices(): Promise<SensorDevice[]> {
    try {
      const devices = await this.loadDevices();
      console.log('Loaded devices from storage:', devices);
      const allDevices: SensorDevice[] = [];

      // Add array devices that have main entities configured
      allDevices.push(...devices.waterSensors.filter(d => d.entity.trim() !== ''));
      allDevices.push(...devices.radarSensors.filter(d => d.entity.trim() !== ''));
      allDevices.push(...devices.tempHumiditySensors.filter(d => d.entity.trim() !== ''));
      allDevices.push(...devices.lights.filter(d => d.entity.trim() !== ''));
      allDevices.push(...devices.acs.filter(d => d.entity.trim() !== ''));

      // For cameras, include if main entity OR motion/occupancy sensors are configured
      allDevices.push(...devices.cameras.filter(d => 
        d.entity.trim() !== '' || 
        (d as any).motion_sensor?.trim() !== '' || 
        (d as any).occupancy_sensor?.trim() !== ''
      ));

      // Add single devices if configured
      if (devices.doorSensor && devices.doorSensor.entity.trim() !== '') {
        allDevices.push(devices.doorSensor);
      }
      if (devices.security && devices.security.entity.trim() !== '') {
        allDevices.push(devices.security);
      }

      console.log('📱 Configured devices found:', allDevices.length);
      allDevices.forEach(device => {
        console.log(`  - ${device.name} (${device.type}): ${device.entity}`);
        if ((device as any).motion_sensor) {
          console.log(`    🎥 Motion sensor: ${(device as any).motion_sensor}`);
        }
        if ((device as any).occupancy_sensor) {
          console.log(`    🎥 Occupancy sensor: ${(device as any).occupancy_sensor}`);
        }
      });

      return allDevices;
    } catch (error) {
      console.error('Error getting configured devices:', error);
      return [];
    }
  }

  // Get all devices from storage (including those without entities configured)
  async getAllDevices(): Promise<SensorDevice[]> {
    try {
      const devices = await this.loadDevices();
      console.log('Loaded all devices from storage:', devices);
      const allDevices: SensorDevice[] = [];

      // Add all array devices regardless of entity configuration
      allDevices.push(...devices.waterSensors);
      allDevices.push(...devices.radarSensors);
      allDevices.push(...devices.tempHumiditySensors);
      allDevices.push(...devices.lights);
      allDevices.push(...devices.cameras);
      allDevices.push(...devices.acs);

      // Add single devices
      if (devices.doorSensor) {
        allDevices.push(devices.doorSensor);
      }
      if (devices.security) {
        allDevices.push(devices.security);
      }

      return allDevices;
    } catch (error) {
      console.error('Error getting all devices:', error);
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

  // Reset devices to default (useful when schema changes)
  async resetToDefaultDevices(): Promise<void> {
    try {
      const defaultDevices = this.getDefaultDevices();
      await this.saveDevices(defaultDevices);
      console.log('✅ Device storage reset to corrected defaults');
    } catch (error) {
      console.error('Error resetting to default devices:', error);
      throw error;
    }
  }

  // Force update to corrected camera configuration (one-time fix)
  async updateCameraConfiguration(): Promise<void> {
    try {
      const devices = await this.loadDevices();
      
      // Find and update Front Door Camera configuration
      const frontDoorCamera = devices.cameras.find(camera => camera.id === 'camera_1');
      if (frontDoorCamera) {
        // Update to correct motion sensor entity ID
        (frontDoorCamera as any).motion_sensor = 'binary_sensor.frontdoor_1_motion';
        
        console.log('✅ Updated Front Door Camera motion sensor to: binary_sensor.frontdoor_1_motion');
        await this.saveDevices(devices);
        console.log('✅ Camera configuration saved');
      } else {
        console.log('❌ Front Door Camera not found in storage');
      }
    } catch (error) {
      console.error('Error updating camera configuration:', error);
      throw error;
    }
  }

  // Ensure radar sensors array has 4 items (migration helper)
  async ensureRadarSensorsCount(): Promise<void> {
    try {
      const devices = await this.loadDevices();
      
      // Check if radar sensors array has less than 4 items
      if (devices.radarSensors.length < 4) {
        console.log(`Found ${devices.radarSensors.length} radar sensors, updating to 4`);
        
        // Create new radar sensors array with 4 items
        const updatedRadarSensors = Array.from({ length: 4 }, (_, i) => {
          // Keep existing radar sensors if they exist
          if (i < devices.radarSensors.length) {
            return devices.radarSensors[i];
          }
          // Create new radar sensor for missing items
          return {
            id: `radar_${i + 1}`,
            name: `Radar Sensor ${i + 1}`,
            entity: '',
            type: 'radar' as const
          } as SensorDevice;
        });
        
        // Update devices with new radar sensors array
        const updatedDevices = {
          ...devices,
          radarSensors: updatedRadarSensors
        };
        
        await this.saveDevices(updatedDevices);
        console.log('Successfully updated radar sensors to 4 items');
      }
    } catch (error) {
      console.error('Error ensuring radar sensors count:', error);
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