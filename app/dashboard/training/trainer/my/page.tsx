'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiRequest, API_BASE_URL } from '@/lib/api'
import { toast } from 'sonner'
import { Calendar, MapPin, User, CheckCircle2, Download, Eye } from 'lucide-react'
import { format } from 'date-fns'

type Training = {
  _id: string
  schoolName: string
  schoolCode?: string
  subject: string
  term?: string
  trainingDate: string
  trainingLevel?: string
  zone?: string
  town?: string
  attendanceDate?: string
  trainerId: { _id: string; name: string }
  employeeId?: { _id: string; name: string }
  createdBy: { _id: string; name: string }
}

type Service = {
  _id: string
  schoolName: string
  schoolCode?: string
  subject: string
  term?: string
  serviceDate: string
  zone?: string
  town?: string
  attendanceDate?: string
  trainerId: { _id: string; name: string }
  employeeId?: { _id: string; name: string }
  createdBy: { _id: string; name: string }
}

export default function TrainerMyTrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'training' | 'service'>('training')

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'training') {
        const data = await apiRequest<Training[]>('/training/trainer/my')
        setTrainings(data)
      } else {
        const data = await apiRequest<Service[]>('/services/trainer/my')
        setServices(data)
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAttendance = async (id: string, type: 'training' | 'service') => {
    try {
      const endpoint = type === 'training' ? `/training/${id}/mark-attendance` : `/services/${id}/mark-attendance`
      await apiRequest(endpoint, { method: 'POST' })
      toast.success('Attendance marked successfully')
      loadData()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to mark attendance')
    }
  }

  const handleMarkCompleted = async (id: string, type: 'training' | 'service') => {
    try {
      const endpoint = type === 'training' ? `/training/${id}/complete` : `/services/${id}/complete`
      await apiRequest(endpoint, { method: 'POST' })
      toast.success('Marked as completed successfully')
      loadData()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to mark as completed')
    }
  }

  const isToday = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isAttendanceMarked = (item: Training | Service) => {
    if (!item.attendanceDate) return false
    const attendanceDate = new Date(item.attendanceDate)
    const today = new Date()
    return attendanceDate.toDateString() === today.toDateString()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-2">
          Training & Services (Active / Upcoming work)
        </h1>
        <p className="text-neutral-600">
          View trainings and services assigned to you by Admin / Training Manager
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('training')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'training'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Trainings
        </button>
        <button
          onClick={() => setActiveTab('service')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'service'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Services
        </button>
      </div>

      {loading ? (
        <Card className="p-4">Loading...</Card>
      ) : (
        <Card className="p-0 overflow-x-auto">
          {activeTab === 'training' ? (
            trainings.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">No trainings assigned</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-sky-50/70 border-b text-neutral-700">
                    <th className="py-3 px-4 text-left border">Product</th>
                    <th className="py-3 px-4 text-left border">Term</th>
                    <th className="py-3 px-4 text-left border">Training Date</th>
                    <th className="py-3 px-4 text-left border">Training Level</th>
                    <th className="py-3 px-4 text-left border">School</th>
                    <th className="py-3 px-4 text-left border">Zone</th>
                    <th className="py-3 px-4 text-left border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {trainings.map((training) => (
                    <tr key={training._id} className="border-b hover:bg-neutral-50">
                      <td className="py-3 px-4 border">{training.subject}</td>
                      <td className="py-3 px-4 border">{training.term || '-'}</td>
                      <td className="py-3 px-4 border">
                        {format(new Date(training.trainingDate), 'dd-MMM-yyyy')}
                      </td>
                      <td className="py-3 px-4 border">{training.trainingLevel || '-'}</td>
                      <td className="py-3 px-4 border">
                        {training.schoolName}
                        {training.schoolCode && ` (${training.schoolCode})`}
                      </td>
                      <td className="py-3 px-4 border">{training.zone || '-'}</td>
                      <td className="py-3 px-4 border">
                        <div className="flex gap-2">
                          {isToday(training.trainingDate) && !isAttendanceMarked(training) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAttendance(training._id, 'training')}
                            >
                              Mark Attendance
                            </Button>
                          )}
                          {isAttendanceMarked(training) && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Attendance Marked
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkCompleted(training._id, 'training')}
                          >
                            Mark as Completed
                          </Button>
                          <Button size="sm" variant="ghost" title="View Details">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Download Materials">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            services.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">No services assigned</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-sky-50/70 border-b text-neutral-700">
                    <th className="py-3 px-4 text-left border">Product</th>
                    <th className="py-3 px-4 text-left border">Term</th>
                    <th className="py-3 px-4 text-left border">Service Date</th>
                    <th className="py-3 px-4 text-left border">School</th>
                    <th className="py-3 px-4 text-left border">Zone</th>
                    <th className="py-3 px-4 text-left border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service._id} className="border-b hover:bg-neutral-50">
                      <td className="py-3 px-4 border">{service.subject}</td>
                      <td className="py-3 px-4 border">{service.term || '-'}</td>
                      <td className="py-3 px-4 border">
                        {format(new Date(service.serviceDate), 'dd-MMM-yyyy')}
                      </td>
                      <td className="py-3 px-4 border">
                        {service.schoolName}
                        {service.schoolCode && ` (${service.schoolCode})`}
                      </td>
                      <td className="py-3 px-4 border">{service.zone || '-'}</td>
                      <td className="py-3 px-4 border">
                        <div className="flex gap-2">
                          {isToday(service.serviceDate) && !isAttendanceMarked(service) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAttendance(service._id, 'service')}
                            >
                              Mark Attendance
                            </Button>
                          )}
                          {isAttendanceMarked(service) && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Attendance Marked
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkCompleted(service._id, 'service')}
                          >
                            Mark as Completed
                          </Button>
                          <Button size="sm" variant="ghost" title="View Details">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Download Materials">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </Card>
      )}
    </div>
  )
}
