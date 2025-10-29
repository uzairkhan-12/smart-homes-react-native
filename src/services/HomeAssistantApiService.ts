import { BinarySensorData, ClimateData, LightData, SensorData } from '../../types';
import { fetchWithTimeout } from '../utils/fetch';
import { homeAssistantConfigService } from './HomeAssistantConfigService';

export interface HAApiEntityState {
  entity_id: string;
  state: string;
  attributes: any;
  last_changed: string;
  last_reported: string;
  last_updated: string;
  context: {
    id: string;
    parent_id: string | null;
    user_id: string | null;
  };
}

export interface HAHistoryState {
  entity_id: string;
  state: string;
  attributes: any;
  last_changed: string;
  last_updated: string;
}

export interface HistoricalAverage {
  temperature: number;
  humidity: number;
  temperatureCount: number;
  humidityCount: number;
}

export class HomeAssistantApiService {
  private static instance: HomeAssistantApiService;
  
  private constructor() {}
  
  public static getInstance(): HomeAssistantApiService {
    if (!HomeAssistantApiService.instance) {
      HomeAssistantApiService.instance = new HomeAssistantApiService();
    }
    return HomeAssistantApiService.instance;
  }

  // Generic method to fetch entity state
  private async fetchEntityState(entityId: string): Promise<HAApiEntityState | null> {
    try {
      const apiUrl = await homeAssistantConfigService.getApiUrl();
      const authHeader = await homeAssistantConfigService.getAuthHeader();
      
      const response = await fetchWithTimeout(`${apiUrl}/states/${entityId}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      if (response.ok) {
        const data: HAApiEntityState = await response.json();
        return data;
      } else {
        console.warn(`Failed to fetch entity ${entityId}: ${response.status} ${response.statusText}`);
        return null;
      }
    } catch (error) {
      // Handle network errors gracefully (equivalent to CORS handling)
      if (error instanceof Error) {
        console.warn(`Network error fetching entity ${entityId}:`, error.message);
      } else {
        console.warn(`Unknown error fetching entity ${entityId}:`, error);
      }
      return null;
    }
  }

  // Fetch multiple entities in parallel
  private async fetchMultipleEntityStates(entityIds: string[]): Promise<{ [entityId: string]: HAApiEntityState }> {

    
    const promises = entityIds.map(async (entityId) => {
      const state = await this.fetchEntityState(entityId);
      return { entityId, state };
    });

    const results = await Promise.all(promises);
    const statesMap: { [entityId: string]: HAApiEntityState } = {};
    
    let successCount = 0;
    let failureCount = 0;

    results.forEach(({ entityId, state }) => {
      if (state) {
        statesMap[entityId] = state;
        successCount++;

      } else {
        failureCount++;

      }
    });


    return statesMap;
  }

  // Convert API response to our internal format
  private convertApiStateToInternalFormat(apiState: HAApiEntityState): any {
    return {
      entity_id: apiState.entity_id,
      old_state: apiState.state, // For initial state, old and new are the same
      new_state: apiState.state,
      user_id: apiState.context.user_id,
      timestamp: apiState.last_updated,
      attributes: apiState.attributes
    };
  }

  // Fetch all configured entity states
  async fetchConfiguredEntityStates(entityIds: string[]): Promise<{
    binarySensorData: { [key: string]: BinarySensorData };
    climateData: { [key: string]: ClimateData };
    lightData: { [key: string]: LightData };
    sensorData: { [key: string]: SensorData };
  }> {

    
    const apiStates = await this.fetchMultipleEntityStates(entityIds);
    
    const result = {
      binarySensorData: {} as { [key: string]: BinarySensorData },
      climateData: {} as { [key: string]: ClimateData },
      lightData: {} as { [key: string]: LightData },
      sensorData: {} as { [key: string]: SensorData }
    };

    Object.entries(apiStates).forEach(([entityId, apiState]) => {
      const internalState = this.convertApiStateToInternalFormat(apiState);
      
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



    return result;
  }

  // Fetch specific light state with detailed attributes
  async fetchLightState(entityId: string): Promise<LightData | null> {
    try {
      const apiState = await this.fetchEntityState(entityId);
      if (apiState) {
        return this.convertApiStateToInternalFormat(apiState) as LightData;
      }
      return null;
    } catch (error) {
      console.warn(`Error fetching light state for ${entityId}:`, error);
      return null;
    }
  }

  // Fetch specific climate state with detailed attributes
  async fetchClimateState(entityId: string): Promise<ClimateData | null> {
    try {
      const apiState = await this.fetchEntityState(entityId);
      if (apiState) {
        return this.convertApiStateToInternalFormat(apiState) as ClimateData;
      }
      return null;
    } catch (error) {
      console.warn(`Error fetching climate state for ${entityId}:`, error);
      return null;
    }
  }

  // Fetch specific binary sensor state
  async fetchBinarySensorState(entityId: string): Promise<BinarySensorData | null> {
    try {
      const apiState = await this.fetchEntityState(entityId);
      if (apiState) {
        return this.convertApiStateToInternalFormat(apiState) as BinarySensorData;
      }
      return null;
    } catch (error) {
      console.warn(`Error fetching binary sensor state for ${entityId}:`, error);
      return null;
    }
  }

  // Fetch all states (if needed for debugging)
  async fetchAllStates(): Promise<HAApiEntityState[]> {
    try {
      const apiUrl = await homeAssistantConfigService.getApiUrl();
      const authHeader = await homeAssistantConfigService.getAuthHeader();
      
      const response = await fetchWithTimeout(`${apiUrl}/states`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        timeout: 15000, // 15 second timeout for all states
      });

      if (response.ok) {
        const data: HAApiEntityState[] = await response.json();

        return data;
      } else {
        console.warn(`Failed to fetch all states: ${response.status} ${response.statusText}`);
        return [];
      }
    } catch (error) {
      console.warn('Error fetching all states:', error);
      return [];
    }
  }

  // Test connection to Home Assistant
  async testConnection(): Promise<boolean> {
    try {
      const config = await homeAssistantConfigService.getConfig();
      const authHeader = await homeAssistantConfigService.getAuthHeader();
      
      // Use the updated method that handles proxy/direct URL logic
      const apiUrl = await homeAssistantConfigService.getApiUrl();
      

      
      const response = await fetchWithTimeout(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        timeout: 5000, // 5 second timeout
      });

      const success = response.ok;

      return success;
    } catch (error) {
      console.warn('❌ Home Assistant API connection test failed:', error);
      return false;
    }
  }

  // Fetch historical data for an entity
  async fetchEntityHistory(entityId: string, startTime: string): Promise<HAHistoryState[]> {
    try {
      const authHeader = await homeAssistantConfigService.getAuthHeader();
      const apiUrl = await homeAssistantConfigService.getApiUrl();
      
      const historyUrl = `${apiUrl}/history/period/${startTime}?filter_entity_id=${entityId}`;
      
      const response = await fetchWithTimeout(historyUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout for history
      });

      if (response.ok) {
        const data: HAHistoryState[][] = await response.json();
        // History API returns array of arrays, we want the first array (our entity)
        return data[0] || [];
      } else {
        console.warn(`Failed to fetch history for ${entityId}: ${response.status} ${response.statusText}`);
        return [];
      }
    } catch (error) {
      console.warn(`Error fetching history for ${entityId}:`, error);
      return [];
    }
  }

  // Calculate 12-hour averages for temperature and humidity sensors
  async getTwelveHourAverages(temperatureSensors: any[], humiditySensors: any[]): Promise<HistoricalAverage> {
    try {
      // Calculate start time (12 hours ago)
      const startTime = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      
      let tempSum = 0;
      let tempCount = 0;
      let humiditySum = 0;
      let humidityCount = 0;

      // Fetch temperature history
      for (const sensor of temperatureSensors) {
        if (sensor.entity && sensor.entity.trim() !== '') {
          console.log(`📊 Fetching 12h history for temperature sensor: ${sensor.entity}`);
          const history = await this.fetchEntityHistory(sensor.entity, startTime);
          
          for (const state of history) {
            const value = parseFloat(state.state);
            if (!isNaN(value)) {
              tempSum += value;
              tempCount++;
            }
          }
        }
      }

      // Fetch humidity history
      for (const sensor of humiditySensors) {
        if (sensor.entity && sensor.entity.trim() !== '') {
          console.log(`📊 Fetching 12h history for humidity sensor: ${sensor.entity}`);
          const history = await this.fetchEntityHistory(sensor.entity, startTime);
          
          for (const state of history) {
            const value = parseFloat(state.state);
            if (!isNaN(value)) {
              humiditySum += value;
              humidityCount++;
            }
          }
        }
      }

      // Also check temp_humidity sensors for backward compatibility
      console.log(`📊 Processed ${tempCount} temperature readings and ${humidityCount} humidity readings from last 12 hours`);

      return {
        temperature: tempCount > 0 ? tempSum / tempCount : 0,
        humidity: humidityCount > 0 ? humiditySum / humidityCount : 0,
        temperatureCount: tempCount,
        humidityCount: humidityCount
      };
    } catch (error) {
      console.error('Error calculating 12-hour averages:', error);
      return {
        temperature: 0,
        humidity: 0,
        temperatureCount: 0,
        humidityCount: 0
      };
    }
  }
}

export const homeAssistantApiService = HomeAssistantApiService.getInstance();