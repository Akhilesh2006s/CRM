# Cross-Platform Deployment Guide

## 🚀 Quick Start - Run on All Platforms

### 1. Development (Expo Go)

```bash
cd frontend
npm install
npm start
```

Then:
- **Web**: Press `w` in terminal or visit `http://localhost:19006`
- **Android**: Press `a` and scan QR code with Expo Go app
- **iOS**: Press `i` and scan QR code with Expo Go app (or use simulator)

### 2. Update API Configuration

Edit `frontend/src/config/api.config.js`:
- **Development**: Use `localhost` or your local IP
- **Production**: Use your deployed backend URL

## 📱 Building for Production

### Install EAS CLI (Expo Application Services)

```bash
npm install -g eas-cli
eas login
```

### Configure EAS Build

1. Initialize EAS in your project:
```bash
cd frontend
eas build:configure
```

2. Update `eas.json` with your project settings

### Build for Android

```bash
# APK (for direct installation)
eas build --platform android --profile production

# AAB (for Play Store)
eas build --platform android --profile production --type app-bundle
```

### Build for iOS

```bash
# Development build
eas build --platform ios --profile development

# Production build (requires Apple Developer account)
eas build --platform ios --profile production
```

### Build for Web

```bash
# Build static web files
expo export:web

# Or use Expo hosting
npx expo export:web
```

The web build will be in `frontend/web/` directory.

## 🌐 Deploy Web Version

### Option 1: Vercel (Recommended)

```bash
npm install -g vercel
cd frontend
vercel
```

### Option 2: Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build and deploy:
```bash
cd frontend
npm run build:web
netlify deploy --prod
```

### Option 3: GitHub Pages

1. Build web version:
```bash
cd frontend
npm run build:web
```

2. Deploy `web/` folder to GitHub Pages

### Option 4: Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
cd frontend
npm run build:web
firebase deploy
```

## 📦 Deploy Backend

### Option 1: Render (Recommended)

1. Create account at [render.com](https://render.com)
2. Create new Web Service
3. Connect your GitHub repository
4. Build command: `cd backend && npm install`
5. Start command: `cd backend && npm start`
6. Add environment variables from `.env`

### Option 2: Railway

1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select backend folder
4. Add environment variables
5. Deploy

### Option 3: AWS / Heroku

Follow respective platform documentation for Node.js deployment.

## 🔧 Environment Variables

### Backend (.env)

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=production
```

### Frontend (Update api.config.js)

```javascript
// Production
const API_URL = 'https://your-backend-domain.com/api';
```

## 📱 Publishing to App Stores

### Google Play Store

1. Build AAB:
```bash
eas build --platform android --profile production --type app-bundle
```

2. Download from Expo dashboard
3. Upload to Google Play Console
4. Complete store listing

### Apple App Store

1. Build for iOS:
```bash
eas build --platform ios --profile production
```

2. Submit to App Store:
```bash
eas submit --platform ios
```

## 🎯 Production Checklist

- [ ] Update API URLs in `api.config.js`
- [ ] Set `NODE_ENV=production` in backend
- [ ] Configure CORS for production domain
- [ ] Set up SSL certificates
- [ ] Configure Firebase (if using)
- [ ] Set up push notifications
- [ ] Test on all platforms
- [ ] Update app version numbers
- [ ] Configure app icons and splash screens
- [ ] Set up analytics (optional)

## 🔄 Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd backend && npm install
      - run: cd backend && npm start
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd frontend && npm install
      - run: cd frontend && npm run build:web
      - run: # Deploy to hosting service
```

## 📝 Notes

- **Expo Go**: Best for development and testing
- **EAS Build**: Required for production apps
- **Web**: Can be deployed to any static hosting
- **Same Codebase**: Works on Web, Android, and iOS
- **Backend**: Deploy separately, frontend connects via API

## 🆘 Troubleshooting

### Web not loading
- Check if `react-native-web` is installed
- Verify `expo start --web` command
- Check browser console for errors

### API connection issues
- Update `api.config.js` with correct backend URL
- Check CORS settings on backend
- Verify backend is running and accessible

### Build failures
- Check EAS project ID in `app.json`
- Verify all dependencies are installed
- Check EAS CLI version: `eas --version`

