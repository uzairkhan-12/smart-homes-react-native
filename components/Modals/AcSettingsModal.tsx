import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SensorDevice } from '../../types';

interface AcSettingsModalProps {
  visible: boolean;
  selectedAc: SensorDevice | null;
  onClose: () => void;
}

const AcSettingsModal: React.FC<AcSettingsModalProps> = ({
  visible,
  selectedAc,
  onClose,
}) => {
  const { isDark: isDarkTheme } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDarkTheme && styles.modalContentDark]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDarkTheme && styles.textDark]}>
              AC Settings - {selectedAc?.name}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={isDarkTheme ? "#fff" : "#333"} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={[styles.modalSectionTitle, isDarkTheme && styles.textDark]}>
              Temperature Control
            </Text>
            <View style={styles.tempControl}>
              <TouchableOpacity style={[styles.tempButton, isDarkTheme && styles.tempButtonDark]}>
                <Text style={[styles.tempButtonText, isDarkTheme && styles.textDark]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.tempValue, isDarkTheme && styles.textDark]}>22°C</Text>
              <TouchableOpacity style={[styles.tempButton, isDarkTheme && styles.tempButtonDark]}>
                <Text style={[styles.tempButtonText, isDarkTheme && styles.textDark]}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSectionTitle, isDarkTheme && styles.textDark]}>
              Mode
            </Text>
            <View style={styles.modeContainer}>
              {['Cool', 'Heat', 'Fan', 'Auto'].map(mode => (
                <TouchableOpacity 
                  key={mode}
                  style={[styles.modeButton, isDarkTheme && styles.modeButtonDark]}
                >
                  <Text style={[styles.modeButtonText, isDarkTheme && styles.textDark]}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalSectionTitle, isDarkTheme && styles.textDark]}>
              Fan Speed
            </Text>
            <View style={styles.modeContainer}>
              {['Low', 'Medium', 'High', 'Auto'].map(speed => (
                <TouchableOpacity 
                  key={speed}
                  style={[styles.modeButton, isDarkTheme && styles.modeButtonDark]}
                >
                  <Text style={[styles.modeButtonText, isDarkTheme && styles.textDark]}>{speed}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.saveButton, isDarkTheme && styles.saveButtonDark]}
              onPress={onClose}
            >
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalContentDark: {
    backgroundColor: '#1e1e1e',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  tempControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tempButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tempButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  tempButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  tempValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  modeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonDark: {
    backgroundColor: '#2a2a2a',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDark: {
    backgroundColor: '#1565C0',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textDark: {
    color: '#fff',
  },
});

export default AcSettingsModal;