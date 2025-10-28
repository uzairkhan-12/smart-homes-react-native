import AsyncStorage from '@react-native-async-storage/async-storage';
import { SensorDevice, StoredDevices } from '../types';

interface User {
  id: string;
  name: string;
  pin: string;
  role: any;
}

const STORAGE_KEY = 'smart_home_devices';
const THEME_PREFERENCE_KEY = 'theme_preference';
const USERS_STORAGE_KEY = 'app_users_config';

class DeviceStorageService {
  // Initialize default devices structure
  private getDefaultDevices(): StoredDevices {
    return {
      waterSensors: Array.from({ length: 8 }, (_, i) => ({
        id: `water_${i + 1}`,
        name: `Dummy Water ${i + 1}`,
        entity: '',
        type: 'water'
      })),
      radarSensors: Array.from({ length: 4 }, (_, i) => ({
        id: `radar_${i + 1}`,
        name: `Dummy Radar ${i + 1}`,
        entity: '',
        type: 'radar'
      })),
      tempHumiditySensors: Array.from({ length: 2 }, (_, i) => ({
        id: `temp_humidity_${i + 1}`,
        name: `Dummy Temp Humidity ${i + 1}`,
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

      allDevices.forEach(device => {
        if ((device as any).motion_sensor) {
          // Handle motion sensor logic if needed
        }
        if ((device as any).occupancy_sensor) {
          // Handle occupancy sensor logic if needed
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
      await AsyncStorage.multiRemove([STORAGE_KEY, THEME_PREFERENCE_KEY, USERS_STORAGE_KEY]);
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

  // Update device names to use dummy naming pattern
  async updateDeviceNamesToDummy(): Promise<void> {
    try {
      const devices = await this.loadDevices();
      let hasChanges = false;

      // Update water sensor names
      devices.waterSensors.forEach((sensor, i) => {
        const expectedName = `Dummy Water ${i + 1}`;
        if (sensor.name !== expectedName && sensor.entity.trim() === '') {
          sensor.name = expectedName;
          hasChanges = true;
        }
      });

      // Update radar sensor names
      devices.radarSensors.forEach((sensor, i) => {
        const expectedName = `Dummy Radar ${i + 1}`;
        if (sensor.name !== expectedName && sensor.entity.trim() === '') {
          sensor.name = expectedName;
          hasChanges = true;
        }
      });

      // Update temp humidity sensor names
      devices.tempHumiditySensors.forEach((sensor, i) => {
        const expectedName = `Dummy Temp Humidity ${i + 1}`;
        if (sensor.name !== expectedName && sensor.entity.trim() === '') {
          sensor.name = expectedName;
          hasChanges = true;
        }
      });

      if (hasChanges) {
        await this.saveDevices(devices);
        console.log('✅ Updated device names to dummy naming pattern');
      } else {
        console.log('ℹ️ Device names already use dummy naming pattern');
      }
    } catch (error) {
      console.error('Error updating device names to dummy:', error);
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

  // Ensure water sensors array has 8 items (migration helper)
  async ensureWaterSensorsCount(): Promise<void> {
    try {
      const devices = await this.loadDevices();
      
      // Check if water sensors array has less than 8 items
      if (devices.waterSensors.length < 8) {
        console.log(`Found ${devices.waterSensors.length} water sensors, updating to 8`);
        
        // Create new water sensors array with 8 items
        const updatedWaterSensors = Array.from({ length: 8 }, (_, i) => {
          // Keep existing water sensors if they exist
          if (i < devices.waterSensors.length) {
            return devices.waterSensors[i];
          }
          // Create new water sensor for missing items
          return {
            id: `water_${i + 1}`,
            name: `Dummy Water ${i + 1}`,
            entity: '',
            type: 'water' as const
          } as SensorDevice;
        });
        
        // Update devices with new water sensors array
        const updatedDevices = {
          ...devices,
          waterSensors: updatedWaterSensors
        };
        
        await this.saveDevices(updatedDevices);
        console.log('Successfully updated water sensors to 8 items');
      }
    } catch (error) {
      console.error('Error ensuring water sensors count:', error);
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
            name: `Dummy Radar ${i + 1}`,
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
    users: User[] | null;
  }> {
    try {
      const [devicesData, themeData, usersData] = await AsyncStorage.multiGet([
        STORAGE_KEY,
        THEME_PREFERENCE_KEY,
        USERS_STORAGE_KEY
      ]);

      return {
        devices: devicesData[1] ? JSON.parse(devicesData[1]) : null,
        theme: (themeData[1] as 'light' | 'dark') || null,
        users: usersData[1] ? JSON.parse(usersData[1]) : null
      };
    } catch (error) {
      console.error('Error getting all storage data:', error);
      return {
        devices: null,
        theme: null,
        users: null
      };
    }
  }

  // User Management Methods
  async loadUsers(): Promise<User[]> {
    try {
      const storedUsers = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      return storedUsers ? JSON.parse(storedUsers) : [];
    } catch (error) {
      console.error('Failed to load users:', error);
      return [];
    }
  }

  async saveUsers(users: User[]): Promise<void> {
    try {
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Failed to save users:', error);
      throw error;
    }
  }

  async addUser(user: User): Promise<void> {
    const users = await this.loadUsers();
    users.push(user);
    await this.saveUsers(users);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const users = await this.loadUsers();
    const updatedUsers = users.map(user => 
      user.id === userId ? { ...user, ...updates } : user
    );
    await this.saveUsers(updatedUsers);
  }

  async deleteUser(userId: string): Promise<void> {
    const users = await this.loadUsers();
    const filteredUsers = users.filter(user => user.id !== userId);
    await this.saveUsers(filteredUsers);
  }

  async getUserById(userId: string): Promise<User | null> {
    const users = await this.loadUsers();
    return users.find(user => user.id === userId) || null;
  }

  // Clear only users
  async clearUsers(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USERS_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing users:', error);
      throw error;
    }
  }

  // Initialize default admin user if no users exist
  async initializeDefaultAdmin(): Promise<void> {
    try {
      const users = await this.loadUsers();
      if (users.length === 0) {
        const defaultAdmin: User = {
          id: 'admin_1',
          name: 'Admin',
          pin: '123456',
          role: 'Admin'
        };
        await this.addUser(defaultAdmin);
        console.log('✅ Default admin user created');
      }
    } catch (error) {
      console.error('Error initializing default admin:', error);
    }
  }

  // Initialize default Pro Admin user (system user, non-editable)
  async initializeDefaultProAdmin(): Promise<void> {
    try {
      const users = await this.loadUsers();
      const proAdminExists = users.some(u => u.id === 'pro_admin_system' && u.role === 'Pro Admin');
      
      if (!proAdminExists) {
        const defaultProAdmin: User = {
          id: 'pro_admin_system',
          name: 'Pro Admin',
          pin: '789789',
          role: 'Pro Admin'
        };
        await this.addUser(defaultProAdmin);
        console.log('✅ Default Pro Admin user created');
      }
    } catch (error) {
      console.error('Error initializing default Pro Admin:', error);
    }
  }

  // Validate user PIN
  async validateUserPin(pin: string): Promise<{ isValid: boolean; user?: User }> {
    try {
      const users = await this.loadUsers();
      const user = users.find(u => u.pin === pin);
      return {
        isValid: !!user,
        user: user || undefined
      };
    } catch (error) {
      console.error('Error validating user PIN:', error);
      return { isValid: false };
    }
  }

  // Check if user is admin
  async isUserAdmin(pin: string): Promise<boolean> {
    try {
      const users = await this.loadUsers();
      const user = users.find(u => u.pin === pin);
      return user ? user.role === 'Admin' : false;
    } catch (error) {
      console.error('Error checking user admin status:', error);
      return false;
    }
  }

  // Get user by PIN
  async getUserByPin(pin: string): Promise<User | null> {
    try {
      const users = await this.loadUsers();
      return users.find(u => u.pin === pin) || null;
    } catch (error) {
      console.error('Error getting user by PIN:', error);
      return null;
    }
  }

  // Check if PIN already exists (for duplicate prevention)
  async isPinExists(pin: string, excludeUserId?: string): Promise<boolean> {
    try {
      const users = await this.loadUsers();
      return users.some(user => 
        user.pin === pin && (!excludeUserId || user.id !== excludeUserId)
      );
    } catch (error) {
      console.error('Error checking PIN existence:', error);
      return false;
    }
  }

  // Check if user is the system Pro Admin (non-editable)
  isSystemProAdmin(userId: string): boolean {
    return userId === 'pro_admin_system';
  }

  // Check if user can be edited (system Pro Admin cannot be edited)
  async canEditUser(userId: string): Promise<boolean> {
    return !this.isSystemProAdmin(userId);
  }

  // Check if user can be deleted (system Pro Admin cannot be deleted)
  async canDeleteUser(userId: string): Promise<boolean> {
    return !this.isSystemProAdmin(userId);
  }

  // Comprehensive method to ensure all sensor counts and names are correct
  async ensureAllSensorConfiguration(): Promise<void> {
    try {
      console.log('🔄 Ensuring all sensor configurations are correct...');
      
      // Ensure sensor counts
      await this.ensureWaterSensorsCount();
      await this.ensureRadarSensorsCount();
      
      // Update names to dummy pattern
      await this.updateDeviceNamesToDummy();
      
      console.log('✅ All sensor configurations verified and updated');
    } catch (error) {
      console.error('❌ Error ensuring sensor configuration:', error);
      throw error;
    }
  }
}

export const deviceStorageService = new DeviceStorageService();