# C-FORGIA Automation API Documentation

## Overview

The C-FORGIA Automation API provides programmatic access to all AI-powered automation tools and insights. This API allows external systems (like DMS Pro) to integrate with C-FORGIA's automation capabilities.

## Base URL

```
Production: https://crm-backend-production-fc85.up.railway.app/api
Development: http://localhost:5000/api
```

## Authentication

C-FORGIA API supports two authentication methods:

### 1. API Key Authentication (Recommended for Integrations)

**Method 1: Bearer Token (Recommended)**
```http
Authorization: Bearer cf_live_your_api_key_here
```

**Method 2: X-API-Key Header**
```http
X-API-Key: cf_live_your_api_key_here
```

**Method 3: Query Parameter**
```
GET /api/automation/revenue-at-risk?api_key=cf_live_your_api_key_here
```

### 2. JWT Token Authentication (For Web/Mobile Apps)

```http
Authorization: Bearer <jwt_token>
```

## Getting Your API Key

1. Log in to C-FORGIA CRM as Admin or Super Admin
2. Navigate to **Settings** → **API Keys** (or use the API endpoint)
3. Click **Generate New API Key**
4. **Important**: Copy and save the API key immediately - it will not be shown again!

### Generate API Key via API

```http
POST /api/api-keys
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "DMS Pro Integration",
  "tenantId": "your_tenant_id",
  "expiresInDays": 365,
  "permissions": ["read", "write"]
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
    "key": "cf_live_abc123...",
    "keyPrefix": "cf_live",
    "tenantId": "your_tenant_id",
    "permissions": ["read", "write"],
    "expiresAt": "2025-12-31T23:59:59.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "warning": "⚠️ Save this API key now. You will not be able to see it again!"
}
```

## API Endpoints

### Automation Tools

All automation endpoints are available under `/api/automation/`

#### 1. Revenue at Risk

**Endpoint:** `GET /api/automation/revenue-at-risk`

**Description:** Identifies revenue likely to get stuck or lost using ML risk analysis.

**Request:**
```http
GET /api/automation/revenue-at-risk
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

#### 2. Executive Dashboard

**Endpoint:** `GET /api/automation/executive-dashboard`

**Description:** High-level strategic view of revenue trends and critical issues.

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: 90)

**Request:**
```http
GET /api/automation/executive-dashboard?days=30
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
  ],
  "daily_metrics": {
    "2024-01-15": {
      "revenue": 200000,
      "deals": 5,
      "payments": 3
    }
  }
}
```

#### 3. Priority Engine

**Endpoint:** `GET /api/automation/priority-engine`

**Description:** Automatically ranks daily actions by business impact and urgency.

**Request:**
```http
GET /api/automation/priority-engine
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

#### 4. Deal Risk Scoring

**Endpoint:** `GET /api/automation/deal-risk-scoring`

**Description:** Identifies deals at high risk of failing with ML predictions.

**Request:**
```http
GET /api/automation/deal-risk-scoring
Authorization: Bearer cf_live_your_api_key_here
```

**Response:**
```json
{
  "high_risk_count": 8,
  "medium_risk_count": 15,
  "low_risk_count": 27,
  "deal_risks": [
    {
      "deal_name": "ABC School Deal",
      "amount": 500000,
      "status": "Pending",
      "risk_score": 0.85,
      "risk_level": "High",
      "recommendations": [
        "Follow up within 24 hours",
        "Offer discount to close faster"
      ]
    }
  ]
}
```

#### 5. Performance Risk Index

**Endpoint:** `GET /api/automation/performance-risk`

**Description:** Highlights managers and zones showing performance drops.

**Request:**
```http
GET /api/automation/performance-risk
Authorization: Bearer cf_live_your_api_key_here
```

**Response:**
```json
{
  "high_risk_count": 3,
  "anomaly_count": 5,
  "performance_risks": [
    {
      "manager_name": "John Doe",
      "zone": "North",
      "risk_index": 0.75,
      "risk_level": "High",
      "recommendations": [
        "Review sales pipeline",
        "Provide additional training"
      ]
    }
  ]
}
```

#### 6. Fraud Detection

**Endpoint:** `GET /api/automation/fraud-detection`

**Description:** Advanced ML detection of unusual patterns in transactions.

**Request:**
```http
GET /api/automation/fraud-detection
Authorization: Bearer cf_live_your_api_key_here
```

**Response:**
```json
{
  "suspicious_count": 5,
  "high_risk_count": 2,
  "fraud_alerts": [
    {
      "transaction_type": "Payment",
      "anomaly_type": "Unusual Amount",
      "category": "Payment",
      "amount": 1000000,
      "fraud_score": 0.88,
      "recommendations": [
        "Verify transaction manually",
        "Contact customer for confirmation"
      ]
    }
  ]
}
```

