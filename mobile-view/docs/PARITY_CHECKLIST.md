# Mobile ↔ Web parity checklist

**Scope:** CRM modules only. **Excluded:** DMS (`branches`, `customers`, `vehicles`, `variants`, `wcx`, `working-capital`, `vin-financing`, `facilities`, `pricing-kb`), **AI** (`/dashboard/ai`).

**Reference web:** `navbar-landing/app/dashboard/`  
**Reference mobile:** `mobile-view/src/screens/`  
**API:** `backend/` on port 5001

## Status legend

| Status | Meaning |
|--------|---------|
| done | Mobile screen exists; same API contract as web |
| partial | Hub/redirect or minor field gap |
| excluded | Out of scope |

Track live status in [`src/config/routeRegistry.ts`](../src/config/routeRegistry.ts).

## Module summary

| Module | Web routes (non-DMS) | Mobile | Notes |
|--------|----------------------|--------|-------|
| Auth | login | Login, FirstTimeAttendance | JWT via AsyncStorage |
| Core | dashboard | MainDrawer + tabs | Home / Work / Reports / More |
| Leads | 8 | 8 screens | Includes `LeadsRenewalList` |
| Clients / DC | 13+ | 18+ screens | `DCAdmin` wired |
| Employees | 8 | 6 screens | Zones + clusters added |
| Executive managers | 5 | 7 screens | Includes `ExecutiveManagerExecutives` |
| Leaves | 4 | 5 screens | |
| Training | 12 | 12 screens | |
| Warehouse | 11 | 11 screens | |
| Returns | 5 | 7 screens | |
| Payments | 10 | 10 screens | |
| Expenses | 10 | 10 screens | EM pending, detail, resubmit |
| Reports | 14 | 14 screens | Change logs = coming soon (both platforms) |
| Products | 9 | 8 screens | Vendors + deliverables |
| Settings | 5 | 5 screens | Expense policy added |
| Partner | stocks, dcs | PartnerStocks, PartnerDCs | Partner + Vendor roles |
| Franchises | 1 | FranchiseDetail | |

## Per-screen verification (repeat when changing web)

1. List `apiRequest` / `fetch` calls on web page.
2. Confirm identical paths on mobile `apiService`.
3. Match role guard with `navConfig.ts` / `roles.ts`.
4. Update `routeRegistry.ts` row.

## QA roles

Test each role on device after `npm run dev:mobile`:

- Admin / Super Admin  
- Executive / Sales BDE  
- Manager / Coordinator / Senior Coordinator  
- Executive Manager  
- Trainer  
- Warehouse Executive / Manager  
- Finance Manager  
- Partner / Vendor  

See [`docs/QA-CRM-TESTING-GUIDE.md`](../../docs/QA-CRM-TESTING-GUIDE.md).
