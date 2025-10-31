'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import {
  LayoutDashboard,
  Truck,
  PlusCircle,
  CheckCircle2,
  Save,
  Clock,
  UserCircle2,
  Users,
  CalendarCheck2,
  GraduationCap,
  Boxes,
  RotateCcw,
  CreditCard,
  Calculator,
  BarChart3,
  Settings,
  LogOut,
  FileText,
  Package,
  Building2,
  Receipt,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  FileSearch,
  Database,
  Shield,
  MessageSquare,
  Copy,
  TrendingUp,
  Eye,
  History,
  Menu,
  X,
} from 'lucide-react'

type NavItem = {
  label: string
  icon?: any
  href?: string
  children?: { label: string; href: string; icon?: any }[]
}

const NAV: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  {
    label: 'DC',
    icon: Truck,
    children: [
      { label: 'Create Sale', href: '/dashboard/dc/create', icon: PlusCircle },
      { label: 'Closed Sales', href: '/dashboard/dc/closed', icon: CheckCircle2 },
      { label: 'Saved DC', href: '/dashboard/dc/saved', icon: Save },
      { label: 'Pending DC', href: '/dashboard/dc/pending', icon: Clock },
      { label: 'EMP DC', href: '/dashboard/dc/emp', icon: UserCircle2 },
      { label: 'My DC', href: '/dashboard/dc/my', icon: UserCircle2 },
    ],
  },
  {
    label: 'Users / Employees',
    icon: Users,
    children: [
      { label: 'New Employee', href: '/dashboard/employees/new' },
      { label: 'Active Employees', href: '/dashboard/employees/active' },
      { label: 'Inactive Employees', href: '/dashboard/employees/inactive' },
      { label: 'Pending Leaves', href: '/dashboard/employees/leaves', icon: CalendarCheck2 },
    ],
  },
  {
    label: 'Leave Management',
    icon: CalendarCheck2,
    children: [
      { label: 'Pending Leaves', href: '/dashboard/leaves/pending', icon: Clock },
      { label: 'Leaves Report', href: '/dashboard/leaves/report', icon: FileText },
    ],
  },
  {
    label: 'Trainings & Services',
    icon: GraduationCap,
    children: [
      { label: 'Add Trainer', href: '/dashboard/training/trainers/new' },
      { label: 'Active Trainers', href: '/dashboard/training/trainers/active' },
      { label: 'Trainers Dashboard', href: '/dashboard/training/dashboard' },
      { label: 'Assign Training/Service', href: '/dashboard/training/assign' },
      { label: 'Trainings List', href: '/dashboard/training/list' },
      { label: 'Services List', href: '/dashboard/training/services' },
      { label: 'Inactive Trainers', href: '/dashboard/training/trainers/inactive' },
    ],
  },
  {
    label: 'Warehouse',
    icon: Boxes,
    children: [
      { label: 'Inventory Items', href: '/dashboard/warehouse/inventory-items' },
      { label: 'Stock', href: '/dashboard/warehouse/stock' },
      { label: 'DC @ Warehouse', href: '/dashboard/warehouse/dc-at-warehouse' },
      { label: 'Completed DC', href: '/dashboard/warehouse/completed-dc' },
      { label: 'Hold DC', href: '/dashboard/warehouse/hold-dc' },
    ],
  },
  {
    label: 'Stock Returns',
    icon: RotateCcw,
    children: [
      { label: 'Employee Returns List', href: '/dashboard/returns/employees' },
      { label: 'Warehouse Returns List', href: '/dashboard/returns/warehouse' },
    ],
  },
  {
    label: 'Payments',
    icon: CreditCard,
    children: [
      { label: 'Add Payment', href: '/dashboard/payments/add-payment' },
      { label: 'Transaction Report', href: '/dashboard/payments/transaction-report' },
      { label: 'Approval Pending Cash', href: '/dashboard/payments/approval-pending-cash' },
      { label: 'Approval Pending Cheques', href: '/dashboard/payments/approval-pending-cheques' },
      { label: 'Approved Payments', href: '/dashboard/payments/approved-payments' },
      { label: 'HOLD Payments', href: '/dashboard/payments/hold-payments' },
    ],
  },
  {
    label: 'Expenses',
    icon: Calculator,
    children: [
      { label: 'Pending Expenses List', href: '/dashboard/expenses/pending' },
      { label: 'Finance Pending Exp List', href: '/dashboard/expenses/finance-pending' },
    ],
  },
  {
    label: 'Reports',
    icon: BarChart3,
    children: [
      { label: 'Leads', href: '/dashboard/reports/leads' },
      { label: 'Sales Visit', href: '/dashboard/reports/sales-visit' },
      { label: 'Employee Track', href: '/dashboard/reports/employee-track' },
      { label: 'Contact Queries', href: '/dashboard/reports/contact-queries' },
      { label: 'Change Logs', href: '/dashboard/reports/change-logs' },
      { label: 'Stock', href: '/dashboard/reports/stock' },
      { label: 'DC', href: '/dashboard/reports/dc' },
      { label: 'Returns', href: '/dashboard/reports/returns' },
      { label: 'All Expenses', href: '/dashboard/reports/expenses' },
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    children: [
      { label: 'Change Password', href: '/dashboard/settings/password' },
      { label: 'App Dashboard Data Upload', href: '/dashboard/settings/upload' },
      { label: 'SMS', href: '/dashboard/settings/sms' },
      { label: 'DB Backup', href: '/dashboard/settings/backup' },
    ],
  },
  { label: 'Sign out', icon: LogOut, href: '/auth/login' },
]

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed')
      if (saved !== null) {
        setSidebarOpen(JSON.parse(saved))
      }
    }
  }, [])

  // Load sidebar state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('authUser')
        if (raw) setUser(JSON.parse(raw))
        
        // Load persisted sidebar state
        const savedOpenState = localStorage.getItem('sidebarOpenState')
        if (savedOpenState) {
          try {
            const parsed = JSON.parse(savedOpenState)
            setOpen(parsed)
          } catch {}
        }
      } catch {}
    }
  }, [])

  const isEmployee = user?.role === 'Employee'

  // Add employee leave menu if employee, replace admin Leave Management
  const employeeLeavesMenu: NavItem = {
    label: 'My Leaves',
    icon: CalendarCheck2,
    children: [
      { label: 'Leave Request', href: '/dashboard/leaves/request', icon: PlusCircle },
      { label: 'Leaves', href: '/dashboard/leaves/approved', icon: CheckCircle2 },
    ],
  }

  const leaveManagementIndex = NAV.findIndex(i => i.label === 'Leave Management')
  let finalNav: NavItem[]
  if (isEmployee) {
    finalNav = [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      {
        label: 'DC',
        icon: Truck,
        children: [
          { label: 'My DC', href: '/dashboard/dc/my', icon: UserCircle2 },
        ],
      },
      employeeLeavesMenu,
      { label: 'Sign out', icon: LogOut, href: '/auth/login' },
    ]
  } else {
    finalNav = NAV
  }

  // Auto-expand menu sections based on current route
  useEffect(() => {
    if (!pathname) return

    setOpen((currentOpen) => {
      const newOpenState = { ...currentOpen }
      let shouldUpdate = false

      // Check which menu section contains the current path (use finalNav to handle employee vs admin menus)
      finalNav.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some((child) => {
            if (pathname === child.href) return true
            // Also check if pathname starts with child.href (for nested routes)
            if (child.href !== '/dashboard' && pathname.startsWith(child.href)) return true
            return false
          })
          
          if (hasActiveChild && !newOpenState[item.label]) {
            newOpenState[item.label] = true
            shouldUpdate = true
          }
        }
      })

      if (shouldUpdate && typeof window !== 'undefined') {
        localStorage.setItem('sidebarOpenState', JSON.stringify(newOpenState))
      }

      return shouldUpdate ? newOpenState : currentOpen
    })
  }, [pathname, isEmployee])

  const signOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
    }
    router.push('/auth/login')
  }

  const toggle = (label: string) => {
    setOpen((o) => {
      const newState = { ...o, [label]: !o[label] }
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarOpenState', JSON.stringify(newState))
      }
      return newState
    })
  }

  const toggleSidebar = () => {
    const newState = !sidebarOpen
    setSidebarOpen(newState)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(!newState))
      // Update main content margin
      const mainContent = document.getElementById('main-content')
      if (mainContent) {
        mainContent.style.marginLeft = newState ? '256px' : '64px'
      }
    }
  }

  // Update main content margin on mount and when sidebar state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mainContent = document.getElementById('main-content')
      if (mainContent) {
        mainContent.style.marginLeft = sidebarOpen ? '256px' : '64px'
      }
    }
  }, [sidebarOpen])

  return (
    <>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-[#0a0d11] text-white min-h-screen fixed md:sticky top-0 left-0 z-40 border-r border-gray-800 transition-all duration-300 relative`}>
        {/* User Profile Section */}
        <div className={`py-4 border-b border-gray-800 ${sidebarOpen ? 'px-4' : 'px-0'} hidden md:block`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate text-white">{user?.name || 'User'}</div>
                <div className="text-xs text-white/80 flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Online
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          )}
        </div>
        
        {/* Main Navigation Header with Hamburger */}
        <div className={`py-3 border-b border-gray-800 hidden md:flex items-center ${sidebarOpen ? 'px-4 justify-between' : 'px-0 justify-center'} relative`}>
          {sidebarOpen && (
            <div className="text-[11px] tracking-wider text-white/70 font-semibold uppercase">MAIN NAVIGATION</div>
          )}
          {/* Hamburger button */}
          <button
            onClick={toggleSidebar}
            className={`bg-transparent text-white p-1.5 rounded hover:bg-gray-800 transition-all duration-300 flex-shrink-0 ${sidebarOpen ? '' : 'absolute top-1/2 -translate-y-1/2'}`}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      <nav className="py-1">
        <ul className="flex md:block gap-0 overflow-x-auto">
          {finalNav.map((item) => (
            <li key={item.label} className="w-full">
              {item.children ? (
                <div>
                  <button
                    onClick={() => {
                      if (!sidebarOpen) {
                        // When collapsed, expand sidebar first, then toggle submenu
                        setSidebarOpen(true)
                        setTimeout(() => toggle(item.label), 100)
                      } else {
                        toggle(item.label)
                      }
                    }}
                    className={`w-full flex items-center justify-center text-white py-3 rounded hover:bg-gray-800 font-semibold transition-colors ${
                      sidebarOpen ? 'px-4 gap-3 justify-start' : 'px-0'
                    }`}
                    title={!sidebarOpen ? item.label : ''}
                  >
                    {item.icon && <item.icon size={20} className="text-white flex-shrink-0" />}
                    {sidebarOpen && (
                      <span className="text-sm text-white">{item.label}</span>
                    )}
                  </button>
                  {sidebarOpen && (
                    <div className={`overflow-hidden transition-all ${open[item.label] ? 'max-h-96' : 'max-h-0'}`}>
                      <ul className="ml-8 mt-1 mb-2 space-y-1">
                        {item.children.map((c) => (
                          <li key={c.label}>
                            <Link href={c.href} className="flex items-center gap-2 text-[13px] text-white px-3 py-2 rounded hover:bg-gray-800 font-medium">
                              {c.icon && <c.icon size={16} className="text-white" />}
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                item.label === 'Sign out' ? (
                  <button 
                    onClick={signOut} 
                    className={`w-full flex items-center justify-center text-white py-3 rounded hover:bg-gray-800 font-semibold transition-colors ${
                      sidebarOpen ? 'px-4 gap-3 justify-start' : 'px-0'
                    }`}
                    title={!sidebarOpen ? item.label : ''}
                  >
                    {item.icon && <item.icon size={20} className="text-white flex-shrink-0" />}
                    {sidebarOpen && (
                      <span className="text-sm text-white">{item.label}</span>
                    )}
                  </button>
                ) : (
                  <Link 
                    href={item.href || '#'} 
                    className={`w-full flex items-center justify-center text-white py-3 rounded font-semibold transition-colors ${
                      sidebarOpen ? 'px-4 gap-3 justify-start' : 'px-0'
                    } ${
                      pathname === item.href 
                        ? 'bg-gray-800' 
                        : 'hover:bg-gray-800'
                    }`}
                    title={!sidebarOpen ? item.label : ''}
                  >
                    {item.icon && <item.icon size={20} className="text-white flex-shrink-0" />}
                    {sidebarOpen && (
                      <span className="text-sm text-white">{item.label}</span>
                    )}
                  </Link>
                )
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
    </>
  )
}


