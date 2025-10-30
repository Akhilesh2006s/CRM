'use client'

import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

const sections = [
  { href: '/dashboard/leads', label: 'Leads' },
  { href: '/dashboard/sales', label: 'Sales' },
  { href: '/dashboard/employees', label: 'Employees' },
  { href: '/dashboard/expenses', label: 'Expenses' },
  { href: '/dashboard/payments', label: 'Payments' },
  { href: '/dashboard/reports', label: 'Reports' },
  { href: '/dashboard/training', label: 'Training' },
  { href: '/dashboard/warehouse', label: 'Warehouse' },
  { href: '/dashboard/dc', label: 'Delivery Challans' },
  { href: '/dashboard/inventory', label: 'Inventory' },
]

export default function DashboardPage() {
  const router = useRouter()
  useEffect(() => {
    const user = getCurrentUser()
    if (!user) router.replace('/auth/login')
  }, [router])

  const statisticsCards = [
    { title: 'Active Leads', value: '0', color: 'bg-blue-600' },
    { title: 'Total Sales', value: '0', color: 'bg-pink-600' },
    { title: 'Existing Schools', value: '0', color: 'bg-orange-600' },
    { title: 'Pending Trainings', value: '0', color: 'bg-amber-600' },
    { title: 'Completed Trainings', value: '0', color: 'bg-green-600' },
    { title: 'Pending Services', value: '0', color: 'bg-amber-600' },
    { title: 'Completed Services', value: '0', color: 'bg-green-800' },
  ]

  const leadsData = [
    { zone: 'Nizamabad', totalLeads: '0', hot: '0', warm: '0', cold: '0' },
  ]

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-500">Control panel</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statisticsCards.map((card) => (
          <Card key={card.title} className={`${card.color} text-white p-6 rounded-md shadow`}> 
            <div className="flex items-start justify-between">
              <div className="font-semibold">{card.title}</div>
              <div className="text-xs opacity-80">All →</div>
            </div>
            <div className="text-3xl font-bold mt-6">{card.value}</div>
          </Card>
        ))}
      </div>

      <Card className="bg-[#1f1f1f] border border-neutral-800 p-6 text-white shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="text-white text-lg font-semibold">Leads</div>
          <div className="text-neutral-400 text-sm">—</div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone</TableHead>
              <TableHead className="text-right">Total Leads</TableHead>
              <TableHead className="text-right">Hot</TableHead>
              <TableHead className="text-right">Warm</TableHead>
              <TableHead className="text-right">Cold</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leadsData.map((row) => (
              <TableRow key={row.zone}>
                <TableCell className="text-white">{row.zone}</TableCell>
                <TableCell className="text-right text-white">{row.totalLeads}</TableCell>
                <TableCell className="text-right text-white">{row.hot}</TableCell>
                <TableCell className="text-right text-white">{row.warm}</TableCell>
                <TableCell className="text-right text-white">{row.cold}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Modules section removed as requested */}
    </div>
  )
}


