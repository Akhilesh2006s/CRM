# CRM Mobile App

Mobile application for employees and trainers to manage DC (Delivery Challan) operations.

## Features

- Employee/Trainer login with credentials
- First-time login attendance tracking
- Role-based dashboards (Sales BDE, Trainer, or both)
- DC capture with location tracking
- Photo capture
- Pincode to town auto-population
- Product categories (including Financial Literacy, Brain Bytes, Spelling Bee, Skill Pro)
- School and product category selection

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update API URL in `src/services/api.ts`:
```typescript
const API_BASE_URL = 'http://your-backend-url:5000/api';
```

3. For local development, update to:
```typescript
const API_BASE_URL = 'http://localhost:5000/api';
```

Or use your computer's IP address for testing on physical device:
```typescript
const API_BASE_URL = 'http://192.168.1.X:5000/api';
```

## Running the App

### Using Expo Go

1. Install Expo Go app on your phone (iOS or Android)

2. Start the development server:
```bash
npm start
```

3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

### Development

- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator (macOS only)
- `npm run web` - Run in web browser

## Backend Requirements

The mobile app connects to the same backend API as the web app. Make sure:

1. Backend server is running on port 5000 (or update API_BASE_URL)
2. CORS is configured to allow mobile app requests
3. Backend has the following endpoints:
   - `/api/auth/login` - User login
   - `/api/attendance/check-in` - Attendance check-in
   - `/api/location/get-town` - Pincode lookup
   - `/api/dc/*` - DC management
   - `/api/dc-orders` - DC orders

## Permissions

The app requires:
- Camera permission (for photo capture)
- Location permission (for GPS tracking)

These are requested at runtime when needed.

