# CRM Go-Live Guide — Simple Workflows for Everyone

**Product:** CRM (education / school sales operations)  
**Date:** 17 Sep 2026  
**Audience:** Any team member — no coding knowledge needed  

This document explains **what the CRM does**, **how each daily job works**, and **what is ready for go-live**.

---

## 1. What this CRM is (in one page)

Think of the CRM as the company’s **digital office + field notebook**.

| Stage | Plain English | Where you work |
|-------|---------------|----------------|
| 1. Find schools | Salesperson finds a school and creates a **Lead** | Leads |
| 2. Visit school | Salesperson logs a **School Visit** with GPS | School Visits |
| 3. Follow up | Call / meet until the school is ready | Follow-up Leads |
| 4. Close the deal | Convert lead to a **Client** (sale) | Close Lead → Closed Sales |
| 5. Send goods | Create a **Delivery Challan (DC)** and send to warehouse | DC pages |
| 6. Dispatch | Warehouse packs, adds LR number, delivers | Warehouse |
| 7. Collect money | Record **Payments** against the school bill | Payments |
| 8. Support | Training, services, expenses, leaves, returns | Separate modules |

**Important — what “DMS” means here**

- There is **no Document Management System** (no file vault for scanning/storing all company papers as a library).
- There **is** code for a separate **Dealership DMS** (car showroom / Hyundai-style product). That is **not part of this education CRM go-live**. Those screens (branches, vehicles, facilities, working capital) are **out of scope** and their API is **not turned on**. Do not use them for this CRM launch.

**What to deploy for go-live**

| Piece | Folder / service |
|-------|------------------|
| Website (desktop CRM) | `navbar-landing` → Vercel |
| Mobile app | `mobile-view` → Expo / store build |
| Server (API + database) | `backend` → Railway |

---

## 2. Who uses what (roles)

| Role (simple name) | Typical job |
|--------------------|-------------|
| **Executive / Sales BDE** | Field sales: leads, visits, my clients, request DC, expenses, leaves |
| **Manager** | Approves DCs toward warehouse, watches team |
| **Executive Manager** | Team expenses, PO change requests, team oversight |
| **Coordinator / Senior Coordinator** | Trainings, services, some DC ops |
| **Finance / Admin** | Payments approve/hold, finance expenses, reports |
| **Warehouse Executive** | Pack DCs, enter Transport / LR / Boxes, receive returns |
| **Warehouse Manager** | Approve return stock, stock decisions |
| **Trainer** | Own trainings / services |
| **Super Admin / Admin** | Everything + users, roles, products, settings |
| **Partner / Franchise** | Their own stock / DCs / franchise dashboard |

After any permission change, users should **log out and log in again**.

---

## 3. Big picture flow (from school to delivery)

```
Login → Attendance (optional start of day)
     → Add / Follow Lead
     → School Visit (GPS)
     → Close Lead (products, PO photo)
     → Client appears in My Clients / Closed Sales
     → Request / Raise DC
     → Saved DC → Pending DC (Finance + SME remarks)
     → Submit to Warehouse
     → DC @ Warehouse (Transport, LR No, LR Date, Boxes)
     → Completed DC
     → Payments (when there is a due amount)
     → Training / Service (separate track — not auto-created by DC)
```

---

## 4. Detailed workflows (step by step)

### 4.1 Login & security

**Goal:** Only the right person opens the CRM.

1. Open web or mobile app.
2. Enter **mobile number or email** + password.
3. On **mobile**, the phone can be **bound** to the account (device lock). If another phone tries to log in with the same user after binding, the system blocks it until an Admin **resets device**.
4. **Forgot password:** user requests OTP → enters OTP → sets new password.
5. First-time users may be asked for **first attendance** (photo + location).

**Go-live check:** Try login on web + mobile; try wrong password; try forgot-password on a test user.

---

### 4.2 Attendance (day start / end)

**Goal:** Prove the salesperson was working in the field.

1. On mobile Home, open Attendance.
2. **Check in** with photo + GPS (+ town/pincode where asked).
3. At end of day, **Check out**.

**Who:** Field staff.  
**Go-live check:** One successful check-in appears in history.

---

### 4.3 Lead creation (new school)

**Goal:** Capture a new school opportunity.

