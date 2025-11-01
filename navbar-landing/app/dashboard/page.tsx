'use client'

import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Zap, TrendingUp, DollarSign, GraduationCap, AlertTriangle, X, Minimize2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import BarGradient from '@/components/charts/BarGradient'
import AreaGradient from '@/components/charts/AreaGradient'
import DoughnutStatus from '@/components/charts/DoughnutStatus'
import { apiRequest } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

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

const STAT_CONFIG = [
  { label: 'Active Leads', icon: Zap, accent: 'sky' },
  { label: 'Total Sales', icon: DollarSign, accent: 'rose' },
  { label: 'Existing Schools', icon: GraduationCap, accent: 'orange' },
  { label: 'Pending Trainings', icon: TrendingUp, accent: 'amber' },
  { label: 'Completed Trainings', icon: TrendingUp, accent: 'emerald' },
  { label: 'Pending Services', icon: TrendingUp, accent: 'yellow' },
  { label: 'Completed Services', icon: TrendingUp, accent: 'teal' },
]

const accentToClasses: Record<string, { chip: string; icon: string }> = {
  sky: { chip: 'bg-sky-100', icon: 'text-sky-50' },
  rose: { chip: 'bg-rose-100', icon: 'text-rose-50' },
  orange: { chip: 'bg-orange-100', icon: 'text-orange-50' },
  amber: { chip: 'bg-amber-100', icon: 'text-amber-50' },
  emerald: { chip: 'bg-emerald-100', icon: 'text-emerald-50' },
  yellow: { chip: 'bg-yellow-100', icon: 'text-yellow-50' },
  teal: { chip: 'bg-teal-100', icon: 'text-teal-50' },
}
const gradientMap: Record<string, string> = {
  sky: 'from-sky-500 to-blue-600',
  rose: 'from-rose-500 to-pink-600',
  orange: 'from-orange-500 to-amber-600',
  amber: 'from-amber-500 to-yellow-600',
  emerald: 'from-emerald-500 to-green-600',
  yellow: 'from-yellow-500 to-orange-500',
  teal: 'from-teal-500 to-cyan-600',
}
const accentHex: Record<string, string> = {
  sky: '#0284c7',
  rose: '#e11d48',
  orange: '#f97316',
  amber: '#f59e0b',
  emerald: '#059669',
  yellow: '#ca8a04',
  teal: '#0d9488',
}

const MOCK_STATS = [
  { value: 128 },
  { value: 74 },
  { value: 38 },
  { value: 5 },
  { value: 12 },
  { value: 9 },
  { value: 20 },
]

const MOCK_TRENDS = [
  { name: 'Mon', leads: 22, sales: 5, revenue: 48000 },
  { name: 'Tue', leads: 28, sales: 8, revenue: 62000 },
  { name: 'Wed', leads: 31, sales: 10, revenue: 75000 },
  { name: 'Thu', leads: 24, sales: 6, revenue: 41000 },
  { name: 'Fri', leads: 35, sales: 11, revenue: 92000 },
  { name: 'Sat', leads: 29, sales: 7, revenue: 56000 },
  { name: 'Sun', leads: 18, sales: 3, revenue: 23000 },
]

const MOCK_VOLUME = [
  { hour: '01:00', value: 82 },
  { hour: '02:00', value: 68 },
  { hour: '03:00', value: 46 },
  { hour: '04:00', value: 58 },
  { hour: '05:00', value: 30 },
  { hour: '06:00', value: 44 },
  { hour: '07:00', value: 64 },
  { hour: '08:00', value: 72 },
  { hour: '09:00', value: 98 },
  { hour: '10:00', value: 106 },
  { hour: '11:00', value: 120 },
  { hour: '12:00', value: 118 },
  { hour: '13:00', value: 136 },
  { hour: '14:00', value: 128 },
  { hour: '15:00', value: 132 },
  { hour: '16:00', value: 126 },
  { hour: '17:00', value: 130 },
  { hour: '18:00', value: 116 },
  { hour: '19:00', value: 84 },
  { hour: '20:00', value: 58 },
  { hour: '21:00', value: 92 },
  { hour: '22:00', value: 76 },
  { hour: '23:00', value: 36 },
  { hour: '24:00', value: 44 },
]

const MOCK_ZONES = [
  { zone: 'Nizamabad', total: 40, hot: 12, warm: 15, cold: 13 },
  { zone: 'Karimnagar', total: 32, hot: 9, warm: 12, cold: 11 },
  { zone: 'Warangal', total: 26, hot: 6, warm: 10, cold: 10 },
]