#### 7. Cashflow Analyzer

**Endpoint:** `GET /api/automation/cashflow-analyzer`

**Description:** Identifies payment delays and cashflow bottlenecks.

**Request:**
```http
GET /api/automation/cashflow-analyzer
Authorization: Bearer cf_live_your_api_key_here
```

**Response:**
```json
{
  "total_pending": 2500000,
  "total_delayed": 500000,
  "bottlenecks": [
    {
      "message": "15 payments delayed by more than 30 days",
      "amount": 500000
    }
  ],
  "recommended_actions": [
    "Follow up on delayed payments",
    "Offer early payment discounts"
  ]
}
```

#### 8. Delay Cost Calculator

**Endpoint:** `GET /api/automation/delay-cost-calculator`

**Description:** Calculates financial loss from operational delays.

**Request:**
```http
GET /api/automation/delay-cost-calculator
Authorization: Bearer cf_live_your_api_key_here
```

**Response:**
```json
{
  "total_delay_cost": 125000,
  "delay_costs": [
    {
      "event_type": "Deal Processing Delay",
      "delay_days": 15,
      "amount": 500000,
      "estimated_cost": 25000
    }
  ]
}
```

#### 9. Churn Predictor

**Endpoint:** `GET /api/automation/churn-predictor`

**Description:** ML-powered identification of customers likely to churn.

**Request:**
```http
GET /api/automation/churn-predictor
Authorization: Bearer cf_live_your_api_key_here
```

**Response:**
```json
{
  "summary": {
    "high_risk_count": 8,
    "medium_risk_count": 12,
    "low_risk_count": 30,
    "total_at_risk_revenue": 2000000,
    "high_value_at_risk": 1500000
  },
  "churn_predictions": [
    {
      "customer_name": "ABC School",
      "churn_probability": 0.85,
      "risk_level": "High",
      "total_revenue": 500000,
      "revenue_at_risk": 425000,
      "total_orders": 10,
      "churn_timeframe": "30-60 days",
      "risk_factors": [
        "No orders in last 90 days",
        "Payment delays"
      ],
      "retention_recommendations": [
        "Reach out with special offer",
        "Schedule follow-up call"
      ]
    }
  ]
}
```

#### 10. Narrative BI

**Endpoint:** `GET /api/automation/narrative-bi`

**Description:** Converts complex data into simple business summaries.

**Request:**
```http
GET /api/automation/narrative-bi
Authorization: Bearer cf_live_your_api_key_here
```

**Response:**
```json
{
  "summary": "Your business is performing well with ₹50L revenue this month. However, 15 high-risk deals require immediate attention. Cashflow is healthy with only 5% delayed payments.",
  "overall_assessment": "Strong performance with minor risks",
  "key_insights": [
    "Revenue increased by 12.5% compared to last month",
    "15 deals at high risk of failure",
    "North zone showing performance decline"
  ],
  "recommended_actions": [
    "Prioritize follow-up on high-risk deals",
    "Investigate North zone performance issues",
    "Implement early payment incentives"
  ]
}
```

### Health Check

**Endpoint:** `GET /api/automation/health`

**Description:** Check if the automation API is running.

**Request:**
```http
GET /api/automation/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "C-FORGIA Automation API",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## API Key Management

### List API Keys

**Endpoint:** `GET /api/api-keys`

**Request:**
```http
GET /api/api-keys
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "apiKeys": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "DMS Pro Integration",
      "keyPrefix": "cf_live",
      "keyPreview": "cf_live_********************...",
      "tenantId": "your_tenant_id",
      "isActive": true,
      "permissions": ["read", "write"],
      "lastUsed": "2024-01-15T10:00:00.000Z",
      "expiresAt": "2025-12-31T23:59:59.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Revoke API Key

**Endpoint:** `DELETE /api/api-keys/:id`

**Request:**
```http
DELETE /api/api-keys/507f1f77bcf86cd799439011
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": "Additional error details (optional)"
}
```

### Common Error Codes

- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid or missing API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (endpoint doesn't exist)
- `500` - Internal Server Error
- `503` - Service Unavailable (AI service not running)

## Rate Limiting

Default rate limit: **1000 requests per hour** per API key.

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets

## Webhooks

Webhook support is available for real-time notifications. See [WEBHOOK_DOCUMENTATION.md](./WEBHOOK_DOCUMENTATION.md) for details.

## Field Mapping

See [FIELD_MAPPING.md](./FIELD_MAPPING.md) for complete field mapping documentation between DMS Pro and C-FORGIA.

## Support

For API support, contact:
- Email: support@c-forgia.com
- Documentation: https://docs.c-forgia.com/api
