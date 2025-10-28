import { deviceStorageService } from '@/src/services/DeviceStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  pin: string;
  role: 'Admin' | 'User' | 'Pro Admin';
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  hasAdminAccess: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@app_auth';
const USER_STORAGE_KEY = '@app_current_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    // Initialize default Pro Admin (non-editable system user)
    await deviceStorageService.initializeDefaultProAdmin();
    
    // Initialize default admin
    await deviceStorageService.initializeDefaultAdmin();
    
    // Also add a default regular user
    try {
      const users = await deviceStorageService.loadUsers();
      const userExists = users.some(u => u.role === 'User');
      if (!userExists) {
        const defaultUser: User = {
          id: 'user_1',
          name: 'User',
          pin: '111111',
          role: 'User'
        };
        await deviceStorageService.addUser(defaultUser);
        console.log('✅ Default regular user created');
      }
    } catch (error) {
      console.error('Error initializing default user:', error);
    }
    
    // Check authentication status
    checkAuth();
  };

  const checkAuth = async () => {
    try {
      const [authStatus, userData] = await AsyncStorage.multiGet([
        AUTH_STORAGE_KEY,
        USER_STORAGE_KEY
      ]);

      if (authStatus[1] === 'true' && userData[1]) {
        const user = JSON.parse(userData[1]);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (pin: string): Promise<boolean> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validate user PIN against stored users
      const validation = await deviceStorageService.validateUserPin(pin);
      
      if (validation.isValid && validation.user) {
        // Save authentication state and user data
        await AsyncStorage.multiSet([
          [AUTH_STORAGE_KEY, 'true'],
          [USER_STORAGE_KEY, JSON.stringify(validation.user)]
        ]);
        
        setCurrentUser(validation.user);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([AUTH_STORAGE_KEY, USER_STORAGE_KEY]);
      setIsAuthenticated(false);
      setCurrentUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  console.log('Current User Role:', currentUser?.role);
  const hasAdminAccess = currentUser?.role === 'Admin' || currentUser?.role === 'Pro Admin';

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      currentUser,
      login, 
      logout, 
      isLoading,
      hasAdminAccess 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}