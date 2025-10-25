import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { homeAssistantService } from '../../src/services/HomeAssistantService';
import { ClimateData, SensorDevice } from '../../types';

interface AcSettingsModalProps {
  visible: boolean;
  selectedAc: SensorDevice | null;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AcSettingsModal: React.FC<AcSettingsModalProps> = ({
  visible,
  selectedAc,
  onClose,
}) => {
  const { isDark: isDarkTheme } = useTheme();
  const [acData, setAcData] = useState<ClimateData | null>(null);
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (!selectedAc || !visible) {
      setAcData(null);
      return;
    }

    const unsubscribe = homeAssistantService.subscribe((data) => {
      const entityData = data.climateData[selectedAc.entity];
      if (entityData) {
        setAcData(entityData);
      }
    });

    // Get initial data
    const currentData = homeAssistantService.getCurrentData();
    const entityData = currentData.climateData[selectedAc.entity];
    if (entityData) {
      setAcData(entityData);
    }

    return unsubscribe;
  }, [selectedAc, visible]);

  // Handle modal animations
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!selectedAc || !acData) {
    return null;
  }

  const handleTemperatureChange = (increment: boolean) => {
    const currentTemp = acData.attributes.temperature || 22;
    const minTemp = acData.attributes.min_temp || 16;
    const maxTemp = acData.attributes.max_temp || 32;
    const step = acData.attributes.target_temp_step || 1;
    
    let newTemp = increment ? currentTemp + step : currentTemp - step;
    newTemp = Math.max(minTemp, Math.min(maxTemp, newTemp));
    
    homeAssistantService.updateClimateEntity(selectedAc.entity, { temperature: newTemp });
  };

  const handleModeChange = (mode: string) => {
    homeAssistantService.updateClimateEntity(selectedAc.entity, { hvac_mode: mode });
  };

  const handleFanSpeedChange = (fanMode: string) => {
    homeAssistantService.updateClimateEntity(selectedAc.entity, { fan_mode: fanMode });
  };

  const getModeDisplayName = (mode: string) => {
    const modeMap: { [key: string]: string } = {
      'off': 'Off',
      'heat': 'Heat',
      'cool': 'Cool',
      'heat_cool': 'Auto',
      'fan_only': 'Fan',
      'dry': 'Dry'
    };
    return modeMap[mode] || mode.charAt(0).toUpperCase() + mode.slice(1);
  };

  const getFanDisplayName = (fanMode: string) => {
    const fanMap: { [key: string]: string } = {
      'low': 'Low',
      'mid': 'Medium',
      'medium': 'Medium',
      'high': 'High',
      'auto': 'Auto'
    };
    return fanMap[fanMode] || fanMode.charAt(0).toUpperCase() + fanMode.slice(1);
  };

  const getModeIcon = (mode: string) => {
    const icons: { [key: string]: string } = {
      'off': '⏻',
      'heat': '🔥',
      'cool': '❄️',
      'heat_cool': '🌡️',
      'fan_only': '💨',
      'dry': '💧'
    };
    return icons[mode] || '🌡️';
  };

  const currentTemp = acData.attributes.temperature || 22;
  const currentTemperatureReading = acData.attributes.current_temperature;
  const hvacModes = acData.attributes.hvac_modes || ['off', 'heat', 'cool', 'heat_cool'];
  const fanModes = acData.attributes.fan_modes || ['low', 'medium', 'high'];
  const currentMode = acData.new_state;
  const currentFanMode = acData.attributes.fan_mode;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.modalContent, 
            isDarkTheme && styles.modalContentDark,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.acHeaderIcon, isDarkTheme && styles.acHeaderIconDark]}>
                <Text style={styles.acIcon}>❄️</Text>
              </View>
              <View>
                <Text style={[styles.modalTitle, isDarkTheme && styles.textDark]}>
                  {selectedAc.name}
                </Text>
                <Text style={[styles.modalSubtitle, isDarkTheme && styles.textSecondaryDark]}>
                  {acData.attributes.manufacturer || 'Air Conditioner'} • {getModeDisplayName(currentMode)}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={isDarkTheme ? "#fff" : "#333"} />
            </TouchableOpacity>
          </View>

          {/* Current Status */}
          <View style={[styles.statusCard, isDarkTheme && styles.statusCardDark]}>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <Text style={[styles.statusLabel, isDarkTheme && styles.textSecondaryDark]}>Target</Text>
                <Text style={[styles.statusValue, isDarkTheme && styles.textDark]}>{currentTemp}°C</Text>
              </View>
              {currentTemperatureReading !== null && (
                <View style={styles.statusItem}>
                  <Text style={[styles.statusLabel, isDarkTheme && styles.textSecondaryDark]}>Current</Text>
                  <Text style={[styles.statusValue, isDarkTheme && styles.textDark]}>{currentTemperatureReading}°C</Text>
                </View>
              )}
              <View style={styles.statusItem}>
                <Text style={[styles.statusLabel, isDarkTheme && styles.textSecondaryDark]}>Fan</Text>
                <Text style={[styles.statusValue, isDarkTheme && styles.textDark]}>{getFanDisplayName(currentFanMode)}</Text>
              </View>
            </View>
          </View>
          
          {/* Temperature Control */}
          {currentMode !== 'off' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkTheme && styles.textDark]}>
                Temperature
              </Text>
              <View style={styles.tempControl}>
                <TouchableOpacity 
                  style={[styles.tempButton, isDarkTheme && styles.tempButtonDark]}
                  onPress={() => handleTemperatureChange(false)}
                  disabled={currentTemp <= (acData.attributes.min_temp || 16)}
                >
                  <Ionicons 
                    name="remove" 
                    size={24} 
                    color={
                      currentTemp <= (acData.attributes.min_temp || 16) 
                        ? (isDarkTheme ? '#444' : '#ccc')
                        : (isDarkTheme ? '#fff' : '#333')
                    } 
                  />
                </TouchableOpacity>
                
                <View style={styles.tempDisplay}>
                  <Text style={[styles.tempValue, isDarkTheme && styles.textDark]}>{currentTemp}</Text>
                  <Text style={[styles.tempUnit, isDarkTheme && styles.textSecondaryDark]}>°C</Text>
                </View>
                
                <TouchableOpacity 
                  style={[styles.tempButton, isDarkTheme && styles.tempButtonDark]}
                  onPress={() => handleTemperatureChange(true)}
                  disabled={currentTemp >= (acData.attributes.max_temp || 32)}
                >
                  <Ionicons 
                    name="add" 
                    size={24} 
                    color={
                      currentTemp >= (acData.attributes.max_temp || 32) 
                        ? (isDarkTheme ? '#444' : '#ccc')
                        : (isDarkTheme ? '#fff' : '#333')
                    } 
                  />
                </TouchableOpacity>
              </View>
              <Text style={[styles.tempRange, isDarkTheme && styles.textSecondaryDark]}>
                Range: {acData.attributes.min_temp || 16}°C - {acData.attributes.max_temp || 32}°C
              </Text>
            </View>
          )}

          {/* Mode Control */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDarkTheme && styles.textDark]}>
              Mode
            </Text>
            <View style={styles.optionsGrid}>
              {hvacModes.map(mode => (
                <TouchableOpacity 
                  key={mode}
                  style={[
                    styles.optionButton, 
                    isDarkTheme && styles.optionButtonDark,
                    currentMode === mode && styles.optionButtonActive,
                    currentMode === mode && isDarkTheme && styles.optionButtonActiveDark
                  ]}
                  onPress={() => handleModeChange(mode)}
                >
                  <Text style={styles.optionIcon}>{getModeIcon(mode)}</Text>
                  <Text style={[
                    styles.optionText, 
                    isDarkTheme && styles.textDark,
                    currentMode === mode && styles.optionTextActive
                  ]}>
                    {getModeDisplayName(mode)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Fan Speed Control */}
          {currentMode !== 'off' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDarkTheme && styles.textDark]}>
                Fan Speed
              </Text>
              <View style={styles.optionsGrid}>
                {fanModes.map(fanMode => (
                  <TouchableOpacity 
                    key={fanMode}
                    style={[
                      styles.optionButton, 
                      isDarkTheme && styles.optionButtonDark,
                      currentFanMode === fanMode && styles.optionButtonActive,
                      currentFanMode === fanMode && isDarkTheme && styles.optionButtonActiveDark
                    ]}
                    onPress={() => handleFanSpeedChange(fanMode)}
                  >
                    <Text style={styles.optionIcon}>💨</Text>
                    <Text style={[
                      styles.optionText, 
                      isDarkTheme && styles.textDark,
                      currentFanMode === fanMode && styles.optionTextActive
                    ]}>
                      {getFanDisplayName(fanMode)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    minHeight: SCREEN_HEIGHT * 0.5,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  acHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  acHeaderIconDark: {
    backgroundColor: '#2a3f5f',
  },
  acIcon: {
    fontSize: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  statusCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statusCardDark: {
    backgroundColor: '#252525',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  tempControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tempButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24,
  },
  tempButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  tempDisplay: {
    alignItems: 'center',
    minWidth: 100,
  },
  tempValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  tempUnit: {
    fontSize: 14,
    color: '#666',
    marginTop: -4,
  },
  tempRange: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  optionButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  optionButtonActiveDark: {
    backgroundColor: '#1e3a5f',
    borderColor: '#42A5F5',
  },
  optionIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  optionTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#aaa',
  },
});

export default AcSettingsModal;