# ✅ Fixed: Invalid UUID appId Error

## ✅ What Was Fixed

**Error**: `[GraphQL] Invalid UUID appId`

**Problem**: The `app.json` had a placeholder project ID: `"projectId": "your-project-id"` which is not a valid UUID.

**Fix**: Removed the invalid EAS project configuration from `app.json`.

## 🚀 Now Restart Expo

```bash
cd frontend
npx expo start --clear
```

## ✅ Expected Result

- ✅ No GraphQL UUID errors
- ✅ Expo starts successfully
- ✅ App loads correctly

## 📝 Optional: Setup EAS Project Later

If you want to use EAS Build later:

1. **Initialize EAS**:
   ```bash
   npx eas build:configure
   ```

2. This will create a valid project ID automatically.

For now, you don't need EAS project ID for development - Expo Go works without it!

Everything should work now! 🎉

