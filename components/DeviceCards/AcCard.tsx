import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { homeAssistantService } from '../../src/services/HomeAssistantService';
import { ClimateData, SensorDevice } from '../../types';

interface AcCardProps {
  device: SensorDevice;
  isOn: boolean;
  acData: ClimateData | null;
  onToggle: (deviceId: string, deviceType: string, entityId: string) => void;
  onOpenSettings: (device: SensorDevice) => void;
  cardWidth: number;
}

const AcCard: React.FC<AcCardProps> = ({
  device,
  isOn,
  acData,
  onToggle,
  onOpenSettings,
  cardWidth,
}) => {
  const { isDark: isDarkTheme } = useTheme();

  const getStatusColor = (isActive: boolean, isDark: boolean): string => {
    if (isActive) {
      return isDark ? '#4CAF50' : '#2E7D32';
    }
    return isDark ? '#666' : '#999';
  };

  const getDeviceIcon = (isActive: boolean): string => {
    return isActive ? '❄️' : '⛄';
  };

  const handleToggle = () => {
    if (!isOn) {
      // When turning on, set default values: 21°C, cool mode, mid fan
      console.log(`Setting AC ${device.entity} to default values: 21°C, cool, mid fan`);
      homeAssistantService.updateClimateEntity(device.entity, {
        hvac_mode: 'cool',
        temperature: 21,
        fan_mode: 'mid'
      });
    } else {
      // When turning off, just turn off
      console.log(`Turning off AC ${device.entity}`);
      homeAssistantService.updateClimateEntity(device.entity, {
        hvac_mode: 'off'
      });
    }
  };

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <View style={[styles.controlCard, isDarkTheme && styles.controlCardDark]}>
        <View style={styles.controlHeader}>
          <View style={[
            styles.controlIconContainer,
            isOn && styles.controlIconContainerActive,
            { backgroundColor: isDarkTheme ? '#2a2a2a' : '#f8f9fa' }
          ]}>
            <Text style={[
              styles.controlIcon,
              { color: isOn ? (isDarkTheme ? '#4CAF50' : '#2E7D32') : (isDarkTheme ? '#666' : '#999') }
            ]}>
              {getDeviceIcon(isOn)}
            </Text>
          </View>
          <View style={styles.controlInfo}>
            <Text style={[styles.controlName, isDarkTheme && styles.textDark]} numberOfLines={1}>
              {device.name}
            </Text>
            <Text style={[styles.controlType, isDarkTheme && styles.textSecondaryDark]} numberOfLines={1}>
              Air Conditioner
            </Text>
            {acData && isOn && (
              <Text style={[styles.acStatus, isDarkTheme && styles.textSecondaryDark]}>
                {acData.attributes.temperature}°C • {acData.attributes.fan_mode}
              </Text>
            )}
          </View>
          <View style={styles.acControls}>
            {isOn && (
              <TouchableOpacity
                style={[styles.settingsButton, isDarkTheme && styles.settingsButtonDark]}
                onPress={() => onOpenSettings(device)}
              >
                <Ionicons 
                  name="settings-outline" 
                  size={18} 
                  color={isDarkTheme ? "#fff" : "#666"} 
                />
              </TouchableOpacity>
            )}
            <View style={styles.toggleWrapper}>
              <Switch
                value={isOn}
                onValueChange={handleToggle}
                trackColor={{ false: '#767577', true: isDarkTheme ? '#4CAF50' : '#81C784' }}
                thumbColor={isOn ? (isDarkTheme ? '#4CAF50' : '#2E7D32') : (isDarkTheme ? '#aaa' : '#f4f3f4')}
                ios_backgroundColor="#3e3e3e"
                style={styles.controlSwitch}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  controlCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 80,
    flex: 1,
  },
  controlCardDark: {
    backgroundColor: '#1e1e1e',
    shadowOpacity: 0.3,
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  controlIconContainerActive: {
    transform: [{ scale: 1.05 }],
  },
  controlIcon: {
    fontSize: 20,
  },
  controlInfo: {
    flex: 1,
  },
  controlName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  controlType: {
    fontSize: 12,
    color: '#666',
  },
  acStatus: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  toggleWrapper: {
    marginLeft: 'auto',
  },
  controlSwitch: {
    transform: [{ scale: 1.1 }],
  },
  acControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  settingsButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#aaa',
  },
});

export default AcCard;