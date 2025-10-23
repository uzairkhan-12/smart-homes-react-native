import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

interface EntityDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  entities: Array<{
    id: string;
    name: string;
    value: string;
    unit: string;
    icon: string;
    type: 'temperature' | 'humidity' | 'other';
  }>;
}

export default function EntityDetailsModal({ 
  visible, 
  onClose, 
  entities 
}: EntityDetailsModalProps) {
  const { isDark } = useTheme();

  const getIconColor = (type: string) => {
    switch (type) {
      case 'temperature':
        return isDark ? '#fbbf24' : '#f59e0b';
      case 'humidity':
        return isDark ? '#3b82f6' : '#2563eb';
      default:
        return isDark ? '#9ca3af' : '#6b7280';
    }
  };

  const dynamicStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContainer: {
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
      borderRadius: 16,
      padding: 24,
      width: '80%',
      maxWidth: 500,
      maxHeight: '70%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 10,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#1a1a1a',
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    entityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 8,
      backgroundColor: isDark ? '#374151' : '#f9fafb',
      borderRadius: 12,
    },
    entityIcon: {
      marginRight: 12,
    },
    entityInfo: {
      flex: 1,
    },
    entityName: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#ffffff' : '#1a1a1a',
    },
    entityValue: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#10b981' : '#059669',
      marginTop: 2,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 8,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={dynamicStyles.modalOverlay}>
        <View style={dynamicStyles.modalContainer}>
          <View style={dynamicStyles.header}>
            <Text style={dynamicStyles.title}>Entity Details</Text>
            <TouchableOpacity
              style={dynamicStyles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={20}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {entities.length > 0 ? (
              entities.map((entity) => (
                <View key={entity.id} style={dynamicStyles.entityItem}>
                  <View style={dynamicStyles.entityIcon}>
                    <Ionicons
                      name={entity.icon as any}
                      size={24}
                      color={getIconColor(entity.type)}
                    />
                  </View>
                  <View style={dynamicStyles.entityInfo}>
                    <Text style={dynamicStyles.entityName}>{entity.name}</Text>
                    <Text style={dynamicStyles.entityValue}>
                      {entity.value} {entity.unit}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={dynamicStyles.emptyState}>
                <Ionicons
                  name="information-circle-outline"
                  size={48}
                  color={isDark ? '#9ca3af' : '#6b7280'}
                />
                <Text style={dynamicStyles.emptyText}>
                  No sensor data available
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}