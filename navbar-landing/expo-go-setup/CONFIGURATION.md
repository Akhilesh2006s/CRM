# Configuration Guide

This document explains how to configure your Expo Go setup and web app integration.

## 📋 Configuration Files

### 1. Mobile App API Configuration

**File:** `mobile-view/src/services/api.ts`

```typescript
// For local development (emulator/simulator)
const DEV_API_URL = 'http://localhost:5000/api';

// For physical device testing
const DEV_API_URL = 'http://YOUR_COMPUTER_IP:5000/api';

// For production
const PROD_API_URL = 'https://your-production-api.com/api';
```

**How to find your computer's IP:**
- **Windows:** Open Command Prompt → `ipconfig` → Look for "IPv4 Address"
- **Mac/Linux:** Open Terminal → `ifconfig` or `ip addr` → Look for inet address

### 2. Web App URL Configuration

**File:** `mobile-view/src/screens/WebApp/WebAppScreen.tsx`

```typescript
const WEB_APP_URL = __DEV__
  ? Platform.OS === 'web'
    ? 'http://localhost:3001'
    : 'http://YOUR_COMPUTER_IP:3001' // Change to your computer's IP
  : 'https://your-production-url.com'; // Production URL
```

**Default Ports:**
- Web App: `3001` (Next.js default)
- Backend API: `5000` (Node.js default)

### 3. Expo Configuration

**File:** `mobile-view/app.json`

This file contains your Expo app configuration. Key settings:
- App name and slug
- Bundle identifiers
- Permissions
- Plugins

### 4. Package Dependencies

**File:** `mobile-view/package.json`

Ensure these packages are installed:
- `expo` - Expo SDK
- `react-native-webview` - For WebView component
- `@react-navigation/native` - Navigation
- `axios` - API calls

## 🔧 Environment-Specific Configuration

### Development (Local)

```typescript
// API
const API_BASE_URL = 'http://localhost:5000/api';

// Web App
const WEB_APP_URL = 'http://localhost:3001';
```

### Physical Device Testing

```typescript
// API (replace with your IP)
const API_BASE_URL = 'http://192.168.1.100:5000/api';

// Web App (replace with your IP)
const WEB_APP_URL = 'http://192.168.1.100:3001';
```

### Production

```typescript
// API
const API_BASE_URL = 'https://api.yourdomain.com/api';

// Web App
const WEB_APP_URL = 'https://app.yourdomain.com';
```

## 🌐 Network Configuration

### Same Network Requirement

For physical device testing, ensure:
1. ✅ Phone and computer are on the same Wi-Fi network
2. ✅ Firewall allows connections on ports 3001 and 5000
3. ✅ Use computer's local IP address (not localhost)

### Firewall Settings

**Windows:**
1. Open Windows Defender Firewall
2. Allow apps through firewall
3. Add Node.js and Expo to allowed apps

**Mac:**
1. System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Allow Node.js and Expo

## 🔐 Security Considerations

### Development
- Using HTTP is acceptable for local development
- Ensure backend CORS is configured correctly

### Production
- **Always use HTTPS** for production
- Configure proper CORS policies
- Use environment variables for sensitive URLs
- Implement proper authentication

## 📱 Platform-Specific Notes

### iOS
- May require additional permissions in `app.json`
- Test on physical device for best results
- Simulator uses `localhost` automatically

### Android
- Emulator uses `10.0.2.2` instead of `localhost`
- Physical device requires computer's IP address
- May need to configure network security config

## 🚀 Quick Configuration Checklist

- [ ] Backend server running on port 5000
- [ ] Web app running on port 3001
- [ ] API URL configured in `api.ts`
- [ ] Web app URL configured in `WebAppScreen.tsx`
- [ ] Computer IP address identified
- [ ] Firewall configured
- [ ] Phone and computer on same network
- [ ] `react-native-webview` installed

## 🔍 Testing Configuration

### Test API Connection
1. Open mobile app
2. Try to login or fetch data
3. Check console for connection errors
4. Verify API URL is correct

### Test Web App Access
1. Navigate to "Web App" in mobile app
2. WebView should load your web application
3. Check for CORS or connection errors
4. Verify web app URL is correct

## 📝 Environment Variables (Optional)

For better configuration management, consider using environment variables:

**Install:** `expo-constants` and `react-native-config`

```typescript
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000/api';
const WEB_APP_URL = Constants.expoConfig?.extra?.webAppUrl || 'http://localhost:3001';
```

Then in `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:5000/api",
      "webAppUrl": "http://localhost:3001"
    }
  }
}
```

---

**Need help?** Check the troubleshooting section in `SETUP_INSTRUCTIONS.md`
