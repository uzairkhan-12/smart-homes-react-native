// Test the corrected Front Door Camera configuration
const fetch = require('node-fetch');

const API_BASE_URL = 'http://192.168.100.95:3040/api/ha/state';

// Corrected camera configuration
const frontDoorCamera = {
  id: 'camera_1',
  name: 'Front Door Camera',
  entity: 'camera.front_door',
  type: 'camera',
  stream_url: 'http://192.168.100.95:8123/api/camera_proxy_stream/camera.front_door',
  motion_sensor: 'binary_sensor.frontdoor_1_motion', // CORRECTED: was binary_sensor.radar_sensor_1
  occupancy_sensor: 'binary_sensor.frontdoor_1_person_occupancy'
};

async function testEntityState(entityId) {
  try {
    const response = await fetch(`${API_BASE_URL}/${entityId}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return { entityId, exists: true, state: data.state, data };
      }
    }
    
    return { entityId, exists: false, state: null, data: null };
  } catch (error) {
    return { entityId, exists: false, state: null, data: null, error: error.message };
  }
}

async function testFrontDoorCameraConfig() {
  console.log('🚀 Testing Front Door Camera Configuration...\n');
  
  console.log('📷 Front Door Camera Config:');
  console.log(`  - Name: ${frontDoorCamera.name}`);
  console.log(`  - Main Entity: ${frontDoorCamera.entity}`);
  console.log(`  - Motion Sensor: ${frontDoorCamera.motion_sensor}`);
  console.log(`  - Occupancy Sensor: ${frontDoorCamera.occupancy_sensor}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 Testing all entities...\n');
  
  // Test all entities
  const entitiesToTest = [
    frontDoorCamera.entity,
    frontDoorCamera.motion_sensor,
    frontDoorCamera.occupancy_sensor
  ];
  
  const results = {};
  
  for (const entityId of entitiesToTest) {
    console.log(`Testing: ${entityId}`);
    const result = await testEntityState(entityId);
    
    if (result.exists) {
      console.log(`✅ ${entityId}: ${result.state}`);
      
      // Convert to internal format
      const entityData = {
        entity_id: result.entityId,
        old_state: result.state,
        new_state: result.state,
        user_id: null,
        timestamp: new Date().toISOString(),
        attributes: {}
      };
      
      if (entityId.startsWith('binary_sensor.')) {
        if (!results.binarySensorData) results.binarySensorData = {};
        results.binarySensorData[entityId] = entityData;
      } else if (entityId.startsWith('camera.')) {
        if (!results.cameraData) results.cameraData = {};
        results.cameraData[entityId] = entityData;
      }
    } else {
      console.log(`❌ ${entityId}: Not found`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log('📊 Results Summary:');
  console.log(`Binary sensors found: ${Object.keys(results.binarySensorData || {}).length}`);
  console.log(`Camera entities found: ${Object.keys(results.cameraData || {}).length}`);
  
  if (results.binarySensorData) {
    console.log('\n📄 Binary sensor details:');
    Object.entries(results.binarySensorData).forEach(([id, data]) => {
      const sensorType = id.includes('motion') ? '🏃‍♂️ Motion' : '👤 Occupancy';
      console.log(`  ${sensorType}: ${id} = ${data.new_state}`);
    });
  }
  
  // Compare with Home Assistant dashboard expectation
  console.log('\n🏠 Home Assistant Dashboard Comparison:');
  if (results.binarySensorData && results.binarySensorData['binary_sensor.frontdoor_1_motion']) {
    const motionState = results.binarySensorData['binary_sensor.frontdoor_1_motion'].new_state;
    console.log(`Motion Detection: ${motionState === 'on' ? '✅ DETECTED (matches dashboard)' : '❌ Not detected'}`);
  } else {
    console.log('Motion Detection: ❌ Entity not found');
  }
  
  return results;
}

testFrontDoorCameraConfig().then((results) => {
  console.log('\n✅ Front Door Camera configuration test completed!');
}).catch(error => {
  console.error('❌ Test failed:', error);
});