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
        {/* Camera Preview with Overlay Info */}
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
              {/* Overlay Info */}
              <View style={styles.overlayContainer}>
                {/* Top Left - Camera Name */}
                <View style={styles.topLeftOverlay}>
                  <Text style={styles.cameraName}>
                    📹 {camera.name}
                  </Text>
                </View>

                {/* Top Right - Sensor Badges */}
                <View style={styles.topRightOverlay}>
                  {/* Motion Badge */}
                  <View
                    style={[
                      styles.sensorBadge,
                      hasMotionSensor ? styles.badgeActive : styles.badgeInactive,
                    ]}
                  >
                    <Text style={styles.sensorBadgeText}>
                      👁️ {hasMotionSensor ? 'Motion' : 'Clear'}
                    </Text>
                  </View>

                  {/* Occupancy Badge */}
                  <View
                    style={[
                      styles.sensorBadge,
                      hasOccupancySensor ? styles.badgeActive : styles.badgeInactive,
                    ]}
                  >
                    <Text style={styles.sensorBadgeText}>
                      🚶 {hasOccupancySensor ? 'Occupied' : 'Clear'}
                    </Text>
                  </View>
                </View>

                {/* Bottom Right - LIVE Badge */}
                <View style={styles.liveBadgeContainer}>
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.cameraName}>
                📹 {camera.name}
              </Text>
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
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deviceCardDark: {
    backgroundColor: '#1e1e1e',
    shadowOpacity: 0.3,
  },
  cameraPreview: {
    height: 290,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  cameraPreviewDark: {
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  topLeftOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  topRightOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    alignItems: 'flex-end',
    gap: 4,
  },
  cameraName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sensorBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
  },
  badgeInactive: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
  },
  sensorBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  liveBadgeContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#ff3b30',
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    backgroundColor: '#2a2a2a',
    gap: 8,
  },
  cameraPlaceholder: {
    fontSize: 12,
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
