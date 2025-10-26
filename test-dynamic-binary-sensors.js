// Test dynamic binary sensor detection for all device types
const fetch = require('node-fetch');

const API_BASE_URL = 'http://192.168.100.95:3040/api/ha/state';

// Simulate different device configurations that might have binary sensors
const testConfigurations = [
  {
    name: "Default Configuration",
    devices: {
      waterSensors: [
        { id: 'water_1', name: 'Water Sensor 1', entity: 'binary_sensor.water_leak_1', type: 'water' },
        { id: 'water_2', name: 'Water Sensor 2', entity: 'binary_sensor.water_leak_2', type: 'water' },
        { id: 'water_3', name: 'Water Sensor 3', entity: '', type: 'water' } // Empty
      ],
      radarSensors: [
        { id: 'radar_1', name: 'Radar Sensor 1', entity: 'binary_sensor.radar_motion_1', type: 'radar' },
        { id: 'radar_2', name: 'Radar Sensor 2', entity: 'binary_sensor.radar_motion_2', type: 'radar' },
        { id: 'radar_3', name: 'Radar Sensor 3', entity: '', type: 'radar' }, // Empty
        { id: 'radar_4', name: 'Radar Sensor 4', entity: '', type: 'radar' } // Empty
      ],
      tempHumiditySensors: [
        { id: 'temp_1', name: 'Temp/Humidity 1', entity: 'sensor.temperature_1', type: 'temp_humidity' },
        { id: 'temp_2', name: 'Temp/Humidity 2', entity: '', type: 'temp_humidity' } // Empty
      ],
      doorSensor: {
        id: 'door_1',
        name: 'Front Door',
        entity: 'binary_sensor.front_door',
        type: 'door'
      },
      lights: [
        { id: 'light_1', name: 'Board A Button Switch A', entity: 'light.boarda_buttonswitch_a', type: 'light' },
        { id: 'light_2', name: 'Living Room Light', entity: 'light.living_room', type: 'light' },
        { id: 'light_3', name: 'Office Light', entity: 'light.office_light_grill43', type: 'light' }
      ],
      cameras: [
        {
          id: 'camera_1',
          name: 'Front Door Camera',
          entity: 'camera.front_door',
          type: 'camera',
          motion_sensor: 'binary_sensor.frontdoor_1_person_occupancy',
          occupancy_sensor: 'binary_sensor.frontdoor_1_person_occupancy'
        },
        {
          id: 'camera_2',
          name: 'Office Camera',
          entity: 'camera.office_demo',
          type: 'camera',
          motion_sensor: 'binary_sensor.office_demo_motion',
          occupancy_sensor: 'binary_sensor.office_demo_person_occupancy'
        }
      ],
      acs: [
        { id: 'ac_1', name: 'Office AC', entity: 'climate.office_ac', type: 'ac' },
        { id: 'ac_2', name: 'Living Room AC', entity: 'climate.living_room_ac', type: 'ac' }
      ],
      security: {
        id: 'security_1',
        name: 'Security System',
        entity: 'binary_sensor.security_system',
        type: 'security'
      }
    }
  }
];

// Function to get configured devices (simulating DeviceStorageService.getConfiguredDevices)
function getConfiguredDevices(devices) {
  const allDevices = [];

  // Add array devices that have main entities configured
  allDevices.push(...devices.waterSensors.filter(d => d.entity.trim() !== ''));
  allDevices.push(...devices.radarSensors.filter(d => d.entity.trim() !== ''));
  allDevices.push(...devices.tempHumiditySensors.filter(d => d.entity.trim() !== ''));
  allDevices.push(...devices.lights.filter(d => d.entity.trim() !== ''));
  allDevices.push(...devices.acs.filter(d => d.entity.trim() !== ''));

  // For cameras, include if main entity OR motion/occupancy sensors are configured
  allDevices.push(...devices.cameras.filter(d => 
    d.entity.trim() !== '' || 
    d.motion_sensor?.trim() !== '' || 
    d.occupancy_sensor?.trim() !== ''
  ));

  // Add single devices if configured
  if (devices.doorSensor && devices.doorSensor.entity.trim() !== '') {
    allDevices.push(devices.doorSensor);
  }
  if (devices.security && devices.security.entity.trim() !== '') {
    allDevices.push(devices.security);
  }

  return allDevices;
}

