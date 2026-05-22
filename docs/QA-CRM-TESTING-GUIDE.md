# CRM Forge — QA / UAT handbook

This document is for testers exercising the **main web app** in the CRM-FORGE repository (`app/` at repo root). It describes environment setup, **role-based navigation**, **direct URLs**, and **suggested end-to-end flows**.

> **Note:** There is a separate `navbar-landing/` folder (duplicate Next app). Unless your team standardizes on that build, **treat the root app + port 3001 as the product under test**.

---

## 1. Environment & URLs

| Layer | Local (typical) | Notes |
|--------|------------------|--------|
| **Frontend** | `http://localhost:3001` | From root `package.json`: `npm run dev` → Next.js on **3001** |
| **Backend API** | `http://localhost:5001` | From `backend/server.js` default `PORT` (**not** 5000 — macOS / AirPlay conflict) |
| **API health** | `GET http://localhost:5001/api/health` | Should return JSON `status: OK` |

**Frontend env:** ensure `.env.local` (repo root) includes:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001
```

(or your staging/production API URL). Production API referenced in code/docs:  
`https://crm-backend-production-fc85.up.railway.app` (see `lib/api.ts`).

**Backend:** MongoDB URI and secrets in `backend/.env`; start with `npm run dev` or `npm start` from `backend/`.

---

## 2. Authentication

| Page | Path | Purpose |
|------|------|---------|
| Login | `/auth/login` | Primary entry |
| Register | `/auth/register` | New user signup (if enabled for your env) |

After login the app stores `authToken` and `authUser` in **localStorage** and wraps dashboard routes with `RequireAuth`.

**Suggested smoke tests**

- Login with valid user → redirects to `/dashboard`.
- Refresh on a deep link (e.g. `/dashboard/leads`) → still authenticated.
- Sign out clears storage and returns to `/auth/login`.

---

## 3. Roles & sidebar (what each role sees)

Navigation is driven by ```142:276:components/dashboard/Sidebar.tsx``` (admin `NAV` + `finalNav` per role). Summaries below.

### 3.1 Admin / Super Admin / default (full admin menu)

**Top-level areas:** Dashboard, Clients, Users/Employees, Executive Managers, Leave Management, Trainings & Services, Warehouse, Stock Returns, Payments, Expenses, Reports, Products, Settings, Sign out.

**Admin-only examples:** Warehouse **Search DC**; Products **Deliverables** & **Partner** (vendors) when marked `adminOnly`.

### 3.2 Executive (sales field user)

Dashboard, **Leads** (Add / Renewal / Followup), **My Clients** (DC list + term-wise), **Payments** (pending / add / done), **Expenses** (create / my), **Employee Sample**, **Stock Returns** (single executive list), **My Leaves**, Sign out.

### 3.3 Manager

Subset: Dashboard, Clients (**no** Create Sale), Warehouse (**DC @ Warehouse**, **Completed DC**, **DC listed**), Expenses (**Pending Expenses List** only), Reports (Leads, Sales Visit, Employee Track, **All Expenses**), Settings, Sign out.

### 3.4 Coordinator

Dashboard, Clients (full submenu from base NAV), Users/Employees (**Active Employees** only), Trainings (no Add Trainer), Warehouse (+ **Hold DC**), Payments (**no** Add Payment, **no** HOLD), Reports (Leads, DC, Returns, All Expenses), Settings, Sign out.

### 3.5 Senior Coordinator

Dashboard, Clients, Warehouse (all items in NAV for that section), Settings, Sign out.

### 3.6 Executive Manager

**My Dashboard:** `/dashboard/executive-managers/{userId}/dashboard`  
**Executives:** `/dashboard/executive-managers/executives`  
**Clients:** PO edit — `/dashboard/clients/closed-sales`  
**Expenses:** `/dashboard/expenses/executive-manager-pending`  
**Leave Management:** `/dashboard/executive-managers/{userId}/leaves`  
Sign out.

> QA must log in as an Executive Manager whose `authUser._id` matches the seeded manager document, or the dynamic links may break.

### 3.7 Trainer

My Dashboard (`/dashboard`), Training lists (`/dashboard/training/trainer/my`, `.../completed`), Expenses create/my, Leave request/approved, Sign out.

### 3.8 Executive (org “Executive” distinct from sales Executive — assigns areas only)

