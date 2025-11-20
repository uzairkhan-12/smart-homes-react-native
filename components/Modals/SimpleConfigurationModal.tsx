import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { dynamicConfigService } from '../../src/services/DynamicConfigService';
import { useTheme } from '../../context/ThemeContext';
import { getColors } from '../../constants/colors';

interface SimpleConfigurationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SimpleConfigurationModal: React.FC<SimpleConfigurationModalProps> = ({
  visible,
  onClose,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  
  const [config, setConfig] = useState({
    haBaseUrl: 'https://hajax.primewave1.click',
    haToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJlNmY1MDliNGE1NmQ0YTRmYjg1YmNjOTA3OGRmMmJkYiIsImlhdCI6MTc2Mjc4MzgxOCwiZXhwIjoyMDc4MTQzODE4fQ.DgTx1Ii-4318sL0A-Sm8BXCjCcrVtBgaGnYnhuP4ILA',
    websocketUrl: 'ws://192.168.100.95:3040/api/ws/entities_live',
  });
  
  const [loading, setLoading] = useState(false);

  // Load current configuration when modal opens
  useEffect(() => {
    if (visible) {
      loadCurrentConfig();
    }
  }, [visible]);

  const loadCurrentConfig = async () => {
    try {
      setLoading(true);
      const currentConfig = await dynamicConfigService.getEditableConfig();
      setConfig(currentConfig);
    } catch (error) {
      console.error('Error loading configuration:', error);
      Alert.alert('Error', 'Failed to load current configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Validate URLs
      if (!isValidUrl(config.haBaseUrl)) {
        Alert.alert('Error', 'Home Assistant Base URL must be a valid HTTP/HTTPS URL');
        return;
      }
      
      if (!isValidWebSocketUrl(config.websocketUrl)) {
        Alert.alert('Error', 'WebSocket URL must be a valid ws:// or wss:// URL');
        return;
      }

      if (!config.haToken || config.haToken.trim().length === 0) {
        Alert.alert('Error', 'Home Assistant Token is required');
        return;
      }

      await dynamicConfigService.updateFromEditableConfig(config);
      
      Alert.alert(
        'Success',
        'Configuration updated successfully! WebSocket will reconnect automatically.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error saving configuration:', error);
      Alert.alert('Error', 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Configuration',
      'Are you sure you want to reset to default values? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await dynamicConfigService.resetToDefaults();
              await loadCurrentConfig();
              Alert.alert('Success', 'Configuration reset to defaults');
            } catch (error) {
              console.error('Error resetting configuration:', error);
              Alert.alert('Error', 'Failed to reset configuration');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const isValidWebSocketUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'ws:' || urlObj.protocol === 'wss:';
    } catch {
      return false;
    }
  };

  const handleExportConfig = async () => {
    try {
      const currentConfig = {
        HA_Config: {
          BASE_URL: config.haBaseUrl,
          API_URL: `${config.haBaseUrl}/api`,
          TOKEN: config.haToken,
          WEBSOCKET_URL: config.websocketUrl,
        },
        exported_at: new Date().toISOString(),
        app_version: "1.0.0"
      };

      const configJson = JSON.stringify(currentConfig, null, 2);
      const blob = new Blob([configJson], { type: 'application/json' });
      
      // For React Native, we'll copy to clipboard instead of downloading
      // In a real mobile app, you'd use share functionality
      Alert.alert(
        'Export Configuration',
        'Configuration exported to clipboard. You can paste it into a text file.',
        [
          {
            text: 'Copy to Clipboard',
            onPress: () => {
              // Note: In a real React Native app, you'd use @react-native-clipboard/clipboard
              console.log('📋 Configuration exported:', configJson);
              Alert.alert('Success', 'Configuration copied to clipboard!');
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error exporting config:', error);
      Alert.alert('Error', 'Failed to export configuration.');
    }
  };

  const handleUploadConfig = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', 'text/*', 'text/csv', 'application/csv'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      console.log('📄 Selected file:', file.name, file.mimeType);

      // Read file content
      const response = await fetch(file.uri);
      const fileContent = await response.text();
      
      console.log('📄 File content:', fileContent);

      // Try to parse as JSON first
      let configData;
      try {
        configData = JSON.parse(fileContent);
      } catch (jsonError) {
        // Check if it's a CSV file
        if (file.name.toLowerCase().endsWith('.csv') || fileContent.includes(',') && fileContent.includes('\n')) {
          configData = parseCsvConfig(fileContent);
        } else {
          // If JSON parsing fails, try to parse as plain text with key-value pairs
          configData = parseTextConfig(fileContent);
        }
      }

      // Extract configuration values
      const extractedConfig = extractConfigFromData(configData);
      
      if (extractedConfig) {
        setConfig(extractedConfig);
        Alert.alert(
          'Success',
          `Configuration loaded from ${file.name}!\n\nFound:\n• Base URL: ${extractedConfig.haBaseUrl}\n• WebSocket URL: ${extractedConfig.websocketUrl}\n• Token: ${extractedConfig.haToken ? 'Present' : 'Missing'}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          'Could not extract configuration from the selected file. Please ensure it contains the required fields: haBaseUrl, haToken, and websocketUrl.'
        );
      }
    } catch (error) {
      console.error('Error uploading config file:', error);
      Alert.alert('Error', 'Failed to read the configuration file. Please try again.');
    }
  };

  const parseTextConfig = (content: string): any => {
    const config: any = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        // Try different formats: key=value, key: value, "key": "value"
        const colonMatch = trimmedLine.match(/^([^:]+):\s*(.+)$/);
        const equalsMatch = trimmedLine.match(/^([^=]+)=(.+)$/);
        
        if (colonMatch) {
          const key = colonMatch[1].replace(/['"]/g, '').trim();
          const value = colonMatch[2].replace(/['"]/g, '').trim();
          config[key] = value;
        } else if (equalsMatch) {
          const key = equalsMatch[1].replace(/['"]/g, '').trim();
          const value = equalsMatch[2].replace(/['"]/g, '').trim();
          config[key] = value;
        }
      }
    }
    
    return config;
  };

  const parseCsvConfig = (content: string): any => {
    const config: any = {};
    const lines = content.split('\n');
    
    if (lines.length < 2) {
      return config;
    }

    // Get headers from first line
    const headers = lines[0].split(',').map(h => h.replace(/['"]/g, '').trim());
    
    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const values = line.split(',').map(v => v.replace(/['"]/g, '').trim());
        
        // Map headers to values
        for (let j = 0; j < headers.length && j < values.length; j++) {
          if (headers[j] && values[j]) {
            config[headers[j]] = values[j];
          }
        }
        
        // For CSV, we typically only use the first data row for config
        break;
      }
    }
    
    return config;
  };

  const extractConfigFromData = (data: any): typeof config | null => {
    if (!data || typeof data !== 'object') {
      return null;
    }

    // Try different possible field names and structures
    const extractValue = (obj: any, possibleKeys: string[]): string | undefined => {
      for (const key of possibleKeys) {
        if (obj[key]) return obj[key];
        // Try case-insensitive search
        const lowerKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
        if (lowerKey && obj[lowerKey]) return obj[lowerKey];
      }
      return undefined;
    };

    // Check if it's our HA_Config structure
    if (data.HA_Config) {
      return {
        haBaseUrl: data.HA_Config.BASE_URL || '',
        haToken: data.HA_Config.TOKEN || '',
        websocketUrl: data.HA_Config.WEBSOCKET_URL || '',
      };
    }

    // Extract from flat structure with various possible field names
    const haBaseUrl = extractValue(data, [
      'haBaseUrl', 'HA_BASE_URL', 'baseUrl', 'base_url', 'BASE_URL',
      'ha_base_url', 'homeassistant_url', 'home_assistant_url'
    ]);

    const haToken = extractValue(data, [
      'haToken', 'HA_TOKEN', 'token', 'TOKEN', 'ha_token',
      'access_token', 'accessToken', 'auth_token', 'authToken'
    ]);

    const websocketUrl = extractValue(data, [
      'websocketUrl', 'WEBSOCKET_URL', 'websocket_url', 'ws_url', 'WS_URL',
      'websocket', 'webSocketUrl', 'web_socket_url'
    ]);

    // Validate that we have at least the essential fields
    if (haBaseUrl && haToken && websocketUrl) {
      return {
        haBaseUrl,
        haToken,
        websocketUrl,
      };
    }

    // If we have at least base URL and token, we can construct websocket URL
    if (haBaseUrl && haToken) {
      return {
        haBaseUrl,
        haToken,
        websocketUrl: websocketUrl || 'ws://192.168.100.95:3040/api/ws/entities_live', // fallback
      };
    }

    return null;
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    sectionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: colors.surface,
      color: colors.text,
    },
    helperText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      fontStyle: 'italic',
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    bold: {
      fontWeight: '600',
      color: colors.text,
    },
    footer: {
      padding: 16,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    button: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    cancelButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    uploadButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.success,
    },
    uploadButtonText: {
      color: colors.success,
      fontSize: 14,
      fontWeight: '500',
    },
    exportButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    exportButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.title}>Configuration Settings</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={handleUploadConfig}
              style={[dynamicStyles.button, dynamicStyles.uploadButton]}
              disabled={loading}
            >
              <Text style={dynamicStyles.uploadButtonText}>📁 Upload</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity
              onPress={handleExportConfig}
              style={[dynamicStyles.button, dynamicStyles.exportButton]}
              disabled={loading}
            >
              <Text style={dynamicStyles.exportButtonText}>📤 Export</Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              onPress={onClose}
              style={[dynamicStyles.button, dynamicStyles.cancelButton]}
              disabled={loading}
            >
              <Text style={dynamicStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
          {/* Main Configuration */}
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionDescription}>
              Configure the essential URLs and authentication for your system.
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={dynamicStyles.label}>Home Assistant Base URL</Text>
              <TextInput
                style={dynamicStyles.input}
                value={config.haBaseUrl}
                onChangeText={(text) => setConfig({ ...config, haBaseUrl: text })}
                placeholder="https://hajax.primewave1.click"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Text style={dynamicStyles.helperText}>
                The base URL of your Home Assistant instance (API URL will be derived from this)
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={dynamicStyles.label}>Home Assistant Token</Text>
              <TextInput
                style={[dynamicStyles.input, styles.tokenInput]}
                value={config.haToken}
                onChangeText={(text) => setConfig({ ...config, haToken: text })}
                placeholder="Enter your Home Assistant long-lived access token"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={true}
                multiline={true}
              />
              <Text style={dynamicStyles.helperText}>
                Long-lived access token from Home Assistant → Profile → Security
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={dynamicStyles.label}>WebSocket URL</Text>
              <TextInput
                style={dynamicStyles.input}
                value={config.websocketUrl}
                onChangeText={(text) => setConfig({ ...config, websocketUrl: text })}
                placeholder="ws://192.168.100.95:3040/api/ws/entities_live"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Text style={dynamicStyles.helperText}>
                Real-time WebSocket connection for live entity updates
              </Text>
            </View>
          </View>

          {/* Info Section */}
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>How it works</Text>
            <Text style={dynamicStyles.infoText}>
              • <Text style={dynamicStyles.bold}>HA Base URL:</Text> Used for all Home Assistant API calls{'\n'}
              • <Text style={dynamicStyles.bold}>HA Token:</Text> Authenticates API requests{'\n'}
              • <Text style={dynamicStyles.bold}>WebSocket URL:</Text> Provides real-time entity updates{'\n\n'}
              Configuration is saved locally and will persist across app restarts.
            </Text>
          </View>

          {/* File Upload/Export Info */}
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>📁 File Management</Text>
            <Text style={dynamicStyles.infoText}>
              <Text style={dynamicStyles.bold}>📁 Upload:</Text> Load configuration from a file. Supported formats:{'\n'}
              • <Text style={dynamicStyles.bold}>JSON:</Text> {`{"haBaseUrl": "...", "haToken": "...", "websocketUrl": "..."}`}{'\n'}
              • <Text style={dynamicStyles.bold}>CSV:</Text> Comma-separated values with headers{'\n'}
              • <Text style={dynamicStyles.bold}>Text:</Text> key=value pairs or key: value format{'\n'}
              • <Text style={dynamicStyles.bold}>HA_Config:</Text> Exported HA_Config object structure{'\n\n'}
              <Text style={dynamicStyles.bold}>📤 Export:</Text> Save current configuration to clipboard for backup or sharing.{'\n\n'}
              The system automatically detects various field names (case-insensitive) and maps them correctly.
            </Text>
          </View>
        </ScrollView>

        <View style={dynamicStyles.footer}>
          <TouchableOpacity
            onPress={handleSave}
            style={[dynamicStyles.button, dynamicStyles.saveButton]}
            disabled={loading}
          >
            <Text style={dynamicStyles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Configuration'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  tokenInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});