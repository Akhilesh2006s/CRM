# CRM-FORGE API Documentation

## Table of Contents
1. [API Base URL](#api-base-url)
2. [Authentication](#authentication)
3. [API Key Generation](#api-key-generation)
4. [Complete API Endpoint List](#complete-api-endpoint-list)
5. [Sample API Requests/Responses](#sample-api-requestsresponses)
6. [Webhook Support](#webhook-support)
7. [Field Mapping Documentation](#field-mapping-documentation)
8. [Error Handling](#error-handling)

---

## API Base URL

### Production
```
https://crm-backend-production-2ffd.up.railway.app/api
```

**Alternative Production URL:**
```
https://crm-backend-production-fc85.up.railway.app/api
```

### Development
```
http://localhost:5000/api
```

**Note:** The production URL may vary. Please confirm the correct production URL with the C-FORGIA team.

---

## Authentication

### Method: Bearer Token (JWT)

All API endpoints (except authentication endpoints) require a Bearer token in the Authorization header.

**Header Format:**
```
Authorization: Bearer <your_jwt_token>
```

**Example:**
```http
GET /api/leads HTTP/1.1
Host: crm-backend-production-2ffd.up.railway.app
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## API Key Generation

The CRM-FORGE system uses **JWT (JSON Web Token)** authentication. There is no separate API key system. Instead, you obtain a JWT token by logging in through the authentication endpoints.

### Step 1: Register or Login

**Register a new user:**
```http
POST /api/auth/register
```

**Login with existing credentials:**
```http
POST /api/auth/login
```

### Step 2: Extract Token from Response

After successful login/registration, the API returns a JWT token in the response:

```json
{
  "_id": "user_id",
  "name": "User Name",
  "email": "user@example.com",
  "role": "Executive",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 3: Use Token for Subsequent Requests

Include the token in the `Authorization` header for all protected endpoints:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Expiration:** Tokens expire after 30 days. You'll need to re-authenticate after expiration.

---

## Complete API Endpoint List

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/firebase-login` | Firebase authentication | No |
| POST | `/api/auth/register-franchise` | Register franchise user | Yes (Admin/Super Admin) |
| GET | `/api/auth/me` | Get current user info | Yes |

### Lead Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/leads` | Get all leads | Yes |
| GET | `/api/leads/export` | Export leads | Yes |
| GET | `/api/leads/:id` | Get lead by ID | Yes |
| POST | `/api/leads` | Create lead | Yes |
| POST | `/api/leads/create` | Create lead (alternative) | Yes |
| PUT | `/api/leads/:id` | Update lead | Yes |
| POST | `/api/leads/:id/convert-to-client` | Convert lead to client | Yes |
| DELETE | `/api/leads/:id` | Delete lead | Yes |

### Sales Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/sales` | Get all sales | Yes |
| GET | `/api/sales/closed` | Get closed sales | Yes |
| GET | `/api/sales/customers` | Get sales customers | Yes |
| GET | `/api/sales/:id` | Get sale by ID | Yes |
| POST | `/api/sales/create` | Create sale | Yes |
| PUT | `/api/sales/:id` | Update sale | Yes |
| POST | `/api/sales/:id/submit-po` | Submit purchase order | Yes |

### DC (Distribution Center) Orders

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/dc-orders` | List all DC orders | Yes |
| GET | `/api/dc-orders/po-change-requests/list` | List PO change requests | Yes |
| GET | `/api/dc-orders/:id` | Get DC order by ID | Yes |
| GET | `/api/dc-orders/:id/history` | Get DC order history | Yes |
| POST | `/api/dc-orders/create` | Create DC order | Yes |
| PUT | `/api/dc-orders/:id` | Update DC order | Yes |
| PUT | `/api/dc-orders/:id/submit` | Submit DC order | Yes |
| PUT | `/api/dc-orders/:id/mark-in-transit` | Mark order as in transit | Yes |
| PUT | `/api/dc-orders/:id/complete` | Mark order as complete | Yes |
| PUT | `/api/dc-orders/:id/hold` | Hold DC order | Yes |
| POST | `/api/dc-orders/:id/submit-edit` | Submit edit request | Yes |
| PUT | `/api/dc-orders/:id/approve-edit` | Approve edit request | Yes |
| POST | `/api/dc-orders/:id/request-po-change` | Request PO change | Yes |
| PUT | `/api/dc-orders/:id/approve-po-change` | Approve PO change | Yes |

### Employee Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/employees` | Get all employees | Yes |
| GET | `/api/employees/tracking` | Get employee tracking | Yes |
| GET | `/api/employees/tracking/export` | Export employee tracking | Yes |
| GET | `/api/employees/:id` | Get employee by ID | Yes |
| GET | `/api/employees/:id/leaves` | Get employee leaves | Yes |
| POST | `/api/employees/create` | Create employee | Yes |
| PUT | `/api/employees/:id` | Update employee | Yes |
| PUT | `/api/employees/:id/reset-password` | Reset employee password | Yes |

### Executive Manager

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/executive-managers` | Get all executive managers | Yes |
| GET | `/api/executive-managers/po-change-requests` | List PO change requests | Yes |
| GET | `/api/executive-managers/my/executives` | Get my executives | Yes |
| GET | `/api/executive-managers/:managerId/employees` | Get manager employees | Yes |
| GET | `/api/executive-managers/:managerId/dashboard` | Get manager dashboard | Yes |
| GET | `/api/executive-managers/:managerId/leaves` | Get manager employee leaves | Yes |
| POST | `/api/executive-managers/create` | Create executive manager | Yes (Admin/Super Admin) |
| PUT | `/api/executive-managers/:managerId/assign-employees` | Assign employees to manager | Yes (Admin/Super Admin) |
| PUT | `/api/executive-managers/:managerId/state` | Update manager state | Yes (Admin/Super Admin) |
| PUT | `/api/executive-managers/assign-zone` | Assign zone to employee | Yes (Executive Manager/Admin) |
| PUT | `/api/executive-managers/leaves/:leaveId/approve` | Approve employee leave | Yes (Executive Manager) |
| PUT | `/api/executive-managers/assign-area` | Assign area to employee | Yes (Executive) |

### Training Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/training` | Get all trainings | Yes |
| GET | `/api/training/stats` | Get training statistics | Yes |
| GET | `/api/training/trainer/my` | Get my trainings (trainer) | Yes |
| GET | `/api/training/trainer/completed` | Get completed trainings (trainer) | Yes |
| GET | `/api/training/:id` | Get training by ID | Yes |
| POST | `/api/training/create` | Create training | Yes |
| PUT | `/api/training/:id` | Update training | Yes |
| PUT | `/api/training/:id/cancel` | Cancel training | Yes |
| POST | `/api/training/:id/mark-attendance` | Mark training attendance | Yes |
| POST | `/api/training/:id/complete` | Complete training | Yes |
| POST | `/api/training/:id/upload-feedback` | Upload training feedback | Yes |

### Service Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/services` | Get all services | Yes |
| GET | `/api/services/stats` | Get service statistics | Yes |
| GET | `/api/services/trainer/my` | Get my services (trainer) | Yes |
| GET | `/api/services/trainer/completed` | Get completed services (trainer) | Yes |
| GET | `/api/services/:id` | Get service by ID | Yes |
| POST | `/api/services/create` | Create service | Yes |
| PUT | `/api/services/:id` | Update service | Yes |
| PUT | `/api/services/:id/cancel` | Cancel service | Yes |
| POST | `/api/services/:id/mark-attendance` | Mark service attendance | Yes |
| POST | `/api/services/:id/complete` | Complete service | Yes |
| POST | `/api/services/:id/upload-feedback` | Upload service feedback | Yes |

### Trainer Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/trainers` | List all trainers | Yes |
| POST | `/api/trainers/create` | Create trainer | Yes |
| PUT | `/api/trainers/:id` | Update trainer | Yes |
| PUT | `/api/trainers/:id/active` | Set trainer active status | Yes |
| PUT | `/api/trainers/:id/reset-password` | Reset trainer password | Yes |

### Payment Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/payments` | Get all payments | Yes |
| GET | `/api/payments/export` | Export payments | Yes |
| GET | `/api/payments/:id` | Get payment by ID | Yes |
| POST | `/api/payments/create` | Create payment | Yes |
| PUT | `/api/payments/:id` | Update payment | Yes |
| PUT | `/api/payments/:id/approve` | Approve payment | Yes (Finance Manager/Admin/Super Admin/Manager) |

### Warehouse Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/warehouse` | Get warehouse items | Yes |
| GET | `/api/warehouse/dc/list` | Get warehouse DC list | Yes |
| GET | `/api/warehouse/hold-dc/list` | Get hold DC list | Yes |
| GET | `/api/warehouse/dc/:id` | Get warehouse DC by ID | Yes |
| GET | `/api/warehouse/reports` | Get warehouse reports | Yes |
| GET | `/api/warehouse/locations` | Get warehouse locations | Yes |
| GET | `/api/warehouse/:id` | Get warehouse item by ID | Yes |
| POST | `/api/warehouse` | Create warehouse item | Yes |
| POST | `/api/warehouse/stock` | Update stock | Yes |
| POST | `/api/warehouse/dc-order/:id/move-to-warehouse` | Move DC order to warehouse | Yes |
| PUT | `/api/warehouse/dc/:id` | Update warehouse DC | Yes |
| PUT | `/api/warehouse/dc/:id/hold` | Toggle hold DC | Yes |
| PUT | `/api/warehouse/:id` | Update warehouse item | Yes |

### Expense Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/expenses` | Get all expenses | Yes |
| GET | `/api/expenses/manager-pending` | Get manager pending expenses | Yes |
| GET | `/api/expenses/executive-manager-pending` | Get executive manager pending expenses | Yes |
| GET | `/api/expenses/finance-pending` | Get finance pending expenses | Yes |
| GET | `/api/expenses/report` | Get expenses report | Yes |
| GET | `/api/expenses/export` | Export expenses | Yes |
| GET | `/api/expenses/employee/:employeeId` | Get expenses by employee | Yes |
| GET | `/api/expenses/:id` | Get expense by ID | Yes |
| POST | `/api/expenses/create` | Create expense | Yes |
| POST | `/api/expenses/upload-bill` | Upload expense bill | Yes |
| POST | `/api/expenses/approve-multiple` | Approve multiple expenses | Yes |
| PUT | `/api/expenses/:id` | Update expense | Yes |
| PUT | `/api/expenses/:id/approve` | Approve expense | Yes |

### Leave Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/leaves` | Get all leaves | Yes |
| POST | `/api/leaves/create` | Create leave request | Yes |
| PUT | `/api/leaves/:id/approve` | Approve leave | Yes |

### Report Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/reports/all` | Get all reports | Yes |
| GET | `/api/reports/sales` | Get sales reports | Yes |
| POST | `/api/reports/generate` | Generate report | Yes |

### Dashboard

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/dashboard` | Get dashboard data | Yes |

### Franchise Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/franchises/:franchiseEmail/dashboard` | Get franchise dashboard | Yes |

### Partner/Vendor Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/partners` | List all partners | Yes |
| GET | `/api/partners/:id` | Get partner by ID | Yes |
| POST | `/api/partners` | Create partner | Yes |
| PUT | `/api/partners/:id/products` | Update partner products | Yes |

### Partner User

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/partner-user/dashboard` | Get partner dashboard | Yes |
| GET | `/api/partner-user/stocks` | Get partner stocks | Yes |
| GET | `/api/partner-user/dcs` | Get partner DCs | Yes |

### Partner Costs

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/partner-costs/zones` | Get zones | Yes |
| GET | `/api/partner-costs/schools` | Get all schools | Yes |
| GET | `/api/partner-costs/schools/zone/:zone` | Get schools by zone | Yes |
| GET | `/api/partner-costs/:partnerId` | Get partner cost | Yes |
| PUT | `/api/partner-costs/:partnerId` | Update partner cost | Yes |

### Product Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/products/active` | Get active products | Yes |
| GET | `/api/products` | List all products | Yes (Admin/Super Admin) |
| GET | `/api/products/:id` | Get product by ID | Yes (Admin/Super Admin) |
| POST | `/api/products` | Create product | Yes (Admin/Super Admin) |
| PUT | `/api/products/:id` | Update product | Yes (Admin/Super Admin) |
| DELETE | `/api/products/:id` | Delete product | Yes (Admin/Super Admin) |

### Deliverable Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/deliverables` | Get deliverables | Yes |
| POST | `/api/deliverables` | Create deliverable | Yes |
| PUT | `/api/deliverables/:id` | Update deliverable | Yes |

### Sample Request Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/sample-requests/my` | Get my sample requests | Yes (Executive/Sales BDE/Employee) |
| GET | `/api/sample-requests/pending` | Get pending sample requests | Yes |
| GET | `/api/sample-requests/accepted` | Get accepted sample requests | Yes (Admin/Super Admin) |
| POST | `/api/sample-requests` | Create sample request | Yes (Executive/Sales BDE/Employee) |
| PUT | `/api/sample-requests/:id/accept` | Accept sample request | Yes |
| PUT | `/api/sample-requests/:id/reject` | Reject sample request | Yes |

### Stock Return Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/stock-returns/executive` | List executive returns | Yes |
| GET | `/api/stock-returns/executive/list` | List executive returns (alternative) | Yes |
| GET | `/api/stock-returns/executive/mine` | List my executive returns | Yes |
| GET | `/api/stock-returns/warehouse-executive/queue` | List warehouse executive queue | Yes |
| GET | `/api/stock-returns/warehouse-executive/:id` | Get return for warehouse executive | Yes |
| GET | `/api/stock-returns/warehouse-manager/queue` | List warehouse manager queue | Yes |
| GET | `/api/stock-returns/warehouse-manager/:id` | Get return for warehouse manager | Yes |
| GET | `/api/stock-returns/warehouse` | List warehouse returns | Yes |
| GET | `/api/stock-returns/:id` | Get executive return by ID | Yes |
| POST | `/api/stock-returns/executive` | Create executive return | Yes |
| POST | `/api/stock-returns/warehouse` | Create warehouse return | Yes |
| POST | `/api/stock-returns/upload-photo` | Upload return photo | Yes |
| PUT | `/api/stock-returns/:id` | Update executive return | Yes |
| PUT | `/api/stock-returns/:id/warehouse-verify` | Warehouse verify return | Yes |
| PUT | `/api/stock-returns/:id/manager-action` | Manager action on return | Yes |

### Attendance Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/attendance` | Get attendance records | Yes |
| POST | `/api/attendance` | Create attendance record | Yes |
| PUT | `/api/attendance/:id` | Update attendance record | Yes |

### Location Services

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/location/get-town` | Get town from pincode | No |

### Metadata Services

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/metadata/inventory-options` | Get inventory options | Yes |
| GET | `/api/metadata/states` | Get states | Yes |
| GET | `/api/metadata/cities` | Get cities | Yes |

### School Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/schools` | Get all schools | Yes |

### AI Services

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/ai/revenue-at-risk` | Calculate revenue at risk | Yes |
| GET | `/api/ai/executive-dashboard` | Get executive dashboard data | Yes |
| GET | `/api/ai/priority-engine` | Calculate priority scores | Yes |
| GET | `/api/ai/deal-risk-scoring` | Score deal risk | Yes |
| GET | `/api/ai/performance-risk` | Detect performance anomalies | Yes |
| GET | `/api/ai/fraud-detection` | Detect fraud anomalies | Yes |
| GET | `/api/ai/cashflow-analyzer` | Analyze cashflow blockages | Yes |
| GET | `/api/ai/delay-cost-calculator` | Calculate delay costs | Yes |
| GET | `/api/ai/churn-predictor` | Predict churn | Yes |
| GET | `/api/ai/narrative-bi` | Generate business narrative | Yes |

### Contact Queries

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/contact-queries` | Get contact queries | Yes |
| POST | `/api/contact-queries` | Create contact query | Yes |
| PUT | `/api/contact-queries/:id` | Update contact query | Yes |

### Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Health check endpoint | No |

---

## Sample API Requests/Responses

### 1. User Registration

**Request:**
```http
POST /api/auth/register HTTP/1.1
Host: crm-backend-production-2ffd.up.railway.app
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "role": "Executive",
  "phone": "+1234567890",
  "department": "Sales"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "role": "Executive",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsImlhdCI6MTYzODAyNzIwMCwiZXhwIjoxNjQwNjE5MjAwfQ.abc123..."
}
```

### 2. User Login

**Request:**
```http
POST /api/auth/login HTTP/1.1
Host: crm-backend-production-2ffd.up.railway.app
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "role": "Executive",
  "roles": [],
  "hasCompletedFirstTimeSetup": false,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsImlhdCI6MTYzODAyNzIwMCwiZXhwIjoxNjQwNjE5MjAwfQ.abc123..."
}
```

### 3. Get Current User

**Request:**
```http
GET /api/auth/me HTTP/1.1
Host: crm-backend-production-2ffd.up.railway.app
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "role": "Executive",
  "phone": "+1234567890",
  "department": "Sales",
  "createdAt": "2023-11-30T10:00:00.000Z",
  "lastLogin": "2023-12-01T08:30:00.000Z"
}
```

### 4. Create Lead

**Request:**
```http
POST /api/leads/create HTTP/1.1
Host: crm-backend-production-2ffd.up.railway.app
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "ABC Corporation",
  "email": "contact@abccorp.com",
  "phone": "+1234567890",
  "company": "ABC Corporation",
  "status": "New",
  "source": "Website",
  "notes": "Interested in product demo"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f191e810c19729de860ea",
  "name": "ABC Corporation",
  "email": "contact@abccorp.com",
  "phone": "+1234567890",
  "company": "ABC Corporation",
  "status": "New",
  "source": "Website",
  "notes": "Interested in product demo",
  "createdBy": "507f1f77bcf86cd799439011",
  "createdAt": "2023-12-01T10:00:00.000Z",
  "updatedAt": "2023-12-01T10:00:00.000Z"
}
```

### 5. Get All Leads

**Request:**
```http
GET /api/leads HTTP/1.1
Host: crm-backend-production-2ffd.up.railway.app
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
[
  {
    "_id": "507f191e810c19729de860ea",
    "name": "ABC Corporation",
    "email": "contact@abccorp.com",
    "phone": "+1234567890",
    "company": "ABC Corporation",
    "status": "New",
    "source": "Website",
    "createdAt": "2023-12-01T10:00:00.000Z"
  },
  {
    "_id": "507f191e810c19729de860eb",
    "name": "XYZ Industries",
    "email": "info@xyzind.com",
    "phone": "+0987654321",
    "company": "XYZ Industries",
    "status": "Contacted",
    "source": "Referral",
    "createdAt": "2023-12-01T09:00:00.000Z"
  }
]
```

### 6. Create Sale

**Request:**
```http
POST /api/sales/create HTTP/1.1
Host: crm-backend-production-2ffd.up.railway.app
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "customerName": "ABC Corporation",
  "customerEmail": "contact@abccorp.com",
  "customerPhone": "+1234567890",
  "product": "Product Name",
  "quantity": 100,
  "amount": 50000,
  "status": "Pending"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f191e810c19729de860ec",
  "customerName": "ABC Corporation",
  "customerEmail": "contact@abccorp.com",
  "customerPhone": "+1234567890",
  "product": "Product Name",
  "quantity": 100,
  "amount": 50000,
  "status": "Pending",
  "createdBy": "507f1f77bcf86cd799439011",
  "createdAt": "2023-12-01T10:00:00.000Z"
}
```

### 7. Error Response Example

**Request (Invalid Token):**
```http
GET /api/leads HTTP/1.1
Host: crm-backend-production-2ffd.up.railway.app
Authorization: Bearer invalid_token
```

**Response (401 Unauthorized):**
```json
{
  "message": "Token is not valid"
}
```

**Request (Missing Token):**
```http
GET /api/leads HTTP/1.1
Host: crm-backend-production-2ffd.up.railway.app
```

**Response (401 Unauthorized):**
```json
{
  "message": "No token, authorization denied"
}
```

---

## Webhook Support

**Current Status:** Webhook support is **not currently available** in the CRM-FORGE API.

**Future Implementation:**
If webhook support is required for your automation system, please contact the C-FORGIA team to discuss:
- Webhook event types needed
- Webhook endpoint URL configuration
- Authentication method for webhooks
- Retry policies
- Payload format

**Potential Webhook Events (to be implemented):**
- Lead created/updated
- Sale created/updated/completed
- Payment received/approved
- Order status changed
- Employee attendance marked
- Expense approved/rejected

---

## Field Mapping Documentation

### Lead Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Lead/Company name |
| `email` | String | Yes | Contact email |
| `phone` | String | No | Contact phone number |
| `company` | String | No | Company name |
| `status` | String | No | Lead status (New, Contacted, Qualified, etc.) |
| `source` | String | No | Lead source (Website, Referral, etc.) |
| `notes` | String | No | Additional notes |
| `createdBy` | ObjectId | Auto | User who created the lead |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

### Sale Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customerName` | String | Yes | Customer name |
| `customerEmail` | String | Yes | Customer email |
| `customerPhone` | String | No | Customer phone |
| `product` | String | Yes | Product name |
| `quantity` | Number | Yes | Product quantity |
| `amount` | Number | Yes | Sale amount |
| `status` | String | No | Sale status (Pending, Approved, Completed, etc.) |
| `createdBy` | ObjectId | Auto | User who created the sale |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

### User Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | User full name |
| `email` | String | Yes | User email (unique) |
| `password` | String | Yes | User password (hashed) |
| `role` | String | Yes | User role (Executive, Admin, Super Admin, etc.) |
| `phone` | String | No | User phone number |
| `department` | String | No | User department |
| `isActive` | Boolean | No | Account active status |
| `lastLogin` | Date | Auto | Last login timestamp |
| `createdAt` | Date | Auto | Account creation timestamp |

### Employee Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Employee name |
| `email` | String | Yes | Employee email |
| `phone` | String | No | Employee phone |
| `employeeId` | String | Yes | Unique employee ID |
| `department` | String | No | Department |
| `designation` | String | No | Job designation |
| `managerId` | ObjectId | No | Manager reference |
| `isActive` | Boolean | No | Active status |
| `createdAt` | Date | Auto | Creation timestamp |

### Payment Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `customerName` | String | Yes | Customer name |
| `amount` | Number | Yes | Payment amount |
| `paymentDate` | Date | Yes | Payment date |
| `paymentMethod` | String | No | Payment method |
| `status` | String | No | Payment status (Pending, Approved, Rejected) |
| `approvedBy` | ObjectId | No | Approver user ID |
| `approvedAt` | Date | No | Approval timestamp |
| `createdBy` | ObjectId | Auto | Creator user ID |
| `createdAt` | Date | Auto | Creation timestamp |

### Expense Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `employeeId` | ObjectId | Yes | Employee ID |
| `amount` | Number | Yes | Expense amount |
| `category` | String | Yes | Expense category |
| `description` | String | Yes | Expense description |
| `billUrl` | String | No | Bill/document URL |
| `status` | String | No | Status (Pending, Approved, Rejected) |
| `approvedBy` | ObjectId | No | Approver user ID |
| `createdAt` | Date | Auto | Creation timestamp |

### DC Order Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `orderNumber` | String | Yes | Order number |
| `customerId` | ObjectId | Yes | Customer reference |
| `items` | Array | Yes | Order items |
| `totalAmount` | Number | Yes | Total order amount |
| `status` | String | No | Order status (Draft, Submitted, In Transit, Completed, etc.) |
| `createdBy` | ObjectId | Auto | Creator user ID |
| `createdAt` | Date | Auto | Creation timestamp |
| `updatedAt` | Date | Auto | Last update timestamp |

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error, missing required fields) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found (resource doesn't exist) |
| 500 | Internal Server Error |

### Error Response Format

All error responses follow this format:

```json
{
  "message": "Error description"
}
```

**Example Error Responses:**

**400 Bad Request:**
```json
{
  "message": "Invalid email format"
}
```

**401 Unauthorized:**
```json
{
  "message": "No token, authorization denied"
}
```

**403 Forbidden:**
```json
{
  "message": "Access denied. Insufficient permissions."
}
```

**404 Not Found:**
```json
{
  "message": "Lead not found"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Something went wrong!",
  "error": "Detailed error message"
}
```

---

## Rate Limiting

**Current Status:** Rate limiting is not explicitly implemented. However, please implement reasonable rate limiting on your side to avoid overwhelming the API.

**Recommendations:**
- Limit requests to 100 requests per minute per API key
- Implement exponential backoff for retries
- Cache responses when appropriate

---

## CORS Configuration

The API supports CORS (Cross-Origin Resource Sharing) for web applications. In development, all origins are allowed. In production, specific origins may be whitelisted.

---

## Support and Contact

For API support, questions, or to request additional endpoints:
- **Email:** Contact the C-FORGIA team
- **Documentation Updates:** This document will be updated as the API evolves

---

## Version Information

- **API Version:** 1.0
- **Last Updated:** December 2023
- **Base URL:** `https://crm-backend-production-2ffd.up.railway.app/api`

---

**Note:** This documentation is based on the current codebase. Some endpoints may require specific roles or permissions. Always test endpoints with your credentials to verify access levels.