1. Go to **Leads → Add Lead → New School** (web or mobile).
2. Fill school name, contact, mobile, zone, area, strength.
3. Fill qualification fields when available: **average fee**, **branches**, **decision maker**, **mandal**, **cluster**, **map latitude/longitude** (helps territory / maps later).
4. Add interested **products**.
5. Save. Lead starts as **Pending** (or your team’s default).

**Lead types**

| Type | Meaning |
|------|---------|
| **New** | Brand-new school |
| **Renewal** | Existing client school, renew products |
| **Cross-sale** | Extra products to an existing school (see Cross-Sale list) |

**Statuses / priority (simple)**

- Priority: Hot / Warm / Cold / Visit Again / Not Interested  
- Deal moves: Pending → Processing → Closed (when converted)

**Go-live check:** Create one test lead; open it in Follow-up; edit and save.

---

### 4.4 School visits

**Goal:** Record that a rep physically visited a school.

1. Open **School Visits** (web) or **School Visits** on mobile.
2. Enter school name (or link from a lead).
3. Choose **visit category** (New Business, Follow-up, Demo, Collection, Training, etc.).
4. Add remarks, next visit date, optional training date.
5. Mobile captures **GPS** automatically when allowed.
6. Save.

**Why it matters:** Feeds the **Sales Visit report**. Without visits, that report stays empty.

**Go-live check:** Create a visit on mobile with GPS on; see it in Visits list and Sales Visit report.

---

### 4.5 Follow-up leads

**Goal:** Keep talking to the school until they buy or drop.

1. Open **Follow-up Leads**.
2. Filter by date / zone / priority.
3. Update product interest, chance %, next follow-up date, remarks.
4. Save history.

**Go-live check:** Change follow-up date on a lead and reload — history should show the update.

---

### 4.6 Close lead → become a client (sale)

**Goal:** Turn a won lead into a sale / client record.

1. Open the lead → **Close**.
2. Select products: classes, levels, **specs** (multi-select), **subjects** (multi-select), **product categories** (multi-select where configured).
3. Enter unit price and strengths.
4. Attach **PO photo** (purchase order proof) when required by process.
5. Submit convert / close.

**What happens behind the scenes**

- A **client / DC order** is created.
- School code may be generated.
- Sale appears under **Closed Sales** / **My Clients** depending on next steps.

**Go-live check:** Close one test lead with Abacus + two subjects; Product Details rows should show correct categories per subject (not the same category on every row).

---

### 4.7 My Clients & Request DC

**Goal:** Salesperson asks the company to prepare delivery.

1. Open **My Clients**.
2. Find the school.
3. Choose follow-up **Student Type** if needed (New / Old / Excess / Exchange / Shortage / …).  
   - **Shortage** opens a special shortage DC flow.  
   - Other types are **saved on the DC**.
4. **Request DC** (moves the sale into the closed / DC pipeline).

**Go-live check:** Request DC on a test client; it should leave “only my clients” and appear in Closed Sales / DC queue as designed for your role.

---

### 4.8 Delivery Challan (DC) pipeline — the heart of operations

**Words to know**

| Word | Meaning |
|------|---------|
| **DC** | Delivery Challan — the paper/digital order to send products |
| **PO** | Purchase Order photo from school |
| **LR No** | Lorry Receipt number from transporter (links returns later) |
| **SME** | Subject Matter Expert sign-off on pending DC |
| **Finance remarks** | Finance team notes before warehouse |

#### A) Closed Sales

Admin / coordinator sees closed deals ready for DC work. Can raise / edit DC details.

#### B) Saved DC

DC drafted and saved. Can update and submit forward.

#### C) Pending DC (critical approvals)

Before warehouse:

1. Fill **DC Date**, **DC Category**, **DC Remarks**, **DC Notes**.
2. Fill **Finance Remarks** + **Special Approval**.
3. Fill **SME Remarks** (**required** for go-live).
4. Save.
5. When both Finance + SME are filled, **Submit to Warehouse**.

**Go-live check:** Try submit without SME remarks — system should block. With SME filled — should move toward warehouse.

#### D) EMP DC

Employee / executive DC list (kits / field DC views). Used by field roles for their DC slice.

#### E) DC @ Warehouse

Warehouse staff:

1. Open the DC.
2. Enter **Transport**, **Transport Area**, **LR No**, **LR Date**, **Boxes**.
3. Process / move to completed when ready.
4. Use **Hold** if stock is short.

