import { BinarySensorData, ClimateData, LightData, SensorData } from '../../types';

// WebSocket Configuration
const WS_API_URL = `ws://192.168.100.95:3040/api/ws/entities_live`;

export interface EntityState {
  entity_id: string;
  old_state: string;
  new_state: string;
  user_id: string | null;
  timestamp: string;
  attributes: any;
}

export interface HomeAssistantData {
  binarySensorData: { [key: string]: BinarySensorData };
  climateData: { [key: string]: ClimateData };
  lightData: { [key: string]: LightData };
  sensorData: { [key: string]: SensorData };
}

class HomeAssistantService {
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds as requested
  private listeners: ((data: HomeAssistantData) => void)[] = [];
  
  // Current data state - starts with dummy data
  private currentData: HomeAssistantData = {
    binarySensorData: {},
    climateData: {},
    lightData: {},
    sensorData: {}
  };

  constructor() {
    this.initializeWithDummyData();
    // Console log all binary sensors to check camera sensors
    this.logBinarySensors();
  }

  // Initialize with dummy data for testing
  private initializeWithDummyData() {
    this.currentData = {
      binarySensorData: {
        'binary_sensor.boardb_presence_tu_pressure': {
          entity_id: 'binary_sensor.boardb_presence_tu_pressure',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-25T16:01:02.946201+00:00',
          attributes: {
            device_class: 'moisture',
            friendly_name: 'Water Sensor 1'
          }
        },
        'binary_sensor.water_sensor_2': {
          entity_id: 'binary_sensor.water_sensor_2',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-25T16:01:02.946201+00:00',
          attributes: {
            device_class: 'moisture',
            friendly_name: 'Water Sensor 2'
          }
        },
        'binary_sensor.water_sensor_3': {
          entity_id: 'binary_sensor.water_sensor_3',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-25T16:01:02.946201+00:00',
          attributes: {
            device_class: 'moisture',
            friendly_name: 'Water Sensor 3'
          }
        },
        'binary_sensor.radar_sensor_1': {
          entity_id: 'binary_sensor.radar_sensor_1',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-25T16:01:02.946201+00:00',
          attributes: {
            device_class: 'motion',
            friendly_name: 'Radar Sensor 1'
          }
        },
        'binary_sensor.radar_sensor_2': {
          entity_id: 'binary_sensor.radar_sensor_2',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-25T16:01:02.946201+00:00',
          attributes: {
            device_class: 'motion',
            friendly_name: 'Radar Sensor 2'
          }
        },
        'binary_sensor.radar_sensor_3': {
          entity_id: 'binary_sensor.radar_sensor_3',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-25T16:01:02.946201+00:00',
          attributes: {
            device_class: 'motion',
            friendly_name: 'Radar Sensor 3'
          }
        },
        'binary_sensor.radar_sensor_4': {
          entity_id: 'binary_sensor.radar_sensor_4',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-25T16:01:02.946201+00:00',
          attributes: {
            device_class: 'motion',
            friendly_name: 'Radar Sensor 4'
          }
        },
        'binary_sensor.frontdoor_1_person_occupancy': {
          entity_id: 'binary_sensor.frontdoor_1_person_occupancy',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-25T16:01:02.946201+00:00',
          attributes: {
            device_class: 'occupancy',
            icon: 'mdi:home-outline',
            friendly_name: 'Frontdoor 1 Person occupancy'
          }
        },
        // Office demo sensors for Camera 2
        'binary_sensor.office_demo_motion': {
          entity_id: 'binary_sensor.office_demo_motion',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-25T16:01:02.946201+00:00',
          attributes: {
            device_class: 'motion',
            friendly_name: 'Office Demo Motion'
          }
        },
        'binary_sensor.office_demo_person_occupancy': {
          entity_id: 'binary_sensor.office_demo_person_occupancy',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-25T16:01:02.946201+00:00',
          attributes: {
            device_class: 'occupancy',
            friendly_name: 'Office Demo Person Occupancy'
          }
        },
        'binary_sensor.boardb_presence_tu_presence': {
          entity_id: 'binary_sensor.boardb_presence_tu_presence',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-25T15:59:06.037860+00:00',
          attributes: {
            device_class: 'occupancy',
            friendly_name: 'BoardB_Presence_TU Occupancy'
          }
        },
        'binary_sensor.front_door': {
          entity_id: 'binary_sensor.front_door',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-25T16:01:02.946201+00:00',
          attributes: {
            device_class: 'door',
            friendly_name: 'Front Door'
          }
        },
        'binary_sensor.security_system': {
          entity_id: 'binary_sensor.security_system',
          old_state: 'off',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-25T16:01:02.946201+00:00',
          attributes: {
            device_class: 'safety',
            friendly_name: 'Security System'
          }
        }
      },
      climateData: {
        'climate.office_ac': {
          entity_id: 'climate.office_ac',
          old_state: 'heat_cool',
          new_state: 'heat_cool',
          user_id: '45882e54e84d4c308af1caabae6b3876',
          timestamp: '2025-10-25T15:59:57.597483+00:00',
          attributes: {
            hvac_modes: ['off', 'heat', 'cool', 'heat_cool', 'fan_only'],
            min_temp: 18.0,
            max_temp: 30.0,
            target_temp_step: 1.0,
            fan_modes: ['low', 'mid', 'high'],
            current_temperature: null,
            temperature: 22,
            fan_mode: 'low',
            last_on_operation: 'heat_cool',
            device_code: 1380,
            manufacturer: 'Midea',
            supported_models: ['Unknown'],
            supported_controller: 'Broadlink',
            commands_encoding: 'Base64',
            friendly_name: 'Office AC',
            supported_features: 393
          }
        }
      },
      lightData: {
        'light.boarda_buttonswitch_a': {
          entity_id: 'light.boarda_buttonswitch_a',
          old_state: 'off',
          new_state: 'on',
          user_id: null,
          timestamp: '2025-10-25T15:49:37.237420+00:00',
          attributes: {
            supported_color_modes: ['onoff'],
            color_mode: 'onoff',
            friendly_name: 'Board A - Button Switch - A',
            supported_features: 0
          }
        },
        'light.living_room': {
          entity_id: 'light.living_room',
          old_state: 'on',
          new_state: 'off',
          user_id: null,
          timestamp: '2025-10-25T15:49:37.237420+00:00',
          attributes: {
            supported_color_modes: ['onoff'],
            color_mode: 'onoff',
            friendly_name: 'Living Room Light',
            supported_features: 0
          }
        },
        'light.office_light_grill43': {
          entity_id: 'light.office_light_grill43',
          old_state: 'off',
          new_state: 'on',
          user_id: null,
          timestamp: '2025-10-25T15:49:37.237420+00:00',
          attributes: {
            supported_color_modes: ['onoff'],
            color_mode: 'onoff',
            friendly_name: 'Office Light',
            supported_features: 0
          }
        }
      },
      sensorData: {
        'sensor.boarda_temp_sonoff_temperature': {
          entity_id: 'sensor.boarda_temp_sonoff_temperature',
          old_state: '25.15',
          new_state: '25.18',
          user_id: null,
          timestamp: '2025-10-25T16:01:55.195652+00:00',
          attributes: {
            state_class: 'measurement',
            unit_of_measurement: '°C',
            device_class: 'temperature',
            friendly_name: 'BoardA_Temp_Sonoff Temperature'
          }
        },
        'sensor.boarda_temp_sonoff_humidity': {
          entity_id: 'sensor.boarda_temp_sonoff_humidity',
          old_state: '65',
          new_state: '65',
          user_id: null,
          timestamp: '2025-10-25T16:01:55.195652+00:00',
          attributes: {
            state_class: 'measurement',
            unit_of_measurement: '%',
            device_class: 'humidity',
            friendly_name: 'BoardA_Temp_Sonoff Humidity'
          }
        },
        'sensor.living_room_temperature': {
          entity_id: 'sensor.living_room_temperature',
          old_state: '22.5',
          new_state: '22.5',
          user_id: null,
          timestamp: '2025-10-25T16:01:55.195652+00:00',
          attributes: {
            state_class: 'measurement',
            unit_of_measurement: '°C',
            device_class: 'temperature',
            friendly_name: 'Living Room Temperature'
          }
        },
        'sensor.living_room_humidity': {
          entity_id: 'sensor.living_room_humidity',
          old_state: '45',
          new_state: '45',
          user_id: null,
          timestamp: '2025-10-25T16:01:55.195652+00:00',
          attributes: {
            state_class: 'measurement',
            unit_of_measurement: '%',
            device_class: 'humidity',
            friendly_name: 'Living Room Humidity'
          }
        }
      }
    };
  }

