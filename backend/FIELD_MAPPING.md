# Field Mapping Documentation

## C-FORGIA ↔ DMS Pro Field Mapping

This document provides complete field mapping between DMS Pro and C-FORGIA CRM systems for seamless data integration.

## Deal/Lead Fields

| DMS Pro Field | C-FORGIA Field | Type | Required | Notes |
|--------------|----------------|------|----------|-------|
| `schoolName` | `school_name` | String | Yes | School or customer name |
| `school_name` | `school_name` | String | Yes | Alternative field name |
| `contactPerson` | `contact_person` | String | Yes | Primary contact name |
| `contact_person` | `contact_person` | String | Yes | Alternative field name |
| `phone` | `contact_mobile` | String | Yes | Primary contact mobile |
| `contactMobile` | `contact_mobile` | String | Yes | Alternative field name |
| `email` | `email` | String | No | Contact email address |
| `contactPerson2` | `contact_person2` | String | No | Secondary contact |
| `contact_person2` | `contact_person2` | String | No | Alternative field name |
| `phone2` | `contact_mobile2` | String | No | Secondary contact mobile |
| `contactMobile2` | `contact_mobile2` | String | No | Alternative field name |
| `location` | `location` | String | No | City/Town |
| `address` | `address` | String | No | Full address |
| `zone` | `zone` | String | No | Geographic zone |
| `schoolType` | `school_type` | String | No | Private, Public, Trust, etc. |
| `school_type` | `school_type` | String | No | Alternative field name |
| `status` | `status` | String | No | Pending, Processing, Saved, Closed |
| `leadStatus` | `status` | String | No | Alternative field name |
| `priority` | `priority` | String | No | Hot, Warm, Cold |
| `branches` | `branches` | Number | No | Number of branches |
| `strength` | `strength` | Number | No | Student count |
| `remarks` | `remarks` | String | No | Additional notes |
| `followUpDate` | `follow_up_date` | String | No | Format: dd-mm-yyyy or yyyy-mm-dd |
| `follow_up_date` | `follow_up_date` | String | No | Alternative field name |
| `assignedTo` | `assigned_to` | String | No | User ID of assigned executive |
| `assigned_to` | `assigned_to` | String | No | Alternative field name |

## Product Fields

| DMS Pro Field | C-FORGIA Field | Type | Required | Notes |
|--------------|----------------|------|----------|-------|
| `products` | `products` | Array | Yes | Array of product objects |
| `products[].productName` | `products[].product_name` | String | Yes | Product name |
| `products[].product_name` | `products[].product_name` | String | Yes | Alternative field name |
| `products[].quantity` | `products[].quantity` | Number | Yes | Quantity ordered |
| `products[].unitPrice` | `products[].unit_price` | Number | No | Price per unit |
| `products[].unit_price` | `products[].unit_price` | Number | No | Alternative field name |
| `products[].price` | `products[].unit_price` | Number | No | Alternative field name |
| `products[].strength` | `products[].strength` | Number | No | Student strength for product |

## Payment Fields

| DMS Pro Field | C-FORGIA Field | Type | Required | Notes |
|--------------|----------------|------|----------|-------|
| `amount` | `amount` | Number | Yes | Payment amount |
| `paymentMethod` | `payment_method` | String | Yes | Cash, UPI, NEFT/RTGS, etc. |
| `payment_method` | `payment_method` | String | Yes | Alternative field name |
| `paymentDate` | `payment_date` | String | Yes | Format: yyyy-mm-dd or ISO 8601 |
| `payment_date` | `payment_date` | String | Yes | Alternative field name |
| `status` | `status` | String | No | Pending, Approved, Hold, Rejected |
| `referenceNumber` | `reference_number` | String | No | Transaction reference |
| `reference_number` | `reference_number` | String | No | Alternative field name |
| `customerName` | `customer_name` | String | Yes | Customer/school name |
| `customer_name` | `customer_name` | String | Yes | Alternative field name |

## Sale/Order Fields

