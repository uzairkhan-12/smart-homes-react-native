import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CONFIG, ConfigType } from '../config/default-config';

class DynamicConfigService {
  private static instance: DynamicConfigService;
  private static readonly STORAGE_KEY = '@smart_home_config';
  private configCache: ConfigType | null = null;
  private listeners: Array<(config: ConfigType) => void> = [];

  private constructor() {}

  public static getInstance(): DynamicConfigService {
    if (!DynamicConfigService.instance) {
      DynamicConfigService.instance = new DynamicConfigService();
    }
    return DynamicConfigService.instance;
  }

  /**
   * Get current configuration, using cache if available
   */
  async getConfig(): Promise<ConfigType> {
    if (this.configCache) {
      console.log('📋 Using cached config');
      return this.configCache;
    }

    try {
      console.log('🔄 Loading config from AsyncStorage...');
      const storedConfig = await AsyncStorage.getItem(DynamicConfigService.STORAGE_KEY);
      
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        console.log('✅ Config loaded from storage:', parsedConfig);
        
        // Ensure API_URL is derived from BASE_URL
        if (parsedConfig.HA_Config && parsedConfig.HA_Config.BASE_URL) {
          parsedConfig.HA_Config.API_URL = `${parsedConfig.HA_Config.BASE_URL}/api`;
        }
        
        this.configCache = parsedConfig;
        return parsedConfig;
      } else {
        console.log('📄 No stored config found, using defaults');
        this.configCache = { ...DEFAULT_CONFIG };
        return this.configCache;
      }
    } catch (error) {
      console.error('❌ Error loading config:', error);
      this.configCache = { ...DEFAULT_CONFIG };
      return this.configCache;
    }
  }

  /**
   * Update configuration and save to AsyncStorage
   */
  async updateConfig(updates: Partial<ConfigType>): Promise<void> {
    try {
      const currentConfig = await this.getConfig();
      const newConfig = this.deepMerge(currentConfig, updates);
      
      await this.saveConfig(newConfig);
      this.configCache = newConfig;
      
      // Notify listeners
      this.notifyListeners(newConfig);
      
      console.log('✅ Configuration updated successfully');
    } catch (error) {
      console.error('❌ Error updating configuration:', error);
      throw error;
    }
  }

  /**
   * Update base URL configuration
   */
  async updateBaseUrl(baseUrl: string): Promise<void> {
    const config = await this.getConfig();
    await this.updateConfig({ 
      HA_Config: { 
        ...config.HA_Config, 
        BASE_URL: baseUrl,
        API_URL: `${baseUrl}/api`
      } 
    });
  }

  /**
   * Update Home Assistant token
   */
  async updateToken(token: string): Promise<void> {
    const config = await this.getConfig();
    await this.updateConfig({ 
      HA_Config: { 
        ...config.HA_Config, 
        TOKEN: token 
      } 
    });
  }

  /**
   * Update WebSocket URL
   */
  async updateWebSocketUrl(websocketUrl: string): Promise<void> {
    const config = await this.getConfig();
    await this.updateConfig({ 
      HA_Config: { 
        ...config.HA_Config, 
        WEBSOCKET_URL: websocketUrl 
      } 
    });
  }

  /**
   * Reset configuration to defaults
   */
  async resetToDefaults(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DynamicConfigService.STORAGE_KEY);
      this.configCache = { ...DEFAULT_CONFIG };
      this.notifyListeners(this.configCache);
      console.log('✅ Configuration reset to defaults');
    } catch (error) {
      console.error('❌ Error resetting configuration:', error);
      throw error;
    }
  }

  /**
   * Clear cache and force reload from AsyncStorage (for debugging)
   */
  async clearCacheAndReload(): Promise<ConfigType> {
    console.log('🔄 Clearing config cache and reloading...');
    this.configCache = null;
    return await this.getConfig();
  }

  /**
   * Get API URL (derived from base URL)
   */
  async getApiUrl(): Promise<string> {
    const config = await this.getConfig();
    return config.HA_Config.API_URL;
  }

  /**
   * Get Home Assistant base URL
   */
  async getBaseUrl(): Promise<string> {
    const config = await this.getConfig();
    return config.HA_Config.BASE_URL;
  }

  /**
   * Get current WebSocket URL
   */
  async getWebSocketUrl(): Promise<string> {
    const config = await this.getConfig();
    console.log('🔍 DynamicConfigService.getWebSocketUrl() called');
    console.log('📋 Current config cache:', this.configCache);
    console.log('🔗 Returning WebSocket URL:', config.HA_Config.WEBSOCKET_URL);
    return config.HA_Config.WEBSOCKET_URL;
  }

  /**
   * Get Home Assistant token
   */
  async getToken(): Promise<string> {
    const config = await this.getConfig();
    return config.HA_Config.TOKEN;
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(listener: (config: ConfigType) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get configuration for display/editing
   */
  async getEditableConfig(): Promise<{
    haBaseUrl: string;
    haToken: string;
    websocketUrl: string;
  }> {
    const config = await this.getConfig();
    return {
      haBaseUrl: config.HA_Config.BASE_URL,
      haToken: config.HA_Config.TOKEN,
      websocketUrl: config.HA_Config.WEBSOCKET_URL,
    };
  }

  /**
   * Update configuration from editable form data
   */
  async updateFromEditableConfig(editableConfig: {
    haBaseUrl?: string;
    haToken?: string;
    websocketUrl?: string;
  }): Promise<void> {
    const config = await this.getConfig();
    const updatedHAConfig = { ...config.HA_Config };

    if (editableConfig.haBaseUrl) {
      updatedHAConfig.BASE_URL = editableConfig.haBaseUrl;
      updatedHAConfig.API_URL = `${editableConfig.haBaseUrl}/api`;
    }

    if (editableConfig.haToken) {
      updatedHAConfig.TOKEN = editableConfig.haToken;
    }

    if (editableConfig.websocketUrl) {
      updatedHAConfig.WEBSOCKET_URL = editableConfig.websocketUrl;
    }

    await this.updateConfig({ HA_Config: updatedHAConfig });
  }

  // Private helper methods
  private async saveConfig(config: ConfigType): Promise<void> {
    await AsyncStorage.setItem(DynamicConfigService.STORAGE_KEY, JSON.stringify(config));
  }

  private mergeWithDefaults(stored: any): ConfigType {
    return this.deepMerge(DEFAULT_CONFIG, stored);
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private notifyListeners(config: ConfigType): void {
    this.listeners.forEach(listener => {
      try {
        listener(config);
      } catch (error) {
        console.error('Error in config change listener:', error);
      }
    });
  }
}

// Export singleton instance
export const dynamicConfigService = DynamicConfigService.getInstance();
export type { ConfigType };