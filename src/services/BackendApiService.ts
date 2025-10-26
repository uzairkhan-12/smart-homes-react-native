import { BinarySensorData, ClimateData, LightData, SensorData } from '../../types';
import { fetchWithTimeout } from '../utils/fetch';
import { BACKEND_CONFIG } from '../config/api';

export interface BackendResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class BackendApiService {
  private static instance: BackendApiService;
  
  private constructor() {}
  
  public static getInstance(): BackendApiService {
    if (!BackendApiService.instance) {
      BackendApiService.instance = new BackendApiService();
    }
    return BackendApiService.instance;
  }

  // Test backend connection
  async testConnection(): Promise<boolean> {
    try {
      console.log(`🔍 Testing backend connection to: ${BACKEND_CONFIG.BASE_URL}`);
      
      const response = await fetchWithTimeout(`${BACKEND_CONFIG.BASE_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      const success = response.ok;
      console.log(success ? '✅ Backend connection successful' : `❌ Backend connection failed: ${response.status}`);
      return success;
    } catch (error) {
      console.warn('❌ Backend connection test failed:', error);
      return false;
    }
  }

  // Get entity state from backend
  async getEntityState(entityId: string): Promise<any | null> {
    try {
      const url = `${BACKEND_CONFIG.BASE_URL}/api/ha/state/${entityId}`;
      console.log(`🔍 Fetching entity state: ${url}`);
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      if (response.ok) {
        const result: any = await response.json();
        if (result.success) {
          // Your backend returns the entity data directly in the response, not in a 'data' field
          // Format: {"success": true, "entity_id": "climate.office_ac", "state": "off"}
          return {
            entity_id: result.entity_id || entityId,
            state: result.state,
            attributes: result.attributes || {}
          };
        } else {
          console.warn(`Backend returned error for ${entityId}:`, result.message);
          return null;
        }
      } else {
        console.warn(`Failed to fetch entity ${entityId}: ${response.status} ${response.statusText}`);
        return null;
      }
    } catch (error) {
      console.warn(`Network error fetching entity ${entityId}:`, error);
      return null;
    }
  }

  // Toggle light via backend
  async toggleLight(entityId: string): Promise<boolean> {
    try {
      const url = `${BACKEND_CONFIG.BASE_URL}/api/ha/service/light_toggle`;
      console.log(`🔧 Toggling light via backend: ${url}`);
      
      // Get current state first to determine toggle direction
      const currentState = await this.getEntityState(entityId);
      const newState = currentState?.state === 'on' ? 'off' : 'on';
      
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_id: entityId,
          state: newState
        }),
        timeout: 10000,
      });

      if (response.ok) {
        const result: BackendResponse = await response.json();
        if (result.success) {
          console.log(`✅ Successfully toggled light: ${entityId}`);
          return true;
        } else {
          console.warn(`Backend error toggling light ${entityId}:`, result.message);
          return false;
        }
      } else {
        console.warn(`Failed to toggle light ${entityId}: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error toggling light ${entityId}:`, error);
      return false;
    }
  }

  // Control light with specific action via backend
  async controlLight(entityId: string, action: 'turn_on' | 'turn_off', options?: {
    brightness?: number;
    rgb_color?: [number, number, number];
    color_temp?: number;
  }): Promise<boolean> {
    try {
      // Use the light_toggle endpoint with explicit state
      const url = `${BACKEND_CONFIG.BASE_URL}/api/ha/service/light_toggle`;
      console.log(`🔧 Controlling light via backend: ${url}`);
      
      const state = action === 'turn_on' ? 'on' : 'off';
      
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entity_id: entityId,
          state: state
        }),
        timeout: 10000,
      });

      if (response.ok) {
        const result: BackendResponse = await response.json();
        if (result.success) {
          console.log(`✅ Successfully controlled light: ${entityId} -> ${action}`);
          return true;
        } else {
          console.warn(`Backend error controlling light ${entityId}:`, result.message);
          return false;
        }
      } else {
        console.warn(`Failed to control light ${entityId}: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error controlling light ${entityId}:`, error);
      return false;
    }
  }

  // Control climate entity via backend (not implemented - use direct HA API)
  async controlClimate(entityId: string, updates: {
    temperature?: number;
    fan_mode?: string;
    hvac_mode?: string;
  }): Promise<boolean> {
    // Climate control not implemented in backend - return false to trigger fallback
    console.log(`⚠️ Climate control not implemented in backend for ${entityId}, will use direct HA API`);
    return false;
  }

  // Helper method to call climate services (disabled - not implemented in backend)
  private async callClimateService(entityId: string, service: string, serviceData: any): Promise<boolean> {
    console.log(`⚠️ Climate service ${service} not implemented in backend, skipping`);
    return false;
  }

  // Get dashboard data from backend
  async getDashboardData(): Promise<any | null> {
    try {
      const url = `${BACKEND_CONFIG.BASE_URL}/api/dashboard`;
      console.log(`🔍 Fetching dashboard data: ${url}`);
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      if (response.ok) {
        const result: BackendResponse = await response.json();
        if (result.success) {
          return result.data;
        } else {
          console.warn(`Backend returned error for dashboard data:`, result.message);
          return null;
        }
      } else {
        console.warn(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`);
        return null;
      }
    } catch (error) {
      console.warn(`Network error fetching dashboard data:`, error);
      return null;
    }
  }

  // Get all entities from backend
  async getAllEntities(): Promise<any | null> {
    try {
      const url = `${BACKEND_CONFIG.BASE_URL}/api/entities`;
      console.log(`🔍 Fetching all entities: ${url}`);
      
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      if (response.ok) {
        const result: BackendResponse = await response.json();
        if (result.success) {
          return result.data;
        } else {
          console.warn(`Backend returned error for entities:`, result.message);
          return null;
        }
      } else {
        console.warn(`Failed to fetch entities: ${response.status} ${response.statusText}`);
        return null;
      }
    } catch (error) {
      console.warn(`Network error fetching entities:`, error);
      return null;
    }
  }

  // Fetch multiple entity states in parallel
  async fetchMultipleEntityStates(entityIds: string[]): Promise<{ [entityId: string]: any }> {
    const promises = entityIds.map(async (entityId) => {
      const state = await this.getEntityState(entityId);
      return { entityId, state };
    });

    const results = await Promise.all(promises);
    const statesMap: { [entityId: string]: any } = {};

    results.forEach(({ entityId, state }) => {
      if (state) {
        statesMap[entityId] = state;
      }
    });

    return statesMap;
  }

  // Convert backend response to our internal format
  private convertBackendStateToInternalFormat(backendState: any): any {
    // Handle the backend response format: {"success": true, "entity_id": "...", "state": "off"}
    return {
      entity_id: backendState.entity_id,
      old_state: backendState.state,
      new_state: backendState.state,
      user_id: null, // Backend doesn't provide user context
      timestamp: new Date().toISOString(), // Use current time since backend doesn't provide timestamp
      attributes: backendState.attributes || {}
    };
  }

  // Fetch configured entity states (similar to HomeAssistantApiService)
  async fetchConfiguredEntityStates(entityIds: string[]): Promise<{
    binarySensorData: { [key: string]: BinarySensorData };
    climateData: { [key: string]: ClimateData };
    lightData: { [key: string]: LightData };
    sensorData: { [key: string]: SensorData };
  }> {
    console.log('🔄 Fetching initial states from backend for entities:', entityIds);
    
    const backendStates = await this.fetchMultipleEntityStates(entityIds);
    
    const result = {
      binarySensorData: {} as { [key: string]: BinarySensorData },
      climateData: {} as { [key: string]: ClimateData },
      lightData: {} as { [key: string]: LightData },
      sensorData: {} as { [key: string]: SensorData }
    };

    Object.entries(backendStates).forEach(([entityId, backendState]) => {
      const internalState = this.convertBackendStateToInternalFormat(backendState);
      
      if (entityId.startsWith('binary_sensor.')) {
        result.binarySensorData[entityId] = internalState as BinarySensorData;
      } else if (entityId.startsWith('climate.')) {
        result.climateData[entityId] = internalState as ClimateData;
      } else if (entityId.startsWith('light.')) {
        result.lightData[entityId] = internalState as LightData;
      } else if (entityId.startsWith('sensor.')) {
        result.sensorData[entityId] = internalState as SensorData;
      }
    });

    console.log('✅ Fetched initial states from backend:', {
      binarySensors: Object.keys(result.binarySensorData).length,
      climateDevices: Object.keys(result.climateData).length,
      lights: Object.keys(result.lightData).length,
      sensors: Object.keys(result.sensorData).length
    });

    return result;
  }
}

export const backendApiService = BackendApiService.getInstance();