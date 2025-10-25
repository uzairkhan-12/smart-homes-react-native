import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { SensorDevice } from '../../types';

interface CameraCardProps {
  camera: SensorDevice;
  cardWidth: number;
}

const CameraCard: React.FC<CameraCardProps> = ({ camera, cardWidth }: any) => {
  const { isDark: isDarkTheme } = useTheme();

  const hasMotionSensor = camera.motion_sensor_detected;
  const hasOccupancySensor = camera.occupancy_sensor_detected;
  console.log({hasMotionSensor, hasOccupancySensor});
  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <View style={[styles.deviceCard, isDarkTheme && styles.deviceCardDark]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.deviceHeader}>
            <Text style={styles.cameraIcon}>📹</Text>
            <View style={styles.deviceInfo}>
              <Text
                style={[styles.deviceName, isDarkTheme && styles.textDark]}
                numberOfLines={1}
              >
                {camera.name}
              </Text>
              <Text
                style={[
                  styles.deviceType,
                  isDarkTheme && styles.textSecondaryDark,
                ]}
                numberOfLines={1}
              >
                Camera
              </Text>
            </View>
          </View>

          {/* Sensor badges */}
          <View style={styles.sensorBadges}>
            {/* Motion Badge */}
            <View
              style={[
                styles.badge,
                hasMotionSensor ? styles.badgeDetected : styles.badgeClear,
              ]}
            >
              <Text style={styles.badgeText}>
                👁️ {hasMotionSensor ? 'Motion Detected' : 'No Motion'}
              </Text>
            </View>

            {/* Occupancy Badge */}
            <View
              style={[
                styles.badge,
                hasOccupancySensor ? styles.badgeDetected : styles.badgeClear,
              ]}
            >
              <Text style={styles.badgeText}>
                🚶 {hasOccupancySensor ? 'Occupied' : 'Clear'}
              </Text>
            </View>
          </View>
        </View>

        {/* Camera Preview */}
        <View
          style={[styles.cameraPreview, isDarkTheme && styles.cameraPreviewDark]}
        >
          {camera.stream_url ? (
            <>
              <WebView
                source={{ uri: camera.stream_url }}
                style={styles.webview}
                javaScriptEnabled
                domStorageEnabled
                allowsFullscreenVideo={false}
                scrollEnabled={false}
              />
              {/* LIVE Badge */}
              <View style={styles.liveBadgeContainer}>
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            </>
          ) : (
            <View style={styles.placeholderContainer}>
              <Text
                style={[
                  styles.cameraPlaceholder,
                  isDarkTheme && styles.textSecondaryDark,
                ]}
              >
                No Stream Available
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.cameraStatus}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: camera.stream_url ? '#4CAF50' : '#ff6b6b' },
              ]}
            />
            <Text
              style={[
                styles.cameraStatusText,
                isDarkTheme && styles.textSecondaryDark,
              ]}
            >
              {camera.stream_url ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
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
    minHeight: 200,
  },
  deviceCardDark: {
    backgroundColor: '#1e1e1e',
    shadowOpacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cameraIcon: {
    fontSize: 20,
    marginRight: 8,
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
  sensorBadges: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeDetected: {
    backgroundColor: '#ffe6e6',
    borderColor: '#ff3b30',
  },
  badgeClear: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#222',
  },
  cameraPreview: {
    height: 140,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  cameraPreviewDark: {
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  liveBadgeContainer: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'red',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#983535ff',
  },
  cameraPlaceholder: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cameraStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cameraStatusText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#aaa',
  },
});

export default CameraCard;