Dashboard, **Assign Areas** `/dashboard/executives/assign-areas`, Sign out.

### 3.9 Warehouse Executive

My Dashboard, **Stock Returns** `/dashboard/returns/warehouse-executive`, Sign out.

### 3.10 Warehouse Manager

My Dashboard, **Stock Returns** `/dashboard/returns/warehouse-manager`, Sign out.

### 3.11 Partner

My Dashboard, **Stocks** `/dashboard/stocks`, **My DCs** `/dashboard/dcs`, Sign out.

---

## 4. Primary module URLs (append to base `http://localhost:3001`)

Use these for **deep-link testing**, **bookmark checks**, and **role permission** verification (blocked or hidden ≠ route missing).

### 4.1 Home & hub

| Path | Notes |
|------|--------|
| `/dashboard` | Main dashboard with module shortcuts and KPI-style content |
| `/dashboard/reports` | Reports hub |
| `/dashboard/dc` | Delivery challan hub |
| `/dashboard/training` | Training hub |

### 4.2 Leads

| Path | Typical flow |
|------|----------------|
| `/dashboard/leads` | Lead list / hub |
| `/dashboard/leads/add` | New lead |
| `/dashboard/leads/add/new-school` | New school lead variant |
| `/dashboard/leads/add/renewal` | Renewal lead |
| `/dashboard/leads/renewal` | Renewal list |
| `/dashboard/leads/followup` | Follow-ups |
| `/dashboard/leads/edit/[id]` | Edit lead |
| `/dashboard/leads/close/[id]` | Close lead |

**Sample E2E (Executive):** Add lead → appears in follow-up → update status → close with reason/details.

### 4.3 Clients / DC (Delivery Challans)

| Path | Notes |
|------|--------|
| `/dashboard/dc/create` | Create sale / DC |
| `/dashboard/dc/closed` | Closed sales |
| `/dashboard/dc/saved` | Saved DC |
| `/dashboard/dc/pending` | Pending |
| `/dashboard/dc/emp` | EMP DC |
| `/dashboard/dc/term-wise` | Term-wise (admin menu) |
| `/dashboard/dc/my` | My DC (context-specific) |
| `/dashboard/dc/admin/my` | Admin my DC |
| `/dashboard/dc/manager` | Manager view |
| `/dashboard/dc/edit/[id]` | Edit DC |
| `/dashboard/dc/client-dc` | Executive “My Clients” |
| `/dashboard/dc/client-dc/term-wise` | Executive term-wise |

**Sample E2E:** Create DC → saved/pending → warehouse flow (if applicable) → closed.

### 4.4 Employees & org structure

| Path | Notes |
|------|--------|
| `/dashboard/employees` | Employees hub |
| `/dashboard/employees/new` | New employee |
| `/dashboard/employees/active` | Active |
| `/dashboard/employees/inactive` | Inactive |
| `/dashboard/employees/leaves` | Pending leaves (admin view) |
| `/dashboard/employees/zones` | Zones |
| `/dashboard/employees/clusters` | Clusters |
| `/dashboard/employees/zones-clusters` | Combined UI (if used) |

### 4.5 Executive managers

| Path | Notes |
|------|--------|
| `/dashboard/executive-managers` | List |
| `/dashboard/executive-managers/new` | Create |
| `/dashboard/executive-managers/executives` | Executives under manager |
| `/dashboard/executive-managers/[managerId]/dashboard` | Manager dashboard |
| `/dashboard/executive-managers/[managerId]/leaves` | Manager leave view |
| `/dashboard/clients/closed-sales` | PO / closed sales for exec manager |

### 4.6 Leaves

| Path | Notes |
|------|--------|
| `/dashboard/leaves/pending` | Approvals (admin) |
| `/dashboard/leaves/report` | Report |
| `/dashboard/leaves/request` | Employee request |
| `/dashboard/leaves/approved` | Employee approved list |

### 4.7 Training & services

| Path | Notes |
|------|--------|
| `/dashboard/training/dashboard` | Trainers dashboard |
| `/dashboard/training/trainers/new` | Add trainer |
| `/dashboard/training/trainers/active` | Active trainers |
| `/dashboard/training/trainers/inactive` | Inactive |
| `/dashboard/training/assign` | Assign training/service |
| `/dashboard/training/list` | Trainings list |
| `/dashboard/training/services` | Services list |
| `/dashboard/training/services/edit/[id]` | Edit service |
| `/dashboard/training/edit/[id]` | Edit training |
| `/dashboard/training/trainer/my` | Trainer upcoming/active |
| `/dashboard/training/trainer/completed` | Trainer completed |

