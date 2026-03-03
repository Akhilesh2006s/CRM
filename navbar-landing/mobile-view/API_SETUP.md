# API Configuration Guide

## Quick Fix: Use Production Backend

The app is configured to use the **production backend** (Railway) by default via `.env`:
```
EXPO_PUBLIC_USE_PRODUCTION=true
```

This works from **anywhere** – phone, web, different networks. No local setup needed.

**Restart Expo** after changing `.env`: stop with `Ctrl+C`, then run `npx expo start` again.

---

## How to Check Which IP the Mobile App Is Using

1. **See the exact URL in the app:** Go to **Settings** → **Upload Documents**. At the top you’ll see **“API (this device)”** with the full base URL the app is using (e.g. `http://192.168.1.105:5000/api` or `http://localhost:5000/api`). If it shows `localhost`, the phone can’t reach your laptop – set `EXPO_PUBLIC_API_URL` in `.env` to your laptop’s IP (see below).
2. **If you see “Cannot connect to server”** on other screens, the app is trying to reach that same API URL; fix it using the URL shown under Settings → Upload.
3. **Expo’s choice:** When you run `npx expo start` and scan the QR code, Expo normally uses your laptop’s LAN IP for the **Metro bundler**. The app gets the API URL from:
   - `EXPO_PUBLIC_API_URL` or `EXPO_PUBLIC_API_IP` in `.env`, or
   - Expo’s `hostUri` (same IP as Metro), or
   - Fallback: `localhost:5000` (this fails on a physical phone).

**To see your laptop IP that the phone should use:**

- **Windows (PowerShell or CMD):** Run `ipconfig` and look for **IPv4 Address** under your WiFi adapter (e.g. `192.168.1.105`).
- **Mac/Linux:** Run `ifconfig` or `ip addr` and look for `inet` on your WiFi interface (e.g. `192.168.1.105`).

Use that IP in `.env` as `EXPO_PUBLIC_API_URL=http://YOUR_IP:5000/api` (see below).

---

## Why the Phone Can’t Connect (and Fixes)

| Cause | Fix |
|-------|-----|
| **App using localhost** | On a real device, `localhost` is the phone itself. Set `EXPO_PUBLIC_API_URL=http://YOUR_LAPTOP_IP:5000/api` in `.env` (use the IP from `ipconfig` / `ifconfig`). |
| **Wrong or old IP** | Your laptop’s IP can change (e.g. new WiFi). Run `ipconfig` again and update `.env` with the new IPv4 address, then restart Expo. |
| **Phone and laptop on different networks** | Use the **same WiFi** for both (no guest network, no mobile data for the app). |
| **Backend not reachable** | Backend must listen on all interfaces. In `backend/server.js` it should use `HOST = '0.0.0.0'` (or listen on `0.0.0.0`) so the phone can connect to your laptop’s IP. |
| **Firewall blocking port 5000** | Allow inbound TCP on port 5000 for your WiFi (e.g. Windows Firewall → allow Node/backend app). |
| **.env not loaded** | Restart Expo after editing `.env`: `Ctrl+C`, then `npx expo start` (or `npx expo start --clear`). |

**Easiest fix if you don’t need local backend:** Set `EXPO_PUBLIC_USE_PRODUCTION=true` in `.env`. The app will use the production API and the phone will connect without caring about your laptop’s IP.

---

## Use Local Backend Instead

If you want to use your local backend (e.g. for development):

### 1. Edit `.env`
```
EXPO_PUBLIC_USE_PRODUCTION=false
# For device: use your computer's IP (run ipconfig or ifconfig)
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:5000/api
```
Replace `192.168.1.XXX` with your laptop’s IPv4 address from `ipconfig` (Windows) or `ifconfig` (Mac/Linux).

### 2. Find Your Computer's IP (for physical device)

- **Windows:** Open CMD or PowerShell → run `ipconfig` → under your WiFi adapter find **IPv4 Address** (e.g. 192.168.1.105).
- **Mac/Linux:** Run `ifconfig` or `ip addr` → find `inet` on your WiFi interface.

### 3. Requirements for Local
- Backend running: `cd backend && npm start` (and listening on `0.0.0.0` so the phone can connect).
- Phone and computer on **same WiFi**.
- Firewall allows port 5000 on your laptop.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Cannot connect to server" | Use production backend (`EXPO_PUBLIC_USE_PRODUCTION=true`) or set `EXPO_PUBLIC_API_URL=http://YOUR_LAPTOP_IP:5000/api` and ensure same WiFi, firewall, backend on 0.0.0.0. |
| "Invalid credentials" | Connection works – check email/password in database. |
| Env changes not applied | Restart Expo (`Ctrl+C` then `npx expo start` or `npx expo start --clear`). |
| Phone loads app but API fails | App is using wrong IP for API; set `EXPO_PUBLIC_API_URL` to `http://YOUR_LAPTOP_IP:5000/api` and restart Expo. |
