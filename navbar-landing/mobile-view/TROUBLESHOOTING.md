# Troubleshooting Network Connection Issues

## Connection Error: Cannot connect to server

If you're seeing this error:
```
Cannot connect to server. Make sure:
1. Backend is running on port 5000
2. API URL is correct (currently: http://192.168.1.15:5000/api)
3. Device and computer are on same network
```

### Step 1: Verify Backend is Running

1. **Check if backend server is running:**
   ```powershell
   cd ..\backend
   npm start
   ```
   You should see: `Server running on port 5000`

2. **Check if port 5000 is in use:**
   ```powershell
   netstat -ano | findstr :5000
   ```

### Step 2: Verify IP Address

1. **Find your computer's IP address:**
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" under your active network adapter (usually WiFi or Ethernet)

2. **Update API URL in mobile app:**
   - Open `mobile-view/src/services/api.ts`
   - Update line 15 with your actual IP address:
   ```typescript
   const DEV_API_URL = Platform.OS === 'web' 
     ? 'http://localhost:5000/api'
     : 'http://YOUR_IP_ADDRESS:5000/api'; // Replace YOUR_IP_ADDRESS
   ```

### Step 3: Verify Network Connection

1. **Ensure device and computer are on the same network:**
   - Both should be connected to the same WiFi network
   - Or use the same network segment

2. **Check firewall settings:**
   - Windows Firewall might be blocking port 5000
   - Add an exception for Node.js or port 5000

3. **Test connection from device:**
   - Open a browser on your phone
   - Navigate to: `http://YOUR_IP_ADDRESS:5000/api/metadata`
   - You should see JSON data (if not authenticated) or an error message

### Step 4: Alternative Solutions

**Option 1: Use ngrok (for testing):**
```bash
# Install ngrok
# Then run:
ngrok http 5000
# Use the ngrok URL in api.ts
```

**Option 2: Use localhost for emulator:**
- If using Android Emulator or iOS Simulator
- Change API URL to: `http://localhost:5000/api` or `http://10.0.2.2:5000/api` (Android emulator)

**Option 3: Check CORS settings:**
- Ensure backend `server.js` has CORS enabled
- Check if it allows requests from your mobile app origin

### Common Issues:

1. **IP address changed:** Your router may have assigned a new IP address. Check `ipconfig` again.

2. **Backend not started:** Make sure you ran `npm start` in the backend folder.

3. **Wrong network:** Phone and computer must be on the same WiFi network.

4. **Firewall blocking:** Windows Firewall may be blocking incoming connections on port 5000.

### Quick Fix Commands:

```powershell
# Check your current IP
ipconfig | findstr IPv4

# Check if backend is running
netstat -ano | findstr :5000

# Start backend (if not running)
cd ..\backend
npm start
```

