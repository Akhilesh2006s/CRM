# Webhook Documentation

## Overview

C-FORGIA supports webhooks for real-time event notifications. You can configure webhooks to receive notifications when specific events occur in the CRM system.

## Webhook Events

### Available Events

| Event Name | Description | Payload |
|-----------|-------------|---------|
| `deal.created` | A new deal/lead is created | Deal object |
| `deal.updated` | A deal/lead is updated | Deal object |
| `deal.closed` | A deal is closed | Deal object |
| `payment.received` | A payment is received | Payment object |
| `payment.approved` | A payment is approved | Payment object |
| `payment.rejected` | A payment is rejected | Payment object |
| `sale.created` | A new sale is created | Sale object |
| `sale.completed` | A sale is completed | Sale object |
| `automation.insight` | New automation insight available | Insight object |

## Setting Up Webhooks

### 1. Register Webhook Endpoint

**Endpoint:** `POST /api/webhooks`

**Request:**
```http
POST /api/webhooks
Authorization: Bearer cf_live_your_api_key_here
Content-Type: application/json

{
  "url": "https://your-dms-pro.com/api/webhooks/c-forgia",
  "events": ["deal.created", "payment.received"],
  "secret": "your_webhook_secret_here"
}
```

**Response:**
```json
{
  "success": true,
  "webhook": {
    "id": "507f1f77bcf86cd799439011",
    "url": "https://your-dms-pro.com/api/webhooks/c-forgia",
    "events": ["deal.created", "payment.received"],
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. List Webhooks

**Endpoint:** `GET /api/webhooks`

**Request:**
```http
GET /api/webhooks
Authorization: Bearer cf_live_your_api_key_here
```

**Response:**
```json
{
  "success": true,
  "webhooks": [
    {
      "id": "507f1f77bcf86cd799439011",
      "url": "https://your-dms-pro.com/api/webhooks/c-forgia",
      "events": ["deal.created", "payment.received"],
      "isActive": true,
      "lastTriggered": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

### 3. Delete Webhook

**Endpoint:** `DELETE /api/webhooks/:id`

**Request:**
```http
DELETE /api/webhooks/507f1f77bcf86cd799439011
Authorization: Bearer cf_live_your_api_key_here
```

## Webhook Payload Format

### Deal Created Event

```json
{
  "event": "deal.created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "school_name": "ABC School",
    "contact_person": "John Doe",
    "contact_mobile": "9876543210",
    "email": "john@abcschool.com",
    "location": "Delhi",
    "zone": "North",
    "status": "Pending",
    "products": [
      {
        "product_name": "IIT",
        "quantity": 10,
        "unit_price": 5000
      }
    ],
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### Payment Received Event

```json
{
  "event": "payment.received",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "customer_name": "ABC School",
    "amount": 50000,
    "payment_method": "UPI",
    "payment_date": "2024-01-15T10:30:00.000Z",
    "status": "Approved",
    "reference_number": "UPI123456789"
  }
}
```

### Automation Insight Event

```json
{
  "event": "automation.insight",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "type": "revenue_at_risk",
    "insight": {
      "total_revenue_at_risk": 1250000.50,
      "high_risk_items": 15,
      "alert_level": "high"
    }
  }
}
```

## Webhook Security

### Signature Verification

All webhook requests include a signature header for verification:

**Header:** `X-C-FORGIA-Signature`

**Verification Process:**

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(signature, payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const calculatedSignature = hmac.update(JSON.stringify(payload)).digest('hex');
  return signature === calculatedSignature;
}

// In your webhook handler
const signature = req.headers['x-c-forgia-signature'];
const isValid = verifyWebhookSignature(signature, req.body, webhookSecret);

if (!isValid) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### Example: Webhook Handler in DMS Pro

```javascript
app.post('/api/webhooks/c-forgia', express.json(), (req, res) => {
  // Verify signature
  const signature = req.headers['x-c-forgia-signature'];
  const secret = process.env.C_FORGIA_WEBHOOK_SECRET;
  
  if (!verifyWebhookSignature(signature, req.body, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const { event, data, timestamp } = req.body;
  
  // Handle different events
  switch(event) {
    case 'deal.created':
      // Sync deal to DMS Pro
      syncDealToDMSPro(data);
      break;
      
    case 'payment.received':
      // Update payment status in DMS Pro
      updatePaymentInDMSPro(data);
      break;
      
    case 'automation.insight':
      // Store automation insights
      storeAutomationInsight(data);
      break;
  }
  
  // Always return 200 to acknowledge receipt
  res.status(200).json({ received: true });
});
```

## Webhook Retry Logic

If your webhook endpoint returns an error (non-2xx status), C-FORGIA will retry:

- **Retry attempts**: 3
- **Retry intervals**: 1 minute, 5 minutes, 30 minutes
- **Timeout**: 30 seconds per request

After 3 failed attempts, the webhook will be marked as failed and you'll receive a notification.

## Testing Webhooks

### Test Webhook Endpoint

**Endpoint:** `POST /api/webhooks/:id/test`

**Request:**
```http
POST /api/webhooks/507f1f77bcf86cd799439011/test
Authorization: Bearer cf_live_your_api_key_here
```

This will send a test webhook to your endpoint with sample data.

## Best Practices

1. **Always verify signatures** - Never trust webhooks without signature verification
2. **Idempotency** - Make your webhook handlers idempotent (handle duplicate events)
3. **Quick response** - Respond quickly (within 5 seconds) to avoid timeouts
4. **Logging** - Log all webhook events for debugging
5. **Error handling** - Return appropriate HTTP status codes

## Webhook Status Codes

Your webhook endpoint should return:

- `200` - Success (webhook processed)
- `400` - Bad Request (invalid payload)
- `401` - Unauthorized (invalid signature)
- `500` - Server Error (will trigger retry)
