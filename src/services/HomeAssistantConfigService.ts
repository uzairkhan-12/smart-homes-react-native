import AsyncStorage from '@react-native-async-storage/async-storage';
import { HA_DIRECT_CONFIG } from '../config/api';

export interface HomeAssistantConfig {
  httpApiUrl: string;      // HTTP API endpoint for REST calls
  websocketUrl: string;    // WebSocket endpoint for real-time updates  
  token: string;           // Long-lived access token
  useProxy: boolean;       // Whether to use proxy server
  // Legacy fields for backward compatibility
  baseUrl?: string;
}

class HomeAssistantConfigService {
  private static instance: HomeAssistantConfigService;
  private static readonly CONFIG_KEY = 'home_assistant_config';
  
  // Default configuration - using direct Home Assistant API (no proxy)
  private defaultConfig: HomeAssistantConfig = {
    httpApiUrl: HA_DIRECT_CONFIG.API_URL, // Direct HA HTTP API
    websocketUrl: 'ws://192.168.100.95:3040/api/ws/entities_live', // WebSocket endpoint
    token: HA_DIRECT_CONFIG.TOKEN, // Use token from config
    useProxy: false, // No proxy needed with backend
    baseUrl: HA_DIRECT_CONFIG.API_URL // Legacy compatibility
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

  // Update HTTP API URL
  async setHttpApiUrl(httpApiUrl: string): Promise<void> {
    await this.saveConfig({ httpApiUrl });
  }

  // Update base URL (legacy method for backward compatibility)
  async setBaseUrl(baseUrl: string): Promise<void> {
    await this.saveConfig({ httpApiUrl: baseUrl, baseUrl });
  }

  // Update WebSocket URL
  async setWebSocketUrl(websocketUrl: string): Promise<void> {
    await this.saveConfig({ websocketUrl });
  }

  // Get HTTP API URL
  async getHttpApiUrl(): Promise<string> {
    const config = await this.getConfig();
    return config.httpApiUrl;
  }

  // Get API URL (legacy method for backward compatibility)
  async getApiUrl(): Promise<string> {
    const config = await this.getConfig();
    // If using proxy, return the base URL as it already includes the /ha-api path
    // Otherwise, return the HTTP API URL directly
    return config.httpApiUrl || config.baseUrl || this.defaultConfig.httpApiUrl;
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
    return config.token.trim() !== '' && config.httpApiUrl.trim() !== '';
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

    if (!config.websocketUrl) {
      return { success: false, error: 'No WebSocket URL configured' };
    }
    if (!config.token) {
      return { success: false, error: 'No token configured' };
    }

    console.log(`🔌 Testing WebSocket connection to: ${config.websocketUrl}`);

    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(config.websocketUrl);

        const timeout = setTimeout(() => {
          ws.close();
          resolve({ success: false, error: 'Connection timeout (5s)' });
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          console.log('✅ WebSocket connection successful');
          ws.close();
          resolve({ success: true });
        };

        ws.onerror = (err) => {
          clearTimeout(timeout);
          console.warn('❌ WebSocket connection failed:', err);
          resolve({ success: false, error: 'WebSocket error' });
        };

        ws.onclose = (event) => {
          if (!event.wasClean) {
            resolve({
              success: false,
              error: `WebSocket closed unexpectedly (code ${event.code})`,
            });
          }
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.warn('❌ WebSocket connection error:', msg);
        resolve({ success: false, error: msg });
      }
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
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