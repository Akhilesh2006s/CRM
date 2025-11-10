import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// IMPORTANT: Update this to your computer's IP address for physical device testing
// For iOS Simulator/Android Emulator: use 'localhost' or '127.0.0.1'
// For physical device: use your computer's IP address (e.g., 'http://192.168.1.100:5000/api')
// To find your IP: Windows: ipconfig | Mac/Linux: ifconfig
// Look for IPv4 Address (usually 192.168.x.x or 10.0.x.x)

// Local development API URL
const DEV_API_URL = Platform.OS === 'web' 
  ? 'http://localhost:5000/api'
  : 'http://localhost:5000/api'; // For emulator/simulator, use localhost

// Production API URL (currently set to localhost for development)
const PROD_API_URL = 'http://localhost:5000/api';

// Always use localhost for now
const API_BASE_URL = DEV_API_URL;

class ApiService {
  private baseURL: string;
  private token: string = '';

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async getHeaders() {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Try to get token from storage if not set
    if (!this.token) {
      const storedToken = await AsyncStorage.getItem('authToken');
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }
    }

    return headers;
  }

  async get(endpoint: string) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseURL}${endpoint}`, { 
        headers,
        timeout: 10000, // 10 second timeout
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message?.includes('Network Error') || error.message?.includes('timeout')) {
        throw new Error(`Cannot connect to server. Make sure:\n1. Backend is running on port 5000\n2. API URL is correct (currently: ${this.baseURL})\n3. Device and computer are on same network\n4. Firewall allows port 5000`);
      }
      throw error;
    }
  }

  async post(endpoint: string, data: any) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(`${this.baseURL}${endpoint}`, data, { 
        headers,
        timeout: 30000, // 30 second timeout for posts (may have image uploads)
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message?.includes('Network Error') || error.message?.includes('timeout')) {
        throw new Error(`Cannot connect to server. Make sure:\n1. Backend is running on port 5000\n2. API URL is correct (currently: ${this.baseURL})\n3. Device and computer are on same network\n4. Firewall allows port 5000`);
      }
      throw error;
    }
  }

  async put(endpoint: string, data: any) {
    const headers = await this.getHeaders();
    const response = await axios.put(`${this.baseURL}${endpoint}`, data, { headers });
    return response.data;
  }

  async delete(endpoint: string) {
    const headers = await this.getHeaders();
    const response = await axios.delete(`${this.baseURL}${endpoint}`, { headers });
    return response.data;
  }
}

export const apiService = new ApiService(API_BASE_URL);

