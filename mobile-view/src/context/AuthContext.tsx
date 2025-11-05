import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  roles?: string[];
  hasCompletedFirstTimeSetup?: boolean;
}

interface AuthContextType {
  user: User | null;
  isFirstTime: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  // Debug: Log auth state
  useEffect(() => {
    console.log('Auth state:', { user: user?.email || 'null', loading, isFirstTime: user ? !user.hasCompletedFirstTimeSetup : false });
  }, [user, loading]);

  const checkAuth = async () => {
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 3000)
      );
      
      const authPromise = (async () => {
        const token = await AsyncStorage.getItem('authToken');
        const userData = await AsyncStorage.getItem('userData');
        
        if (token && userData) {
          apiService.setToken(token);
          const user = JSON.parse(userData);
          setUser(user);
        } else {
          // No stored auth, ensure user is null
          setUser(null);
        }
      })();

      await Promise.race([authPromise, timeoutPromise]);
    } catch (error) {
      console.error('Auth check error:', error);
      // On error, clear any invalid data and show login
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.post('/auth/login', { email, password });
      const { token, ...userData } = response;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      apiService.setToken(token);
      setUser(userData);
    } catch (error: any) {
      // Provide more helpful error messages
      if (error.message) {
        throw error; // Already has a helpful message
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Cannot connect to server. Please check API_SETUP.md for configuration help.');
      }
      throw new Error(error.message || 'Login failed. Please try again.');
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
    apiService.setToken('');
    setUser(null);
  };

  const isFirstTime = user ? !user.hasCompletedFirstTimeSetup : false;

  return (
    <AuthContext.Provider value={{ user, isFirstTime, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

