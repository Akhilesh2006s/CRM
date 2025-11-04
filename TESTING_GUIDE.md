# C-FORGIA CRM - Complete Testing & Walkthrough Guide

## 🎯 Purpose
This guide provides step-by-step instructions for testing every feature and page in the C-FORGIA CRM system. Use this for screen recording and project submission.

---

## 📋 Table of Contents
1. [Landing Page](#1-landing-page)
2. [Authentication](#2-authentication)
3. [Dashboard Overview](#3-dashboard-overview)
4. [DC (Delivery Challan) Management](#4-dc-delivery-challan-management)
5. [Employee Management](#5-employee-management)
6. [Leave Management](#6-leave-management)
7. [Training & Services](#7-training--services)
8. [Warehouse Management](#8-warehouse-management)
9. [Stock Returns](#9-stock-returns)
10. [Payments](#10-payments)
11. [Expenses](#11-expenses)
12. [Reports](#12-reports)
13. [Settings](#13-settings)

---

## 1. Landing Page

### **URL:** `/` or `localhost:3001`

### **What to Test:**
1. **Navigation Bar:**
   - Click "Login" → Should navigate to login page
   - Click "Get Started" → Should navigate to registration
   - Check responsive design (mobile/desktop)

2. **Hero Section:**
   - Animated background (Aurora effect)
   - Main headline and CTA buttons
   - Scroll animations

3. **Features Section:**
   - Scroll through feature cards
   - Check animations and hover effects

4. **Pricing Section:**
   - Three pricing tiers (Monthly, 6 Months, Yearly)
   - Highlighted "Popular" plan

5. **Testimonials:**
   - Scroll through testimonial cards
   - Check animations

6. **Footer:**
   - Links and company information

### **Key Points to Mention:**
- Modern, premium design with glassmorphism effects
- Smooth animations and transitions
- Responsive across devices

---

## 2. Authentication

### **2.1 Login Page**
**URL:** `/auth/login`

### **What to Test:**
1. **Form Fields:**
   - Enter email address
   - Enter password
   - Toggle password visibility (Show/Hide button)
   - Click "Sign in" button

2. **Error Handling:**
   - Try invalid credentials → Should show error toast
   - Try empty fields → Should show validation

3. **Success Flow:**
   - Enter valid credentials → Should redirect to `/dashboard`
   - Should store auth token in localStorage

4. **Navigation:**
   - Click "Create one" link → Should go to register page

### **Key Features:**
- Dark theme with Aurora background
- Password visibility toggle
- Toast notifications for errors/success
- Form validation

---

### **2.2 Registration Page**
**URL:** `/auth/register`

### **What to Test:**
1. **Form Fields:**
   - Enter name
   - Enter email
   - Enter password
   - Click "Create account"

2. **Success Flow:**
   - Successful registration → Redirects to dashboard
   - User is automatically logged in

3. **Navigation:**
   - Click "Sign in" link → Should go to login page

### **Key Features:**
- Simple registration form
- Auto-login after registration
- Toast notifications

---

## 3. Dashboard Overview

### **URL:** `/dashboard`

### **What to Test:**

#### **3.1 Sidebar Navigation**
1. **User Profile Section:**
   - Shows user avatar (initials)
   - Shows user name and "Active" status
   - Check gradient avatar background

2. **Navigation Menu:**
   - **Collapse/Expand Sidebar:**
     - Click X icon to collapse (shows only icons)
     - Click Menu icon to expand
     - **Hover Tooltips:**
       - When collapsed, hover over any icon → Tooltip popover appears
       - For items with submenu (DC, Users, etc.) → Shows full submenu list
       - For single items → Shows simple tooltip

3. **Menu Items (Role-Based):**
   - **Admin/Super Admin:** Full access to all menus
   - **Manager:** Limited access (DC, Warehouse, Expenses, Reports)
   - **Coordinator:** DC, Users, Training, Warehouse, Payments, Reports
   - **Employee:** Only Dashboard, My DC, Payments, Expenses, My Leaves

#### **3.2 Top Navigation Bar**
1. **White Navbar:**
   - Shows C-FORGIA logo and company name
   - "Sign out" button on right
   - **Auto-hide on scroll down, appears on scroll up**
   - **Does NOT cover sidebar** (starts after sidebar)

#### **3.3 Main Dashboard Content**

**A. KPI Stat Cards (7 Cards):**
- Active Leads
- Total Sales
- Existing Schools
- Pending Trainings
- Completed Trainings
- Pending Services
- Completed Services
- **Features:**
  - Color-coded gradients
  - Hover effects
  - Icons with gradient backgrounds
  - Real-time data from API

**B. Dashboard Tabs:**
- **Dashboard Tab:** Main analytics view
- **Leads Dashboard Tab:** Leads analytics with date filters

**C. Charts Section:**

1. **Leads Volume Chart (Bar Chart):**
   - Shows 24-hour activity
   - Time filters: 24H (active), 7D, 30D
   - Hover to see values

2. **Revenue Trend Chart (Area Chart):**
   - Week-over-week revenue progression
   - KPI boxes: Peak, Average, Minimum
   - Hover interactions

3. **Training & Service Status (Donut Chart):**
   - Visual breakdown of training/service status
   - Legend with percentages
   - Color-coded segments

**D. Alerts Section:**
- Active alerts with color-coded indicators
- Warning and info alerts
- "View all" link

**E. Leads by Zone Table:**
- Zone-wise lead distribution
- Hot, Warm, Cold lead categories
- Color-coded badges
- Hover effects on rows

**F. Recent Activity Feed:**
- Latest system activities
- Color-coded activity types
- Timestamp information

**G. Leads Dashboard Tab:**
- Date range filters (From Date, To Date)
- Search button
- **Reports:**
  - Zone wise Leads table
  - Executive wise Leads table
  - Zone wise Closed Leads
  - Executive wise Closed Leads

### **Key Features to Highlight:**
- Premium, modern design (Apple x Notion x Linear x Stripe style)
- Real-time data updates
- Interactive charts
- Responsive layout
- Smooth animations

---

## 4. DC (Delivery Challan) Management

### **4.1 Create Sale / DC**
**URL:** `/dashboard/dc/create`

### **What to Test:**
1. **Form Fields:**
   - School Type (dropdown)
   - School Name (text)
   - Contact Person (text)
   - Contact Mobile (text)
   - Email (email)
   - Secondary Contact (optional)
   - Location (text)
   - Address (textarea)
   - Lead Status (dropdown: pending, hot, warm, cold)
   - Zone (dropdown)
   - Number of Branches
   - Student Strength
   - Remarks (textarea)
   - Follow-up Date (date picker)
   - Assigned To (employee dropdown)

2. **Product Selection:**
   - Checkboxes for products: Abacus, Vedic Maths, EELL, IIT, CodeChamp, Math Lab
   - For each selected product:
     - Enter Price
     - Enter Quantity
     - Enter Strength (students)

3. **Submit:**
   - Click "Create Sale" button
   - Should create a Sale and DC automatically
   - Success message and redirect

### **Key Features:**
- Multi-product selection
- Dynamic product fields
- Employee assignment
- Creates both Sale and DC records

---

### **4.2 Closed Sales**
**URL:** `/dashboard/dc/closed`

### **What to Test:**
1. **View Closed Sales:**
   - List of all completed/closed sales
   - Table with: School Name, Products, Amount, Date, Status
   - Filter/search functionality
   - Sort by columns

2. **Actions:**
   - View details
   - Export (if available)

### **Key Features:**
- Comprehensive sales history
- Filtering and sorting

---

### **4.3 Saved DC**
**URL:** `/dashboard/dc/saved`

### **What to Test:**
1. **View Saved DCs:**
   - List of DCs saved as drafts
   - Edit or delete saved DCs
   - Complete saved DCs

### **Key Features:**
- Draft DC management
- Resume work on incomplete DCs

---

### **4.4 Pending DC**
**URL:** `/dashboard/dc/pending`

### **What to Test:**
1. **View Pending DCs:**
   - DCs awaiting approval/processing
   - Status indicators
   - Actions: Approve, Reject, Hold

2. **Workflow:**
   - Manager reviews pending DCs
   - Can approve to move to warehouse
   - Can request changes

---

### **4.5 EMP DC**
**URL:** `/dashboard/dc/emp`

### **What to Test:**
1. **View Employee DCs:**
   - All DCs assigned to employees
   - Employee-wise grouping
   - Status tracking

---

### **4.6 My DC (Employee View)**
**URL:** `/dashboard/dc/my`

### **What to Test:**
1. **View Assigned DCs:**
   - Only shows DCs assigned to logged-in employee
   - Filters by status (created, pending, etc.)

2. **Submit PO (Purchase Order):**
   - Click on a DC with status "created"
   - Upload PO Image/Photo
   - Add Remarks
   - Click "Submit PO"
   - DC status changes to "PO Submitted"

3. **Workflow:**
   - Employee receives DC assignment
   - Uploads PO document
   - Submits for manager review
   - Manager reviews and approves/rejects

### **Key Features:**
- Employee-specific view
- PO upload functionality
- Status-based filtering

---

### **4.7 DC List (Main Page)**
**URL:** `/dashboard/dc`

### **What to Test:**
1. **View All DCs:**
   - Complete DC list with filters
   - Search by school name, code, status
   - Date range filters
   - Export functionality

2. **Actions:**
   - View details
   - Edit DC
   - Change status
   - Delete (if permitted)

---

## 5. Employee Management

### **5.1 New Employee**
**URL:** `/dashboard/employees/new`

### **What to Test:**
1. **Personal Data:**
   - First Name* (required)
   - Last Name
   - Employee ID/Code
   - Email*
   - Password*
   - Phone
   - Mobile

2. **Address Information:**
   - Address Line 1
   - State
   - Zone
   - Cluster
   - District
   - City
   - Pincode

3. **Role Assignment:**
   - Role dropdown: Employee, Manager, Coordinator, Senior Coordinator, Admin

4. **Submit:**
   - Click "Create Employee"
   - Success → Redirects to Active Employees list

### **Key Features:**
- Comprehensive employee data collection
- Role-based access control setup
- Form validation

---

### **5.2 Active Employees**
**URL:** `/dashboard/employees/active`

### **What to Test:**
1. **View Active Employees:**
   - Table listing all active employees
   - Columns: Name, Email, Role, Zone, Status
   - Search/filter functionality

2. **Actions:**
   - View employee details
   - Edit employee
   - Deactivate employee
   - View employee DCs
   - View employee expenses

---

### **5.3 Inactive Employees**
**URL:** `/dashboard/employees/inactive`

### **What to Test:**
1. **View Inactive Employees:**
   - List of deactivated employees
   - Reactivate option
   - View historical data

---

### **5.4 Pending Leaves (Employee Section)**
**URL:** `/dashboard/employees/leaves`

### **What to Test:**
1. **View Leave Requests:**
   - All pending leave requests from employees
   - Employee name, dates, type, reason
   - Actions: Approve, Reject

---

## 6. Leave Management

### **6.1 Leave Request (Employee)**
**URL:** `/dashboard/leaves/request`

### **What to Test:**
1. **Submit Leave Request:**
   - Leave Type: Sick Leave, Annual Leave, Casual Leave, Emergency Leave, Other
   - Start Date (date picker)
   - End Date (date picker)
   - Reason (textarea)
   - Click "Submit Request"

2. **Success:**
   - Leave request created with status "Pending"
   - Notification sent to manager
   - Redirect or success message

### **Key Features:**
- Employee-only access
- Date validation
- Automatic manager notification

---

### **6.2 Pending Leaves (Manager View)**
**URL:** `/dashboard/leaves/pending`

### **What to Test:**
1. **Review Leave Requests:**
   - List of all pending leave requests
   - Employee details
   - Leave dates and type
   - Reason

2. **Actions:**
   - **Approve:** Changes status to "Approved"
   - **Reject:** Changes status to "Rejected", may require reason
   - **View Details:** See full leave request

3. **Bulk Actions:**
   - Select multiple leaves
   - Approve/Reject in bulk (if available)

---

### **6.3 Approved Leaves**
**URL:** `/dashboard/leaves/approved`

### **What to Test:**
1. **View Approved Leaves:**
   - Employee can see their approved leave history
   - Calendar view (if available)
   - Export leave summary

---

### **6.4 Leaves Report**
**URL:** `/dashboard/leaves/report`

### **What to Test:**
1. **Generate Reports:**
   - Filter by employee, date range, status
   - View leave statistics
   - Export to Excel/PDF
   - Summary metrics:
     - Total leaves by employee
     - Leave balance
     - Leave trends

---

## 7. Training & Services

### **7.1 Trainings & Services Dashboard**
**URL:** `/dashboard/training`

### **What to Test:**
1. **KPI Cards:**
   - Total Trainings
   - Pending Trainings
   - Total Services
   - Pending Services

2. **Charts:**
   - Training status breakdown
   - Service status breakdown
   - Zone-wise distribution

3. **Quick Actions:**
   - "Assign Training/Service" button

---

### **7.2 Add Trainer**
**URL:** `/dashboard/training/trainers/new`

### **What to Test:**
1. **Trainer Information:**
   - Name*
   - Email*
   - Phone
   - Mobile*
   - Specialization (subjects)
   - Zone
   - Status (Active/Inactive)

2. **Submit:**
   - Creates new trainer
   - Trainer appears in Active Trainers list

---

### **7.3 Active Trainers**
**URL:** `/dashboard/training/trainers/active`

### **What to Test:**
1. **View Trainers:**
   - List of all active trainers
   - Filter by zone, specialization
   - View trainer details
   - Edit trainer
   - Assign trainings

---

### **7.4 Trainers Dashboard**
**URL:** `/dashboard/training/dashboard`

### **What to Test:**
1. **Trainer Performance:**
   - Trainer-wise statistics
   - Completed trainings count
   - Pending trainings
   - Performance metrics

---

### **7.5 Assign Training/Service**
**URL:** `/dashboard/training/assign`

### **What to Test:**
1. **Assignment Form:**
   - Select School (from DCs or school list)
   - Select Trainer*
   - Select Subject/Training Type*
   - Training Date*
   - Contact Person
   - Remarks

2. **Service Assignment:**
   - Similar form for services
   - Service type selection

3. **Submit:**
   - Creates training/service record
   - Status: "Scheduled"
   - Notifications sent to trainer and school

---

### **7.6 Trainings List**
**URL:** `/dashboard/training/list`

### **What to Test:**
1. **View All Trainings:**
   - Filter by:
     - Employee
     - Trainer
     - Date range
     - School Code/Name
   - Status: Scheduled, Completed, Cancelled

2. **Actions:**
   - View training details
   - Edit training
   - Cancel training
   - Mark as completed
   - Upload PO Image (for completed trainings)

3. **Table Columns:**
   - School Name
   - Zone
   - Town
   - Subject
   - Trainer
   - Training Date
   - Status
   - Actions (Edit, Cancel)

---

### **7.7 Services List**
**URL:** `/dashboard/training/services`

### **What to Test:**
1. **View All Services:**
   - Similar to trainings list
   - Service-specific filters
   - Service completion tracking

---

### **7.8 Inactive Trainers**
**URL:** `/dashboard/training/trainers/inactive`

### **What to Test:**
1. **View Inactive Trainers:**
   - Deactivated trainers
   - Reactivate option
   - Historical data

---

## 8. Warehouse Management

### **8.1 Warehouse Dashboard**
**URL:** `/dashboard/warehouse`

### **What to Test:**
1. **Overview:**
   - Warehouse statistics
   - Stock levels
   - DCs at warehouse
   - Completed DCs count

---

### **8.2 Inventory Items**
**URL:** `/dashboard/warehouse/inventory-items`

### **What to Test:**
1. **View Inventory:**
   - List of all inventory items
   - Product details
   - Stock quantities
   - Search and filter

2. **Actions:**
   - Add New Item
   - Edit Item
   - View Item Details
   - Delete Item

---

### **8.3 Add Inventory Item**
**URL:** `/dashboard/warehouse/inventory-items/new`

### **What to Test:**
1. **Item Details:**
   - Item Name*
   - SKU/Code
   - Category
   - Description
   - Unit Price
   - Initial Stock
   - Supplier Information

2. **Submit:**
   - Creates inventory item
   - Redirects to inventory list

---

### **8.4 Stock Management**
**URL:** `/dashboard/warehouse/stock`

### **What to Test:**
1. **View Stock:**
   - Current stock levels
   - Low stock alerts
   - Stock movements history

2. **Add Stock:**
   - Select item
   - Enter quantity
   - Enter supplier
   - Purchase date
   - Add stock

---

### **8.5 Add Stock**
**URL:** `/dashboard/warehouse/stock/add`

### **What to Test:**
1. **Stock Entry Form:**
   - Select Inventory Item*
   - Quantity*
   - Supplier
   - Purchase Date
   - Purchase Price
   - Batch Number (if applicable)
   - Remarks

2. **Submit:**
   - Updates stock levels
   - Creates stock movement record

---

### **8.6 DC @ Warehouse**
**URL:** `/dashboard/warehouse/dc-at-warehouse`

### **What to Test:**
1. **View DCs at Warehouse:**
   - DCs sent to warehouse for processing
   - Status: "At Warehouse"
   - Filter by date, employee, school

2. **Actions:**
   - Process DC (warehouse processing)
   - View DC details
   - Hold DC (if needed)

---

### **8.7 Process DC (Warehouse)**
**URL:** `/dashboard/warehouse/dc-at-warehouse/[id]`

### **What to Test:**
1. **DC Processing:**
   - View DC details
   - Check available stock
   - Allocate items
   - Update quantities
   - Submit for delivery
   - Status changes to "Ready for Delivery"

---

### **8.8 Completed DC**
**URL:** `/dashboard/warehouse/completed-dc`

### **What to Test:**
1. **View Completed DCs:**
   - DCs that have been delivered
   - Status: "Completed"
   - Delivery date
   - Delivery confirmation

---

### **8.9 Hold DC**
**URL:** `/dashboard/warehouse/hold-dc`

### **What to Test:**
1. **View Hold DCs:**
   - DCs placed on hold
   - Reason for hold
   - Release hold option

---

### **8.10 DC Listed**
**URL:** `/dashboard/warehouse/dc-listed`

### **What to Test:**
1. **View Listed DCs:**
   - DCs ready for warehouse listing
   - Manager view of DCs ready for processing

---

## 9. Stock Returns

### **9.1 Employee Returns List**
**URL:** `/dashboard/returns/employees`

### **What to Test:**
1. **View Employee Returns:**
   - Returns submitted by employees
   - Return reason
   - Items returned
   - Status: Pending, Approved, Rejected

2. **Actions:**
   - Approve return
   - Reject return
   - Process return

---

### **9.2 Warehouse Returns List**
**URL:** `/dashboard/returns/warehouse`

### **What to Test:**
1. **View Warehouse Returns:**
   - Returns processed at warehouse
   - Return to supplier
   - Stock adjustments

---

## 10. Payments

### **10.1 Add Payment**
**URL:** `/dashboard/payments/add-payment`

### **What to Test:**
1. **Payment Form:**
   - Select School* (from dropdown)
   - Amount* (number)
   - Payment Method* (Cash, UPI, NEFT/RTGS, Cheque, Bank Transfer, Credit Card, Debit Card, Online Payment, Other)
   - Financial Year (default: 2024-25)
   - Remarks (textarea)

2. **Submit:**
   - Creates payment with status "Pending"
   - Requires admin approval
   - Success message

### **Key Features:**
- School selection from database
- Multiple payment methods
- Financial year tracking
- Approval workflow

---

### **10.2 Transaction Report**
**URL:** `/dashboard/payments/transaction-report`

### **What to Test:**
1. **View Transactions:**
   - Filter by:
     - Date range
     - School
     - Payment method
     - Status
   - Export to Excel
   - Summary statistics

2. **Report Features:**
   - Total payments
   - Payment trends
   - School-wise breakdown

---

### **10.3 Approval Pending Cash**
**URL:** `/dashboard/payments/approval-pending-cash`

### **What to Test:**
1. **View Pending Cash Payments:**
   - List of cash payments awaiting approval
   - Payment details
   - School information

2. **Approve Payment:**
   - Click on payment → View details
   - Verify amount and details
   - Click "Approve" → Status changes to "Approved"
   - Click "Reject" → Requires reason, status changes to "Rejected"

---

### **10.4 Approval Pending Cheques**
**URL:** `/dashboard/payments/approval-pending-cheques`

### **What to Test:**
1. **View Pending Cheque Payments:**
   - Cheque payments awaiting approval
   - Cheque number
   - Bank details
   - Cheque date

2. **Approve Cheque:**
   - Verify cheque details
   - Approve or reject
   - Track cheque clearance

---

### **10.5 Approved Payments**
**URL:** `/dashboard/payments/approved-payments`

### **What to Test:**
1. **View Approved Payments:**
   - All approved payments
   - Filter by date, school, method
   - Export functionality

---

### **10.6 HOLD Payments**
**URL:** `/dashboard/payments/hold-payments`

### **What to Test:**
1. **View Hold Payments:**
   - Payments placed on hold
   - Reason for hold
   - Release hold option

---

## 11. Expenses

### **11.1 Create Expense (Employee)**
**URL:** `/dashboard/expenses/create`

### **What to Test:**
1. **Expense Form:**
   - Title* (text)
   - Amount* (number)
   - Category* (Office Supplies, Travel, Marketing, Utilities, Salary, Rent, Food, Other)
   - Date* (date picker)
   - Payment Method (Cash, Bank Transfer, Credit Card, Debit Card, Other)
   - **School / DC*** (dropdown - **NEW FEATURE**)
     - Shows only employee's assigned DCs
     - Format: "School Code - School Name (Zone)"
     - Required if DCs are available
   - Pending Month (dropdown)
   - Description (textarea)
   - Employee Remarks (textarea)

2. **Submit:**
   - Creates expense with status "Pending"
   - Links expense to selected DC
   - Manager approval required

### **Key Features:**
- **DC/School Selection:** Employee must select which school/DC the expense is for
- Category-based organization
- Approval workflow

---

### **11.2 My Expenses (Employee)**
**URL:** `/dashboard/expenses/my`

### **What to Test:**
1. **View My Expenses:**
   - All expenses created by logged-in employee
   - Status: Pending, Approved, Rejected
   - Filter by date, category, status
   - Edit expense (if pending)
   - View expense details

---

### **11.3 Pending Expenses List (Manager)**
**URL:** `/dashboard/expenses/pending`

### **What to Test:**
1. **Review Expenses:**
   - All pending expenses from employees
   - Employee name
   - Expense details
   - DC/School association
   - Amount and category

2. **Actions:**
   - **Approve:** Status → "Manager Approved" (goes to finance)
   - **Reject:** Status → "Rejected", requires reason
   - **Request Changes:** Send back to employee

---

### **11.4 Finance Pending Expenses**
**URL:** `/dashboard/expenses/finance-pending`

### **What to Test:**
1. **Finance Review:**
   - Expenses approved by manager
   - Final approval by finance team
   - Payment processing
   - Reimbursement tracking

2. **Actions:**
   - Final approve
   - Process payment
   - Reject (if needed)

---

### **11.5 Edit Expense**
**URL:** `/dashboard/expenses/edit/[id]`

### **What to Test:**
1. **Edit Form:**
   - Same fields as create
   - Pre-filled with existing data
   - Only editable if status is "Pending"
   - Update expense
   - Cancel changes

---

## 12. Reports

### **12.1 Sales Reports**
**URL:** `/dashboard/reports`

### **What to Test:**
1. **Sales Metrics Cards:**
   - Total Sales (count)
   - Total Revenue (₹ currency)
   - Average Sale Value (₹ currency)
   - Sales by Status (Completed, Pending, Cancelled)

2. **Report Display:**
   - Color-coded metric cards
   - Icons for each metric
   - Detailed breakdown table below

3. **Data Source:**
   - Real-time data from `/api/reports/sales`
   - Updates automatically

### **Key Features:**
- Real-time sales analytics
- Currency formatting
- Status breakdown

---

### **12.2 Leads Reports**
**URL:** `/dashboard/reports/leads`

### **What to Test:**
1. **View Leads Reports:**
   - Open Leads
   - Follow-up Leads
   - Closed Leads
   - Filter by date range, zone, employee

2. **Reports:**
   - Lead statistics
   - Conversion rates
   - Employee performance

---

### **12.3 Sales Visit Report**
**URL:** `/dashboard/reports/sales-visit`

### **What to Test:**
1. **View Sales Visits:**
   - Visit tracking
   - Employee-wise visits
   - Date range filters
   - Export functionality

---

### **12.4 Employee Track Report**
**URL:** `/dashboard/reports/employee-track`

### **What to Test:**
1. **View Employee Tracking:**
   - Employee activity logs
   - Location tracking
   - Visit history
   - Performance metrics

---

### **12.5 Contact Queries Report**
**URL:** `/dashboard/reports/contact-queries`

### **What to Test:**
1. **View Contact Queries:**
   - All contact form submissions
   - Filter by date, status
   - Response tracking

---

### **12.6 Stock Report**
**URL:** `/dashboard/reports/stock`

### **What to Test:**
1. **View Stock Reports:**
   - Current stock levels
   - Stock movements
   - Low stock alerts
   - Item-wise analysis

---

### **12.7 DC Report**
**URL:** `/dashboard/reports/dc`

### **What to Test:**
1. **View DC Reports:**
   - DC statistics
   - Status breakdown
   - Employee performance
   - Zone-wise distribution

---

### **12.8 Returns Report**
**URL:** `/dashboard/reports/returns`

### **What to Test:**
1. **View Returns Reports:**
   - Return statistics
   - Return reasons
   - Item-wise returns

---

### **12.9 Expenses Report**
**URL:** `/dashboard/reports/expenses`

### **What to Test:**
1. **View Expenses Reports:**
   - Total expenses
   - Category-wise breakdown
   - Employee-wise expenses
   - Date range filters
   - Export to Excel

---

### **12.10 Training & Service Report**
**URL:** `/dashboard/reports/training-service`

### **What to Test:**
1. **View Training Reports:**
   - Training statistics
   - Trainer performance
   - Completion rates
   - Service statistics

---

### **12.11 Change Logs**
**URL:** `/dashboard/reports/change-logs`

### **What to Test:**
1. **View Change Logs:**
   - System activity logs
   - User actions
   - Data modifications
   - Audit trail

---

## 13. Settings

### **13.1 Change Password**
**URL:** `/dashboard/settings/password`

### **What to Test:**
1. **Password Change Form:**
   - Current Password*
   - New Password*
   - Confirm New Password*
   - Click "Change Password"
   - Validation: Passwords must match, minimum length

---

### **13.2 App Dashboard Data Upload**
**URL:** `/dashboard/settings/upload`

### **What to Test:**
1. **Data Upload:**
   - Upload CSV/Excel files
   - Bulk import data
   - Schools, employees, products
   - Validation and error handling

---

### **13.3 SMS Settings**
**URL:** `/dashboard/settings/sms`

### **What to Test:**
1. **SMS Configuration:**
   - SMS provider settings
   - API keys
   - Test SMS functionality
   - SMS templates

---

### **13.4 Database Backup**
**URL:** `/dashboard/settings/backup`

### **What to Test:**
1. **Backup Management:**
   - Create backup
   - Download backup
   - Restore from backup
   - Scheduled backups

---

## 🎬 Screen Recording Tips

### **Recommended Flow for Recording:**

1. **Start with Landing Page** (30 seconds)
   - Show navigation
   - Scroll through sections
   - Highlight design quality

2. **Authentication** (1 minute)
   - Registration flow
   - Login flow
   - Show toast notifications

3. **Dashboard Overview** (2 minutes)
   - Show sidebar collapse/expand
   - **Demonstrate hover tooltips** (important!)
   - Show KPI cards
   - Navigate through tabs
   - Show charts and interactions

4. **DC Workflow** (3 minutes)
   - Create Sale/DC
   - Show assigned DCs
   - Employee submits PO
   - Manager reviews
   - Warehouse processing

5. **Employee Management** (2 minutes)
   - Create new employee
   - View active employees
   - Role-based access demo

6. **Expense Management** (2 minutes)
   - **Highlight DC selection feature**
   - Create expense
   - Manager approval
   - Finance approval

7. **Payments** (2 minutes)
   - Add payment
   - Approval workflow
   - Transaction reports

8. **Training & Services** (2 minutes)
   - Assign training
   - View trainings list
   - Trainer management

9. **Reports** (2 minutes)
   - Show sales reports
   - Various report types
   - Export functionality

10. **Settings** (1 minute)
    - Change password
    - Other settings

### **Key Points to Highlight:**

✅ **Premium Design:** Apple x Notion x Linear x Stripe level polish
✅ **Hover Tooltips:** Sidebar collapse with tooltip popovers
✅ **Role-Based Access:** Different views for Admin, Manager, Employee
✅ **Real-Time Data:** Live updates from API
✅ **Workflow Management:** Complete DC, Expense, Payment workflows
✅ **Responsive Design:** Works on mobile and desktop
✅ **Smooth Animations:** All interactions are polished

---

## 📝 Testing Checklist

### **Before Recording:**
- [ ] All API endpoints are working
- [ ] Sample data is available
- [ ] Test accounts created (Admin, Manager, Employee)
- [ ] Browser is in full-screen mode
- [ ] Screen recording software is ready
- [ ] Microphone is working (if doing voiceover)

### **During Recording:**
- [ ] Speak clearly about each feature
- [ ] Show hover interactions
- [ ] Demonstrate workflows end-to-end
- [ ] Show error handling
- [ ] Highlight design details
- [ ] Show responsive behavior (resize browser)

### **After Recording:**
- [ ] Review recording quality
- [ ] Add text annotations if needed
- [ ] Export in appropriate format
- [ ] Prepare submission document

---

## 🎯 Summary

This CRM system is a comprehensive business management solution with:
- **Modern, premium UI/UX** inspired by top tech companies
- **Role-based access control** for different user types
- **Complete workflow management** for DCs, Expenses, Payments
- **Real-time analytics** and reporting
- **Responsive design** for all devices
- **Intuitive navigation** with hover tooltips and smooth animations

**Total Pages:** 50+ dashboard pages
**User Roles:** Admin, Manager, Coordinator, Senior Coordinator, Employee
**Main Modules:** DC, Employees, Expenses, Payments, Warehouse, Training, Reports, Settings

---

**Good luck with your screen recording and project submission! 🚀**


