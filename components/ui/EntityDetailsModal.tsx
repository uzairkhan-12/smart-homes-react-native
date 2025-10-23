import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EntityDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  entities: Array<{
    name: string;
    type: string;
    value: string;
    unit?: string;
    icon: string;
    color: string;
  }>;
}

export default function EntityDetailsModal({ visible, onClose, entities }: EntityDetailsModalProps) {
  const { isDark } = useTheme();

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
      width: '90%',
      maxHeight: '80%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#374151' : '#e5e7eb',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#ffffff' : '#1a1a1a',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? '#374151' : '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      padding: 20,
    },
    entityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 8,
      backgroundColor: isDark ? '#374151' : '#f9fafb',
      borderRadius: 12,
    },
    entityLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    entityIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    entityInfo: {
      flex: 1,
    },
    entityName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#ffffff' : '#1a1a1a',
    },
    entityType: {
      fontSize: 12,
      color: isDark ? '#9ca3af' : '#6b7280',
      marginTop: 2,
    },
    entityValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#ffffff' : '#1a1a1a',
      textAlign: 'right',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#9ca3af' : '#6b7280',
      textAlign: 'center',
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
          <View style={dynamicStyles.modalHeader}>
            <Text style={dynamicStyles.modalTitle}>Entity Details</Text>
            <TouchableOpacity
              style={dynamicStyles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={18}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={dynamicStyles.modalContent} showsVerticalScrollIndicator={false}>
            {entities.length > 0 ? (
              entities.map((entity, index) => (
                <View key={index} style={dynamicStyles.entityItem}>
                  <View style={dynamicStyles.entityLeft}>
                    <View style={[dynamicStyles.entityIcon, { backgroundColor: entity.color + '20' }]}>
                      <Ionicons
                        name={entity.icon as any}
                        size={20}
                        color={entity.color}
                      />
                    </View>
                    <View style={dynamicStyles.entityInfo}>
                      <Text style={dynamicStyles.entityName}>{entity.name}</Text>
                      <Text style={dynamicStyles.entityType}>{entity.type}</Text>
                    </View>
                  </View>
                  <Text style={dynamicStyles.entityValue}>
                    {entity.value}{entity.unit || ''}
                  </Text>
                </View>
              ))
            ) : (
              <View style={dynamicStyles.emptyState}>
                <Ionicons
                  name="analytics-outline"
                  size={48}
                  color={isDark ? '#374151' : '#e5e7eb'}
                  style={dynamicStyles.emptyIcon}
                />
                <Text style={dynamicStyles.emptyText}>
                  No sensor data available{'\n'}Configure your devices to see details here
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}