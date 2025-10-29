# ✅ Fixed: Package Installation Issue

## Problem
`@expo/metro-config@^0.5.3` version doesn't exist for Expo SDK 49.

## Solution
✅ Removed `@expo/metro-config` from devDependencies
✅ Updated `metro.config.js` to use `expo/metro-config` (built into Expo SDK 49)

## Now Install Dependencies

```bash
cd frontend
npm install
```

This should work now! The `expo/metro-config` is included automatically with Expo SDK 49, so no separate package is needed.

## After Installation

```bash
# Start Expo
npm start

# Then:
# - Press 'w' for Web
# - Scan QR code with Expo Go app (Android/iOS)
```

Everything should work perfectly now! 🚀

