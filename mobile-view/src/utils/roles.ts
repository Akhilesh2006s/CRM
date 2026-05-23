/**
 * Role helpers — keep aligned with navbar-landing/components/dashboard/Sidebar.tsx
 */

export type CrmUser = {
  role?: string;
  roles?: string[];
};

function normalizeRole(value?: string): string {
  return (value ?? '').trim().toLowerCase();
}

export function roleIncludes(user: CrmUser | null | undefined, match: string): boolean {
  const m = normalizeRole(match);
  const primary = normalizeRole(user?.role);
  const extras = (user?.roles ?? []).map(normalizeRole);
  return primary.includes(m) || extras.some((r) => r.includes(m));
}

export function getRoleFlags(user: CrmUser | null | undefined) {
  const role = user?.role ?? '';
  return {
    role,
    isAdmin: role === 'Admin' || role === 'Super Admin',
    isPartner: role === 'Partner' || role === 'Vendor',
    isManager: role === 'Manager',
    isCoordinator: role === 'Coordinator',
    isSeniorCoordinator: role === 'Senior Coordinator',
    isExecutiveManager: role === 'Executive Manager',
    isTrainer: role === 'Trainer',
    isWarehouseExecutive: role === 'Warehouse Executive',
    isWarehouseManager: role === 'Warehouse Manager',
    isFinanceManager: roleIncludes(user, 'finance manager'),
    isExecutive: role === 'Executive',
    isEmployee: role === 'Executive' || roleIncludes(user, 'sales bde'),
  };
}
