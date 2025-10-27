import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import {
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BinarySensorData, SensorDevice } from '../../../types';

interface CameraDetailsModalProps {
  visible: boolean;
  camera: SensorDevice | null;
  motionSensorData: BinarySensorData | null;
  occupancySensorData: BinarySensorData | null;
  onClose: () => void;
}

const CameraDetailsModal: React.FC<CameraDetailsModalProps> = ({
  visible,
  camera,
  motionSensorData,
  occupancySensorData,
  onClose,
}) => {
  const { isDark } = useTheme();

  if (!camera) return null;

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  const getSensorStatus = (data: BinarySensorData | null, sensorType: string) => {
    if (!data) {
      return { status: 'No Data', color: '#999', isActive: false };
    }
    
    const isActive = data.new_state === 'on';
    if (sensorType === 'motion') {
      return {
        status: isActive ? 'Motion Detected' : 'No Motion',
        color: isActive ? '#ff5722' : '#2196f3',
        isActive
      };
    } else if (sensorType === 'occupancy') {
      return {
        status: isActive ? 'Occupied' : 'Vacant',
        color: isActive ? '#ff9800' : '#4caf50',
        isActive
      };
    }
    
    return {
      status: isActive ? 'Active' : 'Inactive',
      color: isActive ? '#ff5722' : '#2196f3',
      isActive
    };
  };

  const motionStatus = getSensorStatus(motionSensorData, 'motion');
  const occupancyStatus = getSensorStatus(occupancySensorData, 'occupancy');

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
            <Text style={styles.headerIcon}>📹</Text>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, isDark && styles.textDark]}>
                {camera.name}
              </Text>
              <Text style={[styles.headerSubtitle, isDark && styles.textSecondaryDark]}>
                Camera Details
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
          {/* Camera Feed */}
          {camera.stream_url && (
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Live Feed</Text>
              <View style={styles.cameraContainer}>
                <Image
                  source={{ uri: camera.stream_url }}
                  style={styles.cameraImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          )}

          {/* Sensor Status */}
          <View style={[styles.section, isDark && styles.sectionDark]}>
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Sensor Status</Text>
            
            {/* Motion Sensor */}
            <View style={styles.sensorRow}>
              <View style={styles.sensorInfo}>
                <Text style={[styles.sensorLabel, isDark && styles.textDark]}>🏃 Motion Sensor</Text>
                <Text style={[styles.sensorEntity, isDark && styles.textSecondaryDark]}>
                  {camera.motion_sensor || 'Not configured'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: motionStatus.color }]}>
                <Text style={styles.statusText}>{motionStatus.status}</Text>
              </View>
            </View>

            {/* Occupancy Sensor */}
            <View style={styles.sensorRow}>
              <View style={styles.sensorInfo}>
                <Text style={[styles.sensorLabel, isDark && styles.textDark]}>👤 Occupancy Sensor</Text>
                <Text style={[styles.sensorEntity, isDark && styles.textSecondaryDark]}>
                  {camera.occupancy_sensor || 'Not configured'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: occupancyStatus.color }]}>
                <Text style={styles.statusText}>{occupancyStatus.status}</Text>
              </View>
            </View>
          </View>

          {/* Device Information */}
          <View style={[styles.section, isDark && styles.sectionDark]}>
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Device Information</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Camera ID</Text>
                <Text style={[styles.infoValue, isDark && styles.textDark]}>{camera.id}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Type</Text>
                <Text style={[styles.infoValue, isDark && styles.textDark]}>Camera</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Entity ID</Text>
                <Text style={[styles.infoValue, isDark && styles.textDark]} numberOfLines={2}>
                  {camera.entity || 'Not configured'}
                </Text>
              </View>
              {camera.stream_url && (
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Stream URL</Text>
                  <Text style={[styles.infoValue, isDark && styles.textDark]} numberOfLines={2}>
                    {camera.stream_url}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Motion Sensor Data */}
          {motionSensorData && (
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Motion Sensor Data</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Current State</Text>
                  <Text style={[styles.infoValue, isDark && styles.textDark]}>
                    {motionSensorData.new_state}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Last Updated</Text>
                  <Text style={[styles.infoValue, isDark && styles.textDark]} numberOfLines={2}>
                    {formatTimestamp(motionSensorData.timestamp)}
                  </Text>
                </View>
                {motionSensorData.attributes?.friendly_name && (
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Friendly Name</Text>
                    <Text style={[styles.infoValue, isDark && styles.textDark]}>
                      {motionSensorData.attributes.friendly_name}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Occupancy Sensor Data */}
          {occupancySensorData && (
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Occupancy Sensor Data</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Current State</Text>
                  <Text style={[styles.infoValue, isDark && styles.textDark]}>
                    {occupancySensorData.new_state}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Last Updated</Text>
                  <Text style={[styles.infoValue, isDark && styles.textDark]} numberOfLines={2}>
                    {formatTimestamp(occupancySensorData.timestamp)}
                  </Text>
                </View>
                {occupancySensorData.attributes?.friendly_name && (
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, isDark && styles.textSecondaryDark]}>Friendly Name</Text>
                    <Text style={[styles.infoValue, isDark && styles.textDark]}>
                      {occupancySensorData.attributes.friendly_name}
                    </Text>
                  </View>
                )}
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
  cameraContainer: {
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  cameraImage: {
    width: '100%',
    height: '100%',
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sensorInfo: {
    flex: 1,
  },
  sensorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  sensorEntity: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
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
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#aaa',
  },
});

export default CameraDetailsModal;