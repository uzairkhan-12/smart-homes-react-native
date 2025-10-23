import { deviceStorageService } from '@/src/services/DeviceStorageService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Indigo palette for consistent coloring
const INDIGO = {
  50:  '#EEF2FF',
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
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  // Load theme preference on mount
  React.useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await deviceStorageService.loadThemePreference();
      setIsDarkTheme(savedTheme === 'dark');
    } catch {
      setIsDarkTheme(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    try {
      await deviceStorageService.saveThemePreference(newTheme ? 'dark' : 'light');
    } catch {
      console.error('Failed to save theme preference');
    }
  };

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
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
        // Replace this with your actual login logic
        const success = await mockLogin(fullCode);
        if (success) {
          router.replace('/settings');
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

  // Mock login function - replace with your actual authentication
  const mockLogin = async (code: string): Promise<boolean> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(code === '123456'); // Simple mock validation
      }, 1500);
    });
  };

  const isCodeComplete = code.every(digit => digit !== '') && !isLoading;

  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: isDarkTheme ? '#121212' : '#f5f5f5' 
    },
    containerDark: { 
      backgroundColor: '#121212' 
    },
    themeToggleContainer: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 1000,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logoImage: {
      width: 120,
      height: 80,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: isDarkTheme ? '#fff' : '#333',
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: isDarkTheme ? '#aaa' : '#666',
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
      color: isDarkTheme ? '#aaa' : '#666',
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
      borderColor: isDarkTheme ? '#333' : '#ddd',
      borderRadius: 12,
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      color: isDarkTheme ? '#fff' : '#333',
      backgroundColor: isDarkTheme ? '#2a2a2a' : '#fafafa',
      shadowColor: 'rgba(0,0,0,0.05)',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      elevation: 2,
    },
    codeInputFocused: {
      borderColor: INDIGO[600],
      backgroundColor: isDarkTheme ? INDIGO[900] : INDIGO[50],
    },
    codeInputFilled: {
      borderColor: INDIGO[500],
      backgroundColor: isDarkTheme ? '#2a2a2a' : '#fafafa',
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
      color: isDarkTheme ? '#aaa' : '#666',
      textAlign: 'center',
      lineHeight: 20,
    },
    themeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDarkTheme ? '#2a2a2a' : '#f0f0f0',
    },
    textDark: { 
      color: '#fff' 
    },
  });

  return (
    <SafeAreaView style={styles.container}>
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
              name={isDarkTheme ? "moon" : "sunny"}
              size={20}
              color={isDarkTheme ? "#ffd700" : "#ff8c00"}
            />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ flex: 1 }}>
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Image 
                source={isDarkTheme
                  ? require('../../assets/images/dbf-white.png')
                  : require('../../assets/images/dbf-black.png')
                }
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Enter your 6-digit access code
            </Text>

            {/* 6-Digit Code Input */}
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}