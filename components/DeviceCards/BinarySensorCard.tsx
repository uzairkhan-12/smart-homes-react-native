import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SensorDevice } from '../../types';

interface BinarySensorCardProps {
  device: SensorDevice;
  isActive: boolean;
  stateText: string;
  cardWidth: number;
}

const BinarySensorCard: React.FC<BinarySensorCardProps> = ({
  device,
  isActive,
  stateText,
  cardWidth,
}) => {
  const { isDark: isDarkTheme } = useTheme();

  const getDeviceIcon = (type: string): string => {
    switch (type) {
      case 'water': return '💧';
      case 'radar': return '📡';
      case 'door': return '🚪';
      case 'security': return '🔒';
      default: return '📱';
    }
  };

  const getDeviceTypeLabel = (type: string): string => {
    switch (type) {
      case 'water': return 'Water Sensor';
      case 'radar': return 'Radar Sensor';
      case 'door': return 'Door Sensor';
      case 'security': return 'Security System';
      default: return 'Unknown Device';
    }
  };

  const getStatusColor = (isActive: boolean, isDark: boolean): string => {
    if (isActive) {
      return isDark ? '#af4c4cff' : '#7d2e2eff';
    }
    return isDark ? '#666' : '#999';
  };

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <View style={[styles.sensorCard, isDarkTheme && styles.sensorCardDark]}>
        <View style={styles.sensorHeader}>
          <View style={[
            styles.sensorIconContainer,
            isActive && styles.sensorIconContainerActive,
            { backgroundColor: isDarkTheme ? '#2a2a2a' : '#f8f9fa' }
          ]}>
            <Text style={[
              styles.sensorIcon,
              { color: getStatusColor(isActive, isDarkTheme) }
            ]}>
              {getDeviceIcon(device.type)}
            </Text>
          </View>
          <View style={styles.sensorInfo}>
            <Text style={[styles.sensorName, isDarkTheme && styles.textDark]} numberOfLines={1}>
              {device.name}
            </Text>
            <Text style={[styles.sensorType, isDarkTheme && styles.textSecondaryDark]} numberOfLines={1}>
              {getDeviceTypeLabel(device.type)}
            </Text>
          </View>
        </View>
        
        {/* State Display */}
        <View style={styles.stateContainer}>
          <View style={styles.stateIndicator}>
            <View style={[
              styles.stateDot,
              { backgroundColor: getStatusColor(isActive, isDarkTheme) }
            ]} />
            <Text style={[
              styles.stateText,
              isDarkTheme && styles.textDark,
              { color: getStatusColor(isActive, isDarkTheme) }
            ]}>
              {stateText}
            </Text>
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
  sensorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 100,
    flex: 1,
  },
  sensorCardDark: {
    backgroundColor: '#1e1e1e',
    shadowOpacity: 0.3,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sensorIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sensorIconContainerActive: {
    transform: [{ scale: 1.05 }],
  },
  sensorIcon: {
    fontSize: 20,
  },
  sensorInfo: {
    flex: 1,
  },
  sensorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  sensorType: {
    fontSize: 12,
    color: '#666',
  },
  stateContainer: {
    alignItems: 'center',
  },
  stateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stateDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#aaa',
  },
});

export default BinarySensorCard;