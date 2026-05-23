# Publish CRM Forge Mobile

Production API (same as web): `https://crm-backend-production-fc85.up.railway.app/api`

EAS project: [@akhilesh26/crm-mobile-app](https://expo.dev/accounts/akhilesh26/projects/crm-mobile-app)  
Project ID: `6fbb940c-2bbd-4d25-ae08-68d19179063c`

## Prerequisites

1. [Expo account](https://expo.dev/signup)
2. **Google Play Console** (Android) and/or **Apple Developer** ($99/yr, iOS)
3. Run from `mobile-view/`:

```powershell
npm install
npx eas login
```

## 1. Internal test build (APK, no store)

Fastest way to share with testers:

```powershell
cd mobile-view
npm run build:preview:android
```

When the build finishes, open the link from the terminal (or [expo.dev](https://expo.dev) → your project → Builds) and install the APK on Android.

## 2. Production store builds

### Android (Play Store)

```powershell
npm run build:production:android
```

After the build succeeds:

```powershell
npm run submit:android
```

You will be prompted for Google Play credentials (service account JSON) the first time. Configure in [EAS credentials](https://docs.expo.dev/submit/android/).

### iOS (App Store)

```powershell
npm run build:production:ios
```

Then:

```powershell
npx eas submit --platform ios --profile production --latest
```

Requires Apple Developer account and App Store Connect app record.

### Both platforms

```powershell
npm run build:production
```

## 3. Environment

Production builds inject:

```
EXPO_PUBLIC_API_URL=https://crm-backend-production-fc85.up.railway.app/api
```

via `eas.json` → `production` profile. Local dev still uses `mobile-view/.env` when running `expo start`.

## 4. Version bumps

`production` profile uses `autoIncrement: true` (remote app version on EAS). Bump `version` in `app.config.js` for major releases.

## 5. Checklist before submit

- [ ] Test login on preview APK with production API
- [ ] Confirm bundle IDs: `com.crm.forge.mobile` (iOS + Android)
- [ ] Play Store / App Store listing text, screenshots, privacy policy URL
- [ ] Backend CORS / mobile clients allowed on Railway if applicable

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Not logged in` | `npx eas login` |
| Build fails on assets | Ensure `assets/icon.png`, `adaptive-icon.png`, `splash-icon.png` exist |
| API errors on device | Production URL is baked in at build time; rebuild after `.env` changes |
