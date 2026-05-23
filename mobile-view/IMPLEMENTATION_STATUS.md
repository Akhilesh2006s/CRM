# Mobile implementation status

> **Authoritative parity plan:** [`../docs/MOBILE_WEB_PARITY.md`](../docs/MOBILE_WEB_PARITY.md)  
> **Route tracking:** [`src/config/routeRegistry.ts`](src/config/routeRegistry.ts)

## Summary (May 2026)

| Item | Count |
|------|-------|
| Registered web routes tracked | See `routeRegistry.ts` |
| Mobile screens | ~114 |
| Placeholder screens | **0** |

Core CRM modules match web routes in `routeRegistry.ts` (DMS + AI excluded by scope).

## Recent parity (May 2026)

- `DCAdminFullView` — admin DC list (search, raise DC, PO photo) for `DCAdmin` + `DCAdminMy`
- `DeliverableAdd`, `DCHub` (Deal Conversion stats), full `LeadsRenewalList`
- `SettingsUpload` — real file upload + history via `expo-document-picker`
- `EmployeesZonesClusters` → full zones screen

## Out of scope (unchanged)

- DMS modules, AI dashboard, Change Logs (coming soon on web + mobile)

Older checklists in `MOBILE_APP_GUIDE.md` / `IMPLEMENTATION_COMPLETE.md` are outdated; use the files above.
