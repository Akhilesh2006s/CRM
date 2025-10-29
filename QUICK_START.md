# Quick Start Guide - Cross-Platform CRM

## 🎯 One Codebase - Web, Android, iOS

This project uses **Expo** with **React Native** to create a single codebase that works on:
- ✅ **Web** (Desktop browsers)
- ✅ **Android** (Phones & Tablets)
- ✅ **iOS** (iPhone & iPad)

## 🚀 Run Locally (All Platforms)

### Step 1: Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend (in another terminal)
cd backend
npm install
```

### Step 2: Start Backend

```bash
cd backend
# Create .env file with your MongoDB URI
npm run dev
```

Backend runs on: `http://localhost:5000`

### Step 3: Start Frontend

```bash
cd frontend
npm start
```

### Step 4: Choose Platform

When Expo starts, you'll see:
- Press `w` → Opens in **Web browser**
- Press `a` → Opens **Android** emulator (or scan QR for Expo Go)
- Press `i` → Opens **iOS** simulator (or scan QR for Expo Go)

## 📱 Using Expo Go (Mobile Testing)

1. **Install Expo Go** app on your phone:
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Scan QR Code**:
   - Open Expo Go app
   - Scan the QR code from terminal
   - App loads instantly!

## 🌐 Web Deployment

### Option 1: Vercel (Easiest)

```bash
cd frontend
npm install -g vercel
npm run build:web
vercel
```

### Option 2: Netlify

```bash
cd frontend
npm install -g netlify-cli
npm run build:web
netlify deploy --prod --dir=web
```

### Option 3: Firebase Hosting

```bash
cd frontend
npm install -g firebase-tools
firebase login
firebase init hosting
# Select: web directory
npm run build:web
firebase deploy
```

## 📦 Mobile App Deployment

### Android (Play Store)

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Configure project
cd frontend
eas build:configure

# Build APK or AAB
eas build --platform android --profile production
```

### iOS (App Store)

```bash
# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

## ⚙️ Configuration

### Backend URL

Edit `frontend/src/config/api.config.js`:

```javascript
// Development
return 'http://localhost:5000/api';

// Production
return 'https://your-backend-domain.com/api';
```

### For Android Physical Device

If testing on a real Android device:
1. Find your computer's IP address:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```
2. Update `api.config.js`:
   ```javascript
   return 'http://192.168.1.xxx:5000/api'; // Your IP
   ```

## ✅ Features

- ✅ **Same code** works on Web, Android, iOS
- ✅ **Expo Go** for instant testing
- ✅ **Hot reload** - changes appear instantly
- ✅ **Native performance** on mobile
- ✅ **Responsive** design for all screen sizes

## 🎨 Platform-Specific Features

The app automatically adapts:
- **Web**: Mouse/touch interactions, keyboard navigation
- **Mobile**: Touch gestures, native navigation, device permissions

## 📝 Testing Checklist

- [ ] Web: Test in Chrome, Firefox, Safari
- [ ] Android: Test on phone via Expo Go
- [ ] iOS: Test on iPhone via Expo Go
- [ ] All screens load correctly
- [ ] API calls work on all platforms
- [ ] Navigation works smoothly
- [ ] Forms submit correctly

## 🆘 Troubleshooting

**Web not loading?**
- Run: `npm start` then press `w`
- Check browser console for errors
- Ensure `react-native-web` is installed

**Mobile connection issues?**
- Ensure phone and computer on same WiFi
- Update API URL with your computer's IP
- Check backend CORS settings

**Build errors?**
- Run: `npm install` again
- Clear cache: `expo start --clear`
- Check Node.js version (recommended: 16+)

## 📚 Next Steps

1. **Development**: Use Expo Go for testing
2. **Production Web**: Deploy to Vercel/Netlify
3. **Production Mobile**: Build with EAS and publish to stores

All from the same codebase! 🎉

