import { useTheme } from '@/context/ThemeContext';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BinarySensorData, SensorDevice } from '../../types';

interface SensorStatusPanelProps {
  sensors: SensorDevice[];
  binarySensorData: { [key: string]: BinarySensorData };
  onSensorPress: (sensor: SensorDevice, data: BinarySensorData | null) => void;
}

const SensorStatusPanel: React.FC<SensorStatusPanelProps> = ({
  sensors,
  binarySensorData,
  onSensorPress
}) => {
  const { isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Check sensor states
  const allSensorsConfigured = sensors.length > 0 && sensors.every(sensor => 
    sensor.entity && sensor.entity.trim() !== '' && binarySensorData[sensor.entity]
  );

  const hasActiveSensors = sensors.some(sensor => 
    sensor.entity && binarySensorData[sensor.entity]?.new_state === 'on'
  );

  const hasUnconfiguredSensors = sensors.some(sensor => 
    !sensor.entity || sensor.entity.trim() === '' || !binarySensorData[sensor.entity]
  );

  // Animation for active sensors
  useEffect(() => {
    if (hasActiveSensors) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [hasActiveSensors, pulseAnim]);

  const getSensorIcon = (type: string, isActive: boolean): string => {
    switch (type) {
      case 'water': 
        return isActive ? '🌊' : '💧'; // Water flowing vs water drop
      case 'radar': 
        return isActive ? '🏃' : '👤'; // Running person vs standing person
      case 'door': 
        return isActive ? '🔓' : '🚪'; // Open lock vs door
      case 'security': 
        return isActive ? '🔓' : '🔒'; // Open lock vs closed lock
      case 'motion': 
        return isActive ? '🏃' : '👤'; // Running vs standing person
      case 'occupancy': 
        return isActive ? '👥' : '👤'; // Multiple people vs single person
      default: 
        return '📊';
    }
  };

  const getSensorStatus = (sensor: SensorDevice): { hasIssue: boolean; status: string; isDisabled: boolean; color: string } => {
    if (!sensor.entity || sensor.entity.trim() === '') {
      return { hasIssue: false, status: 'Not Configured', isDisabled: true, color: '#6b7280' };
    }

    const data = binarySensorData[sensor.entity];
    if (!data) {
      return { hasIssue: false, status: 'No Data', isDisabled: true, color: '#6b7280' };
    }

    const isActive = data.new_state === 'on';
    
    // All active states are considered issues/warnings
    if (isActive) {
      switch (sensor.type) {
        case 'water':
          return { 
            hasIssue: true, 
            status: 'Water Detected!', 
            isDisabled: false,
            color: '#ef5350' // Red for active
          };
        case 'door':
          return { 
            hasIssue: true, 
            status: 'Door Open!', 
            isDisabled: false,
            color: '#ef5350' // Red for active
          };
        case 'security':
          return { 
            hasIssue: true, 
            status: 'Security Alert!', 
            isDisabled: false,
            color: '#ef5350' // Red for active
          };
        case 'radar':
          return { 
            hasIssue: true, 
            status: 'Motion Detected!', 
            isDisabled: false,
            color: '#ef5350' // Red for active
          };
        case 'motion':
          return { 
            hasIssue: true, 
            status: 'Motion Detected!', 
            isDisabled: false,
            color: '#ef5350' // Red for active
          };
        case 'occupancy':
          return { 
            hasIssue: true, 
            status: 'Occupancy Detected!', 
            isDisabled: false,
            color: '#ef5350' // Red for active
          };
        default:
          return { 
            hasIssue: true, 
            status: 'Activity Detected!', 
            isDisabled: false,
            color: '#ef5350' // Red for active
          };
      }
    }
    
    // Inactive states (normal/secure)
    switch (sensor.type) {
      case 'water':
        return { 
          hasIssue: false, 
          status: 'Normal', 
          isDisabled: false,
          color: '#10b981' // Green for normal
        };
      case 'door':
        return { 
          hasIssue: false, 
          status: 'Closed', 
          isDisabled: false,
          color: '#10b981' // Green for normal
        };
      case 'security':
        return { 
          hasIssue: false, 
          status: 'Secure', 
          isDisabled: false,
          color: '#10b981' // Green for normal
        };
      case 'radar':
      case 'motion':
      case 'occupancy':
        return { 
          hasIssue: false, 
          status: 'Clear', 
          isDisabled: false,
          color: '#10b981' // Green for normal
        };
      default:
        return { 
          hasIssue: false, 
          status: 'Inactive', 
          isDisabled: false,
          color: '#10b981' // Green for normal
        };
    }
  };

  const getStatusMessage = () => {
    if (hasUnconfiguredSensors) {
      return {
        text: 'Gray sensors need configuration in Settings',
        type: 'warning' as const
      };
    }
    
    if (hasActiveSensors) {
      return {
        text: '⚠️ Sensor alerts detected! Check status below',
        type: 'alert' as const
      };
    }
    
    if (allSensorsConfigured) {
      return {
        text: '✓ All sensors normal and secure',
        type: 'success' as const
      };
    }
    
    return {
      text: 'Configure sensors in Settings',
      type: 'warning' as const
    };
  };

  // Group sensors by layout type
  const regularSensors = sensors.filter(sensor => ['water', 'radar', 'motion', 'occupancy'].includes(sensor.type));
  const doorSecuritySensors = sensors.filter(sensor => ['door', 'security'].includes(sensor.type));

  const renderSensorGroup = (sensorList: SensorDevice[], itemsPerRow: number) => {
    const sensorWidth = itemsPerRow === 4 ? '23%' : '48%';
    
    return sensorList.map((sensor) => {
      const { hasIssue, status, isDisabled, color } = getSensorStatus(sensor);
      const data = binarySensorData[sensor.entity] || null;
      const isActive = !isDisabled && data?.new_state === 'on';
      
      const IconContainer = isActive ? Animated.View : View;
      const animatedStyle = isActive ? { transform: [{ scale: pulseAnim }] } : {};
      
      return (
        <TouchableOpacity
          key={sensor.id}
          style={[
            styles.sensorIcon,
            isDark && styles.sensorIconDark,
            isDisabled && styles.sensorIconDisabled,
            isDisabled && isDark && styles.sensorIconDisabledDark,
            !isDisabled && { borderColor: color, borderWidth: 2 },
            { width: sensorWidth }
          ]}
          onPress={() => !isDisabled && onSensorPress(sensor, data)}
          disabled={isDisabled}
        >
          <IconContainer style={[styles.iconContainer, animatedStyle]}>
            <Text style={[styles.iconText, isDisabled && styles.iconTextDisabled]}>
              {getSensorIcon(sensor.type, isActive)}
            </Text>
          </IconContainer>
          <Text 
            style={[
              styles.sensorName, 
              isDark && styles.sensorNameDark,
              isDisabled && styles.sensorNameDisabled,
              !isDisabled && { color }
            ]} 
            numberOfLines={1}
          >
            {sensor.name.split(' ')[0]}
          </Text>
          <View style={[
            styles.statusDot,
            { backgroundColor: color }
          ]} />
        </TouchableOpacity>
      );
    });
  };

  const statusMessage = getStatusMessage();

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.title, isDark && styles.titleDark]}>Sensors Status</Text>
      
      {/* Conditional status message */}
      <View style={[
        styles.infoMessage, 
        statusMessage.type === 'success' && styles.infoMessageSuccess,
        statusMessage.type === 'warning' && styles.infoMessageWarning,
        statusMessage.type === 'alert' && styles.infoMessageAlert,
        isDark && statusMessage.type === 'success' && styles.infoMessageSuccessDark,
        isDark && statusMessage.type === 'warning' && styles.infoMessageWarningDark,
        isDark && statusMessage.type === 'alert' && styles.infoMessageAlertDark,
      ]}>
        <Text style={[
          styles.infoText, 
          statusMessage.type === 'success' && styles.infoTextSuccess,
          statusMessage.type === 'warning' && styles.infoTextWarning,
          statusMessage.type === 'alert' && styles.infoTextAlert,
          isDark && statusMessage.type === 'success' && styles.infoTextSuccessDark,
          isDark && statusMessage.type === 'warning' && styles.infoTextWarningDark,
          isDark && statusMessage.type === 'alert' && styles.infoTextAlertDark,
        ]}>
          {statusMessage.text}
        </Text>
      </View>
      
      {/* Regular Sensors - 4 per row */}
      {regularSensors.length > 0 && (
        <View style={styles.sensorsGrid}>
          {renderSensorGroup(regularSensors, 4)}
        </View>
      )}
      
      {/* Door & Security Sensors - 2 per row */}
      {doorSecuritySensors.length > 0 && (
        <View style={[styles.sensorsGrid, regularSensors.length > 0 && styles.separateSection]}>
          {renderSensorGroup(doorSecuritySensors, 2)}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flex: 1,
  },
  containerDark: {
    backgroundColor: '#1e1e1e',
    shadowOpacity: 0.3,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 14,
    textAlign: 'center',
  },
  titleDark: {
    color: '#fff',
  },
  sensorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  separateSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  infoMessage: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  infoMessageSuccess: {
    backgroundColor: '#ecfdf5',
  },
  infoMessageWarning: {
    backgroundColor: '#fffbeb',
  },
  infoMessageAlert: {
    backgroundColor: '#fef2f2',
  },
  infoMessageSuccessDark: {
    backgroundColor: '#064e3b',
  },
  infoMessageWarningDark: {
    backgroundColor: '#451a03',
  },
  infoMessageAlertDark: {
    backgroundColor: '#7f1d1d',
  },
  infoText: {
    fontSize: 11,
    fontWeight: '500',
  },
  infoTextSuccess: {
    color: '#065f46',
  },
  infoTextWarning: {
    color: '#92400e',
  },
  infoTextAlert: {
    color: '#dc2626',
  },
  infoTextSuccessDark: {
    color: '#34d399',
  },
  infoTextWarningDark: {
    color: '#fbbf24',
  },
  infoTextAlertDark: {
    color: '#fca5a5',
  },
  sensorIcon: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    alignItems: 'center',
    position: 'relative',
    minHeight: 56,
    justifyContent: 'center',
  },
  sensorIconDark: {
    backgroundColor: '#2a2a2a',
  },
  sensorIconIssue: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ef5350',
  },
  sensorIconDisabled: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  sensorIconDisabledDark: {
    backgroundColor: '#1f2937',
    borderColor: '#4b5563',
  },
  iconText: {
    fontSize: 18,
    marginBottom: 4,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconTextDisabled: {
    opacity: 0.6,
  },
  sensorName: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  sensorNameDark: {
    color: '#aaa',
  },
  sensorNameIssue: {
    color: '#d32f2f',
    fontWeight: '600',
  },
  sensorNameDisabled: {
    color: '#9ca3af',
    opacity: 0.8,
  },
  statusDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default SensorStatusPanel;