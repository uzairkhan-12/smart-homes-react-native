import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SensorDevice } from '../../types';

interface LightCardProps {
  device: SensorDevice;
  isOn: boolean;
  onToggle: (deviceId: string, deviceType: string, entityId: string) => void;
  cardWidth: number;
}

const LightCard: React.FC<LightCardProps> = ({
  device,
  isOn,
  onToggle,
  cardWidth,
}) => {
  const { isDark: isDarkTheme } = useTheme();

  const getStatusColor = (isActive: boolean, isDark: boolean): string => {
    if (isActive) {
      return isDark ? '#4CAF50' : '#2E7D32';
    }
    return isDark ? '#666' : '#999';
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { width: cardWidth }]}
      onPress={() => onToggle(device.id, device.type, device.entity)}
      activeOpacity={0.7}
    >
      <View style={[styles.controlCard, isDarkTheme && styles.controlCardDark]}>
        <View style={styles.controlHeader}>
          <View style={[
            styles.controlIconContainer,
            isOn && styles.controlIconContainerActive,
            { backgroundColor: isDarkTheme ? '#2a2a2a' : '#f8f9fa' }
          ]}>
            <Ionicons
              name={isOn ? "bulb" : "bulb-outline"}
              size={24}
              color={isOn ? (isDarkTheme ? '#FFD700' : '#FFA000') : (isDarkTheme ? '#666' : '#999')}
            />
          </View>
          <View style={styles.controlInfo}>
            <Text style={[styles.controlName, isDarkTheme && styles.textDark]} numberOfLines={1}>
              {device.name}
            </Text>
            <Text style={[styles.controlType, isDarkTheme && styles.textSecondaryDark]} numberOfLines={1}>
              Light
            </Text>
          </View>
          <View style={styles.toggleWrapper}>
            <Switch
              value={isOn}
              onValueChange={() => onToggle(device.id, device.type, device.entity)}
              trackColor={{ false: '#767577', true: isDarkTheme ? '#4CAF50' : '#81C784' }}
              thumbColor={isOn ? (isDarkTheme ? '#4CAF50' : '#2E7D32') : (isDarkTheme ? '#aaa' : '#f4f3f4')}
              ios_backgroundColor="#3e3e3e"
              style={styles.controlSwitch}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
  toggleWrapper: {
    marginLeft: 'auto',
  },
  controlSwitch: {
    transform: [{ scale: 1.1 }],
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#aaa',
  },
});

export default LightCard;