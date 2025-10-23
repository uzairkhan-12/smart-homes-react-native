import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SensorDevice } from '../../types';

interface DeviceSectionProps {
  title: string;
  devices: SensorDevice[];
  icon: string;
  itemsPerRow?: number;
  children: React.ReactNode;
}

const DeviceSection: React.FC<DeviceSectionProps> = ({
  title,
  devices,
  icon,
  itemsPerRow = 2,
  children,
}) => {
  const { isDark: isDarkTheme } = useTheme();

  if (devices.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, isDarkTheme && styles.textDark]}>
        {icon} {title} ({devices.length})
      </Text>
      <View style={[styles.grid, { gap: 12 }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  textDark: {
    color: '#fff',
  },
});

export default DeviceSection;