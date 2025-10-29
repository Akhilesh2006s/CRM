# Cross-Platform CRM - Complete Setup

## ✅ What You Have Now

A **single codebase** that works on:
- 🌐 **Web** (Chrome, Firefox, Safari, Edge)
- 🤖 **Android** (Phones & Tablets)
- 🍎 **iOS** (iPhone & iPad)

## 🎯 Technology Stack

- **Frontend**: Expo + React Native (cross-platform)
- **Backend**: Node.js + Express + MongoDB
- **State Management**: Redux Toolkit
- **UI**: React Native Paper (Material Design)
- **Charts**: Victory (works on all platforms)
- **Navigation**: React Navigation

## 📦 Installation

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
MONGO_URI=mongodb+srv://amenityforge_db_user:qcTX55G2K6ct36Ij@cluster0.ibp4qe2.mongodb.net/CRM?appName=Cluster0
JWT_SECRET=your_secret_key_here
PORT=5000
NODE_ENV=development
```

Start backend:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Update API URL in `frontend/src/config/api.config.js`:
- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-backend-domain.com/api`

Start frontend:
```bash
npm start
```

## 🚀 Running on Different Platforms

### Web Browser

```bash
npm start
# Press 'w' or visit http://localhost:19006
```

**Works in**: Chrome, Firefox, Safari, Edge

### Android

**Option 1: Expo Go (Development)**
1. Install Expo Go from Play Store
2. Run `npm start`
3. Scan QR code with Expo Go app

**Option 2: Android Emulator**
```bash
npm start
# Press 'a'
```

**Option 3: Build APK (Production)**
```bash
eas build --platform android --profile production
```

### iOS

**Option 1: Expo Go (Development)**
1. Install Expo Go from App Store
2. Run `npm start`
3. Scan QR code with Expo Go app

**Option 2: iOS Simulator**
```bash
npm start
# Press 'i'
```

**Option 3: Build IPA (Production)**
```bash
eas build --platform ios --profile production
```

## 🌐 Deploy Web Version

### Vercel (Recommended)

```bash
cd frontend
npm install -g vercel
npm run build:web
vercel
```

### Netlify

```bash
cd frontend
npm install -g netlify-cli
npm run build:web
netlify deploy --prod --dir=web
```

### Firebase Hosting

```bash
cd frontend
npm install -g firebase-tools
firebase login
firebase init hosting
# Select: web directory
npm run build:web
firebase deploy
```

## 📱 Deploy Mobile Apps

### Android (Google Play Store)

1. **Install EAS CLI**:
```bash
npm install -g eas-cli
eas login
```

2. **Configure**:
```bash
cd frontend
eas build:configure
```

3. **Build APK/AAB**:
```bash
# For direct installation
eas build --platform android --profile production

# For Play Store
eas build --platform android --profile production --type app-bundle
```

4. **Download** from Expo dashboard and upload to Play Store

### iOS (Apple App Store)

1. **Build for iOS**:
```bash
eas build --platform ios --profile production
```

2. **Submit to App Store**:
```bash
eas submit --platform ios
```

## ⚙️ Configuration

### Backend Deployment

**Render** (Recommended):
1. Create account at render.com
2. New Web Service
3. Connect GitHub repo
4. Root Directory: `backend`
5. Build: `npm install`
6. Start: `npm start`
7. Add environment variables

**Railway**:
1. Create account at railway.app
2. New Project → Deploy from GitHub
3. Select `backend` folder
4. Add environment variables
5. Deploy

### Frontend API Configuration

Edit `frontend/src/config/api.config.js`:

```javascript
// Development
if (Platform.OS === 'web') {
  return 'http://localhost:5000/api';
} else {
  return 'http://YOUR_COMPUTER_IP:5000/api';
}

// Production
return 'https://your-backend-domain.com/api';
```

### For Android Physical Device

If testing on real device:
1. Find your computer's IP:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```
2. Update `api.config.js`:
   ```javascript
   return 'http://192.168.1.xxx:5000/api';
   ```

## 📋 Project Structure

```
CRM-FORGE/
├── backend/              # Node.js API
│   ├── models/          # MongoDB schemas
│   ├── controllers/     # Business logic
│   ├── routes/          # API routes
│   └── server.js       # Entry point
│
└── frontend/            # Expo React Native
    ├── src/
    │   ├── screens/     # All screens (Web/Android/iOS)
    │   ├── redux/       # State management
    │   └── utils/       # API utilities
    ├── App.js           # Main app component
    └── app.json         # Expo config
```

## ✅ Features

- ✅ **Single Codebase** - Write once, run everywhere
- ✅ **Expo Go** - Instant testing on real devices
- ✅ **Hot Reload** - See changes instantly
- ✅ **Native Performance** - Optimized for mobile
- ✅ **Web Compatibility** - Works in browsers
- ✅ **Material Design** - Beautiful UI everywhere

## 🎨 Platform Adaptations

The app automatically adapts:
- **Web**: Mouse interactions, keyboard navigation, larger screens
- **Mobile**: Touch gestures, native navigation, device sensors

## 📝 Testing Checklist

Before deployment:
- [ ] Test on Web (Chrome, Firefox, Safari)
- [ ] Test on Android phone via Expo Go
- [ ] Test on iPhone via Expo Go
- [ ] Verify all API calls work
- [ ] Check navigation flows
- [ ] Test forms and submissions
- [ ] Verify charts display correctly
- [ ] Test on different screen sizes

## 🆘 Troubleshooting

**Web not loading?**
- Ensure `react-native-web` is installed
- Check browser console for errors
- Verify `expo start --web` command

**Mobile connection issues?**
- Ensure phone and computer on same WiFi
- Update API URL with computer's IP address
- Check backend CORS settings

**Build errors?**
- Run `npm install` again
- Clear cache: `expo start --clear`
- Check Node.js version (16+ recommended)

## 📚 Documentation

- **QUICK_START.md** - Quick setup guide
- **DEPLOYMENT.md** - Detailed deployment instructions
- **SETUP.md** - Development setup
- **README.md** - Project overview

## 🎯 Next Steps

1. ✅ **Development**: Use Expo Go for testing
2. ✅ **Web**: Deploy to Vercel/Netlify
3. ✅ **Android**: Build with EAS → Play Store
4. ✅ **iOS**: Build with EAS → App Store

All from one codebase! 🚀

