# Step-by-Step Setup Instructions

## 🎯 Complete Setup Guide

Follow these steps in order to get everything working.

### Phase 1: Install Required Software

1. **Install Node.js**
   - Download from [nodejs.org](https://nodejs.org/)
   - Install version 16 or higher
   - Verify: `node --version`

2. **Install Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

3. **Install Expo Go App**
   - **iOS:** App Store → Search "Expo Go" → Install
   - **Android:** Play Store → Search "Expo Go" → Install

### Phase 2: Set Up Mobile App

1. **Navigate to mobile-view folder**
   ```bash
   cd mobile-view
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install WebView package** (if not already installed)
   ```bash
   npx expo install react-native-webview
   ```

### Phase 3: Configure Your Environment

1. **Backend Configuration**
   - Ensure your backend server is running
   - Default port: Check `backend/server.js` for PORT
   - Update API URL in `mobile-view/src/config/api.ts` if needed

2. **Web App Configuration**
   - Ensure your web app is running (`cd navbar-landing && npm run dev`)
   - Default port: 3001
   - Update WEB_APP_URL in `mobile-view/src/screens/WebApp/WebAppScreen.tsx` if needed

### Phase 4: Start Development Servers

**Terminal 1: Backend Server**
```bash
cd backend
npm start
```

**Terminal 2: Web Application**
```bash
cd navbar-landing
npm run dev
```

**Terminal 3: Mobile App (Expo)**
```bash
cd mobile-view
npm start
```

### Phase 5: Connect Your Device

1. **Open Expo Go app** on your phone

2. **Scan QR Code**
   - The QR code appears in Terminal 3
   - Use Expo Go's "Scan QR Code" feature
   - Or manually enter the URL shown

3. **Wait for app to load**
   - First load may take a minute
   - Watch for any error messages

### Phase 6: Test Web App Integration

1. **Open the mobile app** on your device
2. **Navigate to Dashboard**
3. **Find "Web App" option** in the menu
4. **Tap to open** - your web app should load in WebView

## 🔍 Verification Checklist

- [ ] Node.js installed and working
- [ ] Expo CLI installed globally
- [ ] Expo Go app installed on device
- [ ] Mobile app dependencies installed
- [ ] Backend server running
- [ ] Web app running on port 3001
- [ ] Expo dev server running
- [ ] Mobile app connected via Expo Go
- [ ] Web app accessible from mobile app

## 🚨 Common Issues & Solutions

### Issue 1: "Unable to connect to Metro"
**Solution:**
- Check Wi-Fi connection
- Ensure phone and computer on same network
- Try: `expo start --tunnel`

### Issue 2: "Module not found: react-native-webview"
**Solution:**
```bash
cd mobile-view
npx expo install react-native-webview
```

### Issue 3: WebView shows blank page
**Solution:**
- Verify web app is running: `http://localhost:3001`
- Check WEB_APP_URL in WebAppScreen.tsx
- For physical device, use your computer's IP: `http://192.168.x.x:3001`

### Issue 4: CORS errors
**Solution:**
- Check backend CORS configuration
- Ensure backend allows requests from mobile app origin

## 📝 Network Configuration for Physical Devices

When testing on a physical device, you need to use your computer's local IP address instead of `localhost`.

1. **Find your computer's IP address:**
   - **Windows:** `ipconfig` (look for IPv4 Address)
   - **Mac/Linux:** `ifconfig` or `ip addr`

2. **Update URLs:**
   - Backend API: `http://YOUR_IP:PORT`
   - Web App: `http://YOUR_IP:3001`

3. **Example:**
   ```typescript
   // If your IP is 192.168.1.100
   const API_BASE_URL = 'http://192.168.1.100:5000';
   const WEB_APP_URL = 'http://192.168.1.100:3001';
   ```

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Expo Go app loads your mobile app
- ✅ You can navigate through mobile app screens
- ✅ Web app loads in WebView without errors
- ✅ Authentication works (if applicable)
- ✅ API calls succeed

---

**Ready to start?** Begin with Phase 1 and work through each phase sequentially.
