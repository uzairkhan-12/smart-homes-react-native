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

  // Group sensors by type for headings - first 4 water sensors are ceiling, rest are floor
  const waterSensors = sensors.filter(sensor => sensor.type === 'water');
  const ceilingSensors = waterSensors.slice(0, 4); // First 4 water sensors
  const floorSensors = waterSensors.slice(4); // Rest of water sensors
  const radarSensors = sensors.filter(sensor => sensor.type === 'radar');
  const securitySensors = sensors.filter(sensor => sensor.type === 'security' || sensor.type === 'door');

  const renderSensorGroup = (sensorList: SensorDevice[], itemsPerRow: number, startingNumber: number = 1) => {
    const sensorWidth = itemsPerRow === 4 ? '23%' : '48%';
    
    return sensorList.map((sensor, index) => {
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
          {/* Sensor number */}
          <View style={[styles.sensorNumber, isDark && styles.sensorNumberDark]}>
            <Text style={[styles.sensorNumberText, isDark && styles.sensorNumberTextDark]}>
              {startingNumber + index}
            </Text>
          </View>
          
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

  const renderSensorSection = (sensorList: SensorDevice[], heading: string, itemsPerRow: number = 4, startingNumber: number = 1) => {
    if (sensorList.length === 0) return null;

    return (
      <View style={styles.sensorSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeading, isDark && styles.sectionHeadingDark]}>
            {heading}
          </Text>
        </View>
        <View style={styles.sensorsGrid}>
          {renderSensorGroup(sensorList, itemsPerRow, startingNumber)}
        </View>
      </View>
    );
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
      
      {/* Main sensors container with entrance/back labels */}
      <View style={styles.sectionWithLabels}>
        {/* Entrance label */}
        <View style={styles.verticalLabelContainer}>
          <View style={[styles.verticalLabel, isDark && styles.verticalLabelDark]}>
            <Text style={[styles.verticalLabelText, isDark && styles.verticalLabelTextDark]}>
              E N T R A N C E
            </Text>
          </View>
        </View>
        
        {/* Sensors sections */}
        <View style={styles.sensorsContainer}>
          {renderSensorSection(ceilingSensors, "Ceiling Sensors", 4, 1)}
          {renderSensorSection(floorSensors, "Floor Sensors", 4, 1)}
          {renderSensorSection(radarSensors, "Radar Sensors", 4, 1)}
          {renderSensorSection(securitySensors, "Security Sensors", 2, 1)}
        </View>
        
        {/* Interior label */}
        <View style={styles.verticalLabelContainer}>
          <View style={[styles.verticalLabel, isDark && styles.verticalLabelDark]}>
            <Text style={[styles.verticalLabelText, isDark && styles.verticalLabelTextDark]}>
              B A C K
            </Text>
          </View>
        </View>
      </View>
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
  sectionWithLabels: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    flex: 1,
  },
  verticalLabelContainer: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  verticalLabel: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 8,
    transform: [{ rotate: '-90deg' }],
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalLabelDark: {
    backgroundColor: '#374151',
  },
  verticalLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
    textAlign: 'center',
  },
  verticalLabelTextDark: {
    color: '#d1d5db',
  },
  sensorsContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  sensorSection: {
    marginBottom: 6, // Reduced from 12 to 6
  },
  sectionHeader: {
    marginBottom: 4, // Reduced from 8 to 4
  },
  sectionHeading: {
    fontSize: 11, // Slightly smaller font
    fontWeight: '600',
    color: '#4b5563',
    marginLeft: 2,
  },
  sectionHeadingDark: {
    color: '#d1d5db',
  },
  sensorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoMessage: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 8, // Reduced from 12 to 8
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
    marginBottom: 6, // Reduced from 8 to 6
    alignItems: 'center',
    position: 'relative',
    minHeight: 52, // Reduced from 56 to 52
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
  sensorNumber: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  sensorNumberDark: {
    backgroundColor: 'rgba(57, 55, 55, 0.8)',
  },
  sensorNumberText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
  sensorNumberTextDark: {
    color: '#fff',
  },
});

export default SensorStatusPanel;