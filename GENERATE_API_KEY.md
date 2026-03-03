# Generate API Key for CRM-FORGE

This guide shows you how to generate an API key for connecting external systems (like rnxa.ai) to CRM-FORGE.

## Prerequisites

- Admin or Super Admin account credentials
- Access to the CRM-FORGE backend API

## Method 1: Using the Node.js Script (Recommended)

### Step 1: Run the script

```bash
node generate-api-key.js
```

### Step 2: Enter your credentials when prompted

The script will ask for:
- Email (Admin/Super Admin email)
- Password

### Step 3: Save the API key

The script will display your API key. **Save it immediately** - you won't be able to see it again!

### Using Environment Variables

You can also set credentials as environment variables:

```bash
API_BASE_URL=https://crm-backend-production-fc85.up.railway.app/api \
EMAIL=admin@example.com \
PASSWORD=yourpassword \
API_KEY_NAME="rnxa.ai Integration" \
EXPIRES_IN_DAYS=365 \
PERMISSIONS=read,write,webhook \
node generate-api-key.js
```

## Method 2: Using cURL

### Step 1: Login to get JWT token

```bash
curl -X POST https://crm-backend-production-fc85.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "yourpassword"
  }'
```

**Response:**
```json
{
  "_id": "...",
  "name": "...",
  "email": "...",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 2: Generate API key using the token

```bash
curl -X POST https://crm-backend-production-fc85.up.railway.app/api/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "rnxa.ai Integration",
    "expiresInDays": 365,
    "permissions": ["read", "write", "webhook"]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "API key generated successfully",
  "apiKey": {
    "id": "...",
    "name": "rnxa.ai Integration",
    "key": "cf_live_abc123def456...",
    "keyPrefix": "cf_live",
    "tenantId": "...",
    "permissions": ["read", "write", "webhook"],
    "expiresAt": "2025-12-31T23:59:59.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "warning": "⚠️ Save this API key now. You will not be able to see it again!"
}
```

## Method 3: Using Postman or Similar Tools

1. **Login Request:**
   - Method: `POST`
   - URL: `https://crm-backend-production-fc85.up.railway.app/api/auth/login`
   - Headers: `Content-Type: application/json`
   - Body:
     ```json
     {
       "email": "admin@example.com",
       "password": "yourpassword"
     }
     ```
   - Copy the `token` from the response

2. **Generate API Key Request:**
   - Method: `POST`
   - URL: `https://crm-backend-production-fc85.up.railway.app/api/api-keys`
   - Headers:
     - `Authorization: Bearer YOUR_JWT_TOKEN_HERE`
     - `Content-Type: application/json`
   - Body:
     ```json
     {
       "name": "rnxa.ai Integration",
       "expiresInDays": 365,
       "permissions": ["read", "write", "webhook"]
     }
     ```

## Using Your API Key

Once you have the API key, use it in your requests:

### Option 1: Bearer Token (Recommended)
```http
Authorization: Bearer cf_live_your_api_key_here
```

### Option 2: X-API-Key Header
```http
X-API-Key: cf_live_your_api_key_here
```

### Option 3: Query Parameter
```
GET /api/automation/revenue-at-risk?api_key=cf_live_your_api_key_here
```

## API Key Information for rnxa.ai

When connecting to rnxa.ai, use:

- **Provider Name:** `CRM-FORGE`
- **Base URL:** `https://crm-backend-production-fc85.up.railway.app/api`
- **Authentication Type:** `API Key`
- **API Key:** `cf_live_your_generated_key_here`

## Troubleshooting

### Error: "No token, authorization denied"
- Make sure you're logged in and using a valid JWT token
- Check that the token hasn't expired (tokens expire after 30 days)

### Error: "Access denied. Insufficient permissions."
- You need Admin or Super Admin role to generate API keys
- Contact your system administrator if you don't have the required role

### Error: "API key generation failed"
- Verify your JWT token is valid
- Check that you have Admin/Super Admin permissions
- Ensure the API endpoint is accessible

## Security Notes

- ⚠️ **Never share your API key publicly**
- ⚠️ **Save the API key immediately** - it's only shown once
- ⚠️ **Rotate API keys regularly** for security
- ⚠️ **Revoke unused API keys** to prevent unauthorized access

## Support

For issues or questions:
- Check the API documentation: `API_DOCUMENTATION.md`
- Contact the C-FORGIA team
