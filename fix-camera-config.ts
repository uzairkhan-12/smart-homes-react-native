// Script to fix the Front Door Camera motion sensor configuration
// This updates the stored configuration to use the correct entity ID

import { deviceStorageService } from './src/services/DeviceStorageService';

async function fixFrontDoorCameraConfig() {
  console.log('🔧 Fixing Front Door Camera configuration...\n');
  
  try {
    // Get current devices from storage
    console.log('📱 Loading current device configuration...');
    const devices = await deviceStorageService.loadDevices();
    
    // Find Front Door Camera
    const frontDoorCamera = devices.cameras.find(camera => camera.id === 'camera_1');
    
    if (frontDoorCamera) {
      console.log('📷 Found Front Door Camera:');
      console.log(`  Name: ${frontDoorCamera.name}`);
      console.log(`  Current motion_sensor: ${(frontDoorCamera as any).motion_sensor}`);
      console.log(`  Current occupancy_sensor: ${(frontDoorCamera as any).occupancy_sensor}`);
      
      // Update motion sensor to correct entity ID
      const oldMotionSensor = (frontDoorCamera as any).motion_sensor;
      (frontDoorCamera as any).motion_sensor = 'binary_sensor.frontdoor_1_motion';
      
      console.log('\n🔄 Updating configuration...');
      console.log(`  OLD motion_sensor: ${oldMotionSensor}`);
      console.log(`  NEW motion_sensor: ${(frontDoorCamera as any).motion_sensor}`);
      
      // Save updated configuration
      await deviceStorageService.saveDevices(devices);
      
      console.log('\n✅ Front Door Camera configuration updated successfully!');
      console.log('   The motion sensor should now show the correct state (detected/on)');
      
    } else {
      console.log('❌ Front Door Camera not found in stored configuration');
      console.log('   You may need to reset to default configuration');
    }
    
  } catch (error) {
    console.error('❌ Error fixing configuration:', error);
  }
}

async function resetToDefaults() {
  console.log('🔄 Resetting to default device configuration...\n');
  
  try {
    await deviceStorageService.resetToDefaultDevices();
    console.log('✅ Device configuration reset to corrected defaults!');
    console.log('   All devices now use the latest entity IDs');
  } catch (error) {
    console.error('❌ Error resetting configuration:', error);
  }
}

async function showCurrentConfig() {
  console.log('📋 Current Front Door Camera configuration:\n');
  
  try {
    const devices = await deviceStorageService.loadDevices();
    const frontDoorCamera = devices.cameras.find(camera => camera.id === 'camera_1');
    
    if (frontDoorCamera) {
      console.log('📷 Front Door Camera:');
      console.log(`  ID: ${frontDoorCamera.id}`);
      console.log(`  Name: ${frontDoorCamera.name}`);
      console.log(`  Entity: ${frontDoorCamera.entity}`);
      console.log(`  Motion Sensor: ${(frontDoorCamera as any).motion_sensor}`);
      console.log(`  Occupancy Sensor: ${(frontDoorCamera as any).occupancy_sensor}`);
      
      // Check if motion sensor is correct
      const isCorrect = (frontDoorCamera as any).motion_sensor === 'binary_sensor.frontdoor_1_motion';
      console.log(`\n🎯 Motion sensor status: ${isCorrect ? '✅ CORRECT' : '❌ NEEDS FIX'}`);
      
      if (!isCorrect) {
        console.log('\n💡 To fix this, run:');
        console.log('   - fixFrontDoorCameraConfig() to update just the camera');
        console.log('   - resetToDefaults() to reset all devices to latest defaults');
      }
      
    } else {
      console.log('❌ Front Door Camera not found');
    }
    
  } catch (error) {
    console.error('❌ Error loading configuration:', error);
  }
}

// Main execution
async function main() {
  const action = process.argv[2] || 'show';
  
  switch (action) {
    case 'fix':
      await fixFrontDoorCameraConfig();
      break;
    case 'reset':
      await resetToDefaults();
      break;
    case 'show':
    default:
      await showCurrentConfig();
      break;
  }
}

console.log('🏠 Front Door Camera Configuration Tool\n');
main().then(() => {
  console.log('\n✅ Done!');
}).catch(error => {
  console.error('❌ Failed:', error);
});