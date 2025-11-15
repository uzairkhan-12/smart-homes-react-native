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

interface HumidityDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  humiditySensors: SensorDevice[];
  sensorData: { [key: string]: SensorData };
}

export default function HumidityDetailsModal({
  visible,
  onClose,
  humiditySensors,
  sensorData
}: HumidityDetailsModalProps) {
  const { isDark } = useTheme();

  const getSensorData = (device: SensorDevice) => {
    const data = sensorData[device.entity];
    return data || null;
  };

  const getHumidityColor = (humidity: number) => {
    if (humidity < 30) return '#ef4444'; // Too dry - Red
    if (humidity < 40) return '#f59e0b'; // Low - Amber
    if (humidity < 60) return '#10b981'; // Ideal - Green
    if (humidity < 70) return '#f59e0b'; // High - Amber
    return '#3b82f6'; // Too humid - Blue
  };

  const getHumidityDescription = (humidity: number) => {
    if (humidity < 30) return 'Too Dry';
    if (humidity < 40) return 'Low';
    if (humidity < 60) return 'Ideal';
    if (humidity < 70) return 'High';
    return 'Too Humid';
  };

  const renderHumiditySensor = (device: SensorDevice) => {
    const data = getSensorData(device);
    
    // Only render if we have real data
    if (!data || !data.new_state) {
      return null;
    }
    
    const humidityValue = parseFloat(data.new_state);
    if (isNaN(humidityValue)) {
      return null;
    }
    
    return (
      <View key={device.id} style={[styles.sensorCard, isDark && styles.sensorCardDark]}>
        <View style={styles.sensorHeader}>
          <View style={[styles.sensorIconContainer, isDark && styles.sensorIconContainerDark]}>
            <Ionicons 
              name="water-outline" 
              size={20} 
              color={isDark ? '#3b82f6' : '#1e40af'} 
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
          <View style={[styles.dataItem, isDark && styles.dataItemDark]}>
            <View style={styles.dataHeader}>
              <Ionicons 
                name="water-outline" 
                size={16} 
                color={getHumidityColor(humidityValue)} 
              />
              <Text style={[styles.dataLabel, isDark && styles.textDark]}>Current Humidity</Text>
            </View>
            <Text style={[
              styles.dataValue,
              { color: getHumidityColor(humidityValue) }
            ]}>
              {data.new_state}%
            </Text>
            <Text style={[styles.dataDescription, isDark && styles.textSecondaryDark]}>
              {getHumidityDescription(humidityValue)}
            </Text>
          </View>
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
                  name="water" 
                  size={24} 
                  color={isDark ? '#3b82f6' : '#1e40af'} 
                />
              </View>
              <View>
                <Text style={[styles.headerTitle, isDark && styles.textDark]}>
                  Humidity Sensors
                </Text>
                <Text style={[styles.headerSubtitle, isDark && styles.textSecondaryDark]}>
                  {humiditySensors.length} sensor{humiditySensors.length !== 1 ? 's' : ''}
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
          {humiditySensors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="water-outline" 
                size={64} 
                color={isDark ? '#666' : '#ccc'} 
              />
              <Text style={[styles.emptyTitle, isDark && styles.textDark]}>
                No Humidity Sensors
              </Text>
              <Text style={[styles.emptyMessage, isDark && styles.textSecondaryDark]}>
                Configure humidity sensors in Settings to see readings here.
              </Text>
            </View>
          ) : (
            <>
              {/* Humidity Sensors Grid - 2 per row */}
              <View style={styles.sensorsGrid}>
                {humiditySensors.map(device => renderHumiditySensor(device)).filter(Boolean)}
              </View>
              
              {/* Show message if no valid sensor data */}
              {humiditySensors.every(device => !getSensorData(device)?.new_state) && (
                <View style={styles.emptyContainer}>
                  <Ionicons 
                    name="warning-outline" 
                    size={64} 
                    color={isDark ? '#3b82f6' : '#1e40af'} 
                  />
                  <Text style={[styles.emptyTitle, isDark && styles.textDark]}>
                    No Humidity Data Available
                  </Text>
                  <Text style={[styles.emptyMessage, isDark && styles.textSecondaryDark]}>
                    Check your Home Assistant connection and humidity sensor configuration.
                  </Text>
                </View>
              )}
            </>
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
    backgroundColor: '#dbeafe',
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
  sensorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  sensorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    width: '48%',
    minHeight: 120,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sensorIconContainerDark: {
    backgroundColor: '#374151',
  },
  sensorInfo: {
    flex: 1,
  },
  sensorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  sensorEntity: {
    fontSize: 10,
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
  dataItemDark: {
    backgroundColor: '#2a2a2a',
  },
  dataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  dataValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dataDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
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