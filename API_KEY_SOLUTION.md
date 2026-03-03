# API Key Generation - Solutions

## Problem
The `/api/api-keys` endpoint is not available on the production server. This means the API key generation feature hasn't been deployed yet.

## Solutions

### Solution 1: Deploy to Production (Recommended)

The API key generation code exists in the codebase but needs to be deployed to production.

**Steps:**
1. Ensure all API key related files are committed:
   - `backend/routes/apiKeyRoutes.js`
   - `backend/controllers/apiKeyController.js`
   - `backend/models/ApiKey.js`
   - `backend/middleware/apiKeyAuth.js`

2. Deploy to Railway (or your hosting platform)

3. Once deployed, use the script:
   ```bash
   node generate-api-key.js
   ```

### Solution 2: Run Backend Locally

If you have the backend running locally:

1. **Start the backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Update the script to use localhost:**
   ```bash
   API_BASE_URL=http://localhost:5000/api node generate-api-key.js
   ```

3. **Or modify generate-api-key.js** to use localhost by default in development

### Solution 3: Direct Database Script (Advanced)

If you have direct database access, use the direct script:

**Prerequisites:**
- MongoDB connection string
- Database access
- Node.js with mongoose

**Steps:**

1. **Set environment variables:**
   ```bash
   # Copy .env from backend if needed
   cp backend/.env .env
   ```

2. **Edit .env and ensure MONGO_URI is set:**
   ```
   MONGO_URI=your_mongodb_connection_string
   ```

3. **Run the direct script:**
   ```bash
   EMAIL=amenityforge@gmail.com node generate-api-key-direct.js
   ```

   Or let it find the first Admin user:
   ```bash
   node generate-api-key-direct.js
   ```

### Solution 4: Manual Database Insert (Last Resort)

If all else fails, you can manually create an API key in the database:

1. Connect to MongoDB
2. Find a user ID (Admin or Super Admin):
   ```javascript
   db.users.findOne({ role: { $in: ["Admin", "Super Admin"] } })
   ```
3. Generate a key manually:
   ```javascript
   const crypto = require('crypto');
   const keyPrefix = 'cf_live';
   const randomBytes = crypto.randomBytes(32);
   const key = `${keyPrefix}_${randomBytes.toString('hex')}`;
   console.log(key);
   ```
4. Insert into database:
   ```javascript
   db.apikeys.insertOne({
     name: "rnxa.ai Integration",
     key: "cf_live_...", // from step 3
     keyPrefix: "cf_live",
     createdBy: ObjectId("..."), // user ID from step 2
     tenantId: "...", // user ID as string
     expiresAt: null, // or set expiration date
     permissions: ["read", "write", "webhook"],
     isActive: true,
     createdAt: new Date(),
     updatedAt: new Date()
   })
   ```

## Quick Test

To verify if the endpoint is available:

**PowerShell:**
```powershell
$headers = @{ "Authorization" = "Bearer YOUR_JWT_TOKEN" }
$body = @{ name = "Test"; expiresInDays = 365; permissions = @("read", "write") } | ConvertTo-Json
Invoke-WebRequest -Uri "https://crm-backend-production-fc85.up.railway.app/api/api-keys" -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

**cURL (if available):**
```bash
curl -X POST https://crm-backend-production-fc85.up.railway.app/api/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","expiresInDays":365,"permissions":["read","write"]}'
```

## Recommended Next Steps

1. **Check Railway deployment logs** to see if the route is deployed
2. **Verify the route exists** in the deployed code
3. **Deploy the latest code** if the route is missing
4. **Use Solution 2 or 3** as a temporary workaround

## Once You Have the API Key

Use it for rnxa.ai connection:

- **Provider Name:** `CRM-FORGE`
- **Base URL:** `https://crm-backend-production-fc85.up.railway.app/api`
- **Authentication Type:** `API Key`
- **API Key:** `cf_live_...` (your generated key)
