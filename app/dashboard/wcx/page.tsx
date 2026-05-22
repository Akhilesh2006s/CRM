'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

type WcxExposure = {
  exposure_id: string
  vehicle_id: string
  vin: string
  model: string
  variant_id: string
  branch_id: string
  ageing_bucket: string
  risk_tag: string
  inventory_status: string
  facility_id: string
  working_capital_locked_inr: number
  interest_exposure_inr: number
  mrp_inr: number
  cost_price_inr: number
  recommended_discount_pct: number
  recommended_discount_inr: number
  recommended_price_inr: number
  margin_pct_after_discount: number
  critical_flag?: string
}

export default function WcxPage() {
  const [items, setItems] = useState<WcxExposure[]>([])
  const [loading, setLoading] = useState(true)
  const [modelFilter, setModelFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (modelFilter) params.append('model', modelFilter)
      if (riskFilter) params.append('risk_tag', riskFilter)
      if (branchFilter) params.append('branch_id', branchFilter)
      params.append('limit', '200')

      const data = await apiRequest<WcxExposure[]>(`/wcx?${params.toString()}`)
      setItems(data)
    } catch (e) {
      console.error('Failed to load WCX exposures', e)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const models = Array.from(new Set(items.map((i) => i.model))).sort()
  const branches = Array.from(new Set(items.map((i) => i.branch_id))).sort()

  const summary = {
    total: items.length,
    workingCapital: items.reduce((s, i) => s + (i.working_capital_locked_inr || 0), 0),
    interestExposure: items.reduce((s, i) => s + (i.interest_exposure_inr || 0), 0),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">WCX After Discounting</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Live working-capital exposure and recommended pricing for each VIN imported from Lakshmi Hyundai seed.
        </p>
      </div>

      <Card className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 items-end">
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Model</label>
            <Select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
            >
              <option value="">All models</option>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Risk Tag</label>
            <Select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Branch</label>
            <Select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={load}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors w-full"
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
            <button
              onClick={() => {
                setModelFilter('')
                setRiskFilter('')
                setBranchFilter('')
                load()
              }}
              className="hidden md:inline-flex items-center justify-center px-4 py-2 rounded-md border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-xs text-neutral-500">Vehicles in scope</div>
            <div className="text-xl font-semibold text-neutral-900">{summary.total}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Working Capital Locked (₹)</div>
            <div className="text-xl font-semibold text-neutral-900">
              {summary.workingCapital.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Interest Exposure (₹)</div>
            <div className="text-xl font-semibold text-neutral-900">
              {summary.interestExposure.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="min-w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b bg-neutral-50 text-neutral-600">
                <th className="px-3 py-2 text-left">VIN</th>
                <th className="px-3 py-2 text-left">Model / Variant</th>
                <th className="px-3 py-2 text-left">Branch</th>
                <th className="px-3 py-2 text-left">Ageing</th>
                <th className="px-3 py-2 text-left">Risk</th>
                <th className="px-3 py-2 text-right">MRP</th>
                <th className="px-3 py-2 text-right">Cost</th>
                <th className="px-3 py-2 text-right">Reco Disc %</th>
                <th className="px-3 py-2 text-right">Reco Price</th>
                <th className="px-3 py-2 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-center text-neutral-500">
                    No vehicles found for the selected filters.
                  </td>
                </tr>
              )}
              {items.map((i) => (
                <tr
                  key={i.exposure_id}
                  className="border-b last:border-0 hover:bg-neutral-50/60 transition-colors"
                >
                  <td className="px-3 py-2 font-mono text-[11px] md:text-xs text-neutral-700">{i.vin}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-neutral-900">{i.model}</div>
                    <div className="text-[11px] text-neutral-500">{i.variant_id}</div>
                  </td>
                  <td className="px-3 py-2 text-neutral-700">{i.branch_id}</td>
                  <td className="px-3 py-2 text-neutral-700">{i.ageing_bucket}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        i.risk_tag === 'Critical'
                          ? 'bg-red-100 text-red-700'
                          : i.risk_tag === 'High'
                          ? 'bg-amber-100 text-amber-700'
                          : i.risk_tag === 'Medium'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {i.risk_tag}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {i.mrp_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {i.cost_price_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {(i.recommended_discount_pct * 100).toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right">
                    {i.recommended_price_inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {(i.margin_pct_after_discount * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

