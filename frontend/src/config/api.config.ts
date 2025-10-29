import { Platform } from 'react-native';

// Platform-specific API URL configuration
const getApiUrl = (): string => {
  if (__DEV__) {
    // Development URLs
    if (Platform.OS === 'web') {
      return 'http://localhost:5000/api';
    } else if (Platform.OS === 'android') {
      // Use your computer's IP address or localhost for Android emulator
      // For physical device, use your computer's local IP: http://192.168.x.x:5000/api
      return 'http://localhost:5000/api';
    } else {
      return 'http://localhost:5000/api';
    }
  } else {
    // Production URL - Replace with your deployed backend URL
    return 'https://your-backend-domain.com/api';
  }
};

const API_URL = getApiUrl();

export { API_URL };
export default API_URL;

