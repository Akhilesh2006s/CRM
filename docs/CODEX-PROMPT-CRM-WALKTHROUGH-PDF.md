# Codex prompt — Live CRM screenshot walkthrough PDF

Copy everything below the line into Codex (with browser/computer use enabled).

---

You are documenting our live CRM for non-technical stakeholders. Open the real web app in the browser, walk through sample workflows as an Executive, take clear screenshots, and produce a **designed multi-page PDF** (or a print-ready HTML that you open and Print → Save as PDF).

## App URLs & login (fill these in before running)

- Web CRM URL: `______________________________`  (example: https://your-app.vercel.app or http://localhost:3001)
- Executive login mobile/email: `______________________________`
- Executive password: `______________________________`
- If first login needs attendance, complete it with camera/location allowed.

Use ONLY the education CRM. Do NOT open AI dashboard, dealership DMS, branches, vehicles, WCX, working capital, or pricing-kb — those were removed and must not appear.

## Design rules for the PDF

- Title page: **CRM — Sample Operations Walkthrough** + date
- Clean corporate look: white background, teal/dark text accents, clear section headers
- Each step page: **Step number + short title**, 1–2 sentences in plain English, then **large screenshot** of the live UI
- Footer on every page: page number + “Sample data for verification”
- No jargon without explanation (e.g. say “Delivery order (DC)” not only “DC”)
- Screenshots must show the full main content area (not cropped to nothing useful)

## Walkthrough script (do these IN ORDER; use SAMPLE test data only)

Create a clearly named sample school, e.g. `SAMPLE-CRM-DEMO-SCHOOL-001`, so it is obvious and safe to delete later.

### Step 1 — Login
1. Open the login page
2. Screenshot the login screen (empty form)
3. Log in as Executive
4. Screenshot the landing dashboard after login

### Step 2 — Create a Lead
1. Go to Leads → Add Lead → New School
2. Screenshot the empty form
3. Fill sample data:
   - School name: SAMPLE-CRM-DEMO-SCHOOL-001
   - Contact, mobile, zone, city
   - Average fee, branches, decision maker if fields exist
   - Add one product (e.g. Abacus) if required
4. Save
5. Screenshot success / lead list showing the new lead

### Step 3 — School Visit
1. Open School Visits
2. Screenshot the page
3. Create a visit for SAMPLE-CRM-DEMO-SCHOOL-001 (category Follow-up, remarks “Demo visit for verification”)
4. Allow location if prompted
5. Screenshot saved visit in the list

### Step 4 — Follow-up
1. Open Follow-up Leads
2. Find the sample lead
3. Screenshot the follow-up screen
4. Update remarks + next follow-up date
5. Screenshot after save

### Step 5 — Close Lead / products
1. Open Close Lead for the sample
2. Screenshot product config (levels, classes, specs, subjects, categories if shown)
3. Select sample options and unit price
4. Screenshot Product Details table
5. Complete close with PO photo if required (use any small test image)
6. Screenshot confirmation / redirect

### Step 6 — My Clients / Request DC
1. Open My Clients
2. Find the sample school
3. Screenshot the client row
4. Request DC (if available for Executive)
5. Screenshot result

### Step 7 — (If Executive cannot do pending/warehouse) STOP and note
If the Executive role cannot open Pending DC or Warehouse, screenshot Access Denied / missing menu and write: “Next steps need Admin/Finance/Warehouse login.”  
Then ask the user for Admin credentials OR stop the PDF after Step 6 with a “What happens next” diagram in text.

### If Admin credentials ARE provided, continue:

### Step 8 — Pending DC
1. Open Pending DC for the sample
2. Screenshot form
3. Fill Finance Remarks, Special Approval, SME Remarks (all required), DC date/category/notes
4. Screenshot filled form
5. Submit to Warehouse
6. Screenshot success

### Step 9 — Warehouse dispatch fields
1. Open DC @ Warehouse
2. Screenshot DC detail
3. Fill Transport, LR No, LR Date, Boxes
4. Screenshot filled fields
5. Process toward completed if allowed
6. Screenshot completed / success

### Step 10 — Reports
1. Open Sales Visit report — screenshot showing the sample visit
2. Open Change Logs — screenshot (if any sample edits appear)

## Output deliverable

1. Save all screenshots into a folder `crm-walkthrough-shots/`
2. Build a designed PDF named `CRM-Sample-Operations-Walkthrough.pdf`
3. Also keep a simple HTML version `CRM-Sample-Operations-Walkthrough.html` that embeds the same screenshots (so we can re-print)
4. At the end of the PDF, add a one-page checklist:
   - Login works
   - Lead create works
   - Visit works
   - Close lead works
   - Request DC works
   - Pending SME/Finance works (if reached)
   - Warehouse LR fields work (if reached)
5. Do NOT invent screenshots. Only real browser captures.
6. Do NOT delete the sample school unless the user asks.

When finished, return the PDF path and a short summary of which steps succeeded vs blocked by role permissions.

---
