import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, View } from 'react-native';
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
      <View style={[styles.grid, { gap: 6 }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 12,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
    paddingHorizontal: 4,
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