import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { homeAssistantConfigService } from '../../src/services/HomeAssistantConfigService';

interface HomeAssistantConfigModalProps {
  visible: boolean;
  onClose: () => void;
}

const HomeAssistantConfigModal: React.FC<HomeAssistantConfigModalProps> = ({
  visible,
  onClose,
}) => {
  const { isDark: isDarkTheme } = useTheme();
  const [baseUrl, setBaseUrl] = useState('http://192.168.100.60:8123');
  const [token, setToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCurrentConfig();
    }
  }, [visible]);

  const loadCurrentConfig = async () => {
    try {
      const config = await homeAssistantConfigService.getConfig();
      setBaseUrl(config.baseUrl);
      setToken(config.token);
      
      // Check current connection status
      const status = await homeAssistantConfigService.getConnectionStatus();
      setIsConnected(status.connected);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const testConnection = async () => {
    if (!baseUrl.trim() || !token.trim()) {
      Alert.alert('Error', 'Please enter both Base URL and Token');
      return;
    }

    setIsTesting(true);
    try {
      // Temporarily save config for testing
      await homeAssistantConfigService.saveConfig({ baseUrl, token });
      
      const result = await homeAssistantConfigService.testConnection();
      setIsConnected(result.success);
      
      if (result.success) {
        Alert.alert('Success', 'Connected to Home Assistant successfully!');
      } else {
        Alert.alert('Connection Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to test connection');
    } finally {
      setIsTesting(false);
    }
  };

  const saveConfig = async () => {
    if (!baseUrl.trim() || !token.trim()) {
      Alert.alert('Error', 'Please enter both Base URL and Token');
      return;
    }

    setIsSaving(true);
    try {
      await homeAssistantConfigService.saveConfig({ baseUrl, token });
      Alert.alert('Success', 'Home Assistant configuration saved!', [
        { text: 'OK', onPress: onClose }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const resetConfig = async () => {
    Alert.alert(
      'Reset Configuration',
      'Are you sure you want to reset to default settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await homeAssistantConfigService.resetConfig();
              setBaseUrl('http://192.168.100.60:8123');
              setToken('');
              setIsConnected(false);
              Alert.alert('Success', 'Configuration reset to defaults');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset configuration');
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDarkTheme && styles.modalContentDark]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDarkTheme && styles.textDark]}>
              Home Assistant Configuration
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={isDarkTheme ? "#fff" : "#333"} />
            </TouchableOpacity>
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, isDarkTheme && styles.textSecondaryDark]}>
                Connection Status:
              </Text>
              <View style={[
                styles.statusBadge,
                isConnected ? styles.statusBadgeConnected : styles.statusBadgeDisconnected
              ]}>
                <Text style={[
                  styles.statusText,
                  isConnected ? styles.statusTextConnected : styles.statusTextDisconnected
                ]}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={[styles.fieldLabel, isDarkTheme && styles.textDark]}>
              Base URL
            </Text>
            <TextInput
              style={[styles.textInput, isDarkTheme && styles.textInputDark]}
              value={baseUrl}
              onChangeText={setBaseUrl}
              placeholder="http://192.168.100.60:8123"
              placeholderTextColor={isDarkTheme ? '#666' : '#999'}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.fieldLabel, isDarkTheme && styles.textDark]}>
              Long-Lived Access Token
            </Text>
            <TextInput
              style={[styles.textInput, isDarkTheme && styles.textInputDark]}
              value={token}
              onChangeText={setToken}
              placeholder="Enter your Home Assistant token"
              placeholderTextColor={isDarkTheme ? '#666' : '#999'}
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.helpText, isDarkTheme && styles.textSecondaryDark]}>
              Get your token from Home Assistant → Profile → Security → Long-Lived Access Tokens
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.testButton, isDarkTheme && styles.testButtonDark]}
              onPress={testConnection}
              disabled={isTesting || !baseUrl.trim() || !token.trim()}
            >
              <Text style={[styles.testButtonText, isDarkTheme && styles.textDark]}>
                {isTesting ? 'Testing...' : 'Test Connection'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, isDarkTheme && styles.saveButtonDark]}
              onPress={saveConfig}
              disabled={isSaving || !baseUrl.trim() || !token.trim()}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resetButton, isDarkTheme && styles.resetButtonDark]}
              onPress={resetConfig}
            >
              <Text style={[styles.resetButtonText, isDarkTheme && styles.textSecondaryDark]}>
                Reset to Defaults
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalContentDark: {
    backgroundColor: '#1e1e1e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  statusContainer: {
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeConnected: {
    backgroundColor: '#e8f5e8',
  },
  statusBadgeDisconnected: {
    backgroundColor: '#ffeaea',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextConnected: {
    color: '#2e7d32',
  },
  statusTextDisconnected: {
    color: '#d32f2f',
  },
  formContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  textInputDark: {
    borderColor: '#444',
    backgroundColor: '#2a2a2a',
    color: '#fff',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    lineHeight: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  testButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  testButtonDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDark: {
    backgroundColor: '#1565C0',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonDark: {
    backgroundColor: 'transparent',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#666',
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#aaa',
  },
});

export default HomeAssistantConfigModal;