| DMS Pro Field | C-FORGIA Field | Type | Required | Notes |
|--------------|----------------|------|----------|-------|
| `customerName` | `customer_name` | String | Yes | Customer name |
| `customer_name` | `customer_name` | String | Yes | Alternative field name |
| `customerEmail` | `customer_email` | String | No | Customer email |
| `customer_email` | `customer_email` | String | No | Alternative field name |
| `customerPhone` | `customer_phone` | String | Yes | Customer phone |
| `customer_phone` | `customer_phone` | String | Yes | Alternative field name |
| `product` | `product` | String | Yes | Product name |
| `quantity` | `quantity` | Number | Yes | Quantity |
| `unitPrice` | `unit_price` | Number | Yes | Price per unit |
| `unit_price` | `unit_price` | Number | Yes | Alternative field name |
| `totalAmount` | `total_amount` | Number | Yes | Total order amount |
| `total_amount` | `total_amount` | Number | Yes | Alternative field name |
| `status` | `status` | String | No | Pending, Confirmed, Closed, etc. |
| `paymentStatus` | `payment_status` | String | No | Pending, Partial, Paid, Overdue |
| `payment_status` | `payment_status` | String | No | Alternative field name |
| `saleDate` | `sale_date` | String | No | Format: yyyy-mm-dd or ISO 8601 |
| `sale_date` | `sale_date` | String | No | Alternative field name |

## Date Format Conversion

C-FORGIA accepts dates in multiple formats:

1. **ISO 8601**: `2024-01-15T10:30:00.000Z`
2. **YYYY-MM-DD**: `2024-01-15`
3. **DD-MM-YYYY**: `15-01-2024`

All dates are converted to UTC internally.

## Example: Creating a Deal from DMS Pro

### DMS Pro Request Format

```json
{
  "schoolName": "ABC School",
  "contactPerson": "John Doe",
  "phone": "9876543210",
  "email": "john@abcschool.com",
  "location": "Delhi",
  "zone": "North",
  "schoolType": "Private",
  "status": "Pending",
  "products": [
    {
      "productName": "IIT",
      "quantity": 10,
      "unitPrice": 5000,
      "strength": 100
    },
    {
      "productName": "VedicMath",
      "quantity": 5,
      "unitPrice": 3000
    }
  ],
  "followUpDate": "20-01-2024",
  "remarks": "Interested in both products"
}
```

### C-FORGIA Internal Format

```json
{
  "school_name": "ABC School",
  "contact_person": "John Doe",
  "contact_mobile": "9876543210",
  "email": "john@abcschool.com",
  "location": "Delhi",
  "zone": "North",
  "school_type": "Private",
  "status": "Pending",
  "products": [
    {
      "product_name": "IIT",
      "quantity": 10,
      "unit_price": 5000,
      "strength": 100
    },
    {
      "product_name": "VedicMath",
      "quantity": 5,
      "unit_price": 3000
    }
  ],
  "follow_up_date": "2024-01-20T00:00:00.000Z",
  "remarks": "Interested in both products"
}
```

## Field Transformation Rules

1. **CamelCase to snake_case**: Automatically converts `contactPerson` → `contact_person`
2. **Date normalization**: All dates converted to ISO 8601 format
3. **Phone number**: Removes spaces, dashes, and country codes if present
4. **Email**: Converted to lowercase and trimmed
5. **Product names**: Case-insensitive matching with existing products
6. **Numbers**: Strings converted to numbers where applicable

## Required vs Optional Fields

### Required Fields for Deal Creation:
- `school_name` (or `schoolName`)
- `contact_person` (or `contactPerson`)
- `contact_mobile` (or `phone`, `contactMobile`)
- `products` (at least one product)

### Optional Fields:
- All other fields are optional and will use defaults if not provided

## Validation Rules

1. **Email**: Must be valid email format
2. **Phone**: Must be 10 digits (Indian format)
3. **Date**: Must be valid date format
4. **Amounts**: Must be positive numbers
5. **Quantities**: Must be positive integers
6. **Status**: Must be one of allowed enum values

## Error Handling

If a field mapping fails:

1. The API will return a `400 Bad Request` error
2. Error message will indicate which field failed
3. Suggested correction will be provided

Example:
```json
{
  "error": "Validation Error",
  "message": "Invalid field value",
  "details": {
    "field": "contact_mobile",
    "value": "123",
    "error": "Phone number must be 10 digits",
    "suggestion": "Please provide a valid 10-digit mobile number"
  }
}
```
