# 🚀 Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites Check

- [ ] Node.js installed (v16+)
- [ ] Expo Go app installed on your phone
- [ ] Phone and computer on same Wi-Fi network

## Step 1: Install WebView Package (One-time setup)

```bash
cd mobile-view
npx expo install react-native-webview
```

## Step 2: Start All Services

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Web App:**
```bash
cd navbar-landing
npm run dev
```

**Terminal 3 - Mobile App:**
```bash
cd mobile-view
npm start
```

## Step 3: Connect Your Phone

1. Open **Expo Go** app on your phone
2. Scan the **QR code** from Terminal 3
3. Wait for app to load

## Step 4: Access Web App

1. In the mobile app, go to **Dashboard**
2. Tap **"Open Web App"** (purple card)
3. Your web application loads in WebView! 🎉

## ⚙️ Configuration (If needed)

### For Physical Device Testing

If the web app doesn't load, update the URL:

1. Find your computer's IP:
   - **Windows:** `ipconfig` → IPv4 Address
   - **Mac/Linux:** `ifconfig` → inet address

2. Update `mobile-view/src/screens/WebApp/WebAppScreen.tsx`:
   ```typescript
   const WEB_APP_URL = 'http://YOUR_IP:3001';
   ```

3. Restart the mobile app

## ✅ Success Checklist

- [ ] Backend running (port 5000)
- [ ] Web app running (port 3001)
- [ ] Mobile app connected via Expo Go
- [ ] Can navigate to "Web App" in mobile app
- [ ] Web app loads in WebView

## 🐛 Quick Troubleshooting

**Can't connect?**
- Check all 3 services are running
- Verify same Wi-Fi network
- Try: `expo start --tunnel`

**WebView blank?**
- Check web app is running
- Update WEB_APP_URL with your IP
- Check firewall settings

**Need more help?**
- See `SETUP_INSTRUCTIONS.md` for detailed guide
- See `CONFIGURATION.md` for configuration options

---

**That's it!** You're ready to use your web app from your mobile app! 🎊
