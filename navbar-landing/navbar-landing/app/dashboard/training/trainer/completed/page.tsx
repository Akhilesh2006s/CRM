'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiRequest, API_BASE_URL } from '@/lib/api'
import { toast } from 'sonner'
import { Upload, Eye, FileText, Calendar } from 'lucide-react'
import { format } from 'date-fns'

type Training = {
  _id: string
  schoolName: string
  schoolCode?: string
  subject: string
  trainingDate: string
  completionDate?: string
  status: string
  feedbackPdfUrl?: string
  zone?: string
  town?: string
  trainerId: { _id: string; name: string }
  employeeId?: { _id: string; name: string }
  createdBy: { _id: string; name: string }
}

type Service = {
  _id: string
  schoolName: string
  schoolCode?: string
  subject: string
  serviceDate: string
  completionDate?: string
  status: string
  feedbackPdfUrl?: string
  zone?: string
  town?: string
  trainerId: { _id: string; name: string }
  employeeId?: { _id: string; name: string }
  createdBy: { _id: string; name: string }
}

export default function TrainerCompletedPage() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'training' | 'service'>('training')
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'training') {
        const data = await apiRequest<Training[]>('/training/trainer/completed')
        setTrainings(data)
      } else {
        const data = await apiRequest<Service[]>('/services/trainer/completed')
        setServices(data)
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (id: string, type: 'training' | 'service', file: File) => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed')
      return
    }

    setUploading(id)
    try {
      const formData = new FormData()
      formData.append('feedback', file)

      const endpoint = type === 'training' ? `/training/${id}/upload-feedback` : `/services/${id}/upload-feedback`
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null

      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to upload feedback')
      }

      const result = await response.json()
      toast.success('Feedback uploaded successfully')
      loadData()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to upload feedback')
    } finally {
      setUploading(null)
    }
  }

  const handleViewFeedback = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-2">
          Completed Training & Services (Closure + proof)
        </h1>
        <p className="text-neutral-600">
          Audit and documentation after delivery. Upload feedback PDF for completed trainings and services.
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
          Completed Trainings
        </button>
        <button
          onClick={() => setActiveTab('service')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'service'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Completed Services
        </button>
      </div>

      {loading ? (
        <Card className="p-4">Loading...</Card>
      ) : (
        <Card className="p-0 overflow-x-auto">
          {activeTab === 'training' ? (
            trainings.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">No completed trainings</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-sky-50/70 border-b text-neutral-700">
                    <th className="py-3 px-4 text-left border">Training</th>
                    <th className="py-3 px-4 text-left border">Client</th>
                    <th className="py-3 px-4 text-left border">Starting Date</th>
                    <th className="py-3 px-4 text-left border">Completion Status</th>
                    <th className="py-3 px-4 text-left border">Completion Date</th>
                    <th className="py-3 px-4 text-left border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {trainings.map((training) => (
                    <tr key={training._id} className="border-b hover:bg-neutral-50">
                      <td className="py-3 px-4 border">{training.subject}</td>
                      <td className="py-3 px-4 border">
                        {training.schoolName}
                        {training.schoolCode && ` (${training.schoolCode})`}
                      </td>
                      <td className="py-3 px-4 border">
                        {format(new Date(training.trainingDate), 'dd-MMM-yyyy')}
                      </td>
                      <td className="py-3 px-4 border">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            training.status === 'Completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {training.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 border">
                        {training.completionDate
                          ? format(new Date(training.completionDate), 'dd-MMM-yyyy')
                          : '-'}
                      </td>
                      <td className="py-3 px-4 border">
                        <div className="flex gap-2">
                          {!training.feedbackPdfUrl ? (
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleFileUpload(training._id, 'training', file)
                                  }
                                }}
                                disabled={uploading === training._id}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={uploading === training._id}
                                className="flex items-center gap-1"
                              >
                                <Upload className="w-4 h-4" />
                                {uploading === training._id ? 'Uploading...' : 'Upload Feedback PDF'}
                              </Button>
                            </label>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewFeedback(training.feedbackPdfUrl!)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View Uploaded File
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            services.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">No completed services</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-sky-50/70 border-b text-neutral-700">
                    <th className="py-3 px-4 text-left border">Service</th>
                    <th className="py-3 px-4 text-left border">Client</th>
                    <th className="py-3 px-4 text-left border">Starting Date</th>
                    <th className="py-3 px-4 text-left border">Completion Status</th>
                    <th className="py-3 px-4 text-left border">Completion Date</th>
                    <th className="py-3 px-4 text-left border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service._id} className="border-b hover:bg-neutral-50">
                      <td className="py-3 px-4 border">{service.subject}</td>
                      <td className="py-3 px-4 border">
                        {service.schoolName}
                        {service.schoolCode && ` (${service.schoolCode})`}
                      </td>
                      <td className="py-3 px-4 border">
                        {format(new Date(service.serviceDate), 'dd-MMM-yyyy')}
                      </td>
                      <td className="py-3 px-4 border">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            service.status === 'Completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {service.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 border">
                        {service.completionDate
                          ? format(new Date(service.completionDate), 'dd-MMM-yyyy')
                          : '-'}
                      </td>
                      <td className="py-3 px-4 border">
                        <div className="flex gap-2">
                          {!service.feedbackPdfUrl ? (
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleFileUpload(service._id, 'service', file)
                                  }
                                }}
                                disabled={uploading === service._id}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={uploading === service._id}
                                className="flex items-center gap-1"
                              >
                                <Upload className="w-4 h-4" />
                                {uploading === service._id ? 'Uploading...' : 'Upload Feedback PDF'}
                              </Button>
                            </label>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewFeedback(service.feedbackPdfUrl!)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View Uploaded File
                            </Button>
                          )}
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
