'use client'

import { Card } from '@/components/ui/card'
import { History, Clock, FileText, Sparkles } from 'lucide-react'

export default function ChangeLogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
          <History className="w-8 h-8 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Change Logs</h1>
          <p className="text-sm text-neutral-600 mt-1">Track all system changes and updates</p>
        </div>
      </div>

      <Card className="p-12 md:p-16">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
            <div className="relative p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-full">
              <Sparkles className="w-16 h-16 text-purple-600" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-neutral-900">Change Logs Coming Soon</h2>
            <p className="text-neutral-600 max-w-md mx-auto">
              We're working on bringing you a comprehensive change log system to track all updates, 
              improvements, and modifications to the CRM platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 w-full max-w-2xl">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <Clock className="w-6 h-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-blue-900 text-sm">Version History</h3>
              <p className="text-xs text-blue-700 mt-1">Track version updates</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <FileText className="w-6 h-6 text-purple-600 mb-2" />
              <h3 className="font-semibold text-purple-900 text-sm">Feature Updates</h3>
              <p className="text-xs text-purple-700 mt-1">New features & improvements</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <History className="w-6 h-6 text-green-600 mb-2" />
              <h3 className="font-semibold text-green-900 text-sm">System Changes</h3>
              <p className="text-xs text-green-700 mt-1">All system modifications</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

