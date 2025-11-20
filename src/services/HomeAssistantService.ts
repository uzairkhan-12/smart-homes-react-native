import { AppState, AppStateStatus } from 'react-native';
import { BinarySensorData, ClimateData, LightData, SensorData } from '../../types';
import { fetchWithTimeout } from '../utils/fetch';
import { homeAssistantApiService } from './HomeAssistantApiService';
import { deviceStorageService } from './DeviceStorageService';
import { dynamicConfigService } from './DynamicConfigService';

// Helper function to get configuration
const getConfig = async () => {
  const config = await dynamicConfigService.getConfig();
  return {
    baseUrl: config.HA_Config.BASE_URL,
    apiUrl: config.HA_Config.API_URL,
    token: config.HA_Config.TOKEN,
    httpApiUrl: config.HA_Config.API_URL
  };
};

const getApiUrl = async () => {
  return await dynamicConfigService.getApiUrl();
};

const getAuthHeader = async () => {
  const token = await dynamicConfigService.getToken();
  return `Bearer ${token}`;
};

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
  private reconnectDelay = 5000; // 5 seconds for ongoing reconnections
  private initialReconnectDelay = 500; // 500ms for initial attempts (faster)
  private listeners: ((data: HomeAssistantData) => void)[] = [];
  private reconnectTimer: number | null = null;
  private isAppInBackground = false;
  private shouldReconnectOnForeground = false;
  private appStateSubscription: any = null;
  private configSubscription: (() => void) | null = null;
  
  // Current data state - starts with dummy data
  private currentData: HomeAssistantData = {
    binarySensorData: {},
    climateData: {},
    lightData: {},
    sensorData: {}
  };

  constructor() {
    this.initializeWithDummyData();
    this.setupAppStateListener();
    this.setupConfigurationChangeListener();
  }

  // Setup app state listener to handle background/foreground transitions
  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  // Setup configuration change listener for hot reloading
  private setupConfigurationChangeListener(): void {
    this.configSubscription = dynamicConfigService.subscribe((newConfig) => {
      console.log('🔄 Configuration changed, reconnecting WebSocket...');
      this.handleConfigurationChange(newConfig);
    });
  }

  // Handle configuration changes by reconnecting WebSocket
  private async handleConfigurationChange(newConfig: any): Promise<void> {
    try {
      // Clear cache to ensure fresh config is used
      await dynamicConfigService.clearCacheAndReload();
      
      // Close existing WebSocket connection
      if (this.websocket) {
        console.log('🔌 Closing existing WebSocket connection for config change');
        this.websocket.close();
        this.websocket = null;
      }

      // Reset reconnection attempts for fresh start
      this.reconnectAttempts = 0;
      
      // Clear any pending reconnection timers
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      // Wait a moment for cleanup, then reconnect with new configuration
      setTimeout(async () => {
        try {
          console.log('🔄 Connecting with new configuration...');
          await this.connectWebSocket();
          console.log('✅ Successfully reconnected with new configuration');
        } catch (error) {
          console.error('❌ Failed to reconnect with new configuration:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('❌ Error handling configuration change:', error);
    }
  }

  // Handle app state changes (background/foreground)
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App is going to background or screen is locked
      this.isAppInBackground = true;
      this.shouldReconnectOnForeground = this.isConnected();
      
      // Close WebSocket connection to prevent background connection issues
      if (this.websocket) {
        console.log('📱 App going to background, closing WebSocket connection');
        this.websocket.close();
        this.websocket = null;
      }
      
      // Clear any pending reconnection attempts
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    } else if (nextAppState === 'active') {
      // App is coming to foreground or screen is unlocked
      this.isAppInBackground = false;
      
      if (this.shouldReconnectOnForeground) {
        console.log('📱 App coming to foreground, reconnecting services');
        // Add a small delay to ensure app is fully active
        setTimeout(async () => {
          this.reconnectAttempts = 0; // Reset reconnection attempts
          
          try {
            // Reconnect WebSocket
            await this.connectWebSocket();
            
            // Refresh configuration and camera streams
            await this.refreshAfterForeground();
            
            console.log('✅ Successfully reconnected all services after foreground');
          } catch (error) {
            console.error('Failed to reconnect after foreground:', error);
          }
        }, 1000);
      }
      
      this.shouldReconnectOnForeground = false;
    }
  };

  // Refresh services after app comes to foreground
  private async refreshAfterForeground(): Promise<void> {
    try {
      console.log('🔄 Refreshing services after foreground...');
      
      // Validate configuration is still valid
      const config = await getConfig();
      if (!config || !config.httpApiUrl || !config.token) {
        console.warn('⚠️ Configuration invalid after foreground, skipping refresh');
        return;
      }
      
      // Force refresh of camera URLs and entities
      await this.validateAndRefreshCameraUrls();
      
      // Notify listeners that we're refreshing (this will trigger camera reloads)
      this.notifyListeners();
      
      console.log('✅ Services refreshed after foreground');
      
    } catch (error) {
      console.error('❌ Failed to refresh services after foreground:', error);
    }
  }

  // Validate and refresh camera URLs after app foreground
  private async validateAndRefreshCameraUrls(): Promise<void> {
    try {
      console.log('📹 Validating camera URLs after foreground...');
      
      // Get fresh configuration URLs
      const config = await getConfig();
      const apiUrl = config.apiUrl;
      const authHeader = `Bearer ${config.token}`;
      
      if (!apiUrl || apiUrl.includes('undefined') || !authHeader) {
        console.error('❌ Invalid API configuration for cameras:', { apiUrl, hasAuth: !!authHeader });
        return;
      }
      
      console.log('✅ Camera URLs validated successfully');
      
    } catch (error) {
      console.error('❌ Failed to validate camera URLs:', error);
    }
  }

  // Load initial states from Home Assistant API
  async loadInitialStatesFromAPI(entityIds: string[]): Promise<void> {
    try {

      
      // Fetch actual states from API
      const apiStates = await homeAssistantApiService.fetchConfiguredEntityStates(entityIds);
      

      
      // Set API states directly (no dummy data merging)
      this.currentData = {
        binarySensorData: { ...apiStates.binarySensorData },
        climateData: { ...apiStates.climateData },
        lightData: { ...apiStates.lightData },
        sensorData: { ...apiStates.sensorData }
      };


      this.notifyListeners();
      
    } catch (error) {
      console.error('❌ Failed to load initial states from API:', error);
      // Keep empty data if API fails (no fallback to dummy data)
    }
  }

  // Extract entity IDs from configured devices for API loading
  getConfiguredEntityIds(configuredDevices: any[]): string[] {
    const entityIds: string[] = [];
    

    
    configuredDevices.forEach(device => {
      
      // Add main entity if it exists
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
    const uniqueEntityIds = [...new Set(entityIds)];
    
    return uniqueEntityIds;
  }

  // Initialize with both dummy data and API data
  async initializeWithConfiguredDevices(configuredDevices: any[]): Promise<void> {
    // Always start with dummy data
    this.initializeWithDummyData();
    
    // Try to load real data from API
    const entityIds = this.getConfiguredEntityIds(configuredDevices);
    if (entityIds.length > 0) {
      await this.loadInitialStatesFromAPI(entityIds);
    }
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
          old_state: 'off',
          new_state: 'off',
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
        },
        'climate.living_room_ac': {
          entity_id: 'climate.living_room_ac',
          old_state: 'cool',
          new_state: 'cool',
          user_id: '45882e54e84d4c308af1caabae6b3876',
          timestamp: '2025-10-25T15:59:57.597483+00:00',
          attributes: {
            hvac_modes: ['off', 'heat', 'cool', 'heat_cool', 'fan_only'],
            min_temp: 16.0,
            max_temp: 32.0,
            target_temp_step: 1.0,
            fan_modes: ['low', 'mid', 'high', 'auto'],
            current_temperature: 24,
            temperature: 20,
            fan_mode: 'mid',
            last_on_operation: 'cool',
            device_code: 1420,
            manufacturer: 'LG',
            supported_models: ['Unknown'],
            supported_controller: 'Broadlink',
            commands_encoding: 'Base64',
            friendly_name: 'Living Room AC',
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
      
      if (entityId.startsWith('binary_sensor.') || this.isBinarySensorEntity(entityId)) {
        newData.binarySensorData[entityId] = state as BinarySensorData;
      } else if (entityId.startsWith('climate.')) {
        newData.climateData[entityId] = state as ClimateData;
      } else if (entityId.startsWith('light.')) {
        newData.lightData[entityId] = state as LightData;
      } else if (entityId.startsWith('sensor.')) {
        newData.sensorData[entityId] = state as SensorData;
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
  async connectWebSocket(): Promise<void> {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Validate configuration first
      const config = await getConfig();
      if (!config || !config.httpApiUrl || !config.token) {
        console.warn('⚠️ No valid Home Assistant configuration found, skipping WebSocket connection');
        return;
      }

      // Use dynamic WebSocket URL
      const websocketUrl = await dynamicConfigService.getWebSocketUrl();
      console.log('🔌 WebSocket - About to connect to:', websocketUrl);
      
      // Double-check by getting full config
      const fullConfig = await dynamicConfigService.getConfig();
      console.log('🔍 WebSocket - Full config WEBSOCKET_URL:', fullConfig.HA_Config.WEBSOCKET_URL);
      console.log('🔍 WebSocket - URLs match:', websocketUrl === fullConfig.HA_Config.WEBSOCKET_URL);
      
      this.websocket = new WebSocket(websocketUrl);

      this.websocket.onopen = () => {
        console.log('✅ WebSocket connected successfully');
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
        try {
          console.log('🔌 WebSocket connection closed', {
            code: event?.code,
            reason: event?.reason,
            wasClean: event?.wasClean
          });
        } catch (logError) {
          console.log('🔌 WebSocket closed (unable to read event details)', String(logError));
        }

        this.websocket = null;

        // Only attempt reconnection if app is not in background
        if (!this.isAppInBackground) {
          this.handleReconnect();
        }
      };

      this.websocket.onerror = (error) => {
        try {
          // Attempt to extract useful info from the error object
          const errObj: any = error || {};
          const details = {
            message: errObj.message || errObj.type || 'Unknown WebSocket error',
            code: errObj.code || null,
            target: errObj.target ? 'WebSocket' : null
          };
          console.error('⚠️ WebSocket error (handled gracefully):', details, errObj);
        } catch (logErr) {
          console.error('⚠️ WebSocket error (could not serialize):', String(logErr));
        }

        // Don't attempt reconnection immediately after error if app is in background
        if (this.isAppInBackground) {
          this.shouldReconnectOnForeground = true;
        }
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);

      // Don't attempt reconnection if configuration is invalid
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('undefined') || errorMessage.includes('invalid')) {
        console.error('❌ WebSocket connection failed due to invalid configuration, not retrying');
        return;
      }

      this.handleReconnect();
    }
  }

  // Handle WebSocket reconnection
  private handleReconnect(): void {
    // Don't reconnect if app is in background
    if (this.isAppInBackground) {
      this.shouldReconnectOnForeground = true;
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🔄 Max reconnection attempts reached. Stopping reconnection.');
      // Notify listeners that we've given up reconnecting
      this.notifyListeners();
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    // Use shorter delay for initial connection attempts
    const delay = this.reconnectAttempts <= 2 ? this.initialReconnectDelay : this.reconnectDelay;
    console.log(`⏱️ Next reconnection attempt in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(async () => {
      try {
      // Validate configuration before attempting reconnection
      const config = await getConfig();
      if (!config?.token) {
        console.error('❌ Cannot reconnect WebSocket: No token configured');
        return;
      }        await this.connectWebSocket();
      } catch (error) {
        console.error('Failed to reconnect WebSocket:', error);
      }
    }, delay) as any;
  }

  // Get current data
  getCurrentData(): HomeAssistantData {
    return this.currentData;
  }

  // Disconnect WebSocket
  disconnect(): void {
    console.log('🔌 Disconnecting WebSocket service');
    
    // Clear reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Close WebSocket connection
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    // Clear listeners
    this.listeners = [];
    
    // Remove app state listener
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    // Remove configuration change listener
    if (this.configSubscription) {
      this.configSubscription();
      this.configSubscription = null;
    }

    // Reset connection state
    this.reconnectAttempts = 0;
    this.isAppInBackground = false;
    this.shouldReconnectOnForeground = false;
  }

  // Check connection status
  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }

  // Check if currently trying to connect
  isConnecting(): boolean {
    return this.websocket?.readyState === WebSocket.CONNECTING || this.reconnectTimer !== null;
  }

  // Check if connection attempts have been exhausted
  hasExhaustedReconnectionAttempts(): boolean {
    return this.reconnectAttempts >= this.maxReconnectAttempts;
  }

  // Reset reconnection attempts (useful for manual refresh)
  resetReconnectionAttempts(): void {
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Public method to refresh connections (can be called by camera components)
  async refreshConnections(): Promise<void> {
    try {
      console.log('🔄 Manually refreshing connections...');
      
      // Validate configuration
      const config = await getConfig();
      if (!config || !config.httpApiUrl || !config.token) {
        console.warn('⚠️ No valid configuration for refresh');
        return;
      }
      
      // Refresh camera URLs
      await this.validateAndRefreshCameraUrls();
      
      // Reconnect WebSocket if needed
      if (!this.isConnected() && !this.isAppInBackground) {
        await this.connectWebSocket();
      }
      
      // Notify listeners to refresh their components
      this.notifyListeners();
      
      console.log('✅ Manual connection refresh completed');
      
    } catch (error) {
      console.error('❌ Failed to refresh connections:', error);
    }
  }

  // Specific method for camera connectivity issues
  async refreshCameraStreams(): Promise<void> {
    console.log('📹 Camera stream refresh requested');
    
    try {
      await this.validateAndRefreshCameraUrls();
      
      // Notify listeners about updated data
      this.notifyListeners();
      
      console.log('✅ Camera streams refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh camera streams:', error);
    }
  }

  // Simple toggle method for testing (enhanced with API calls)
  toggleEntity(entityId: string): void {
    const currentData = this.getCurrentData();
    
    // Find the entity in the appropriate data category
    let entity = null;
    if (entityId.startsWith('light.')) {
      entity = currentData.lightData[entityId];
    } else if (entityId.startsWith('binary_sensor.')) {
      entity = currentData.binarySensorData[entityId];
    } else if (entityId.startsWith('climate.')) {
      entity = currentData.climateData[entityId];
    }
    
    if (entity) {
      // Toggle the state
      let newState: string;
      if (entityId.startsWith('climate.')) {
        // For climate entities, cycle through modes
        const currentMode = entity.new_state;
        const climateEntity = entity as ClimateData;
        const modes = (climateEntity.attributes as any)?.hvac_modes || ['off', 'heat', 'cool', 'heat_cool'];
        const currentIndex = modes.indexOf(currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        newState = modes[nextIndex];
      } else {
        newState = entity.new_state === 'on' ? 'off' : 'on';
      }
      
      const updatedEntity = {
        ...entity,
        old_state: entity.new_state,
        new_state: newState,
        timestamp: new Date().toISOString()
      };
      

      this.processEntityStates([updatedEntity]);
      
      // Also toggle via Backend API first, then fallback to Home Assistant API
      if (entityId.startsWith('light.')) {
        const action = newState === 'on' ? 'turn_on' : 'turn_off';
        this.controlLight(entityId, action).catch(error => {
          console.warn(`Failed to control light ${entityId}:`, error);
        });
      } else {
        this.toggleEntityViaBackendAPI(entityId, newState);
      }
    }
  }

  // Toggle entity via Backend API with Home Assistant fallback
  private async toggleEntityViaBackendAPI(entityId: string, newState: string): Promise<void> {
    try {
      if (entityId.startsWith('light.')) {
        const action = newState === 'on' ? 'turn_on' : 'turn_off';

        
        // Use direct backend API call for lights - using WebSocket URL base for now
        const websocketUrl = await dynamicConfigService.getWebSocketUrl();
        const apiBaseUrl = websocketUrl.replace('ws://', 'http://').replace('/api/ws/entities_live', '/api');
        const response = await fetchWithTimeout(`${apiBaseUrl}/ha/service/light_toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_id: entityId,
            state: newState
          }),
          timeout: 10000,
        });
        
        if (response.ok) {

        } else {
          console.warn(`❌ Backend light control failed for ${entityId}: ${response.status}`);
          // Fallback to Home Assistant API
          const service = newState === 'on' ? 'turn_on' : 'turn_off';
          await this.callHomeAssistantService('light', service, { entity_id: entityId });
        }
      } else if (entityId.startsWith('climate.')) {

        
        // For climate, use Home Assistant API directly for now
        await this.callHomeAssistantService('climate', 'set_hvac_mode', {
          entity_id: entityId,
          hvac_mode: newState
        });
      }
      // Note: binary_sensor entities are typically read-only

    } catch (error) {
      console.warn(`❌ Failed to toggle ${entityId}:`, error);
    }
  }

  // Legacy toggle method (keeping for compatibility)
  private async toggleEntityViaAPI(entityId: string, newState: string): Promise<void> {
    // Delegate to the new backend-first method
    return this.toggleEntityViaBackendAPI(entityId, newState);
  }

  // Method to update AC settings via Backend API (preferred) with Home Assistant fallback
  updateClimateEntity(entityId: string, updates: Partial<{ temperature: number; fan_mode: string; hvac_mode: string }>): void {
    const currentData = this.getCurrentData();
    const entity = currentData.climateData[entityId];
    
    if (entity) {
      const updatedAttributes = { ...entity.attributes } as any;
      
      if (updates.temperature !== undefined) {
        updatedAttributes.temperature = updates.temperature;
      }
      if (updates.fan_mode !== undefined) {
        updatedAttributes.fan_mode = updates.fan_mode;
      }
      
      const updatedEntity = {
        ...entity,
        old_state: entity.new_state,
        new_state: updates.hvac_mode || entity.new_state,
        timestamp: new Date().toISOString(),
        attributes: updatedAttributes
      };
      

      this.processEntityStates([updatedEntity]);
      
      // Try to update via Backend API first, then fallback to Home Assistant API
      this.updateEntityViaBackendAPI(entityId, updates);
    }
  }

  // Update entity via Backend API with Home Assistant fallback
  private async updateEntityViaBackendAPI(entityId: string, updates: any): Promise<void> {
    try {
      if (entityId.startsWith('climate.')) {

        
        // Use Home Assistant API directly for climate updates
        if (updates.temperature !== undefined) {

          await this.callHomeAssistantService('climate', 'set_temperature', {
            entity_id: entityId,
            temperature: updates.temperature
          });
        }
        if (updates.fan_mode !== undefined) {

          await this.callHomeAssistantService('climate', 'set_fan_mode', {
            entity_id: entityId,
            fan_mode: updates.fan_mode
          });
        }
        if (updates.hvac_mode !== undefined) {

          await this.callHomeAssistantService('climate', 'set_hvac_mode', {
            entity_id: entityId,
            hvac_mode: updates.hvac_mode
          });
        }
        

      }
    } catch (error) {
      console.warn(`❌ Failed to update ${entityId}:`, error);
    }
  }

  // Control light via Backend API (preferred) with Home Assistant fallback
  async controlLight(entityId: string, action: 'turn_on' | 'turn_off', options?: {
    brightness?: number;
    rgb_color?: [number, number, number];
    color_temp?: number;
  }): Promise<void> {
    try {

      
      // Use Home Assistant API directly for light control
      const serviceData: any = { entity_id: entityId };
      
      if (action === 'turn_on' && options) {
        if (options.brightness !== undefined) {
          serviceData.brightness = options.brightness;
        }
        if (options.rgb_color) {
          serviceData.rgb_color = options.rgb_color;
        }
        if (options.color_temp) {
          serviceData.color_temp = options.color_temp;
        }
      }


      await this.callHomeAssistantService('light', action, serviceData);
      
      // Update local state immediately for UI responsiveness
      const currentData = this.getCurrentData();
      const lightEntity = currentData.lightData[entityId];
      if (lightEntity) {
        const updatedEntity = {
          ...lightEntity,
          old_state: lightEntity.new_state,
          new_state: action === 'turn_on' ? 'on' : 'off',
          timestamp: new Date().toISOString()
        };
        this.processEntityStates([updatedEntity]);
      }
      

    } catch (error) {
      console.error(`❌ Failed to control light ${entityId}:`, error);
      throw error;
    }
  }



  // Call Home Assistant service
  private async callHomeAssistantService(domain: string, service: string, serviceData: any): Promise<void> {
    try {
      const config = await getConfig();
      const authHeader = await getAuthHeader();
      
      // Use the updated getApiUrl method that handles proxy/direct URL logic
      const apiUrl = await getApiUrl();
      const serviceUrl = `${apiUrl}/services/${domain}/${service}`;
      

      
      const response = await fetchWithTimeout(serviceUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceData),
        timeout: 10000, // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Service call failed: ${response.status} ${response.statusText}`);
      }

      console.log(`✅ Successfully called ${domain}.${service} for`, serviceData.entity_id);
    } catch (error) {
      console.error(`❌ Failed to call ${domain}.${service}:`, error);
      throw error;
    }
  }

  // Refresh specific entity data from Home Assistant API
  async refreshEntityFromAPI(entityId: string): Promise<void> {
    try {

      
      // Use Home Assistant API via our backend service
      if (entityId.startsWith('climate.')) {
        const climateData = await homeAssistantApiService.fetchClimateState(entityId);
        if (climateData) {
          this.processEntityStates([climateData]);

          return;
        }
      } else if (entityId.startsWith('light.')) {
        const lightData = await homeAssistantApiService.fetchLightState(entityId);
        if (lightData) {
          this.processEntityStates([lightData]);

          return;
        }
      } else if (entityId.startsWith('binary_sensor.')) {
        const binaryData = await homeAssistantApiService.fetchBinarySensorState(entityId);
        if (binaryData) {
          this.processEntityStates([binaryData]);

          return;
        }
      }
      
      console.warn(`Unsupported entity type for refresh: ${entityId}`);
    } catch (error) {
      console.warn(`❌ Failed to refresh entity ${entityId}:`, error);
    }
  }

  // Method to simulate AC changes for testing
  simulateACChanges(): void {
    const acs = ['climate.office_ac', 'climate.living_room_ac'];
    
    const intervalId = setInterval(() => {
      const randomAC = acs[Math.floor(Math.random() * acs.length)];
      const changes = [
        { temperature: Math.floor(Math.random() * 10) + 18 }, // 18-27°C
        { fan_mode: ['low', 'mid', 'high'][Math.floor(Math.random() * 3)] },
        { hvac_mode: ['off', 'heat', 'cool', 'heat_cool'][Math.floor(Math.random() * 4)] }
      ];
      
      const randomChange = changes[Math.floor(Math.random() * changes.length)];
      this.updateClimateEntity(randomAC, randomChange);
    }, 3000); // Change every 3 seconds for demo
    
    // Clear interval after 30 seconds for demo
    setTimeout(() => clearInterval(intervalId), 30000);
  }

  // Method to test light controls (for demonstration)
  async testLightControls(): Promise<void> {
    const lights = ['light.boarda_buttonswitch_a', 'light.living_room', 'light.office_light_grill43'];
    
    console.log('🔆 Testing light controls with Home Assistant API...');
    
    for (const lightId of lights) {
      try {
        console.log(`Testing ${lightId}:`);
        
        // Turn on
        await this.controlLight(lightId, 'turn_on');
        console.log(`✅ ${lightId} turned on`);
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Turn off
        await this.controlLight(lightId, 'turn_off');
        console.log(`✅ ${lightId} turned off`);
        
        // Wait before next light
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Failed to control ${lightId}:`, error);
      }
    }
    
    console.log('🔆 Light control test completed');
  }
}

export const homeAssistantService = new HomeAssistantService();