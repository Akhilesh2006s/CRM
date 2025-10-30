'use client'

import { Home, Box, Users, Truck, Receipt, Landmark, Calculator, ChartBar, Settings, LogOut, Layers3 } from 'lucide-react'
import Link from 'next/link'

const items = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: Layers3, label: 'DC', href: '/dashboard/dc' },
  { icon: Users, label: 'Employees', href: '/dashboard/employees' },
  { icon: Landmark, label: 'Trainings', href: '/dashboard/training' },
  { icon: Box, label: 'Warehouse', href: '/dashboard/warehouse' },
  { icon: Truck, label: 'Stock Returns', href: '/dashboard/inventory' },
  { icon: Receipt, label: 'Payments', href: '/dashboard/payments' },
  { icon: Calculator, label: 'Expenses', href: '/dashboard/expenses' },
  { icon: ChartBar, label: 'Reports', href: '/dashboard/reports' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  { icon: LogOut, label: 'Sign out', href: '/auth/login' },
]

export function Sidebar() {
  return (
    <aside className="w-16 md:w-64 bg-[#1a1a1a] text-white h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] sticky top-14 md:top-16">
      <nav className="py-3">
        <ul className="flex md:block gap-2 md:gap-0 px-2 md:px-0 overflow-x-auto">
          {items.map(({ icon: Icon, label, href }) => (
            <li key={label}>
              <Link href={href} className="flex md:flex-row flex-col items-center md:items-start gap-2 md:gap-3 text-xs md:text-sm px-2 md:px-4 py-3 rounded hover:bg-white/10 whitespace-nowrap">
                <Icon size={20} />
                <span className="hidden md:block">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}


