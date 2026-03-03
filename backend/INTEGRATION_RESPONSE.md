# C-FORGIA API Integration Response

## Response to DMS Pro Integration Request

Thank you for your interest in integrating with C-FORGIA Automation System. Below are all the details you requested:

---

## 1. API Base URL

**Production:**
```
https://crm-backend-production-fc85.up.railway.app/api
```

**Development (if needed):**
```
http://localhost:5000/api
```

---

## 2. API Key Generation

### How to Generate API Key

**Option 1: Via API (Recommended)**

```http
POST https://crm-backend-production-fc85.up.railway.app/api/api-keys
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "name": "DMS Pro Integration",
  "tenantId": "your_tenant_id",
  "expiresInDays": 365,
  "permissions": ["read", "write", "webhook"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key generated successfully",
  "apiKey": {
    "id": "507f1f77bcf86cd799439011",
    "name": "DMS Pro Integration",
    "key": "cf_live_abc123def456...",
    "keyPrefix": "cf_live",
    "tenantId": "your_tenant_id",
    "permissions": ["read", "write", "webhook"],
    "expiresAt": "2025-12-31T23:59:59.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "warning": "⚠️ Save this API key now. You will not be able to see it again!"
}
```

**Option 2: Via Admin Dashboard** (Coming Soon)
- Navigate to Settings → API Keys → Generate New Key

---

## 3. Authentication Method

C-FORGIA supports **multiple authentication methods**:

### Method 1: Bearer Token (Recommended)
```http
Authorization: Bearer cf_live_your_api_key_here
```

### Method 2: X-API-Key Header
```http
X-API-Key: cf_live_your_api_key_here
```

### Method 3: Query Parameter
```
GET /api/automation/revenue-at-risk?api_key=cf_live_your_api_key_here
```

**Note:** All three methods are supported. Bearer token is recommended for security.

---

## 4. Complete API Endpoint List

### Automation Endpoints

All endpoints are under `/api/automation/`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/automation/revenue-at-risk` | GET | Revenue at risk analysis |
| `/api/automation/executive-dashboard` | GET | Executive dashboard metrics |
| `/api/automation/priority-engine` | GET | Prioritized tasks |
| `/api/automation/deal-risk-scoring` | GET | Deal risk scores |
| `/api/automation/performance-risk` | GET | Performance risk index |
| `/api/automation/fraud-detection` | GET | Fraud detection alerts |
| `/api/automation/cashflow-analyzer` | GET | Cashflow analysis |
| `/api/automation/delay-cost-calculator` | GET | Delay cost calculation |
| `/api/automation/churn-predictor` | GET | Churn predictions |
| `/api/automation/narrative-bi` | GET | Narrative BI summary |
| `/api/automation/health` | GET | Health check |

### API Key Management Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/api-keys` | POST | Generate new API key |
| `/api/api-keys` | GET | List all API keys |
| `/api/api-keys/:id` | GET | Get API key details |
| `/api/api-keys/:id` | DELETE | Revoke API key |

---

## 5. API Documentation

Complete API documentation is available in:
- **`backend/API_DOCUMENTATION.md`** - Full API reference with all endpoints, request/response examples, error codes, and rate limiting

**Quick Reference:**
- Base URL: `https://crm-backend-production-fc85.up.railway.app/api`
- Authentication: Bearer token or X-API-Key header
- Content-Type: `application/json`
- Response Format: JSON

---

## 6. Sample API Request/Response Examples

### Example 1: Get Revenue at Risk

**Request:**
```http
GET https://crm-backend-production-fc85.up.railway.app/api/automation/revenue-at-risk
Authorization: Bearer cf_live_your_api_key_here
```

