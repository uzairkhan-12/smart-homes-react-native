// Add this to your app's initialization code (like in DashboardScreen or App.tsx)
// This will automatically fix the Front Door Camera configuration on app startup

import { deviceStorageService } from '../services/DeviceStorageService';

// One-time configuration fix
async function ensureCorrectCameraConfig() {
  try {
    const devices = await deviceStorageService.loadDevices();
    const frontDoorCamera = devices.cameras.find(camera => camera.id === 'camera_1');
    
    // Check if Front Door Camera needs fixing
    if (frontDoorCamera && (frontDoorCamera as any).motion_sensor === 'binary_sensor.radar_sensor_1') {
      console.log('🔧 Fixing Front Door Camera motion sensor configuration...');
      
      // Update to correct entity ID
      (frontDoorCamera as any).motion_sensor = 'binary_sensor.frontdoor_1_motion';
      
      // Save the corrected configuration
      await deviceStorageService.saveDevices(devices);
      
      console.log('✅ Front Door Camera configuration corrected!');
      return true; // Configuration was fixed
    }
    
    return false; // No fix needed
  } catch (error) {
    console.error('❌ Error fixing camera configuration:', error);
    return false;
  }
}

// Call this in your app initialization
export { ensureCorrectCameraConfig };
