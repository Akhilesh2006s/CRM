# Mobile ↔ Web parity

## Architecture (final)

| Application | Folder |
|-------------|--------|
| Web | `navbar-landing/` |
| Mobile | `mobile-view/` |
| API | `backend/` |

## Active scope (May 2026)

- **In scope:** Full CRM operational modules (leads through settings, partner, franchises).
- **Excluded:** All DMS routes and **AI dashboard** (deferred).

## Implementation status

| Area | Status |
|------|--------|
| Navigation | Drawer + bottom tabs (`MainDrawer`, Work/Reports/More hubs) |
| Screen registry | [`mobile-view/src/config/routeRegistry.ts`](../mobile-view/src/config/routeRegistry.ts) |
| Role-based nav | [`mobile-view/src/config/navConfig.ts`](../mobile-view/src/config/navConfig.ts) + [`roles.ts`](../mobile-view/src/utils/roles.ts) |
| New screens | Zones, clusters, EM expenses, expense detail/resubmit, vendors, deliverables, partner stocks/DCs, renewal leads, franchise detail, DCAdmin |
| Dashboard | Uses `navigateRoot()` for stack screens; Partner role cards |

**Checklist:** [`mobile-view/docs/PARITY_CHECKLIST.md`](../mobile-view/docs/PARITY_CHECKLIST.md)

## Run locally

```bash
npm run dev:api
npm run dev:web
npm run dev:mobile
```

## Do not use

- Root `app/` (legacy web duplicate)
- `navbar-landing/backend/`, `navbar-landing/mobile-view/` nested copies
- DMS pages until explicitly scheduled