#### F) Completed DC

Delivery finished for ops purposes. Can print invoice PDF.  
**Note:** Update company name/address on PDF letterhead before customer-facing go-live (cleaned from old Viswam text to “CRM” placeholder).

**Go-live check:** One DC end-to-end: Closed → Pending (Finance+SME) → Warehouse (LR fields) → Completed.

---

### 4.9 Payments

**Goal:** Collect and approve money against school dues.

1. **Add Payment** — choose school / DC, amount, method (cash, cheque, UPI, NEFT, …).
2. Cash / cheque go to **Approval Pending** queues.
3. Finance **Approves**, **Holds**, or **Rejects**.
4. See **Done** / **Transaction Report**.

**Rules (plain English)**

- If the school has **no due amount**, payment may be rejected / do nothing — complete a DC first so a bill exists.
- Always verify the payment appears in the correct queue after add.

**Go-live check:** Add a small test payment on a school with due > 0; approve it.

---

### 4.10 Expenses

**Goal:** Staff claim travel / work expenses; managers approve.

1. Employee **Creates** expense (type, amount, bill image, month).
2. Goes to **Executive Manager** pending (if used).
3. Then **Manager / Finance** pending.
4. Can be **Approved**, **Rejected**, or **Needs Correction** (employee fixes and resubmits).
5. Managers can open **View Employee Track** style reports when GPS pings exist — distance helps verify travel claims.

**Go-live check:** Create expense → approve as manager → see status Approved.

---

### 4.11 Leaves

1. Employee **Requests** leave (type, dates, reason).
2. Manager sees **Pending Leaves**.
3. **Approve** or **Reject**.
4. Employee sees result under **My Leaves** / Approved.

**Go-live check:** Request → approve → list updates.

---

### 4.12 Stock returns

**Goal:** Return unused / damaged stock from field or warehouse.

**Simple path**

1. Executive creates **Employee Return** (products, qty, reason).
2. Warehouse Executive **receives** (received qty).
3. Warehouse Manager **approves** (full / partial / send back).
4. Stock is updated; return **Closed**.

**Statuses (remember as a story)**  
Draft → Submitted → Received → Pending approval → Approved / Partial / Sent Back → Stock Updated → Closed.

**Go-live check:** One return from submit to manager approval.

---

### 4.13 Warehouse stock & inventory

1. Maintain **Inventory Items** (product, category, level, type, qty).
2. View **Stock**.
3. When processing DCs, system checks stock; short stock → **Hold DC**.

**Go-live check:** Add quantity to an item; process a DC that needs that item.

---

### 4.14 Training & services

**Important:** Raising a DC **does not automatically** create a training.  
Goods delivery and training are **two parallel tracks** joined by school + product.

1. Coordinator **Assigns** training/service to a trainer + school.
2. Trainer marks **Completed** / **Cancelled**, attendance, feedback.
3. Reports under Training dashboard / Training-Service report.

**Go-live check:** Assign one training → trainer completes it → appears in list.

---

### 4.15 Samples

1. Executive **Requests** sample.
2. Admin **Accepts / Rejects**.
3. Executive sees **My Samples**.

---

### 4.16 Products setup (admin)

Before sales can close properly, Admin must configure:

- Products, levels, subjects, specs, categories  
- Calculation type (normal / level-based / subject-based)  
- Vendors / deliverables if used  

**Go-live check:** Create a product with two subjects and two categories named like the subjects; close-lead should pick matching category per subject.

---

### 4.17 Reports (what each one is for)

| Report | What a normal person learns |
|--------|-----------------------------|
| **Open / Closed / Follow-up Leads** | Pipeline of schools |
| **Sales Visit** | Who visited which school (from real Visit records) |
| **Employee Tracking** | Last GPS location / route of field staff |
| **Change Logs** | Who changed what (with IP + old/new values) |
| **Stock / DC / Returns / Expenses** | Ops health |
| **Contact Queries** | Website enquiries |
| **Training-Service** | Service delivery |

---

### 4.18 GPS tracking

1. Mobile app, while logged in, sends location **pings** every few minutes (when permission allowed).
2. Managers open **Employee Tracking** report → see last location.
3. **View route** for a day shows distance and ping count.

**Limits for go-live:** Foreground tracking works when the app is active. Full phone “background forever” tracking needs more native setup later.

