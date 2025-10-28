import { getColors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
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
  const { theme, setTheme } = useTheme();
  const systemColorScheme = useColorScheme();
  const isDarkTheme = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  const colors = getColors(isDarkTheme);
  
  // Configuration fields
  const [httpApiUrl, setHttpApiUrl] = useState('http://192.168.100.60:8123/api');
  const [websocketUrl, setWebsocketUrl] = useState('ws://192.168.100.95:3040/api/ws/entities_live');
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
      setHttpApiUrl(config.httpApiUrl || config.baseUrl || 'http://192.168.100.60:8123/api');
      setWebsocketUrl(config.websocketUrl);
      setToken(config.token);
      
      // Check current connection status
      const status = await homeAssistantConfigService.getConnectionStatus();
      setIsConnected(status.connected);
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const testConnection = async () => {
    if (!httpApiUrl.trim() || !token.trim()) {
      Alert.alert('Error', 'Please enter both HTTP API URL and Token');
      return;
    }

    setIsTesting(true);
    try {
      // Temporarily save config for testing
      await homeAssistantConfigService.saveConfig({ 
        httpApiUrl, 
        websocketUrl, 
        token 
      });
      
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
    if (!httpApiUrl.trim() || !token.trim()) {
      Alert.alert('Error', 'Please enter both HTTP API URL and Token');
      return;
    }

    setIsSaving(true);
    try {
      await homeAssistantConfigService.saveConfig({ 
        httpApiUrl, 
        websocketUrl, 
        token 
      });
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
              setHttpApiUrl('http://192.168.100.60:8123/api');
              setWebsocketUrl('ws://192.168.100.95:3040/api/ws/entities_live');
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.modalContent, {backgroundColor: colors.surface}]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, {color: colors.text}]}>
              Home Assistant Configuration
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, {color: colors.textSecondary}]}>
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
            <Text style={[styles.fieldLabel, {color: colors.text}]}>
              HTTP API URL
            </Text>
            <TextInput
              style={[styles.textInput, {
                borderColor: colors.border,
                backgroundColor: colors.surfaceSecondary,
                color: colors.text
              }]}
              value={httpApiUrl}
              onChangeText={setHttpApiUrl}
              placeholder="http://192.168.100.60:8123/api"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={[styles.helpText, {color: colors.textSecondary}]}>
              The HTTP API endpoint for REST calls (e.g., http://your-ha-ip:8123/api)
            </Text>

            <Text style={[styles.fieldLabel, {color: colors.text}]}>
              WebSocket URL
            </Text>
            <TextInput
              style={[styles.textInput, {
                borderColor: colors.border,
                backgroundColor: colors.surfaceSecondary,
                color: colors.text
              }]}
              value={websocketUrl}
              onChangeText={setWebsocketUrl}
              placeholder="ws://192.168.100.95:3040/api/ws/entities_live"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={[styles.helpText, {color: colors.textSecondary}]}>
              The WebSocket endpoint for real-time updates
            </Text>

            <Text style={[styles.fieldLabel, {color: colors.text}]}>
              Long-Lived Access Token
            </Text>
            <TextInput
              style={[styles.textInput, {
                borderColor: colors.border,
                backgroundColor: colors.surfaceSecondary,
                color: colors.text
              }]}
              value={token}
              onChangeText={setToken}
              placeholder="Enter your Home Assistant token"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.helpText, {color: colors.textSecondary}]}>
              Get your token from Home Assistant → Profile → Security → Long-Lived Access Tokens
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.testButton, {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border
              }]}
              onPress={testConnection}
              disabled={isTesting || !httpApiUrl.trim() || !token.trim()}
            >
              <Text style={[styles.testButtonText, {color: colors.text}]}>
                {isTesting ? 'Testing...' : 'Test Connection'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, {backgroundColor: colors.primary}]}
              onPress={saveConfig}
              disabled={isSaving || !httpApiUrl.trim() || !token.trim()}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetConfig}
            >
              <Text style={[styles.resetButtonText, {color: colors.textSecondary}]}>
                Reset to Defaults
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
    width: '100%',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    minHeight: '70%',
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
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  helpText: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  buttonContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  testButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
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
  resetButtonText: {
    fontSize: 14,
  },
});

export default HomeAssistantConfigModal;