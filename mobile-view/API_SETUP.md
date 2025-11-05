# API Configuration Guide

## Why Login Fails

If you're testing on a **physical device** (iPhone/Android phone), `localhost` won't work because it refers to the device itself, not your computer.

## Solution: Update API URL

### Step 1: Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually Wi-Fi or Ethernet).
It will look like: `192.168.1.100` or `10.0.0.5`

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" under your active network adapter.

### Step 2: Update API URL in Code

Open `mobile-view/src/services/api.ts` and update line 14:

```typescript
// Replace 192.168.1.100 with YOUR computer's IP address
const DEV_API_URL = Platform.OS === 'web' 
  ? 'http://localhost:5000/api'
  : 'http://YOUR_IP_ADDRESS:5000/api'; // e.g., 'http://192.168.1.100:5000/api'
```

### Step 3: Verify Backend is Running

Make sure your backend server is running:
```bash
cd backend
npm start
```

You should see: `Server running on port 5000`

### Step 4: Check Network Connection

- Ensure your phone and computer are on the **same Wi-Fi network**
- Some corporate networks may block device-to-device communication
- Try disabling firewall temporarily if connection fails

### Step 5: Test Connection

After updating the IP, reload the app in Expo Go and try logging in again.

## Common Issues

1. **"Cannot connect to server"**
   - Check IP address is correct
   - Verify backend is running
   - Ensure same network

2. **"Network Error"**
   - Check firewall settings
   - Try different network
   - Verify port 5000 is not blocked

3. **"Invalid credentials"**
   - This means connection works! Check email/password
   - Make sure user exists in database
   - Verify user has correct role (Employee, Sales BDE, or Trainer)

## For Testing on Simulator/Emulator

If using iOS Simulator or Android Emulator, you can use:
```typescript
const DEV_API_URL = 'http://localhost:5000/api';
```

Or for Android Emulator specifically:
```typescript
const DEV_API_URL = 'http://10.0.2.2:5000/api';
```

