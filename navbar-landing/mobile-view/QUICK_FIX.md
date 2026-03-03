# Quick Fix for Connection Issues

## Your Current Setup:
- **Backend Status:** ✅ Running on port 5000
- **Your IP Address:** `192.168.1.15`
- **API URL:** `http://192.168.1.15:5000/api`

## If you're getting connection errors, try these:

### 1. Check Windows Firewall (Most Common Issue)

**Option A: Allow Node.js through Firewall**
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Node.js Server" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

**Option B: Temporarily disable firewall for testing**
- Go to Windows Security → Firewall & network protection
- Temporarily turn off firewall (for testing only)
- Test if connection works

### 2. Verify Device is on Same Network
- Your phone and computer must be on the **same WiFi network**
- Check your phone's WiFi settings
- Make sure it's not using mobile data

### 3. Test Connection from Phone Browser
Open browser on your phone and go to:
```
http://192.168.1.15:5000/api/metadata
```

If you see JSON data or an error (not connection refused), the network is working!

### 4. Restart Backend Server
```powershell
cd ..\backend
npm start
```

### 5. Reload Expo App
- Shake your phone (or press Ctrl+M in emulator)
- Select "Reload"
- Or restart Expo Go app

## Still Not Working?

1. **Try a different IP:** Your router might assign a different IP
   ```powershell
   ipconfig
   ```
   Look for the active adapter's IPv4 address

2. **Check if port is accessible:**
   ```powershell
   Test-NetConnection -ComputerName 192.168.1.15 -Port 5000
   ```

3. **Use localhost for emulator:**
   If using Android Emulator or iOS Simulator, change API URL to:
   - `http://localhost:5000/api` (iOS Simulator)
   - `http://10.0.2.2:5000/api` (Android Emulator)

