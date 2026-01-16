import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadAuthTokens, setAuthTokens, setLogoutCallback } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (userData: any, tokens: { access: string; refresh: string }) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set logout callback for API layer
    setLogoutCallback(logout);
    
    // Check if user is logged in on app start
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      const userData = await AsyncStorage.getItem('user_data');

      if (accessToken && refreshToken && userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
        console.log('AuthContext - checkAuthState: user authenticated');
        console.log('AuthContext - setting api tokens from stored data');
        // Also update the api tokens
        const { setAuthTokens } = await import('../services/api');
        setAuthTokens(accessToken, refreshToken);
      } else {
        console.log('AuthContext - checkAuthState: user not authenticated');
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData: any, tokens: { access: string; refresh: string }) => {
    try {
      console.log('AuthContext login - saving tokens to AsyncStorage');
      await AsyncStorage.setItem('access_token', tokens.access);
      await AsyncStorage.setItem('refresh_token', tokens.refresh);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      console.log('AuthContext - login successful, isAuthenticated set to true');
      console.log('AuthContext - tokens saved, calling setAuthTokens');
      // Also update the api tokens
      const { setAuthTokens } = await import('../services/api');
      setAuthTokens(tokens.access, tokens.refresh);
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('user_data');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};