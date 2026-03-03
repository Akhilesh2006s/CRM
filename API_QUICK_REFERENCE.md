# CRM-FORGE API Quick Reference

## 🔑 Authentication

**Method:** Bearer Token (JWT)

**Get Token:**
```bash
POST /api/auth/login
Body: { "email": "user@example.com", "password": "password" }
Response: { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**Use Token:**
```http
Authorization: Bearer <your_token>
```

---

## 🌐 Production API Base URL

```
https://crm-backend-production-2ffd.up.railway.app/api
```

**Alternative:**
```
https://crm-backend-production-fc85.up.railway.app/api
```

---

## 📋 Most Common Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user

### Leads
- `GET /api/leads` - List all leads
- `POST /api/leads/create` - Create lead
- `PUT /api/leads/:id` - Update lead
- `GET /api/leads/:id` - Get lead by ID

### Sales
- `GET /api/sales` - List all sales
- `POST /api/sales/create` - Create sale
- `PUT /api/sales/:id` - Update sale
- `GET /api/sales/:id` - Get sale by ID

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees/create` - Create employee
- `GET /api/employees/:id` - Get employee by ID

### Payments
- `GET /api/payments` - List all payments
- `POST /api/payments/create` - Create payment
- `PUT /api/payments/:id/approve` - Approve payment

### Expenses
- `GET /api/expenses` - List all expenses
- `POST /api/expenses/create` - Create expense
- `PUT /api/expenses/:id/approve` - Approve expense

---

## 🔧 cURL Examples

### Login
```bash
curl -X POST https://crm-backend-production-2ffd.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

### Get Leads (with token)
```bash
curl -X GET https://crm-backend-production-2ffd.up.railway.app/api/leads \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### Create Lead
```bash
curl -X POST https://crm-backend-production-2ffd.up.railway.app/api/leads/create \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ABC Corporation",
    "email": "contact@abccorp.com",
    "phone": "+1234567890",
    "status": "New"
  }'
```

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## ⚠️ Important Notes

1. **Token Expiration:** Tokens expire after 30 days
2. **No Webhooks:** Webhook support is not currently available
3. **Rate Limiting:** Implement client-side rate limiting (recommended: 100 req/min)
4. **CORS:** Enabled for web applications

---

## 📚 Full Documentation

See `API_DOCUMENTATION.md` for complete endpoint list, field mappings, and detailed examples.

---

**Last Updated:** December 2023
