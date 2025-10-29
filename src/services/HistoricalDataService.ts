import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HistoricalReading {
  value: number;
  timestamp: string;
  entityId: string;
}

export interface HistoricalData {
  temperature: HistoricalReading[];
  humidity: HistoricalReading[];
}

const HISTORICAL_DATA_KEY = 'historical_sensor_data';
const MAX_READINGS_PER_TYPE = 288; // 12 hours * 24 readings per hour (every 2.5 minutes)
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

class HistoricalDataService {
  
  // Load historical data from storage
  async loadHistoricalData(): Promise<HistoricalData> {
    try {
      const jsonValue = await AsyncStorage.getItem(HISTORICAL_DATA_KEY);
      if (jsonValue != null) {
        const data = JSON.parse(jsonValue);
        // Clean old data on load
        return this.cleanOldData(data);
      } else {
        return { temperature: [], humidity: [] };
      }
    } catch (error) {
      console.error('Error loading historical data:', error);
      return { temperature: [], humidity: [] };
    }
  }

  // Save historical data to storage
  async saveHistoricalData(data: HistoricalData): Promise<void> {
    try {
      const jsonValue = JSON.stringify(data);
      await AsyncStorage.setItem(HISTORICAL_DATA_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving historical data:', error);
      throw error;
    }
  }

  // Add new sensor reading
  async addReading(type: 'temperature' | 'humidity', value: number, entityId: string, timestamp?: string): Promise<void> {
    try {
      const data = await this.loadHistoricalData();
      const readingTimestamp = timestamp || new Date().toISOString();
      
      const newReading: HistoricalReading = {
        value,
        timestamp: readingTimestamp,
        entityId
      };

      // Add to appropriate array
      data[type].push(newReading);
      
      // Sort by timestamp (newest first) and limit to max readings
      data[type].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      data[type] = data[type].slice(0, MAX_READINGS_PER_TYPE);
      
      // Clean old data (older than 12 hours)
      const cleanedData = this.cleanOldData(data);
      
      await this.saveHistoricalData(cleanedData);
    } catch (error) {
      console.error('Error adding reading:', error);
    }
  }

  // Remove readings older than 12 hours
  private cleanOldData(data: HistoricalData): HistoricalData {
    const twelveHoursAgo = new Date(Date.now() - TWELVE_HOURS_MS);
    
    return {
      temperature: data.temperature.filter(reading => 
        new Date(reading.timestamp) >= twelveHoursAgo
      ),
      humidity: data.humidity.filter(reading => 
        new Date(reading.timestamp) >= twelveHoursAgo
      )
    };
  }

  // Calculate 12-hour rolling average
  async getTwelveHourAverage(type: 'temperature' | 'humidity'): Promise<number> {
    try {
      const data = await this.loadHistoricalData();
      const readings = data[type];
      
      if (readings.length === 0) {
        return 0;
      }

      // Filter readings from last 12 hours
      const twelveHoursAgo = new Date(Date.now() - TWELVE_HOURS_MS);
      const recentReadings = readings.filter(reading => 
        new Date(reading.timestamp) >= twelveHoursAgo
      );

      if (recentReadings.length === 0) {
        return 0;
      }

      // Calculate average
      const sum = recentReadings.reduce((total, reading) => total + reading.value, 0);
      return sum / recentReadings.length;
    } catch (error) {
      console.error('Error calculating 12-hour average:', error);
      return 0;
    }
  }

  // Get both temperature and humidity 12-hour averages
  async getTwelveHourAverages(): Promise<{ temperature: number; humidity: number }> {
    try {
      const [temperature, humidity] = await Promise.all([
        this.getTwelveHourAverage('temperature'),
        this.getTwelveHourAverage('humidity')
      ]);

      return { temperature, humidity };
    } catch (error) {
      console.error('Error getting 12-hour averages:', error);
      return { temperature: 0, humidity: 0 };
    }
  }

  // Get readings count for debugging
  async getReadingsCount(): Promise<{ temperature: number; humidity: number }> {
    try {
      const data = await this.loadHistoricalData();
      return {
        temperature: data.temperature.length,
        humidity: data.humidity.length
      };
    } catch (error) {
      console.error('Error getting readings count:', error);
      return { temperature: 0, humidity: 0 };
    }
  }

  // Clear all historical data
  async clearHistoricalData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HISTORICAL_DATA_KEY);
    } catch (error) {
      console.error('Error clearing historical data:', error);
      throw error;
    }
  }

  // Get recent readings for debugging
  async getRecentReadings(type: 'temperature' | 'humidity', limit: number = 10): Promise<HistoricalReading[]> {
    try {
      const data = await this.loadHistoricalData();
      return data[type].slice(0, limit);
    } catch (error) {
      console.error('Error getting recent readings:', error);
      return [];
    }
  }

  // Process current sensor data to extract and store temperature/humidity readings
  async processSensorData(sensorData: { [key: string]: any }, temperatureSensors: any[], humiditySensors: any[]): Promise<void> {
    try {
      // Process temperature sensors
      for (const sensor of temperatureSensors) {
        if (sensor.entity && sensorData[sensor.entity]) {
          const data = sensorData[sensor.entity];
          const value = parseFloat(data.new_state);
          if (!isNaN(value)) {
            await this.addReading('temperature', value, sensor.entity, data.timestamp);
          }
        }
      }

      // Process humidity sensors
      for (const sensor of humiditySensors) {
        if (sensor.entity && sensorData[sensor.entity]) {
          const data = sensorData[sensor.entity];
          const value = parseFloat(data.new_state);
          if (!isNaN(value)) {
            await this.addReading('humidity', value, sensor.entity, data.timestamp);
          }
        }
      }

      // Also process old temp_humidity sensors for backward compatibility
      // (these would be detected by entity names containing 'temp' or 'humidity')
      for (const [entityId, data] of Object.entries(sensorData)) {
        if (entityId.includes('temp') && !entityId.includes('humidity')) {
          const value = parseFloat((data as any).new_state);
          if (!isNaN(value)) {
            await this.addReading('temperature', value, entityId, (data as any).timestamp);
          }
        } else if (entityId.includes('humidity')) {
          const value = parseFloat((data as any).new_state);
          if (!isNaN(value)) {
            await this.addReading('humidity', value, entityId, (data as any).timestamp);
          }
        }
      }
    } catch (error) {
      console.error('Error processing sensor data:', error);
    }
  }
}

export const historicalDataService = new HistoricalDataService();