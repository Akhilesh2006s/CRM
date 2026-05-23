/**
 * Mobile nav items — aligned with navbar-landing/components/dashboard/Sidebar.tsx
 * (non-DMS, AI excluded)
 */

import { getRoleFlags, type CrmUser } from '../utils/roles';

export type NavLink = {
  label: string;
  screen: string;
  params?: object;
};

export type NavSection = {
  title: string;
  items: NavLink[];
};

export function getNavSections(user: CrmUser | null | undefined): NavSection[] {
  const flags = getRoleFlags(user);
  const { role, isAdmin, isPartner, isManager, isExecutive, isTrainer, isWarehouseExecutive, isWarehouseManager, isFinanceManager, isExecutiveManager } = flags;

  if (isPartner || role === 'Vendor') {
    return [
      {
        title: 'Partner',
        items: [
          { label: 'Stocks', screen: 'PartnerStocks' },
          { label: 'My DCs', screen: 'PartnerDCs' },
        ],
      },
    ];
  }

  if (isTrainer) {
    return [
      {
        title: 'Training',
        items: [
          { label: 'My Trainings', screen: 'TrainingTrainerMy' },
          { label: 'Completed', screen: 'TrainingTrainerCompleted' },
        ],
      },
      {
        title: 'Expenses',
        items: [
          { label: 'Create Expense', screen: 'ExpenseCreate' },
          { label: 'My Expenses', screen: 'ExpenseMy' },
        ],
      },
      {
        title: 'Leaves',
        items: [
          { label: 'Request Leave', screen: 'LeaveRequest' },
          { label: 'My Leaves', screen: 'LeavesApproved' },
        ],
      },
    ];
  }

  if (isExecutive || role === 'Sales BDE') {
    return [
      {
        title: 'Leads',
        items: [
          { label: 'Add Lead', screen: 'LeadAdd' },
          { label: 'Renewal Leads', screen: 'LeadsRenewalList' },
          { label: 'Followup Leads', screen: 'LeadFollowup' },
          { label: 'My Leads', screen: 'LeadsList' },
        ],
      },
      {
        title: 'Clients',
        items: [
          { label: 'My Clients', screen: 'DCClient' },
          { label: 'Term-Wise DC', screen: 'DCTermWise' },
        ],
      },
      {
        title: 'Payments',
        items: [
          { label: 'Pending Payments', screen: 'PaymentList' },
          { label: 'Add Payment', screen: 'PaymentAdd' },
          { label: 'Payments Done', screen: 'PaymentDone' },
        ],
      },
      {
        title: 'Expenses',
        items: [
          { label: 'Create Expense', screen: 'ExpenseCreate' },
          { label: 'My Expenses', screen: 'ExpenseMy' },
        ],
      },
      {
        title: 'More',
        items: [
          { label: 'Sample Request', screen: 'SamplesRequest' },
          { label: 'Stock Returns', screen: 'ReturnsEmployee' },
          { label: 'Request Leave', screen: 'LeaveRequest' },
        ],
      },
    ];
  }

  if (isExecutiveManager) {
    return [
      {
        title: 'Executive Manager',
        items: [
          { label: 'Dashboard', screen: 'ExecutiveManagerDashboard', params: { managerId: (user as any)?._id } },
          { label: 'Managers', screen: 'ExecutiveManagers' },
          { label: 'Closed Sales', screen: 'ClientsClosedSales' },
          { label: 'Pending Expenses', screen: 'ExpenseExecutiveManagerPending' as const },
          { label: 'My Leaves', screen: 'ExecutiveManagerLeaves', params: { managerId: (user as any)?._id } },
        ],
      },
    ];
  }

  if (isManager || isCoordinator || isSeniorCoordinator) {
    const clientsChildren: NavLink[] = [
      { label: 'Closed Sales', screen: 'DCClosed' },
      { label: 'Saved DC', screen: 'DCSaved' },
      { label: 'Pending DC', screen: 'DCPending' },
      { label: 'EMP DC', screen: 'DCEmp' },
    ];
    if (!isManager) {
      clientsChildren.unshift({ label: 'Create Sale', screen: 'DCCreate' });
    }
    return [
      { title: 'Clients', items: clientsChildren },
      {
        title: 'Warehouse',
        items: [
          { label: 'DC @ Warehouse', screen: 'WarehouseDCAtWarehouse' },
          { label: 'Completed DC', screen: 'WarehouseCompletedDC' },
          { label: 'DC Listed', screen: 'WarehouseDCListed' },
        ],
      },
      {
        title: 'Expenses',
        items: [{ label: 'Pending Expenses', screen: 'ExpensePending' }],
      },
      {
        title: 'Reports',
        items: [
          { label: 'Leads', screen: 'ReportsLeads' },
          { label: 'Sales Visit', screen: 'ReportsSalesVisit' },
          { label: 'Employee Track', screen: 'ReportsEmployeeTrack' },
          { label: 'All Expenses', screen: 'ReportsExpenses' },
        ],
      },
      {
        title: 'Leaves',
        items: [
          { label: 'Pending Leaves', screen: 'LeavesPending' },
          { label: 'Request Leave', screen: 'LeaveRequest' },
          { label: 'My Leaves', screen: 'LeavesApproved' },
        ],
      },
      {
        title: 'Settings',
        items: [{ label: 'Change Password', screen: 'SettingsPassword' }],
      },
    ];
  }

  if (isWarehouseExecutive || isWarehouseManager) {
    return [
      {
        title: 'Warehouse',
        items: [
          { label: 'Inventory Items', screen: 'WarehouseInventoryItems' },
          { label: 'Stock', screen: 'WarehouseStock' },
          { label: 'DC @ Warehouse', screen: 'WarehouseDCAtWarehouse' },
          { label: 'Hold DC', screen: 'WarehouseHoldDC' },
          { label: 'Returns', screen: isWarehouseManager ? 'ReturnsWarehouseManager' : 'ReturnsWarehouseExecutive' },
        ],
      },
    ];
  }

  if (isFinanceManager) {
    return [
      {
        title: 'Finance',
        items: [
          { label: 'Finance Pending Expenses', screen: 'ExpenseFinancePending' },
          { label: 'Payments', screen: 'PaymentList' },
        ],
      },
    ];
  }

  // Admin / default
  const sections: NavSection[] = [
    {
      title: 'Leads',
      items: [
        { label: 'All Leads', screen: 'LeadsList' },
        { label: 'Add Lead', screen: 'LeadAdd' },
        { label: 'Renewal Leads', screen: 'LeadsRenewalList' },
      ],
    },
    {
      title: 'Clients',
      items: [
        { label: 'Create Sale', screen: 'DCCreate' },
        { label: 'Closed Sales', screen: 'DCClosed' },
        { label: 'Admin DC', screen: 'DCAdmin' },
        { label: 'Pending DC', screen: 'DCPending' },
      ],
    },
    {
      title: 'Employees',
      items: [
        { label: 'New Employee', screen: 'EmployeeNew' },
        { label: 'Active', screen: 'EmployeesActive' },
        { label: 'Zones', screen: 'EmployeesZones' },
        { label: 'Clusters', screen: 'EmployeesClusters' },
      ],
    },
    {
      title: 'Payments',
      items: [
        { label: 'Payments', screen: 'PaymentList' },
        { label: 'Pending Cash', screen: 'PaymentApprovalPendingCash' },
        { label: 'Pending Cheques', screen: 'PaymentApprovalPendingCheques' },
      ],
    },
    {
      title: 'Expenses',
      items: [
        { label: 'Pending', screen: 'ExpensePending' },
        { label: 'Finance Pending', screen: 'ExpenseFinancePending' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { label: 'Reports Hub', screen: 'ReportsLeads' },
        { label: 'DC Report', screen: 'ReportsDC' },
      ],
    },
    {
      title: 'Training',
      items: [
        { label: 'Training List', screen: 'TrainingList' },
        { label: 'Assign', screen: 'TrainingAssign' },
      ],
    },
    {
      title: 'Warehouse',
      items: [
        { label: 'Inventory', screen: 'WarehouseInventoryItems' },
        { label: 'Search DC', screen: 'WarehouseSearchDC' },
      ],
    },
  ];

  if (isAdmin) {
    sections.push({
      title: 'Products (Admin)',
      items: [
        { label: 'Products', screen: 'ProductsList' },
        { label: 'Partners / Vendors', screen: 'VendorsList' },
        { label: 'Deliverables', screen: 'DeliverablesList' },
      ],
    });
    sections.push({
      title: 'Settings',
      items: [
        { label: 'Password', screen: 'SettingsPassword' },
        { label: 'SMS', screen: 'SettingsSMS' },
        { label: 'Backup', screen: 'SettingsBackup' },
        { label: 'Expense Policy', screen: 'SettingsExpenses' },
      ],
    });
  }

  return sections;
}