// Function to extract entity IDs (simulating HomeAssistantService.getConfiguredEntityIds)
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
    
    // For water sensors, radar sensors, door sensors, security sensors
    // their main entity might be a binary sensor
    if (['water', 'radar', 'door', 'security'].includes(device.type)) {
      if (device.entity && device.entity.startsWith('binary_sensor.')) {
        console.log(`  📡 Binary sensor entity: ${device.entity}`);
      }
    }
  });
  
  // Remove duplicates
  const uniqueEntityIds = [...new Set(entityIds)];
  
  // Log the breakdown
  const binarySensors = uniqueEntityIds.filter(id => id.startsWith('binary_sensor.'));
  const climateDevices = uniqueEntityIds.filter(id => id.startsWith('climate.'));
  const lights = uniqueEntityIds.filter(id => id.startsWith('light.'));
  const sensors = uniqueEntityIds.filter(id => id.startsWith('sensor.'));
  const cameras = uniqueEntityIds.filter(id => id.startsWith('camera.'));
  
  console.log('📊 Entity breakdown:');
  console.log(`  Binary sensors (${binarySensors.length}):`, binarySensors);
  console.log(`  Climate devices (${climateDevices.length}):`, climateDevices);
  console.log(`  Lights (${lights.length}):`, lights);
  console.log(`  Sensors (${sensors.length}):`, sensors);
  console.log(`  Cameras (${cameras.length}):`, cameras);
  
  return uniqueEntityIds;
}

async function testEntityState(entityId) {
  try {
    const response = await fetch(`${API_BASE_URL}/${entityId}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return { entityId, exists: true, state: data.state };
      }
    }
    
    return { entityId, exists: false, state: null };
  } catch (error) {
    return { entityId, exists: false, state: null };
  }
}

async function testConfiguration(config) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Testing Configuration: ${config.name}`);
  console.log(`${'='.repeat(80)}`);
  
  // Get configured devices
  const configuredDevices = getConfiguredDevices(config.devices);
  console.log('\n📱 Configured devices found:', configuredDevices.length);
  
  // Get entity IDs
  const entityIds = getConfiguredEntityIds(configuredDevices);
  console.log(`\n📋 Total entities to fetch: ${entityIds.length}`);
  
  // Test each entity
  console.log('\n🔍 Testing entity availability...');
  const results = {
    binarySensorData: {},
    climateData: {},
    lightData: {},
    sensorData: {},
    cameraData: {}
  };
  
  let foundCount = 0;
  let notFoundCount = 0;
  
  for (const entityId of entityIds) {
    const result = await testEntityState(entityId);
    
    if (result.exists) {
      console.log(`✅ ${entityId}: ${result.state}`);
      foundCount++;
      
      const entityData = {
        entity_id: result.entityId,
        old_state: result.state,
        new_state: result.state,
        user_id: null,
        timestamp: new Date().toISOString(),
        attributes: {}
      };
      
      if (entityId.startsWith('binary_sensor.')) {
        results.binarySensorData[entityId] = entityData;
      } else if (entityId.startsWith('climate.')) {
        results.climateData[entityId] = entityData;
      } else if (entityId.startsWith('light.')) {
        results.lightData[entityId] = entityData;
      } else if (entityId.startsWith('sensor.')) {
        results.sensorData[entityId] = entityData;
      } else if (entityId.startsWith('camera.')) {
        results.cameraData[entityId] = entityData;
      }
    } else {
      console.log(`❌ ${entityId}: Not found`);
      notFoundCount++;
    }
  }
  
  console.log(`\n📊 Results Summary:`);
  console.log(`  ✅ Found: ${foundCount}`);
  console.log(`  ❌ Not found: ${notFoundCount}`);
  console.log(`  📊 Binary sensors: ${Object.keys(results.binarySensorData).length}`);
  console.log(`  📊 Climate devices: ${Object.keys(results.climateData).length}`);
  console.log(`  📊 Lights: ${Object.keys(results.lightData).length}`);
  console.log(`  📊 Sensors: ${Object.keys(results.sensorData).length}`);
  console.log(`  📊 Cameras: ${Object.keys(results.cameraData).length}`);
  
  if (Object.keys(results.binarySensorData).length > 0) {
    console.log('\n📄 Binary sensor details:');
    Object.entries(results.binarySensorData).forEach(([id, data]) => {
      console.log(`  - ${id}: ${data.new_state}`);
    });
  }
  
  return results;
}

async function runDynamicBinarySensorTest() {
  console.log('🚀 Testing Dynamic Binary Sensor Detection...');
  
  for (const config of testConfigurations) {
    await testConfiguration(config);
  }
  
  console.log('\n✅ Dynamic binary sensor detection test completed!');
}

runDynamicBinarySensorTest().catch(error => {
  console.error('❌ Test failed:', error);
});