# Expo Go Setup Guide

This folder contains everything you need to set up Expo Go and integrate your web application with your mobile app.

## 📱 What is Expo Go?

Expo Go is a mobile app that lets you run your Expo React Native projects on your physical device without building a standalone app. It's perfect for development and testing.

## 🚀 Quick Start

### Step 1: Install Expo Go on Your Device

1. **For iOS (iPhone/iPad):**
   - Open the App Store
   - Search for "Expo Go"
   - Install the app

2. **For Android:**
   - Open Google Play Store
   - Search for "Expo Go"
   - Install the app

### Step 2: Install Dependencies

Navigate to the `mobile-view` folder and install dependencies:

```bash
cd mobile-view
npm install
```

### Step 3: Start the Development Server

```bash
npm start
```

This will:
- Start the Expo development server
- Display a QR code in your terminal
- Open Expo DevTools in your browser

### Step 4: Connect Your Device

**Option A: Scan QR Code (Recommended)**
1. Open Expo Go app on your phone
2. Tap "Scan QR Code"
3. Scan the QR code from your terminal
4. The app will load on your device

**Option B: Use Development Build URL**
1. Make sure your phone and computer are on the same Wi-Fi network
2. Open Expo Go app
3. Enter the URL shown in your terminal (e.g., `exp://192.168.1.100:8081`)

## 🌐 Accessing Your Web Application

Your mobile app now includes a WebView component that allows you to access your web application directly from within the mobile app.

### Features:
- ✅ Full web app access from mobile
- ✅ Seamless navigation between native and web views
- ✅ Shared authentication (if configured)
- ✅ Responsive design for mobile viewing

### How to Access:
1. Open the mobile app
2. Navigate to "Web App" from the dashboard or menu
3. The web application will load in a WebView

## 📋 Configuration

### Backend API URL
Update the API URL in `mobile-view/src/config/api.ts` if your backend is running on a different port:

```typescript
export const API_BASE_URL = 'http://your-backend-url:port';
```

### Web Application URL
Update the web app URL in `mobile-view/src/screens/WebApp/WebAppScreen.tsx`:

```typescript
const WEB_APP_URL = 'http://localhost:3001'; // Change to your web app URL
```

For production, use your deployed web app URL.

## 🔧 Development Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (installed globally): `npm install -g expo-cli`
- Expo Go app on your mobile device

### Running on Different Platforms

```bash
# Start Expo development server
npm start

# Run on Android emulator
npm run android

# Run on iOS simulator (macOS only)
npm run ios

# Run on web browser
npm run web
```

## 📱 Building for Production

When you're ready to build a standalone app:

### Android (APK)
```bash
expo build:android
```

### iOS (IPA)
```bash
expo build:ios
```

## 🐛 Troubleshooting

### Issue: Can't connect to development server
**Solution:** 
- Ensure your phone and computer are on the same Wi-Fi network
- Check firewall settings
- Try using tunnel mode: `expo start --tunnel`

### Issue: WebView not loading web app
**Solution:**
- Ensure your web app is running (`cd navbar-landing && npm run dev`)
- Check the WEB_APP_URL in WebAppScreen.tsx
- Verify CORS settings in your backend

### Issue: Authentication not working
**Solution:**
- Ensure backend API is running
- Check API_BASE_URL configuration
- Verify authentication tokens are being stored correctly

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native WebView](https://github.com/react-native-webview/react-native-webview)
- [Expo Go App Store](https://apps.apple.com/app/expo-go/id982107779)
- [Expo Go Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## 🎯 Next Steps

1. ✅ Install Expo Go on your device
2. ✅ Start the development server
3. ✅ Test the mobile app features
4. ✅ Access web app through WebView
5. ✅ Configure production URLs
6. ✅ Build standalone app when ready

---

**Need Help?** Check the troubleshooting section or refer to the Expo documentation.
