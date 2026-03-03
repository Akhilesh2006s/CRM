# Installing react-native-webview

The WebView component requires the `react-native-webview` package. Follow these steps to install it.

## Installation Steps

### Step 1: Navigate to mobile-view folder
```bash
cd mobile-view
```

### Step 2: Install the package using Expo
```bash
npx expo install react-native-webview
```

This command will:
- Install the correct version compatible with your Expo SDK
- Automatically configure native dependencies
- Update your `package.json`

### Step 3: Verify Installation
Check that `react-native-webview` is in your `package.json` dependencies.

### Step 4: Restart Development Server
```bash
# Stop the current server (Ctrl+C)
# Then restart
npm start
```

## Alternative: Manual Installation

If `npx expo install` doesn't work, you can install manually:

```bash
npm install react-native-webview
```

Then rebuild your app:
```bash
# Clear cache and restart
npx expo start --clear
```

## Verification

After installation, the WebView screen should work. Test by:
1. Opening the mobile app
2. Navigating to "Web App" from the dashboard
3. The web application should load in the WebView

## Troubleshooting

### Issue: "Module not found: react-native-webview"
**Solution:**
- Make sure you ran `npx expo install react-native-webview`
- Clear cache: `npx expo start --clear`
- Restart the development server

### Issue: WebView shows blank screen
**Solution:**
- Check that your web app is running
- Verify the WEB_APP_URL in WebAppScreen.tsx
- Check console for errors

### Issue: Build errors
**Solution:**
- Make sure you're using `npx expo install` (not `npm install`)
- This ensures version compatibility with your Expo SDK

---

**Note:** The `react-native-webview` package is already included in the WebAppScreen component code. You just need to install it using the steps above.
