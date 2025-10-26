// Test the exact flow the app uses to fetch binary sensor states
const fetch = require('node-fetch');

const API_BASE_URL = 'http://192.168.100.95:3040/api/ha/state';

// Simulate the corrected configuration as stored in the app
const correctedCameraConfig = {
  id: 'camera_1',
  name: 'Front Door Camera',
  entity: 'camera.front_door',
  type: 'camera',
  stream_url: 'http://192.168.100.95:8123/api/camera_proxy_stream/camera.front_door',
  motion_sensor: 'binary_sensor.frontdoor_1_motion',
  occupancy_sensor: 'binary_sensor.frontdoor_1_person_occupancy'
};

// Simulate getConfiguredDevices - only returns devices with entities configured
function getConfiguredDevices() {
  const configuredDevices = [];
  
  // Camera would be included because it has motion_sensor and occupancy_sensor configured
  if (correctedCameraConfig.entity.trim() !== '' || 
      correctedCameraConfig.motion_sensor?.trim() !== '' || 
      correctedCameraConfig.occupancy_sensor?.trim() !== '') {
    configuredDevices.push(correctedCameraConfig);
  }
  
  return configuredDevices;
}

// Simulate getConfiguredEntityIds from HomeAssistantService
function getConfiguredEntityIds(configuredDevices) {
  const entityIds = [];
  
  console.log('🔍 Extracting entity IDs from configured devices...');
  
  configuredDevices.forEach(device => {
    console.log(`Processing device: ${device.name} (${device.type})`);
    
    // Add main entity if it exists
    if (device.entity && device.entity.trim() !== '') {
      entityIds.push(device.entity);
      console.log(`  ✅ Main entity: ${device.entity}`);
    }
    
    // For cameras, also add motion and occupancy sensor entities
    if (device.type === 'camera') {
      if (device.motion_sensor && device.motion_sensor.trim() !== '') {
        entityIds.push(device.motion_sensor);
        console.log(`  🎥 Motion sensor: ${device.motion_sensor}`);
      }
      if (device.occupancy_sensor && device.occupancy_sensor.trim() !== '') {
        entityIds.push(device.occupancy_sensor);
        console.log(`  🎥 Occupancy sensor: ${device.occupancy_sensor}`);
      }
    }
  });
  
  // Remove duplicates
  const uniqueEntityIds = [...new Set(entityIds)];
  
  console.log('📋 Final entity IDs to fetch:', uniqueEntityIds);
  return uniqueEntityIds;
}

// Simulate fetchEntityState from HomeAssistantApiService
async function fetchEntityState(entityId) {
  try {
    console.log(`🔄 Fetching state for: ${entityId}`);
    
    const response = await fetch(`${API_BASE_URL}/${entityId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.success) {
        // Convert backend response format to internal format
        const entityState = {
          entity_id: data.entity_id,
          state: data.state,
          attributes: data.attributes || {},
          last_changed: new Date().toISOString(),
          last_updated: new Date().toISOString(),
          last_reported: new Date().toISOString(),
          context: {
            id: 'api-fetch',
            parent_id: null,
            user_id: null
          }
        };
        
        console.log(`  ✅ Successfully fetched ${entityId}: ${data.state}`);
        return entityState;
      } else {
        console.log(`  ❌ Backend API returned error for ${entityId}:`, data.error);
        return null;
      }
    } else {
      console.log(`  ❌ Failed to fetch ${entityId}: ${response.status} ${response.statusText}`);
      return null;
    }
  } catch (error) {
    console.log(`  ❌ Network error for ${entityId}:`, error.message);
    return null;
  }
}

// Simulate convertApiStateToInternalFormat from HomeAssistantApiService
function convertApiStateToInternalFormat(apiState) {
  return {
    entity_id: apiState.entity_id,
    old_state: apiState.state,
    new_state: apiState.state,
    user_id: apiState.context?.user_id || null,
    timestamp: apiState.last_updated || new Date().toISOString(),
    attributes: apiState.attributes || {}
  };
}

// Simulate fetchConfiguredEntityStates from HomeAssistantApiService
async function fetchConfiguredEntityStates(entityIds) {
  console.log(`🔍 Fetching states for ${entityIds.length} entities:`, entityIds);
  
  const result = {
    binarySensorData: {},
    climateData: {},
    lightData: {},
    sensorData: {}
  };

  for (const entityId of entityIds) {
    const apiState = await fetchEntityState(entityId);
    
    if (apiState) {
      const internalState = convertApiStateToInternalFormat(apiState);
      
      if (entityId.startsWith('binary_sensor.')) {
        result.binarySensorData[entityId] = internalState;
        console.log(`  📡 Added binary sensor: ${entityId} = ${internalState.new_state}`);
      } else if (entityId.startsWith('climate.')) {
        result.climateData[entityId] = internalState;
      } else if (entityId.startsWith('light.')) {
        result.lightData[entityId] = internalState;
      } else if (entityId.startsWith('sensor.')) {
        result.sensorData[entityId] = internalState;
      }
    }
  }

  return result;
}

async function testAppFlow() {
  console.log('🚀 Testing exact app flow for binary sensor detection...\n');
  
  // Step 1: Get configured devices
  console.log('📱 Step 1: Get configured devices');
  const configuredDevices = getConfiguredDevices();
  console.log(`Found ${configuredDevices.length} configured devices\n`);
  
  // Step 2: Extract entity IDs
  console.log('📋 Step 2: Extract entity IDs');
  const entityIds = getConfiguredEntityIds(configuredDevices);
  console.log('');
  
  // Step 3: Fetch states from API
  console.log('🔄 Step 3: Fetch states from API');
  const states = await fetchConfiguredEntityStates(entityIds);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Final Results:');
  console.log(`Binary sensors loaded: ${Object.keys(states.binarySensorData).length}`);
  
  if (Object.keys(states.binarySensorData).length > 0) {
    console.log('\n📄 Binary sensor states:');
    Object.entries(states.binarySensorData).forEach(([id, data]) => {
      const isMotion = id.includes('motion');
      const icon = isMotion ? '🏃‍♂️' : '👤';
      const sensorType = isMotion ? 'Motion' : 'Occupancy';
      console.log(`  ${icon} ${sensorType}: ${id} = ${data.new_state}`);
    });
    
    // Check specifically for the motion sensor
    const motionSensor = states.binarySensorData['binary_sensor.frontdoor_1_motion'];
    if (motionSensor) {
      console.log('\n🎯 Front Door Motion Sensor Check:');
      console.log(`  Entity ID: ${motionSensor.entity_id}`);
      console.log(`  Current State: ${motionSensor.new_state}`);
      console.log(`  Previous State: ${motionSensor.old_state}`);
      console.log(`  Timestamp: ${motionSensor.timestamp}`);
      console.log(`  Expected: ON (detected)`);
      console.log(`  Actual: ${motionSensor.new_state.toUpperCase()}`);
      console.log(`  Status: ${motionSensor.new_state === 'on' ? '✅ CORRECT' : '❌ INCORRECT'}`);
    } else {
      console.log('\n❌ Front Door Motion Sensor NOT FOUND in results!');
    }
  } else {
    console.log('\n❌ No binary sensors loaded!');
  }
  
  return states;
}

testAppFlow().then((results) => {
  console.log('\n✅ App flow test completed!');
}).catch(error => {
  console.error('❌ Test failed:', error);
});