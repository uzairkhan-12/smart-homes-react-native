import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

// Indigo palette
const INDIGO = {
  50: '#EEF2FF',
  100: '#E0E7FF',
  200: '#C7D2FE',
  300: '#A5B4FC',
  400: '#818CF8',
  500: '#6366F1',
  600: '#4F46E5',
  700: '#4338CA',
  800: '#3730A3',
  900: '#312E81',
};

export default function LoginScreen() {
  const { login } = useAuth();
  const { isDark, setTheme } = useTheme();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    if (index === 5 && text) {
      Keyboard.dismiss();
      setTimeout(handleLogin, 100);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleLogin = async () => {
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      setIsLoading(true);
      try {
        const success = await login(fullCode);
        if (success) {
          router.replace('/(tabs)');
        } else {
          Alert.alert('Login Failed', 'Invalid access code. Please try again.');
          setCode(['', '', '', '', '', '']);
          inputs.current[0]?.focus();
        }
      } catch (error) {
        Alert.alert('Error', 'An error occurred during login. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const isCodeComplete = code.every((digit) => digit !== '') && !isLoading;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#f5f5f5',
    },
    themeToggleContainer: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 1000,
    },
    // Remove the content paddingBottom since footer is now properly positioned
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logoImage: {
      width: 160,
      height: 120,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#333',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#aaa' : '#666',
      textAlign: 'center',
      marginBottom: 48,
    },
    codeContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 48,
    },
    inputGroup: {
      flexDirection: 'row',
    },
    dash: {
      color: isDark ? '#aaa' : '#666',
      fontSize: 24,
      fontWeight: 'bold',
      marginHorizontal: 16,
      alignSelf: 'center',
    },
    codeInput: {
      width: 50,
      height: 60,
      marginHorizontal: 4,
      borderWidth: 2,
      borderColor: isDark ? '#333' : '#ddd',
      borderRadius: 12,
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      color: isDark ? '#fff' : '#333',
      backgroundColor: isDark ? '#2a2a2a' : '#fafafa',
      shadowColor: 'rgba(0,0,0,0.05)',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      elevation: 2,
    },
    codeInputFocused: {
      borderColor: INDIGO[600],
      backgroundColor: isDark ? INDIGO[900] : INDIGO[50],
    },
    codeInputFilled: {
      borderColor: INDIGO[500],
      backgroundColor: isDark ? '#2a2a2a' : '#fafafa',
    },
    loginButton: {
      backgroundColor: INDIGO[600],
      paddingVertical: 14,
      paddingHorizontal: 48,
      borderRadius: 25,
      alignItems: 'center',
      marginBottom: 24,
      opacity: isCodeComplete ? 1 : 0.5,
      shadowColor: INDIGO[600],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
      minWidth: 140,
      alignSelf: 'center',
    },
    loginButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    helpText: {
      fontSize: 14,
      color: isDark ? '#aaa' : '#666',
      textAlign: 'center',
      lineHeight: 20,
    },
    themeToggle: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
    },
    // Improved footer styling
    footerContainer: {
      width: '100%',
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#e5e7eb',
      paddingVertical: 16,
      paddingBottom: Platform.OS === 'ios' ? 34 : 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 10,
    },
    footerTextRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    footerText: {
      fontSize: 16,
      color: isDark ? '#9ca3af' : '#6b7280',
      fontWeight: '500',
    },
    footerHeart: {
      color: '#e63946',
      marginHorizontal: 6,
      fontSize: 18,
    },
    footerLogo: {
      width: 50,
      height: 50,
      resizeMode: 'contain',
      marginLeft: 6,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Floating Theme Toggle */}
        <View style={styles.themeToggleContainer}>
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={20}
              color={isDark ? '#ffd700' : '#ff8c00'}
            />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.logoContainer}>
              <Image
                source={
                  isDark
                    ? require('../assets/images/dbf-white.png')
                    : require('../assets/images/dbf-black.png')
                }
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Enter your 6-digit access code</Text>

            <View style={styles.codeContainer}>
              <View style={styles.inputGroup}>
                {[0, 1, 2].map((index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputs.current[index] = ref; }}
                    style={[
                      styles.codeInput,
                      focusedIndex === index && styles.codeInputFocused,
                      code[index] && styles.codeInputFilled,
                    ]}
                    value={code[index]}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(null)}
                    onKeyPress={({ nativeEvent }) =>
                      handleKeyPress(nativeEvent.key, index)
                    }
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <Text style={styles.dash}>-</Text>

              <View style={styles.inputGroup}>
                {[3, 4, 5].map((index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputs.current[index] = ref; }}
                    style={[
                      styles.codeInput,
                      focusedIndex === index && styles.codeInputFocused,
                      code[index] && styles.codeInputFilled,
                    ]}
                    value={code[index]}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(null)}
                    onKeyPress={({ nativeEvent }) =>
                      handleKeyPress(nativeEvent.key, index)
                    }
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={!isCodeComplete}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Authenticating...' : 'Login'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.helpText}>
              Can't access your account?{'\n'}
              Contact support for assistance
            </Text>
          </ScrollView>

          {/* ✅ Improved Sticky Footer */}
          {!keyboardVisible && (
            <View style={styles.footerContainer}>
              <View style={styles.footerTextRow}>
                <Text style={styles.footerText}>Made with</Text>
                <Text style={styles.footerHeart}>♥</Text>
                <Text style={styles.footerText}>by</Text>
                <Image
                  source={
                    isDark
                      ? require('../assets/images/whitelogo.png')
                      : require('../assets/images/PMLogo.png')
                  }
                  style={styles.footerLogo}
                />
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}