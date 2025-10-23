import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function UniversalFooter() {
  const { isDark } = useTheme();

  const dynamicStyles = StyleSheet.create({
    footer: {
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#e5e7eb',
      paddingVertical: 20, // Increased from 12
      paddingHorizontal: 20,
      shadowColor: isDark ? '#000000' : '#000000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 12,
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize: 16, // Increased from 14
      color: isDark ? '#9ca3af' : '#6b7280',
      fontWeight: '500',
      marginRight: 6,
    },
    heart: {
      fontSize: 18, // Increased from 16
      color: '#420f0fff',
      marginHorizontal: 4,
    },
    text2: {
      fontSize: 16, // Increased from 14
      color: isDark ? '#9ca3af' : '#6b7280',
      fontWeight: '500',
      marginLeft: 6,
      marginRight: 8,
    },
    logo: {
      width: 50, // Increased from 40
      height: 50, // Increased from 40
      resizeMode: 'contain',
    },
  });

  return (
    <View style={dynamicStyles.footer}>
      <View style={dynamicStyles.container}>
        <Text style={dynamicStyles.text}>Made with</Text>
        <Text style={dynamicStyles.heart}>♥</Text>
        <Text style={dynamicStyles.text2}>by</Text>
        <Image
          source={
            isDark
              ? require('../../assets/images/whitelogo.png')
              : require('../../assets/images/PMLogo.png')
          }
          style={dynamicStyles.logo}
        />
      </View>
    </View>
  );
}