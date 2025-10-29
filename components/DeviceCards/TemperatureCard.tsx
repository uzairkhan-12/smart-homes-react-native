import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SensorData, SensorDevice } from '../../types';

interface TemperatureCardProps {
  device: SensorDevice;
  sensorData: SensorData | null;
  cardWidth: number;
}

const TemperatureCard: React.FC<TemperatureCardProps> = ({
  device,
  sensorData,
  cardWidth,
}) => {
  const { isDark: isDarkTheme } = useTheme();

  const getTemperatureColor = (temp: number) => {
    if (temp < 18) return '#3b82f6'; // Cold - Blue
    if (temp < 22) return '#10b981'; // Cool - Green
    if (temp < 26) return '#f59e0b'; // Warm - Amber
    return '#ef4444'; // Hot - Red
  };

  const temperature = sensorData ? parseFloat(sensorData.new_state) : null;

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <View style={[styles.deviceCard, isDarkTheme && styles.deviceCardDark]}>
        <View style={styles.deviceHeader}>
          <View style={[
            styles.deviceIconContainer,
            { backgroundColor: isDarkTheme ? '#2a2a2a' : '#f8f9fa' }
          ]}>
            <Text style={styles.deviceIcon}>🌡️</Text>
          </View>
          <View style={styles.deviceInfo}>
            <Text style={[styles.deviceName, isDarkTheme && styles.textDark]} numberOfLines={1}>
              {device.name}
            </Text>
            <Text style={[styles.deviceType, isDarkTheme && styles.textSecondaryDark]} numberOfLines={1}>
              Temperature Sensor
            </Text>
          </View>
        </View>
        
        {/* Temperature Display */}
        <View style={styles.valueContainer}>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>🌡️ Temperature</Text>
            <Text style={[
              styles.value,
              { 
                color: temperature !== null ? getTemperatureColor(temperature) : (isDarkTheme ? '#aaa' : '#666')
              }
            ]}>
              {temperature !== null ? `${temperature.toFixed(1)}°C` : '--'}
            </Text>
          </View>
          <View style={[
            styles.valueBar,
            { backgroundColor: isDarkTheme ? '#333' : '#e0e0e0' }
          ]}>
            <View 
              style={[
                styles.valueFill,
                { 
                  backgroundColor: temperature !== null ? getTemperatureColor(temperature) : '#ccc',
                  width: temperature !== null ? `${Math.min((temperature - 10) / 30 * 100, 100)}%` : '0%'
                }
              ]} 
            />
          </View>
        </View>

        {/* Last Updated */}
        <View style={styles.lastUpdated}>
          <Text style={[styles.lastUpdatedText, isDarkTheme && styles.textSecondaryDark]}>
            {sensorData ? 'Updated now' : 'No data'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  deviceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 160,
    flex: 1,
  },
  deviceCardDark: {
    backgroundColor: '#1e1e1e',
    shadowOpacity: 0.3,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceIcon: {
    fontSize: 20,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  deviceType: {
    fontSize: 12,
    color: '#666',
  },
  valueContainer: {
    marginBottom: 16,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  valueLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  valueBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  valueFill: {
    height: '100%',
    borderRadius: 3,
  },
  lastUpdated: {
    marginTop: 'auto',
  },
  lastUpdatedText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#aaa',
  },
});

export default TemperatureCard;