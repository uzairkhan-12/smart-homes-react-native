import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BinarySensorData, SensorDevice } from '../../../types';

interface SensorDetailsModalProps {
  visible: boolean;
  sensor: SensorDevice | null;
  sensorData: BinarySensorData | null;
  onClose: () => void;
}

const SensorDetailsModal: React.FC<SensorDetailsModalProps> = ({
  visible,
  sensor,
  sensorData,
  onClose,
}) => {
  const { isDark } = useTheme();

  if (!sensor) return null;

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getSensorIcon = (type: string): string => {
    switch (type) {
      case 'water': return '💧';
      case 'radar': return '📡';
      case 'door': return '🚪';
      case 'security': return '🔒';
      case 'motion': return '🏃';
      case 'occupancy': return '👤';
      default: return '📊';
    }
  };

  const getSensorStatus = (): { status: string; isIssue: boolean } => {
    if (!sensor.entity || sensor.entity.trim() === '') {
      return { status: 'Not Configured', isIssue: true };
    }

    if (!sensorData) {
      return { status: 'No Data Available', isIssue: true };
    }

    const isActive = sensorData.new_state === 'on';
    
    switch (sensor.type) {
      case 'water':
        return { 
          status: isActive ? 'Water Detected' : 'No Water Detected', 
          isIssue: isActive 
        };
      case 'door':
        return { 
          status: isActive ? 'Door Open' : 'Door Closed', 
          isIssue: isActive 
        };
      case 'security':
        return { 
          status: isActive ? 'Security Alert' : 'Secure', 
          isIssue: isActive 
        };
      case 'radar':
        return { 
          status: isActive ? 'Motion Detected' : 'No Motion', 
          isIssue: false 
        };
      default:
        return { 
          status: isActive ? 'Active' : 'Inactive', 
          isIssue: false 
        };
    }
  };

  const { status, isIssue } = getSensorStatus();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={[styles.header, isDark && styles.headerDark]}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerIcon]}>{getSensorIcon(sensor.type)}</Text>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, isDark && styles.textDark]}>
                {sensor.name}
              </Text>
              <Text style={[styles.headerSubtitle, isDark && styles.textSecondaryDark]}>
                {sensor.type.charAt(0).toUpperCase() + sensor.type.slice(1)} Sensor
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.closeButton, isDark && styles.closeButtonDark]}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, isDark && styles.textDark]}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Status */}
          <View style={[styles.section, isDark && styles.sectionDark]}>
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Current Status</Text>
            <View style={[
              styles.statusContainer, 
              isDark && styles.statusContainerDark,
              isIssue && styles.statusContainerIssue,
              isDark && isIssue && styles.statusContainerIssueDark
            ]}>
              <Text style={[
                styles.statusText, 
                isDark && styles.textDark,
                isIssue && styles.statusTextIssue,
                isDark && isIssue && styles.statusTextIssueDark
              ]}>
                {status}
              </Text>
              <View style={[
                styles.statusIndicator,
                isIssue ? styles.statusIndicatorIssue : styles.statusIndicatorNormal
              ]} />
            </View>
          </View>

          {/* Device Information */}
          <View style={[styles.section, isDark && styles.sectionDark]}>
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Device Information</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Device ID</Text>
                <Text style={[styles.infoValue, isDark && styles.textDark]}>{sensor.id}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Type</Text>
                <Text style={[styles.infoValue, isDark && styles.textDark]}>
                  {sensor.type.charAt(0).toUpperCase() + sensor.type.slice(1)}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Entity ID</Text>
                <Text style={[styles.infoValue, isDark && styles.textDark]} numberOfLines={2}>
                  {sensor.entity || 'Not Configured'}
                </Text>
              </View>
            </View>
          </View>

          {/* Sensor Data */}
          {sensorData && (
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Sensor Data</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Current State</Text>
                  <Text style={[styles.infoValue, isDark && styles.textDark]}>
                    {sensorData.new_state}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Previous State</Text>
                  <Text style={[styles.infoValue, isDark && styles.textDark]}>
                    {sensorData.old_state}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Last Updated</Text>
                  <Text style={[styles.infoValue, isDark && styles.textDark]} numberOfLines={2}>
                    {formatTimestamp(sensorData.timestamp)}
                  </Text>
                </View>
                {sensorData.attributes?.device_class && (
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Device Class</Text>
                    <Text style={[styles.infoValue, isDark && styles.textDark]}>
                      {sensorData.attributes.device_class}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Attributes */}
          {sensorData?.attributes && (
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Attributes</Text>
              <View style={styles.attributesContainer}>
                {Object.entries(sensorData.attributes).map(([key, value]) => (
                  <View key={key} style={styles.attributeItem}>
                    <Text style={[styles.attributeKey, isDark && styles.textSecondaryDark]}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                    </Text>
                    <Text style={[styles.attributeValue, isDark && styles.textDark]}>
                      {String(value)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerDark: {
    backgroundColor: '#1e1e1e',
    borderBottomColor: '#333',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonDark: {
    backgroundColor: '#333',
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionDark: {
    backgroundColor: '#1e1e1e',
    shadowOpacity: 0.3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statusContainerDark: {
    backgroundColor: '#2d2d2d',
  },
  statusContainerIssue: {
    backgroundColor: '#ffebee',
  },
  statusContainerIssueDark: {
    backgroundColor: '#3a1f1f',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  statusTextIssue: {
    color: '#d32f2f',
  },
  statusTextIssueDark: {
    color: '#ff5252',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusIndicatorNormal: {
    backgroundColor: '#4caf50',
  },
  statusIndicatorIssue: {
    backgroundColor: '#ef5350',
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 12,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  attributesContainer: {
    gap: 8,
  },
  attributeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  attributeKey: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    marginRight: 12,
  },
  attributeValue: {
    fontSize: 13,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#aaa',
  },
});

export default SensorDetailsModal;