**Response:**
```json
{
  "total_revenue_at_risk": 1250000.50,
  "high_risk_items": [
    {
      "id": "507f1f77bcf86cd799439011",
      "type": "deal",
      "name": "ABC School",
      "amount": 500000,
      "risk_probability": 0.85,
      "risk_amount": 425000,
      "status": "Pending",
      "priority": "Hot"
    }
  ],
  "risk_breakdown": {
    "high_risk": 15,
    "medium_risk": 25,
    "low_risk": 10
  },
  "total_items_analyzed": 50,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Example 2: Get Executive Dashboard

**Request:**
```http
GET https://crm-backend-production-fc85.up.railway.app/api/automation/executive-dashboard?days=30
Authorization: Bearer cf_live_your_api_key_here
```

**Response:**
```json
{
  "key_metrics": {
    "total_revenue": 5000000,
    "total_deals": 150,
    "revenue_trend": 12.5,
    "avg_daily_revenue": 166666.67
  },
  "critical_issues": [
    {
      "type": "high_risk_deal",
      "message": "15 deals with high risk of failure",
      "severity": "high"
    }
  ]
}
```

### Example 3: Get Priority Engine

**Request:**
```http
GET https://crm-backend-production-fc85.up.railway.app/api/automation/priority-engine
Authorization: Bearer cf_live_your_api_key_here
```

**Response:**
```json
{
  "prioritized_tasks": [
    {
      "name": "Follow up with ABC School",
      "type": "deal",
      "status": "Pending",
      "priority_score": 0.92,
      "recommended_action": "Call immediately - high value deal at risk"
    }
  ],
  "high_priority_count": 10,
  "total_tasks": 45
}
```

**More examples available in `API_DOCUMENTATION.md`**

---

## 7. Webhook Support

**Yes, webhook support is available!**

### Available Webhook Events:
- `deal.created` - New deal/lead created
- `deal.updated` - Deal/lead updated
- `deal.closed` - Deal closed
- `payment.received` - Payment received
- `payment.approved` - Payment approved
- `payment.rejected` - Payment rejected
- `sale.created` - New sale created
- `sale.completed` - Sale completed
- `automation.insight` - New automation insight available

### Register Webhook:

```http
POST https://crm-backend-production-fc85.up.railway.app/api/webhooks
Authorization: Bearer cf_live_your_api_key_here
Content-Type: application/json

{
  "url": "https://your-dms-pro.com/api/webhooks/c-forgia",
  "events": ["deal.created", "payment.received"],
  "secret": "your_webhook_secret_here"
}
```

**Complete webhook documentation:** See `WEBHOOK_DOCUMENTATION.md`

---

## 8. Field Mapping Documentation

Complete field mapping between DMS Pro and C-FORGIA is available in:
- **`backend/FIELD_MAPPING.md`**

### Quick Field Mapping Reference:

| DMS Pro | C-FORGIA | Type |
|---------|----------|------|
| `schoolName` | `school_name` | String |
| `contactPerson` | `contact_person` | String |
| `phone` | `contact_mobile` | String |
| `email` | `email` | String |
| `location` | `location` | String |
| `zone` | `zone` | String |
| `products[]` | `products[]` | Array |
| `products[].productName` | `products[].product_name` | String |
| `products[].quantity` | `products[].quantity` | Number |
| `products[].price` | `products[].unit_price` | Number |

**Complete mapping with examples:** See `FIELD_MAPPING.md`

---

## Quick Start Guide

### Step 1: Generate API Key

```bash
curl -X POST https://crm-backend-production-fc85.up.railway.app/api/api-keys \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "DMS Pro Integration",
    "tenantId": "your_tenant_id",
    "permissions": ["read", "write"]
  }'
```

### Step 2: Test API Connection

```bash
curl -X GET https://crm-backend-production-fc85.up.railway.app/api/automation/health \
  -H "Authorization: Bearer cf_live_your_api_key_here"
```

### Step 3: Call Automation Endpoint

```bash
curl -X GET https://crm-backend-production-fc85.up.railway.app/api/automation/revenue-at-risk \
  -H "Authorization: Bearer cf_live_your_api_key_here"
```

---

## Support & Resources

- **API Documentation**: `backend/API_DOCUMENTATION.md`
- **Field Mapping**: `backend/FIELD_MAPPING.md`
- **Webhook Docs**: `backend/WEBHOOK_DOCUMENTATION.md`
- **Support Email**: support@c-forgia.com

---

## Summary

✅ **API Base URL**: `https://crm-backend-production-fc85.up.railway.app/api`  
✅ **API Key**: Generate via `/api/api-keys` endpoint  
✅ **Authentication**: Bearer token, X-API-Key header, or query parameter  
✅ **10 Automation Endpoints**: All available under `/api/automation/`  
✅ **Complete Documentation**: 3 comprehensive documentation files  
✅ **Sample Examples**: Included in API_DOCUMENTATION.md  
✅ **Webhook Support**: Yes, with 9 event types  
✅ **Field Mapping**: Complete mapping documentation provided  

**You're all set to integrate!** 🚀