### 4.8 Warehouse

| Path | Notes |
|------|--------|
| `/dashboard/warehouse` | Warehouse hub |
| `/dashboard/warehouse/inventory-items` | Inventory items |
| `/dashboard/warehouse/inventory-items/new` | New item |
| `/dashboard/warehouse/inventory-items/[id]` | Item detail |
| `/dashboard/warehouse/stock` | Stock |
| `/dashboard/warehouse/stock/add` | Add stock |
| `/dashboard/warehouse/items` | Items alternate listing |
| `/dashboard/warehouse/dc-at-warehouse` | DC at warehouse |
| `/dashboard/warehouse/dc-at-warehouse/[id]` | Detail |
| `/dashboard/warehouse/completed-dc` | Completed |
| `/dashboard/warehouse/hold-dc` | Hold |
| `/dashboard/warehouse/dc-listed` | Listed (Coordinator/Manager; excluded from default admin sidebar filter) |
| `/dashboard/warehouse/search-dc` | Admin-only search |

### 4.9 Stock returns

| Path | Notes |
|------|--------|
| `/dashboard/returns/employees` | Employee returns list |
| `/dashboard/returns/warehouse` | Warehouse returns |
| `/dashboard/returns/executive` | Executive return flow |
| `/dashboard/returns/warehouse-executive` | Warehouse executive |
| `/dashboard/returns/warehouse-manager` | Warehouse manager |

### 4.10 Payments

| Path | Notes |
|------|--------|
| `/dashboard/payments` | Pending payments |
| `/dashboard/payments/add-payment` | Add |
| `/dashboard/payments/done` | Completed |
| `/dashboard/payments/transaction-report` | Report |
| `/dashboard/payments/approval-pending-cash` | Cash approval queue |
| `/dashboard/payments/approval-pending-cash/[id]` | Cash detail |
| `/dashboard/payments/approval-pending-cheques` | Cheque queue |
| `/dashboard/payments/approval-pending-cheques/[id]` | Cheque detail |
| `/dashboard/payments/approved-payments` | Approved |
| `/dashboard/payments/hold-payments` | Held |

### 4.11 Expenses

| Path | Notes |
|------|--------|
| `/dashboard/expenses` | Hub |
| `/dashboard/expenses/pending` | Pending list |
| `/dashboard/expenses/finance-pending` | Finance queue |
| `/dashboard/expenses/executive-manager-pending` | Exec manager queue |
| `/dashboard/expenses/create` | Create |
| `/dashboard/expenses/my` | My expenses |
| `/dashboard/expenses/edit/[id]` | Edit |
| `/dashboard/expenses/manager-update/[employeeId]` | Manager update path |

### 4.12 Reports

| Path | Notes |
|------|--------|
| `/dashboard/reports/leads` | Leads report |
| `/dashboard/reports/leads/open-leads` | Open |
| `/dashboard/reports/leads/follow-up-leads` | Follow-up |
| `/dashboard/reports/leads/closed-leads` | Closed |
| `/dashboard/reports/sales-visit` | Sales visit |
| `/dashboard/reports/employee-track` | Employee tracking |
| `/dashboard/reports/contact-queries` | Contact queries |
| `/dashboard/reports/change-logs` | Change logs |
| `/dashboard/reports/stock` | Stock |
| `/dashboard/reports/dc` | DC |
| `/dashboard/reports/returns` | Returns |
| `/dashboard/reports/expenses` | All expenses |
| `/dashboard/reports/training-service` | Training/service |

### 4.13 Products, partners (vendors), deliverables

| Path | Notes |
|------|--------|
| `/dashboard/products` | Products |
| `/dashboard/products/new` | New product |
| `/dashboard/products/vendors` | Partners/vendors |
| `/dashboard/products/vendors/new` | New vendor |
| `/dashboard/products/vendors/[id]` | Vendor detail |
| `/dashboard/products/vendors/[id]/assign-cost` | Assign cost |
| `/dashboard/products/deliverables` | Deliverables (admin-heavy) |
| `/dashboard/products/deliverables/add` | Add deliverable |
| `/dashboard/products/deliverables/view` | View deliverables |

