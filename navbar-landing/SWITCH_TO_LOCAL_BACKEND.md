# Switch to Local Backend

## Summary
This document tracks the switch from Railway backend to local backend (localhost:5000).

## Files Updated

### Web App (navbar-landing)
✅ `lib/api.ts` - Already defaults to `http://localhost:5000`
✅ `app/dashboard/reports/leads/closed-leads/page.tsx` - Updated to localhost
✅ `app/dashboard/reports/contact-queries/page.tsx` - Updated to localhost
✅ `app/dashboard/expenses/create/page.tsx` - Already uses environment variable

### Mobile App (mobile-view)
✅ `src/services/api.ts` - Already uses `DEV_API_URL` which is `http://localhost:5000/api`
✅ `src/screens/Expenses/ExpenseCreateScreen.tsx` - Updated to use shared apiService
✅ `src/screens/Expenses/ExpensePendingScreen.tsx` - Updated to use shared apiService
✅ `src/screens/Expenses/ExpenseMyScreen.tsx` - Updated to use shared apiService
✅ `src/screens/Expenses/ExpenseManagerUpdateScreen.tsx` - Updated to use shared apiService
✅ `src/screens/Expenses/ExpenseFinancePendingScreen.tsx` - Updated to use shared apiService
✅ `src/screens/Expenses/ExpenseEditScreen.tsx` - Updated to use shared apiService

## Files Still Needing Update

The following mobile screens still have hardcoded Railway URLs and need to be updated to use the shared `apiService` from `src/services/api.ts`:

### Pattern to Replace:
```typescript
import ApiService from '../../services/api';
const apiService = new ApiService('https://crm-backend-production-fc85.up.railway.app/api');
```

### Replace With:
```typescript
import { apiService } from '../../services/api';
```

### Files to Update:
- All files in `src/screens/Warehouse/`
- All files in `src/screens/Training/`
- All files in `src/screens/Settings/`
- All files in `src/screens/Reports/`
- All files in `src/screens/Products/`
- All files in `src/screens/Payments/`
- All files in `src/screens/Leaves/`
- All files in `src/screens/Leads/`
- All files in `src/screens/ExecutiveManagers/`
- All files in `src/screens/Employees/`
- All files in `src/screens/DC/`
- And others...

## Quick Fix Script

You can use this PowerShell script to update all remaining files:

```powershell
cd mobile-view\src\screens
Get-ChildItem -Recurse -Filter *.tsx | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match "new ApiService\('https://crm-backend-production") {
        $content = $content -replace "import ApiService from '../../services/api';\r?\n\s*const apiService = new ApiService\('https://crm-backend-production-fc85\.up\.railway\.app/api'\);", "import { apiService } from '../../services/api';"
        $content = $content -replace "const apiService = new ApiService\('https://crm-backend-production-fc85\.up\.railway\.app/api'\);", ""
        Set-Content $_.FullName -Value $content -NoNewline
        Write-Host "Updated: $($_.FullName)"
    }
}
```

## Environment Variables

For the web app, you can also set the environment variable:
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000`

This will override the default in `lib/api.ts`.

## Testing

After switching:
1. Make sure your local backend is running on port 5000
2. Test API calls from both web and mobile apps
3. Verify all endpoints are working correctly



