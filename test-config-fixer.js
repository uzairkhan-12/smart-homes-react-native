// Test the configuration fixer
const AsyncStorage = require('@react-native-async-storage/async-storage');

// Mock AsyncStorage for testing
const mockStorage = {};
const mockAsyncStorage = {
  setItem: async (key, value) => {
    mockStorage[key] = value;
    console.log(`📝 AsyncStorage.setItem: ${key}`);
  },
  getItem: async (key) => {
    const value = mockStorage[key];
    console.log(`📖 AsyncStorage.getItem: ${key} = ${value ? 'data exists' : 'null'}`);
    return value;
  },
  removeItem: async (key) => {
    delete mockStorage[key];
    console.log(`🗑️ AsyncStorage.removeItem: ${key}`);
  }
};

// Create the device storage service with mock
class MockDeviceStorageService {
  constructor() {
    this.STORAGE_KEY = 'smart_home_devices';
  }

  getDefaultDevices() {
    return {
      cameras: [
        {
          id: 'camera_1',
          name: 'Front Door Camera',
          entity: 'camera.front_door',
          type: 'camera',
          stream_url: 'http://192.168.100.95:8123/api/camera_proxy_stream/camera.front_door',
          motion_sensor: 'binary_sensor.frontdoor_1_motion', // CORRECTED
          occupancy_sensor: 'binary_sensor.frontdoor_1_person_occupancy'
        }
      ]
    };
  }

  async saveDevices(devices) {
    const jsonValue = JSON.stringify(devices);
    await mockAsyncStorage.setItem(this.STORAGE_KEY, jsonValue);
  }

  async loadDevices() {
    const jsonValue = await mockAsyncStorage.getItem(this.STORAGE_KEY);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    } else {
      const defaultDevices = this.getDefaultDevices();
      await this.saveDevices(defaultDevices);
      return defaultDevices;
    }
  }
}

// Configuration fixer function
async function ensureCorrectCameraConfig() {
  try {
    const deviceStorageService = new MockDeviceStorageService();
    const devices = await deviceStorageService.loadDevices();
    const frontDoorCamera = devices.cameras.find(camera => camera.id === 'camera_1');
    
    // Check if Front Door Camera needs fixing
    if (frontDoorCamera && frontDoorCamera.motion_sensor === 'binary_sensor.radar_sensor_1') {
      console.log('🔧 Fixing Front Door Camera motion sensor configuration...');
      console.log(`   OLD: ${frontDoorCamera.motion_sensor}`);
      
      // Update to correct entity ID
      frontDoorCamera.motion_sensor = 'binary_sensor.frontdoor_1_motion';
      console.log(`   NEW: ${frontDoorCamera.motion_sensor}`);
      
      // Save the corrected configuration
      await deviceStorageService.saveDevices(devices);
      
      console.log('✅ Front Door Camera configuration corrected!');
      return true; // Configuration was fixed
    } else if (frontDoorCamera) {
      console.log('✅ Front Door Camera configuration is already correct');
      console.log(`   Motion sensor: ${frontDoorCamera.motion_sensor}`);
      return false; // No fix needed
    } else {
      console.log('❌ Front Door Camera not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error fixing camera configuration:', error);
    return false;
  }
}

async function testConfigurationFixer() {
  console.log('🧪 Testing Configuration Fixer...\n');
  
  // Test 1: Simulate old incorrect configuration
  console.log('📱 Test 1: Simulating old incorrect configuration');
  const oldConfig = {
    cameras: [
      {
        id: 'camera_1',
        name: 'Front Door Camera',
        entity: 'camera.front_door',
        type: 'camera',
        motion_sensor: 'binary_sensor.radar_sensor_1', // OLD INCORRECT
        occupancy_sensor: 'binary_sensor.frontdoor_1_person_occupancy'
      }
    ]
  };
  
  await mockAsyncStorage.setItem('smart_home_devices', JSON.stringify(oldConfig));
  console.log('💾 Saved old configuration with incorrect motion sensor');
  
  // Test the fixer
  console.log('\n🔧 Running configuration fixer...');
  const wasFixed = await ensureCorrectCameraConfig();
  
  console.log(`\n📊 Result: ${wasFixed ? 'Configuration was corrected' : 'No changes needed'}`);
  
  // Test 2: Run fixer again to make sure it doesn't fix what's already correct
  console.log('\n📱 Test 2: Running fixer on already correct configuration');
  const wasFixedAgain = await ensureCorrectCameraConfig();
  console.log(`📊 Result: ${wasFixedAgain ? 'Configuration was corrected again (unexpected!)' : 'No changes needed (correct)'}`);
  
  console.log('\n✅ Configuration fixer test completed!');
}

testConfigurationFixer().catch(error => {
  console.error('❌ Test failed:', error);
});