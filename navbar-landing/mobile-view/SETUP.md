# Mobile App Setup Guide

## Prerequisites

1. Node.js (v18 or higher)
2. npm or yarn
3. Expo Go app installed on your phone (iOS/Android)
4. Backend server running (see backend setup)

## Installation Steps

### 1. Install Dependencies

```bash
cd mobile-view
npm install
```

### 2. Configure API URL

Open `src/services/api.ts` and update the `API_BASE_URL`:

**For local development (using emulator/simulator):**
```typescript
const API_BASE_URL = 'http://localhost:5000/api';
```

**For physical device (replace with your computer's IP):**
```typescript
const API_BASE_URL = 'http://192.168.1.X:5000/api';
```

To find your IP address:
- **Windows**: Run `ipconfig` in Command Prompt
- **Mac/Linux**: Run `ifconfig` in Terminal

**For production:**
```typescript
const API_BASE_URL = 'https://your-backend-domain.com/api';
```

### 3. Start Backend Server

Make sure your backend is running on port 5000:

```bash
cd ../backend
npm install  # If not already done
npm run dev  # or npm start
```

### 4. Start Mobile App

```bash
cd mobile-view
npm start
```

This will:
- Start the Expo development server
- Display a QR code in the terminal
- Open Expo DevTools in your browser

### 5. Run on Device

#### Option A: Using Expo Go (Recommended for Development)

1. Install **Expo Go** app on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Scan the QR code:
   - **iOS**: Use the Camera app to scan the QR code
   - **Android**: Use the Expo Go app to scan the QR code

3. The app will load on your device

#### Option B: Using Emulator/Simulator

**Android:**
```bash
npm run android
```

**iOS (macOS only):**
```bash
npm run ios
```

**Web (for testing):**
```bash
npm run web
```

## Troubleshooting

### Connection Issues

If you can't connect to the backend:

1. **Check if backend is running**: Visit `http://localhost:5000/api/health` in browser
2. **Check IP address**: Make sure you're using the correct IP for physical devices
3. **Check firewall**: Ensure port 5000 is not blocked
4. **Check CORS**: Backend should allow requests from mobile app

### Permission Issues

The app requires:
- **Camera**: For capturing photos
- **Location**: For GPS tracking

These are requested at runtime. If denied, you can enable them in:
- **iOS**: Settings > Privacy
- **Android**: Settings > Apps > CRM Mobile App > Permissions

### Common Errors

**"Network request failed"**
- Check API_BASE_URL is correct
- Ensure backend is running
- Check device and computer are on same network (for physical device)

**"Token is not valid"**
- User may need to login again
- Check backend JWT_SECRET is set

**"Location permission denied"**
- Enable location permission in device settings
- Restart the app

## Development Tips

1. **Hot Reload**: Changes to code automatically reload in Expo Go
2. **Debugging**: Shake device or press `d` in terminal to open developer menu
3. **Logs**: Check terminal for console logs
4. **Network**: Use React Native Debugger or Chrome DevTools for network inspection

## Building for Production

When ready to build standalone apps:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Features

✅ Employee/Trainer login
✅ First-time login attendance tracking
✅ Role-based dashboards (Sales BDE, Trainer, or both)
✅ DC capture with location tracking
✅ Photo capture
✅ Pincode to town auto-population
✅ Product categories (including Financial Literacy, Brain Bytes, Spelling Bee, Skill Pro)
✅ School and product category selection

## API Endpoints Used

- `POST /api/auth/login` - User login
- `POST /api/attendance/check-in` - First-time attendance
- `GET /api/location/get-town?pincode=XXXXXX` - Pincode lookup
- `GET /api/dc/employee/my` - Get employee DCs
- `POST /api/dc-orders` - Create DC order
- `POST /api/dc/raise` - Raise DC from order
- `PUT /api/dc/:id` - Update DC

