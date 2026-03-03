'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'
import { GraduationCap, CheckCircle2, Clock, XCircle, TrendingUp, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Stats = {
  total: number
  byStatus: { Scheduled: number; Completed: number; Cancelled: number }
  zoneStats: { _id: string; total: number; completed: number }[]
  subjectStats: { _id: string; total: number; completed: number }[]
}

type ServiceStats = Stats

export default function TrainingPage() {
  const [trainingStats, setTrainingStats] = useState<Stats | null>(null)
  const [serviceStats, setServiceStats] = useState<ServiceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const [tStats, sStats] = await Promise.all([
        apiRequest<Stats>('/training/stats'),
        apiRequest<ServiceStats>('/services/stats'),
      ])
      setTrainingStats(tStats)
      setServiceStats(sStats)
    } catch (e) {
      console.error('Failed to load stats', e)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, subtitle, bgColor }: { title: string; value: number; icon: any; color: string; subtitle?: string; bgColor?: string }) => {
    // Map bgColor to gradient and border colors
    const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
      'bg-blue-100': { bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-500' },
      'bg-yellow-100': { bg: 'from-amber-50 to-amber-100', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500' },
      'bg-green-100': { bg: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500' },
      'bg-orange-100': { bg: 'from-orange-50 to-orange-100', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-500' },
    }
    const colors = colorMap[bgColor || 'bg-blue-100'] || colorMap['bg-blue-100']
    
    return (
      <Card className={`p-5 bg-gradient-to-br ${colors.bg} border-2 ${colors.border} shadow-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-xs font-semibold ${colors.text} mb-1 uppercase`}>{title}</div>
            <div className={`text-2xl font-bold ${colors.text.replace('700', '900')}`}>{value.toLocaleString()}</div>
            {subtitle && <div className={`text-xs ${colors.text.replace('700', '600')} mt-1`}>{subtitle}</div>}
          </div>
          <Icon className={`w-8 h-8 ${colors.icon}`} />
        </div>
      </Card>
    )
  }

  if (loading) {
    return <div className="space-y-6"><h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Trainings & Services</h1><Card className="p-4">Loading...</Card></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Trainings & Services Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/training/assign">
            <Button>Assign Training/Service</Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Trainings"
          value={trainingStats?.total || 0}
          icon={GraduationCap}
          color="text-blue-600"
          bgColor="bg-blue-100"
          subtitle={`${trainingStats?.byStatus.Completed || 0} completed`}
        />
        <StatCard
          title="Pending Trainings"
          value={trainingStats?.byStatus.Scheduled || 0}
          icon={Clock}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
        />
        <StatCard
          title="Total Services"
          value={serviceStats?.total || 0}
          icon={CheckCircle2}
          color="text-green-600"
          bgColor="bg-green-100"
          subtitle={`${serviceStats?.byStatus.Completed || 0} completed`}
        />
        <StatCard
          title="Pending Services"
          value={serviceStats?.byStatus.Scheduled || 0}
          icon={Clock}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
      </div>

      {/* Training Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5" /> Training Status
            </h2>
            <Link href="/dashboard/training/list">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Completed</span>
              </div>
              <span className="font-bold text-green-600">{trainingStats?.byStatus.Completed || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium">Scheduled</span>
              </div>
              <span className="font-bold text-yellow-600">{trainingStats?.byStatus.Scheduled || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium">Cancelled</span>
              </div>
              <span className="font-bold text-red-600">{trainingStats?.byStatus.Cancelled || 0}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Service Status
            </h2>
            <Link href="/dashboard/training/services">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Completed</span>
              </div>
              <span className="font-bold text-green-600">{serviceStats?.byStatus.Completed || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium">Scheduled</span>
              </div>
              <span className="font-bold text-yellow-600">{serviceStats?.byStatus.Scheduled || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium">Cancelled</span>
              </div>
              <span className="font-bold text-red-600">{serviceStats?.byStatus.Cancelled || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Subject-wise Distribution */}
      {trainingStats?.subjectStats && trainingStats.subjectStats.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" /> Training by Subject
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trainingStats.subjectStats.map((subj) => (
              <div key={subj._id} className="p-4 bg-neutral-50 rounded-lg">
                <p className="font-medium text-neutral-900 mb-2">{subj._id}</p>
                <p className="text-2xl font-bold text-blue-600">{subj.total}</p>
                <p className="text-xs text-neutral-500 mt-1">{subj.completed} completed</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Zone-wise Distribution */}
      {trainingStats?.zoneStats && trainingStats.zoneStats.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Training by Zone
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Zone</th>
                  <th className="text-right py-2 px-3">Total</th>
                  <th className="text-right py-2 px-3">Completed</th>
                  <th className="text-right py-2 px-3">Completion %</th>
                </tr>
              </thead>
              <tbody>
                {trainingStats.zoneStats.slice(0, 10).map((zone) => (
                  <tr key={zone._id} className="border-b last:border-0">
                    <td className="py-2 px-3 font-medium">{zone._id || 'N/A'}</td>
                    <td className="py-2 px-3 text-right">{zone.total}</td>
                    <td className="py-2 px-3 text-right text-green-600">{zone.completed}</td>
                    <td className="py-2 px-3 text-right">
                      {zone.total > 0 ? Math.round((zone.completed / zone.total) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/dashboard/training/trainers/new">
            <Button variant="outline" className="w-full">Add Trainer</Button>
          </Link>
          <Link href="/dashboard/training/trainers/active">
            <Button variant="outline" className="w-full">Active Trainers</Button>
          </Link>
          <Link href="/dashboard/training/dashboard">
            <Button variant="outline" className="w-full">Trainers Dashboard</Button>
          </Link>
          <Link href="/dashboard/training/assign">
            <Button variant="outline" className="w-full">Assign Training</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}