---

### 4.19 Change logs (audit)

Whenever important records change, the system can store:

- Who did it  
- When  
- IP address  
- Which fields  
- Previous vs new values  

Open **Reports → Change Logs**.

---

### 4.20 Sales collateral

Admin adds links to **videos / PPTs / brochures**.  
Sales can open them during school demos (**Sales Collateral** menu).

---

### 4.21 Cross-sale leads

List of leads marked **cross_sale** — upsell to existing schools.  
Use when selling extra products to a school that already buys something.

---

### 4.22 Partners / franchises / vendors

- **Vendors:** product cost partners  
- **Partner portal:** their stocks / DCs  
- **Franchise:** dashboard by franchise login  

---

### 4.23 Settings & roles

- Change password  
- SMS / backup / expense settings  
- **Roles:** tick which pages each role can see  

Always **re-login** after role changes.

---

## 5. Go-live readiness checklist

### Ready (CRM core)

- [x] Leads (new / renewal / cross-sale)  
- [x] School Visits + Sales Visit report wiring  
- [x] Close lead with multi specs / subjects / categories  
- [x] DC pipeline including **SME required**  
- [x] Warehouse Transport / LR / Boxes  
- [x] Payments / Expenses / Leaves  
- [x] Stock returns multi-level  
- [x] Training & services  
- [x] Change logs with IP + previous values  
- [x] Device lock + forgot password  
- [x] Student types save on DC  
- [x] Collateral + Cross-sale pages  
- [x] Viswam branding removed from main DC/Training titles (CRM-neutral)  

### Out of CRM go-live (ignore)

- [ ] Dealership **DMS** (vehicles, branches, WCX, etc.) — API not mounted  
- [ ] AI dashboard  
- [ ] Full offline mode  
- [ ] Push notifications  
- [ ] True always-on background GPS  

### Before customers see it — do these smoke tests

1. **Seed permissions:** `node backend/scripts/seedPermissions.js` then logout/login.  
2. Executive: create lead → visit → close → request DC.  
3. Admin/Finance: Pending DC with Finance + SME → warehouse.  
4. Warehouse: fill LR No + Boxes → complete.  
5. Finance: add + approve one payment.  
6. Manager: approve one expense + one leave.  
7. Executive: one stock return through warehouse manager.  
8. Open Sales Visit + Employee Track reports — data should match new visits/pings.  
9. Update **PDF company letterhead** text to your legal company name.  
10. Confirm Vercel builds `navbar-landing` (or root `app` if that is what you deploy) and Railway uses latest `CRM-BACKEND`.

---

## 6. Common problems (plain English)

| Problem | Likely cause | What to do |
|---------|--------------|------------|
| Menu item missing | Role has no permission | Admin → Roles → tick page → user re-login |
| Request DC forbidden | Missing `request_dc` permission | Seed permissions + re-login |
| Sales Visit report empty | No Visit records yet | Log visits from mobile/web |
| Employee Track empty | No GPS pings | Allow location on mobile app while logged in |
| Payment does nothing | No due / no completed DC | Finish DC / bill first |
| Pending DC won’t go to warehouse | SME or Finance remarks missing | Fill both |
| Wrong product category on every row | Old bug — use latest build | Re-add product after selecting subjects |
| DMS pages fail | Not part of this CRM launch | Don’t use; API not connected |

---

## 7. One-line dictionary

| Term | Meaning |
|------|---------|
| Lead | Possible school customer |
| Visit | Record of going to the school |
| Client / Closed Sale | School that bought |
| DC | Delivery order for products |
| LR | Transport receipt number |
| SME | Expert approval on DC |
| Shortage | Extra DC because some items were short |
| Specs | Product variant (e.g. Wet / CW) |
| Strength | Student quantity |
| Zone / Cluster / Mandal | Geography for reporting |

---

## 8. Final recommendation

This CRM is **ready to go live for school sales operations** if you:

1. Deploy the latest frontend + backend,  
2. Run the smoke tests in section 5,  
3. Keep **dealership DMS** turned off,  
4. Replace the PDF “CRM” placeholder with your real company letterhead.

For day-to-day users, start training with: **Lead → Visit → Close → DC → Warehouse → Payment**. Everything else supports that spine.

---

*Document generated for CRM go-live. Keep this file with the team handbook.*
