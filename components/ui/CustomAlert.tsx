import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { getColors } from '@/constants/colors';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

export default function CustomAlert({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  onDismiss,
}: CustomAlertProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const getButtonStyle = (style?: string) => {
    switch (style) {
      case 'destructive':
        return {
          color: isDark ? '#ff6b6b' : '#dc3545',
          fontWeight: '600' as const,
        };
      case 'cancel':
        return {
          color: colors.textSecondary,
          fontWeight: '400' as const,
        };
      default:
        return {
          color: isDark ? '#4dabf7' : '#007bff',
          fontWeight: '500' as const,
        };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.alertContainer,
          { backgroundColor: colors.surface }
        ]}>
          <Text style={[
            styles.title,
            { color: colors.text }
          ]}>
            {title}
          </Text>
          
          {message && (
            <Text style={[
              styles.message,
              { color: colors.textSecondary }
            ]}>
              {message}
            </Text>
          )}

          <View style={[
            styles.buttonContainer,
            { borderTopColor: colors.border }
          ]}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  index < buttons.length - 1 && styles.buttonBorder,
                  { borderColor: colors.border }
                ]}
                onPress={() => handleButtonPress(button)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.buttonText,
                  getButtonStyle(button.style)
                ]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    borderRadius: 16,
    padding: 0,
    minWidth: 280,
    maxWidth: Dimensions.get('window').width - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBorder: {
    borderRightWidth: 0.5,
  },
  buttonText: {
    fontSize: 16,
  },
});