  // Log binary sensors for debugging - especially camera sensors
  private logBinarySensors() {
    console.log('=== All Binary Sensors in Storage ===');
    const binarySensors = Object.keys(this.currentData.binarySensorData);
    
    console.log(`Total binary sensors: ${binarySensors.length}`);
    
    // Filter camera sensors
    const cameraSensors = binarySensors.filter(sensor => 
      sensor.includes('camera') || sensor.includes('motion') || sensor.includes('occupancy')
    );
    
    console.log(`Camera-related sensors: ${cameraSensors.length}`);
    cameraSensors.forEach(sensor => {
      const sensorData = this.currentData.binarySensorData[sensor];
      console.log(`🎥 ${sensor}: ${sensorData.new_state} (${sensorData.attributes.friendly_name})`);
    });
    
    // Log all binary sensors for reference
    console.log('All binary sensors:');
    binarySensors.forEach(sensor => {
      const sensorData = this.currentData.binarySensorData[sensor];
      console.log(`📡 ${sensor}: ${sensorData.new_state}`);
    });
    console.log('=== End Binary Sensors List ===');
  }

  // Subscribe to data updates
  subscribe(callback: (data: HomeAssistantData) => void) {
    this.listeners.push(callback);
    // Immediately send current data to new subscriber
    callback(this.currentData);
    
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentData));
  }

  // Process entity states and categorize them
  private processEntityStates(states: EntityState[]) {
    const newData: HomeAssistantData = {
      binarySensorData: { ...this.currentData.binarySensorData },
      climateData: { ...this.currentData.climateData },
      lightData: { ...this.currentData.lightData },
      sensorData: { ...this.currentData.sensorData }
    };

    states.forEach(state => {
      const entityId = state.entity_id;
      
      // Skip processing if entity_id is undefined or null
      if (!entityId || typeof entityId !== 'string') {
        console.warn('Skipping state with invalid entity_id:', state);
        return;
      }
      
      console.log(`Processing entity: ${entityId} with state: ${state.new_state}`);
      
      if (entityId.startsWith('binary_sensor.') || this.isBinarySensorEntity(entityId)) {
        newData.binarySensorData[entityId] = state as BinarySensorData;
        console.log(`Updated binary sensor: ${entityId}`);
      } else if (entityId.startsWith('climate.')) {
        newData.climateData[entityId] = state as ClimateData;
        console.log(`Updated climate device: ${entityId}`);
      } else if (entityId.startsWith('light.')) {
        newData.lightData[entityId] = state as LightData;
        console.log(`Updated light: ${entityId}`);
      } else if (entityId.startsWith('sensor.')) {
        newData.sensorData[entityId] = state as SensorData;
        console.log(`Updated sensor: ${entityId}`);
      }
    });

    this.currentData = newData;
    this.notifyListeners();
  }

  // Helper to identify binary sensor entities that don't follow naming convention
  private isBinarySensorEntity(entityId: string): boolean {
    const binarySensorIds = ['test22', 'test', 'radar 1', 'radar 2', 'radar 3', 'radar 4'];
    return binarySensorIds.includes(entityId);
  }

  // Connect to WebSocket for real-time updates
  connectWebSocket(): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.websocket = new WebSocket(WS_API_URL);

      this.websocket.onopen = () => {
        this.reconnectAttempts = 0;
      };

      this.websocket.onmessage = (event) => {
        try {
          const rawData = event?.data;
          
          // Skip non-JSON messages (like ping/pong or connection messages)
          if (!rawData || typeof rawData !== 'string' || rawData.trim().length === 0) {
            return;
          }
          
          // Try to parse as JSON
          let entityState: EntityState;
          try {
            entityState = JSON.parse(rawData);
          } catch (parseError) {
            return;
          }
          
          // Validate that we have proper entity data before processing
          if (entityState && entityState.entity_id && typeof entityState.entity_id === 'string') {
            this.processEntityStates([entityState]);
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      };

      this.websocket.onclose = (event) => {
        this.websocket = null;
        this.handleReconnect();
      };

      this.websocket.onerror = (error) => {
        // Keep error logging for debugging critical issues
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.handleReconnect();
    }
  }

  // Handle WebSocket reconnection
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached. Stopping reconnection.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms...`);
    
    setTimeout(() => {
      this.connectWebSocket();
    }, this.reconnectDelay);
  }

  // Get current data
  getCurrentData(): HomeAssistantData {
    return this.currentData;
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.listeners = [];
  }

  // Check connection status
  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }

  // Simple toggle method for testing (can be enhanced later)
  toggleEntity(entityId: string): void {
    const currentData = this.getCurrentData();
    
    // Find the entity in the appropriate data category
    let entity = null;
    if (entityId.startsWith('light.')) {
      entity = currentData.lightData[entityId];
    } else if (entityId.startsWith('binary_sensor.')) {
      entity = currentData.binarySensorData[entityId];
    }
    
    if (entity) {
      // Toggle the state
      const newState = entity.new_state === 'on' ? 'off' : 'on';
      const updatedEntity = {
        ...entity,
        old_state: entity.new_state,
        new_state: newState,
        timestamp: new Date().toISOString()
      };
      
      console.log(`Toggling ${entityId} from ${entity.new_state} to ${newState}`);
      this.processEntityStates([updatedEntity]);
    }
  }
}

export const homeAssistantService = new HomeAssistantService();