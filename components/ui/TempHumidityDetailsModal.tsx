import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SensorData, SensorDevice } from '../../types';

interface TempHumidityDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  tempHumidityDevices: SensorDevice[];
  sensorData: { [key: string]: SensorData };
}

export default function TempHumidityDetailsModal({
  visible,
  onClose,
  tempHumidityDevices,
  sensorData
}: TempHumidityDetailsModalProps) {
  const { isDark } = useTheme();

  const getTempHumidityData = (device: SensorDevice) => {
    // Check if this device has temperature data
    const tempData = sensorData[device.entity];
    let humidityData = null;

    // Try to find matching humidity sensor
    if (device.entity.includes('temperature')) {
      const humidityEntity = device.entity.replace('temperature', 'humidity');
      humidityData = sensorData[humidityEntity];
    } else if (device.entity.includes('temp')) {
      const humidityEntity = device.entity.replace('temp', 'humidity');
      humidityData = sensorData[humidityEntity];
    }

    return {
      temperature: tempData,
      humidity: humidityData
    };
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 18) return '#3b82f6'; // Cold - Blue
    if (temp < 22) return '#10b981'; // Cool - Green
    if (temp < 26) return '#f59e0b'; // Warm - Amber
    return '#ef4444'; // Hot - Red
  };

  const getHumidityColor = (humidity: number) => {
    if (humidity < 30) return '#ef4444'; // Too dry - Red
    if (humidity < 40) return '#f59e0b'; // Low - Amber
    if (humidity < 60) return '#10b981'; // Ideal - Green
    if (humidity < 70) return '#f59e0b'; // High - Amber
    return '#3b82f6'; // Too humid - Blue
  };

  const renderSensorCard = (device: SensorDevice) => {
    const { temperature, humidity } = getTempHumidityData(device);
    
    return (
      <View key={device.id} style={[styles.sensorCard, isDark && styles.sensorCardDark]}>
        <View style={styles.sensorHeader}>
          <View style={[styles.sensorIconContainer, isDark && styles.sensorIconContainerDark]}>
            <Ionicons 
              name="thermometer-outline" 
              size={20} 
              color={isDark ? '#f59e0b' : '#f97316'} 
            />
          </View>
          <View style={styles.sensorInfo}>
            <Text style={[styles.sensorName, isDark && styles.textDark]} numberOfLines={1}>
              {device.name}
            </Text>
            <Text style={[styles.sensorEntity, isDark && styles.textSecondaryDark]} numberOfLines={1}>
              {device.entity}
            </Text>
          </View>
        </View>

        <View style={styles.dataContainer}>
          {/* Temperature */}
          {temperature && (
            <View style={styles.dataItem}>
              <View style={styles.dataHeader}>
                <Ionicons 
                  name="thermometer-outline" 
                  size={16} 
                  color={getTemperatureColor(parseFloat(temperature.new_state))} 
                />
                <Text style={[styles.dataLabel, isDark && styles.textDark]}>Temperature</Text>
              </View>
              <Text style={[
                styles.dataValue,
                { color: getTemperatureColor(parseFloat(temperature.new_state)) }
              ]}>
                {temperature.new_state}°C
              </Text>
              <Text style={[styles.dataTimestamp, isDark && styles.textSecondaryDark]}>
                Updated: {formatTimestamp(temperature.timestamp)}
              </Text>
              {temperature.old_state !== temperature.new_state && (
                <Text style={[styles.dataChange, isDark && styles.textSecondaryDark]}>
                  Previous: {temperature.old_state}°C
                </Text>
              )}
            </View>
          )}

          {/* Humidity */}
          {humidity && (
            <View style={styles.dataItem}>
              <View style={styles.dataHeader}>
                <Ionicons 
                  name="water-outline" 
                  size={16} 
                  color={getHumidityColor(parseFloat(humidity.new_state))} 
                />
                <Text style={[styles.dataLabel, isDark && styles.textDark]}>Humidity</Text>
              </View>
              <Text style={[
                styles.dataValue,
                { color: getHumidityColor(parseFloat(humidity.new_state)) }
              ]}>
                {humidity.new_state}%
              </Text>
              <Text style={[styles.dataTimestamp, isDark && styles.textSecondaryDark]}>
                Updated: {formatTimestamp(humidity.timestamp)}
              </Text>
              {humidity.old_state !== humidity.new_state && (
                <Text style={[styles.dataChange, isDark && styles.textSecondaryDark]}>
                  Previous: {humidity.old_state}%
                </Text>
              )}
            </View>
          )}

          {/* No data message */}
          {!temperature && !humidity && (
            <View style={styles.noDataContainer}>
              <Ionicons 
                name="warning-outline" 
                size={24} 
                color={isDark ? '#f59e0b' : '#f97316'} 
              />
              <Text style={[styles.noDataText, isDark && styles.textSecondaryDark]}>
                No sensor data available
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, isDark && styles.containerDark]}>
        {/* Header */}
        <View style={[styles.header, isDark && styles.headerDark]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconContainer, isDark && styles.headerIconContainerDark]}>
                <Ionicons 
                  name="thermometer" 
                  size={24} 
                  color={isDark ? '#f59e0b' : '#f97316'} 
                />
              </View>
              <View>
                <Text style={[styles.headerTitle, isDark && styles.textDark]}>
                  Temperature & Humidity
                </Text>
                <Text style={[styles.headerSubtitle, isDark && styles.textSecondaryDark]}>
                  {tempHumidityDevices.length} sensor{tempHumidityDevices.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, isDark && styles.closeButtonDark]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={isDark ? '#fff' : '#333'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {tempHumidityDevices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="thermometer-outline" 
                size={64} 
                color={isDark ? '#666' : '#ccc'} 
              />
              <Text style={[styles.emptyTitle, isDark && styles.textDark]}>
                No Temperature Sensors
              </Text>
              <Text style={[styles.emptyMessage, isDark && styles.textSecondaryDark]}>
                Configure temperature and humidity sensors in Settings to see detailed readings here.
              </Text>
            </View>
          ) : (
            tempHumidityDevices.map(device => renderSensorCard(device))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  headerDark: {
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#374151',
    shadowOpacity: 0.3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerIconContainerDark: {
    backgroundColor: '#374151',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonDark: {
    backgroundColor: '#374151',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sensorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sensorCardDark: {
    backgroundColor: '#1e1e1e',
    shadowOpacity: 0.3,
  },
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sensorIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sensorIconContainerDark: {
    backgroundColor: '#374151',
  },
  sensorInfo: {
    flex: 1,
  },
  sensorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  sensorEntity: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  dataContainer: {
    gap: 16,
  },
  dataItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  dataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  dataValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dataTimestamp: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  dataChange: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#aaa',
  },
});