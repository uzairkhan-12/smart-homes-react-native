import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { dynamicConfigService, ConfigType } from '../src/services/DynamicConfigService';

interface ConfigViewerProps {
  visible?: boolean;
}

export const ConfigViewer: React.FC<ConfigViewerProps> = ({ visible = true }) => {
  const [config, setConfig] = useState<ConfigType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const currentConfig = await dynamicConfigService.getConfig();
      setConfig(currentConfig);
    } catch (error) {
      console.error('Failed to load config:', error);
      Alert.alert('Error', 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const testUpdateConfig = async () => {
    try {
      // Example: Update HA base URL
      await dynamicConfigService.updateBaseUrl('https://new-ha-url.com');
      
      Alert.alert('Success', 'Configuration updated successfully!');
      await loadConfig(); // Reload to show changes
    } catch (error) {
      console.error('Failed to update config:', error);
      Alert.alert('Error', 'Failed to update configuration');
    }
  };

  const resetConfig = async () => {
    try {
      await dynamicConfigService.resetToDefaults();
      Alert.alert('Success', 'Configuration reset to defaults!');
      await loadConfig(); // Reload to show changes
    } catch (error) {
      console.error('Failed to reset config:', error);
      Alert.alert('Error', 'Failed to reset configuration');
    }
  };

  if (!visible || loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>
          {loading ? 'Loading configuration...' : 'Configuration viewer hidden'}
        </Text>
      </View>
    );
  }

  if (!config) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load configuration</Text>
        <TouchableOpacity style={styles.button} onPress={loadConfig}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Current Configuration</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>HA_Config</Text>
        <Text style={styles.configText}>Base URL: {config.HA_Config.BASE_URL}</Text>
        <Text style={styles.configText}>API URL: {config.HA_Config.API_URL}</Text>
        <Text style={styles.configText}>WebSocket: {config.HA_Config.WEBSOCKET_URL}</Text>
        <Text style={styles.configText}>
          Token: {config.HA_Config.TOKEN.substring(0, 20)}...
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testUpdateConfig}>
          <Text style={styles.buttonText}>Test Update</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={resetConfig}>
          <Text style={styles.buttonText}>Reset to Defaults</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={loadConfig}>
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  configText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  resetButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    color: '#FF3B30',
    fontSize: 16,
    marginBottom: 16,
  },
});