### 4.14 Other dashboards / deep links

| Path | Notes |
|------|--------|
| `/dashboard/sales` | Sales module shortcut from main dashboard tiles |
| `/dashboard/inventory` | Inventory view |
| `/dashboard/samples/request` | Employee sample request |
| `/dashboard/stocks` | Partner stocks |
| `/dashboard/dcs` | Partner DC list |
| `/dashboard/franchises/[email]` | Franchise by email |
| `/dashboard/wcx` | WCX/exposure-style page (ensure API exists for your env) |
| `/dashboard/ai` | AI-related UI |
| `/dashboard/executives/assign-areas` | Assign areas (“Executive” org role) |

### 4.15 Settings (menu items vs implementation)

Sidebar links to:

- `/dashboard/settings/password`
- `/dashboard/settings/upload`
- `/dashboard/settings/sms`
- `/dashboard/settings/backup`

**Verify in your branch** that these routes exist as `app/dashboard/settings/**/page.tsx`. If missing, expect **404** until implemented.

---

## 5. Dashboard “tiles” shortcut (super-admin style home)

`/dashboard` includes quick links such as Leads, Sales, Employees, Expenses, Payments, Reports, Training, Warehouse, DC, Inventory (`sections` in `app/dashboard/page.tsx`). Use these to sanity-check routing from the home dashboard.

---

## 6. Suggested regression suites (by business area)

### A. Lead lifecycle

1. Executive: `/dashboard/leads/add` → create.
2. `/dashboard/leads/followup` → confirm follow-up visibility.
3. `/dashboard/leads/edit/[id]` → update fields.
4. `/dashboard/leads/close/[id]` → close.
5. Coordinator/Manager: `/dashboard/reports/leads/*` → counts match expectations.

### B. DC / client lifecycle

1. Admin: `/dashboard/dc/create` → submit.
2. `/dashboard/dc/saved` or `/dashboard/dc/pending` → state correct.
3. Warehouse: `/dashboard/warehouse/dc-at-warehouse` → receive/process as per process.
4. `/dashboard/dc/closed` → terminal state.
5. Executive: `/dashboard/dc/client-dc` → only own clients.

### C. Payments

1. Executive: add payment → appears pending.
2. Coordinator/Admin: approval queues (cash/cheque) → approve/reject.
3. `/dashboard/payments/done` & `transaction-report` → reconciliation.

### D. Expenses

1. Executive/Trainer: create → my list.
2. Manager: pending list / manager-update flows.
3. Finance: `finance-pending`.
4. Executive Manager: `executive-manager-pending`.

### E. Training

1. Admin: create trainer → assign training.
2. Trainer: my vs completed.
3. Services list + edit.

### F. Warehouse & returns

1. Stock / inventory CRUD.
2. DC at warehouse detail.
3. Return flows: employee → warehouse → reports.

### G. RBAC (critical)

For **each role**: log in, export visible menu, then **hit denied deep URLs** (from section 4) directly in the address bar. Expect redirect, 403 from API, or empty data — **define expected behavior with dev** and document pass/fail.

---

## 7. Out of scope / known gaps for this app

- **DMS-specific pages** under `navbar-landing` that call `/api/dms/...` are **not** part of the main `app/` sidebar. On the current backend, **DMS routes may not be mounted** in `server.js` — if you test those UIs, confirm API registration first.
- **Placeholder** route pattern: `app/dashboard/[section]/page.tsx` shows a placeholder for section names not replaced by a real page; prefer the concrete paths in section 4.

---

## 8. Handoff checklist for QA lead

- [ ] MongoDB seeded with test users per **role** (including Executive Manager with known `_id`).
- [ ] Backend running and `GET /api/health` OK.
- [ ] Frontend `.env.local` points to correct API.
- [ ] Test data: at least one open lead, one DC, one payment, one expense, one training assignment.
- [ ] Browser matrix (Chrome/Edge + one mobile width) agreed.
- [ ] Defect template includes: **role**, **exact URL**, **request ID** (network tab), **screenshot**.

---

*Generated from repository structure and `components/dashboard/Sidebar.tsx` navigation definitions. Update this file when menus or ports change.*