const MOCK_ALERTS = [
  { level: 'warning', text: 'Follow-up pending for 7 hot leads today' },
  { level: 'info', text: '3 trainings scheduled this week' },
]

// PIE_DATA will be computed from stats state

type DashboardStats = {
  activeLeads: number
  totalSales: number
  existingSchools: number
  pendingTrainings: number
  completedTrainings: number
  pendingServices: number
  completedServices: number
}

type TrendData = {
  name: string
  leads: number
  sales: number
  revenue: number
}

type VolumeData = {
  hour: string
  value: number
}

type ZoneData = {
  zone: string
  total: number
  hot: number
  warm: number
  cold: number
}

type AlertData = {
  level: 'warning' | 'info'
  text: string
}

type ActivityData = {
  id: string
  type: string
  message: string
  timestamp: string | Date
  user: string
}

type ZoneWiseLeadData = {
  zone: string
  total: number
  hot: number
  warm: number
  cold: number
}

type ExecutiveWiseLeadData = {
  zone: string
  executiveName: string
  total: number
  hot: number
  warm: number
  cold: number
}

type ZoneWiseClosedLeadData = {
  zone: string
  totalClosed: number
}

type ExecutiveWiseClosedLeadData = {
  zone: string
  executiveName: string
  totalClosed: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState(MOCK_STATS)
  const [trends, setTrends] = useState(MOCK_TRENDS)
  const [zones, setZones] = useState(MOCK_ZONES)
  const [alerts, setAlerts] = useState(MOCK_ALERTS)
  const [volume, setVolume] = useState(MOCK_VOLUME)
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [loading, setLoading] = useState(true)
  
  // Leads analytics state
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [zoneWiseLeads, setZoneWiseLeads] = useState<ZoneWiseLeadData[]>([])
  const [executiveWiseLeads, setExecutiveWiseLeads] = useState<ExecutiveWiseLeadData[]>([])
  const [zoneWiseClosedLeads, setZoneWiseClosedLeads] = useState<ZoneWiseClosedLeadData[]>([])
  const [executiveWiseClosedLeads, setExecutiveWiseClosedLeads] = useState<ExecutiveWiseClosedLeadData[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads'>('dashboard')

  // compute KPIs for the teal chart
  const salesArr = trends && trends.length ? trends.map(t => t.revenue) : [0]
  const peak = Math.max(...salesArr)
  const min = Math.min(...salesArr)
  const avg = Math.round(salesArr.reduce((s,v)=>s+v,0) / (salesArr.length || 1))
  const fmtINR = (n:number) => `₹${Number(n || 0).toLocaleString('en-IN')}`

  // Compute pie chart data from stats
  const PIE_DATA = [
    { label: 'Pending Trainings', value: stats[3]?.value || 0, color: '#fbbf24' },    // Amber
    { label: 'Completed Trainings', value: stats[4]?.value || 0, color: '#34d399' }, // Green
    { label: 'Pending Services', value: stats[5]?.value || 0, color: '#f59e42' },     // Orange
    { label: 'Completed Services', value: stats[6]?.value || 0, color: '#60a5fa' },   // Blue
  ]

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        // Fetch all dashboard data in parallel
        const [statsData, trendsData, volumeData, zonesData, alertsData, activitiesData] = await Promise.all([
          apiRequest<DashboardStats>('/dashboard/stats').catch(() => null),
          apiRequest<TrendData[]>('/dashboard/revenue-trends').catch(() => null),
          apiRequest<VolumeData[]>('/dashboard/leads-volume').catch(() => null),
          apiRequest<ZoneData[]>('/dashboard/leads-by-zone').catch(() => null),
          apiRequest<AlertData[]>('/dashboard/alerts').catch(() => null),
          apiRequest<ActivityData[]>('/dashboard/recent-activities').catch(() => null),
        ])

        // Update stats
        if (statsData) {
          setStats([
            { value: statsData.activeLeads },
            { value: statsData.totalSales },
            { value: statsData.existingSchools },
            { value: statsData.pendingTrainings },
            { value: statsData.completedTrainings },
            { value: statsData.pendingServices },
            { value: statsData.completedServices },
          ])
        }

        // Update trends
        if (trendsData && trendsData.length > 0) {
          setTrends(trendsData)
        }

        // Update volume
        if (volumeData && volumeData.length > 0) {
          setVolume(volumeData)
        }

        // Update zones
        if (zonesData && zonesData.length > 0) {
          setZones(zonesData)
        } else if (zonesData && zonesData.length === 0) {
          setZones([]) // Empty array if no zones
        }

        // Update alerts
        if (alertsData && alertsData.length > 0) {
          setAlerts(alertsData)
        } else if (alertsData && alertsData.length === 0) {
          setAlerts([]) // Empty array if no alerts
        }

        // Update activities
        if (activitiesData && activitiesData.length > 0) {
          setActivities(activitiesData)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Keep using mock data on error
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    fetchLeadsAnalytics() // Initial load without date filter
  }, [])

  const fetchLeadsAnalytics = async () => {
    setLeadsLoading(true)
    try {
      const params = new URLSearchParams()
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)
      
      const queryString = params.toString()
      const suffix = queryString ? `?${queryString}` : ''

      const [zoneWise, executiveWise, zoneClosed, executiveClosed] = await Promise.all([
        apiRequest<ZoneWiseLeadData[]>(`/dashboard/leads-analytics/zone-wise${suffix}`).catch(() => []),
        apiRequest<ExecutiveWiseLeadData[]>(`/dashboard/leads-analytics/executive-wise${suffix}`).catch(() => []),
        apiRequest<ZoneWiseClosedLeadData[]>(`/dashboard/leads-analytics/zone-wise-closed${suffix}`).catch(() => []),
        apiRequest<ExecutiveWiseClosedLeadData[]>(`/dashboard/leads-analytics/executive-wise-closed${suffix}`).catch(() => []),
      ])

      setZoneWiseLeads(zoneWise || [])
      setExecutiveWiseLeads(executiveWise || [])
      setZoneWiseClosedLeads(zoneClosed || [])
      setExecutiveWiseClosedLeads(executiveClosed || [])
    } catch (error) {
      console.error('Error fetching leads analytics:', error)
    } finally {
      setLeadsLoading(false)
    }
  }

  const handleSearch = () => {
    fetchLeadsAnalytics()
  }

  return (
    <div className="p-2 md:p-6 max-w-7xl mx-auto space-y-7">
      {/* STAT WIDGETS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {STAT_CONFIG.map((stat, i) => {
          const cls = accentToClasses[stat.accent]
          const grad = gradientMap[stat.accent]
          return (
            <div
              key={stat.label}
              className={`relative overflow-hidden rounded-2xl text-white p-7 md:p-8 shadow-md border-0 bg-gradient-to-br ${grad} transition-transform hover:scale-[1.01] min-h-[148px]`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[13px] uppercase tracking-wider opacity-95">{stat.label}</div>
                  <div className="mt-2 text-[38px] md:text-[44px] leading-[1.1] font-extrabold drop-shadow-sm">{stats[i]?.value ?? '0'}</div>
                </div>
                <span className={`h-12 w-12 rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-sm`}>
                  <stat.icon className={`w-6 h-6 text-white`} />
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-4 border-b border-neutral-200">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'dashboard' | 'leads')} className="w-full">
          <TabsList className="bg-transparent p-0 h-auto">
            <TabsTrigger
              value="dashboard"
              className={`px-6 py-3 rounded-t-lg font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="leads"
              className={`px-6 py-3 rounded-t-lg font-medium transition-colors ${
                activeTab === 'leads'
                  ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Leads Dashboard
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Dashboard Content */}
      {activeTab === 'dashboard' && (
        <>
          {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BarChart: Chart.js */}
        <Card className="shadow-sm rounded-xl bg-white text-neutral-900 p-6 flex flex-col gap-3 border border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-neutral-900">Leads Volume</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 font-medium">24H</span>
              <span className="px-2 py-1 rounded text-neutral-500 hover:bg-neutral-100 cursor-default">7D</span>
              <span className="px-2 py-1 rounded text-neutral-500 hover:bg-neutral-100 cursor-default">30D</span>
            </div>
          </div>
          <div className="h-[300px]">
            <BarGradient labels={volume.map(v=>v.hour)} values={volume.map(v=>v.value)} />
          </div>
        </Card>
        {/* AreaChart with KPIs - Chart.js */}
        <Card className="min-h-[360px] rounded-xl bg-white text-neutral-900 p-6 shadow-sm flex flex-col gap-4 border border-neutral-200">
          <div>
            <div className="text-lg font-semibold">Revenue Trend</div>
            <div className="text-xs text-neutral-500">Week‑over‑week revenue progression (daily).</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-neutral-50 rounded-md px-4 py-3 text-center border border-neutral-200">
              <div className="text-orange-600 text-xl font-bold">{fmtINR(peak)}</div>
              <div className="text-xs text-neutral-500">Peak day</div>
            </div>
            <div className="bg-neutral-50 rounded-md px-4 py-3 text-center border border-neutral-200">
              <div className="text-neutral-900 text-xl font-bold">{fmtINR(avg)}</div>
              <div className="text-xs text-neutral-500">Average</div>
            </div>
            <div className="bg-neutral-50 rounded-md px-4 py-3 text-center border border-neutral-200">
              <div className="text-green-700 text-xl font-bold">{fmtINR(min)}</div>
              <div className="text-xs text-neutral-500">Minimum</div>
            </div>
          </div>
          <div className="flex-1 min-h-[240px]">
            <AreaGradient labels={trends.map(t=>t.name)} values={trends.map(t=>t.revenue)} />
          </div>
        </Card>
      </div>
      {/* Donut chart row (Training & Service Status) */}
      <div className="flex flex-col lg:flex-row w-full gap-6 mt-8">
        <Card className="flex flex-col lg:flex-row items-center justify-between w-full shadow-sm rounded-xl bg-sky-50 border border-sky-100 p-8 md:p-10 text-neutral-900">
          <div className="w-full lg:w-[350px] xl:w-[430px] h-[260px] flex items-center justify-center relative">
            <DoughnutStatus slices={PIE_DATA as any} />
            <div className="absolute text-center">
              <div className="text-xs text-neutral-500">Total</div>
              <div className="text-xl font-semibold">{PIE_DATA.reduce((s,d)=>s + (d.value as number),0)}</div>
            </div>
          </div>
          {/* legend */}
          <div className="flex flex-col mt-5 lg:mt-0 lg:ml-12 gap-3 min-w-[200px]">
            <div className="font-semibold text-base mb-2">Training & Service Status</div>
            {PIE_DATA.map((entry) => {
              const total = PIE_DATA.reduce((s,d)=>s + (d.value as number),0) || 1
              const pct = Math.round(((entry.value as number) / total) * 100)
              return (
                <div key={entry.label} className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                  <span className="w-3.5 h-3.5 rounded-full block" style={{background: entry.color}}></span>
                  <span className="truncate">{entry.label}</span>
                  <span className="ml-auto text-neutral-500">{pct}%</span>
                  <span className="font-semibold text-neutral-900 w-8 text-right">{entry.value}</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Active Alerts - animated, colored stripe */}
        <Card className="shadow rounded-xl bg-orange-50 p-6 flex flex-col gap-3 lg:col-span-1 border border-orange-100">
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold text-neutral-900">Active Alerts</div>
            <button className="text-xs text-blue-600 hover:text-blue-700">View all</button>
          </div>
          {loading ? (
            <div className="text-neutral-500 text-sm">Loading alerts...</div>
          ) : alerts.length > 0 ? (
            alerts.map((a, idx) => (
              <div
                key={idx}
                className={`relative flex items-center gap-2 rounded-lg p-3 text-sm transition-all hover:translate-x-[1px] ${
                  a.level === 'warning'
                    ? 'bg-orange-50 text-orange-800 border border-orange-200'
                    : 'bg-green-50 text-green-800 border border-green-200'
                }`}
                style={{ boxShadow: '0 1px 0 0 rgba(0,0,0,0.02) inset' }}
              >
                <span className={`absolute left-0 top-0 h-full w-1 ${a.level === 'warning' ? 'bg-orange-400' : 'bg-green-400'} rounded-l-lg`} />
                <AlertTriangle size={18} />
                <span className="pl-1">{a.text}</span>
              </div>
            ))
          ) : (
            <div className="text-neutral-500 text-sm">No active alerts</div>
          )}
        </Card>
        {/* Leads by Zone - zebra and hover */}
        <Card className="bg-emerald-50 shadow rounded-xl p-6 lg:col-span-2 border border-emerald-100">
          <div className="font-semibold text-neutral-900 mb-2">Leads by Zone</div>
          <table className="w-full text-left text-sm overflow-hidden rounded-lg">
            <thead>
              <tr className="text-neutral-600 border-b bg-neutral-50">
                <th className="py-2 font-medium px-2">Zone</th>
                <th className="py-2 font-medium text-right px-2">Total Leads</th>
                <th className="py-2 font-medium text-right px-2">Hot</th>
                <th className="py-2 font-medium text-right px-2">Warm</th>
                <th className="py-2 font-medium text-right px-2">Cold</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-4 px-2 text-center text-neutral-500">Loading zones...</td>
                </tr>
              ) : zones.length > 0 ? (
                zones.map((z, i) => (
                  <tr key={z.zone} className={`border-b last:border-0 transition-colors hover:bg-neutral-50 ${i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/60'}`}>
                    <td className="py-2 px-2 text-neutral-900">{z.zone}</td>
                    <td className="py-2 px-2 text-right"><span className="inline-flex items-center justify-center min-w-8 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">{z.total}</span></td>
                    <td className="py-2 px-2 text-right"><span className="inline-flex min-w-8 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">{z.hot}</span></td>
                    <td className="py-2 px-2 text-right"><span className="inline-flex min-w-8 px-2 py-0.5 rounded-full bg-green-50 text-green-700">{z.warm}</span></td>
                    <td className="py-2 px-2 text-right"><span className="inline-flex min-w-8 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">{z.cold}</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 px-2 text-center text-neutral-500">No zone data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Recent Activity - soft colored card */}
        <Card className="bg-violet-50 shadow rounded-xl p-6 border border-violet-100">
          <div className="font-semibold text-neutral-900 mb-3">Recent Activity</div>
          <div className="flex flex-col gap-3 text-sm">
            {loading ? (
              <div className="text-neutral-500">Loading activities...</div>
            ) : activities.length > 0 ? (
              activities.slice(0, 5).map((activity) => {
                const getColorClasses = () => {
                  if (activity.type === 'lead_created') return { text: 'text-orange-700', bg: 'bg-orange-500' }
                  if (activity.type === 'sale_made') return { text: 'text-green-700', bg: 'bg-green-500' }
                  if (activity.type === 'training_completed') return { text: 'text-blue-700', bg: 'bg-blue-500' }
                  return { text: 'text-neutral-700', bg: 'bg-neutral-500' }
                }
                const colors = getColorClasses()
                return (
                  <div key={activity.id} className={`flex items-center gap-2 ${colors.text}`}>
                    <span className={`h-2 w-2 rounded-full ${colors.bg}`} />
                    <span>{activity.message}</span>
                  </div>
                )
              })
            ) : (
              <div className="text-neutral-500">No recent activities</div>
            )}
          </div>
        </Card>
        <div className="hidden" />
      </div>
        </>
      )}

      {/* Leads Dashboard Content */}
      {activeTab === 'leads' && (
      <div className="mt-6 space-y-6">
        <Card className="p-6 shadow-sm rounded-xl bg-white border border-neutral-200">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Dashboard</h2>
            
            {/* Date Range Filter */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <label htmlFor="fromDate" className="text-sm font-medium text-neutral-700 whitespace-nowrap">
                  From Date:
                </label>
                <Input
                  id="fromDate"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-[180px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="toDate" className="text-sm font-medium text-neutral-700 whitespace-nowrap">
                  To Date:
                </label>
                <Input
                  id="toDate"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-[180px]"
                />
              </div>
              <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white">
                Search
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Zone wise Leads */}
            <Card className="p-4 border border-neutral-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-neutral-900">Zone wise Leads</h3>
                <div className="flex items-center gap-2">
                  <Minimize2 className="h-4 w-4 text-neutral-400 cursor-pointer hover:text-neutral-600" />
                  <X className="h-4 w-4 text-neutral-400 cursor-pointer hover:text-neutral-600" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-neutral-50">
                      <th className="py-2 px-3 text-left font-semibold text-neutral-900">Zone</th>
                      <th className="py-2 px-3 text-right font-semibold text-neutral-900">Total Leads</th>
                      <th className="py-2 px-3 text-right font-semibold text-neutral-900">Hot</th>
                      <th className="py-2 px-3 text-right font-semibold text-neutral-900">Warm</th>
                      <th className="py-2 px-3 text-right font-semibold text-neutral-900">Cold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsLoading ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-neutral-500">Loading...</td>
                      </tr>
                    ) : zoneWiseLeads.length > 0 ? (
                      zoneWiseLeads.map((item, idx) => (
                        <tr key={idx} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}>
                          <td className="py-2 px-3 text-neutral-900">{item.zone || 'Unassigned'}</td>
                          <td className="py-2 px-3 text-right">{item.total}</td>
                          <td className="py-2 px-3 text-right">{item.hot}</td>
                          <td className="py-2 px-3 text-right">{item.warm}</td>
                          <td className="py-2 px-3 text-right">{item.cold}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-neutral-500">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Executive wise Leads */}
            <Card className="p-4 border border-neutral-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-neutral-900">Executive wise Leads</h3>
                <div className="flex items-center gap-2">
                  <Minimize2 className="h-4 w-4 text-neutral-400 cursor-pointer hover:text-neutral-600" />
                  <X className="h-4 w-4 text-neutral-400 cursor-pointer hover:text-neutral-600" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-neutral-50">
                      <th className="py-2 px-3 text-left font-semibold text-neutral-900">Zone</th>
                      <th className="py-2 px-3 text-left font-semibold text-neutral-900">Executive Name</th>
                      <th className="py-2 px-3 text-right font-semibold text-neutral-900">Total Leads</th>
                      <th className="py-2 px-3 text-right font-semibold text-neutral-900">Hot</th>
                      <th className="py-2 px-3 text-right font-semibold text-neutral-900">Warm</th>
                      <th className="py-2 px-3 text-right font-semibold text-neutral-900">Cold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsLoading ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-neutral-500">Loading...</td>
                      </tr>
                    ) : executiveWiseLeads.length > 0 ? (
                      executiveWiseLeads.map((item, idx) => (
                        <tr key={idx} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}>
                          <td className="py-2 px-3 text-neutral-900">{item.zone || 'Unassigned'}</td>
                          <td className="py-2 px-3 text-neutral-900">{item.executiveName || 'Unassigned'}</td>
                          <td className="py-2 px-3 text-right">{item.total}</td>
                          <td className="py-2 px-3 text-right">{item.hot}</td>
                          <td className="py-2 px-3 text-right">{item.warm}</td>
                          <td className="py-2 px-3 text-right">{item.cold}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-neutral-500">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Zone wise Closed Leads */}
            <Card className="p-4 border border-neutral-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-neutral-900">Zone wise Closed Leads</h3>
                <div className="flex items-center gap-2">
                  <Minimize2 className="h-4 w-4 text-neutral-400 cursor-pointer hover:text-neutral-600" />
                  <X className="h-4 w-4 text-neutral-400 cursor-pointer hover:text-neutral-600" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-neutral-50">
                      <th className="py-2 px-3 text-left font-semibold text-neutral-900">Zone</th>
                      <th className="py-2 px-3 text-right font-semibold text-neutral-900">Total Closed Leads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsLoading ? (
                      <tr>
                        <td colSpan={2} className="py-4 text-center text-neutral-500">Loading...</td>
                      </tr>
                    ) : zoneWiseClosedLeads.length > 0 ? (
                      zoneWiseClosedLeads.map((item, idx) => (
                        <tr key={idx} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}>
                          <td className="py-2 px-3 text-neutral-900">{item.zone || 'Unassigned'}</td>
                          <td className="py-2 px-3 text-right">{item.totalClosed}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-4 text-center text-neutral-500">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Executive wise Closed Leads */}
            <Card className="p-4 border border-neutral-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-neutral-900">Executive wise Closed Leads</h3>
                <div className="flex items-center gap-2">
                  <Minimize2 className="h-4 w-4 text-neutral-400 cursor-pointer hover:text-neutral-600" />
                  <X className="h-4 w-4 text-neutral-400 cursor-pointer hover:text-neutral-600" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-neutral-50">
                      <th className="py-2 px-3 text-left font-semibold text-neutral-900">Zone</th>
                      <th className="py-2 px-3 text-left font-semibold text-neutral-900">Executive Name</th>
                      <th className="py-2 px-3 text-right font-semibold text-neutral-900">Total Closed Leads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsLoading ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-neutral-500">Loading...</td>
                      </tr>
                    ) : executiveWiseClosedLeads.length > 0 ? (
                      executiveWiseClosedLeads.map((item, idx) => (
                        <tr key={idx} className={`border-b ${idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}`}>
                          <td className="py-2 px-3 text-neutral-900">{item.zone || 'Unassigned'}</td>
                          <td className="py-2 px-3 text-neutral-900">{item.executiveName || 'Unassigned'}</td>
                          <td className="py-2 px-3 text-right">{item.totalClosed}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-neutral-500">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </Card>
      </div>
      )}
    </div>
  )
}


