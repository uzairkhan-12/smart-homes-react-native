// Test to check what entities are stored and which binary sensors exist
const fetch = require('node-fetch');

const API_BASE_URL = 'http://192.168.100.95:3040/api/ha/state';

// Simulate the device storage structure from DeviceStorageService
const defaultDevices = {
  waterSensors: Array.from({ length: 3 }, (_, i) => ({
    id: `water_${i + 1}`,
    name: `Water Sensor ${i + 1}`,
    entity: '', // Usually empty by default
    type: 'water'
  })),
  radarSensors: Array.from({ length: 4 }, (_, i) => ({
    id: `radar_${i + 1}`,
    name: `Radar Sensor ${i + 1}`,
    entity: '', // Usually empty by default
    type: 'radar'
  })),
  tempHumiditySensors: Array.from({ length: 2 }, (_, i) => ({
    id: `temp_humidity_${i + 1}`,
    name: `Temperature & Humidity Sensor ${i + 1}`,
    entity: '', // Usually empty by default
    type: 'temp_humidity'
  })),
  doorSensor: {
    id: 'door_1',
    name: 'Front Door',
    entity: '', // Usually empty by default
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
      motion_sensor: 'binary_sensor.radar_sensor_1',
      occupancy_sensor: 'binary_sensor.frontdoor_1_person_occupancy'
    },
    {
      id: 'camera_2',
      name: 'Office Camera',
      entity: 'camera.office_demo',
      type: 'camera',
      stream_url: 'http://192.168.100.55:5050/api/office_demo',
      motion_sensor: 'binary_sensor.office_demo_motion',
      occupancy_sensor: 'binary_sensor.office_demo_person_occupancy'
    }
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
    entity: '', // Usually empty by default
    type: 'security'
  }
};

// Function to get configured entity IDs (simulating HomeAssistantService.getConfiguredEntityIds)
function getConfiguredEntityIds(configuredDevices) {
  const entityIds = [];
  
  configuredDevices.forEach(device => {
    if (device.entity && device.entity.trim() !== '') {
      entityIds.push(device.entity);
    }
    
    // For cameras, also add motion and occupancy sensor entities
    if (device.type === 'camera') {
      if (device.motion_sensor && device.motion_sensor.trim() !== '') {
        entityIds.push(device.motion_sensor);
      }
      if (device.occupancy_sensor && device.occupancy_sensor.trim() !== '') {
        entityIds.push(device.occupancy_sensor);
      }
    }
  });
  
  // Remove duplicates
  return [...new Set(entityIds)];
}

// Function to get configured devices (simulating DeviceStorageService.getConfiguredDevices)
function getConfiguredDevices(devices) {
  const allDevices = [];

  // Add array devices that have entities configured
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
}

async function testEntityState(entityId) {
  try {
    const response = await fetch(`${API_BASE_URL}/${entityId}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log(`✅ ${entityId}: ${data.state}`);
        return { entityId, exists: true, state: data.state };
      }
    }
    
    console.log(`❌ ${entityId}: Not found`);
    return { entityId, exists: false, state: null };
  } catch (error) {
    console.log(`❌ ${entityId}: Error - ${error.message}`);
    return { entityId, exists: false, state: null };
  }
}

async function runStorageEntityTest() {
  console.log('🚀 Testing entities from storage configuration...\n');
  
  // Get configured devices from storage simulation
  const configuredDevices = getConfiguredDevices(defaultDevices);
  console.log('📱 Configured devices:', configuredDevices.map(d => ({ id: d.id, name: d.name, entity: d.entity, type: d.type })));
  
  // Get entity IDs including binary sensors from cameras
  const entityIds = getConfiguredEntityIds(configuredDevices);
  console.log('\n📋 All entity IDs to fetch:', entityIds);
  
  // Separate entities by type
  const binarySensors = entityIds.filter(id => id.startsWith('binary_sensor.'));
  const climateEntities = entityIds.filter(id => id.startsWith('climate.'));
  const lightEntities = entityIds.filter(id => id.startsWith('light.'));
  const sensorEntities = entityIds.filter(id => id.startsWith('sensor.'));
  const cameraEntities = entityIds.filter(id => id.startsWith('camera.'));
  
  console.log('\n📊 Entity breakdown:');
  console.log(`Binary sensors: ${binarySensors.length} -`, binarySensors);
  console.log(`Climate devices: ${climateEntities.length} -`, climateEntities);
  console.log(`Lights: ${lightEntities.length} -`, lightEntities);
  console.log(`Sensors: ${sensorEntities.length} -`, sensorEntities);
  console.log(`Cameras: ${cameraEntities.length} -`, cameraEntities);
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 Testing entity availability in Home Assistant...\n');
  
  const results = {
    binarySensorData: {},
    climateData: {},
    lightData: {},
    sensorData: {},
    cameraData: {}
  };
  
  // Test all entities
  for (const entityId of entityIds) {
    const result = await testEntityState(entityId);
    
    if (result.exists) {
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
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Final results summary:');
  console.log(`✅ Binary sensors found: ${Object.keys(results.binarySensorData).length}`);
  console.log(`✅ Climate devices found: ${Object.keys(results.climateData).length}`);
  console.log(`✅ Lights found: ${Object.keys(results.lightData).length}`);
  console.log(`✅ Sensors found: ${Object.keys(results.sensorData).length}`);
  console.log(`✅ Cameras found: ${Object.keys(results.cameraData).length}`);
  
  console.log('\n📄 Binary sensor details:');
  Object.keys(results.binarySensorData).forEach(id => {
    console.log(`  - ${id}: ${results.binarySensorData[id].new_state}`);
  });
  
  return results;
}

runStorageEntityTest().then((results) => {
  console.log('\n✅ Storage entity test completed!');
}).catch(error => {
  console.error('❌ Test failed:', error);
});