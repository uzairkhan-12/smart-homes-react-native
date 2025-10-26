import AsyncStorage from '@react-native-async-storage/async-storage';
import { HA_DIRECT_CONFIG } from '../config/api';
import { fetchWithTimeout } from '../utils/fetch';

export interface HomeAssistantConfig {
  baseUrl: string;
  token: string;
  websocketUrl: string;
  useProxy: boolean;
}

class HomeAssistantConfigService {
  private static instance: HomeAssistantConfigService;
  private static readonly CONFIG_KEY = 'home_assistant_config';
  
  // Default configuration - using direct Home Assistant API (no proxy)
  private defaultConfig: HomeAssistantConfig = {
    baseUrl: HA_DIRECT_CONFIG.API_URL, // Direct HA API
    token: HA_DIRECT_CONFIG.TOKEN, // Use token from config
    websocketUrl: 'ws://192.168.100.95:3040/api/ws/entities_live',
    useProxy: false // No proxy needed with backend
  };

  private constructor() {}

  public static getInstance(): HomeAssistantConfigService {
    if (!HomeAssistantConfigService.instance) {
      HomeAssistantConfigService.instance = new HomeAssistantConfigService();
    }
    return HomeAssistantConfigService.instance;
  }

  // Get current configuration
  async getConfig(): Promise<HomeAssistantConfig> {
    try {
      const stored = await AsyncStorage.getItem(HomeAssistantConfigService.CONFIG_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        return { ...this.defaultConfig, ...config };
      }
      return this.defaultConfig;
    } catch (error) {
      console.warn('Failed to load Home Assistant config:', error);
      return this.defaultConfig;
    }
  }

  // Save configuration
  async saveConfig(config: Partial<HomeAssistantConfig>): Promise<void> {
    try {
      const currentConfig = await this.getConfig();
      const newConfig = { ...currentConfig, ...config };
      await AsyncStorage.setItem(
        HomeAssistantConfigService.CONFIG_KEY,
        JSON.stringify(newConfig)
      );
      console.log('Home Assistant config saved successfully');
    } catch (error) {
      console.error('Failed to save Home Assistant config:', error);
      throw error;
    }
  }

  // Update token
  async setToken(token: string): Promise<void> {
    await this.saveConfig({ token });
  }

  // Update base URL
  async setBaseUrl(baseUrl: string): Promise<void> {
    await this.saveConfig({ baseUrl });
  }

  // Update WebSocket URL
  async setWebSocketUrl(websocketUrl: string): Promise<void> {
    await this.saveConfig({ websocketUrl });
  }

  // Get API URL
  async getApiUrl(): Promise<string> {
    const config = await this.getConfig();
    // If using proxy, return the base URL as it already includes the /ha-api path
    // Otherwise, return the base URL directly (it should already include /api)
    return config.baseUrl;
  }

  // Get WebSocket URL
  async getWebSocketUrl(): Promise<string> {
    const config = await this.getConfig();
    return config.websocketUrl;
  }

  // Get authorization header
  async getAuthHeader(): Promise<string> {
    const config = await this.getConfig();
    return `Bearer ${config.token}`;
  }

  // Check if configuration is complete
  async isConfigured(): Promise<boolean> {
    const config = await this.getConfig();
    return config.token.trim() !== '' && config.baseUrl.trim() !== '';
  }

  // Reset to defaults
  async resetConfig(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HomeAssistantConfigService.CONFIG_KEY);
      console.log('Home Assistant config reset to defaults');
    } catch (error) {
      console.error('Failed to reset Home Assistant config:', error);
      throw error;
    }
  }

  // Test connection with current config
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const config = await this.getConfig();
      
      if (!config.token) {
        return { success: false, error: 'No token configured' };
      }

      // For proxy, test the root endpoint directly
      const testUrl = config.useProxy ? config.baseUrl : `${config.baseUrl}/api`;
      
      console.log(`Testing connection to: ${testUrl}`);

      const response = await fetchWithTimeout(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000, // 5 second timeout
      });

      if (response.ok) {
        console.log('✅ Home Assistant connection successful');
        return { success: true };
      } else {
        const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        console.warn('❌ Home Assistant connection failed:', errorMsg);
        return { 
          success: false, 
          error: errorMsg
        };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.warn('❌ Home Assistant connection error:', errorMsg);
      
      // Provide helpful error messages for common issues
      if (errorMsg.includes('fetch')) {
        return {
          success: false,
          error: 'Network error - Check if CORS proxy is running (npm run cors-proxy)'
        };
      }
      
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  // Get connection status
  async getConnectionStatus(): Promise<{
    configured: boolean;
    connected: boolean;
    error?: string;
  }> {
    const configured = await this.isConfigured();
    
    if (!configured) {
      return { configured: false, connected: false, error: 'Not configured' };
    }

    const testResult = await this.testConnection();
    return {
      configured: true,
      connected: testResult.success,
      error: testResult.error
    };
  }
}

export const homeAssistantConfigService = HomeAssistantConfigService.getInstance();