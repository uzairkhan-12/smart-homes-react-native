// Centralized color scheme for the entire app
export const Colors = {
  light: {
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceSecondary: '#f8f9fa',
    text: '#1a1a1a',
    textSecondary: '#666666',
    textTertiary: '#999999',
    border: '#e5e5e5',
    borderSecondary: '#dddddd',
    primary: '#007AFF',
    primaryDark: '#0056CC',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#f44336',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    background: '#121212',
    surface: '#1e1e1e',
    surfaceSecondary: '#2a2a2a',
    text: '#ffffff',
    textSecondary: '#aaaaaa',
    textTertiary: '#888888',
    border: '#374151',
    borderSecondary: '#4b5563',
    primary: '#1565C0',
    primaryDark: '#0d47a1',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#f44336',
    shadow: 'rgba(0, 0, 0, 0.3)',
  }
};

// Helper function to get colors based on theme
export const getColors = (isDark: boolean) => {
  return isDark ? Colors.dark : Colors.light;
};