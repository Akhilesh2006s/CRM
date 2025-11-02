'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type DcOrder = {
  _id: string
  dc_code?: string
  school_name?: string
  school_type?: string
  contact_person?: string
  contact_mobile?: string
  email?: string
  address?: string
  location?: string
  zone?: string
  cluster?: string
  products?: Array<{ product_name: string; quantity: number }>
  assigned_to?: {
    _id: string
    name?: string
    email?: string
  }
  created_at?: string
  createdAt?: string
  remarks?: string
}

type DC = {
  _id: string
  dcOrderId?: string | DcOrder
  saleId?: {
    _id: string
    customerName?: string
    product?: string
    quantity?: number
  }
  customerName?: string
  customerPhone?: string
  product?: string
  status?: string
  poPhotoUrl?: string
  dcDate?: string
  dcRemarks?: string
  dcCategory?: string
  dcNotes?: string
  productDetails?: Array<{
    product: string
    class: string
    category: string
    productName: string
    quantity: number
    strength?: number
  }>
}

export default function ClosedSalesPage() {
  const [items, setItems] = useState<DcOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDeal, setSelectedDeal] = useState<DcOrder | null>(null)
  const [openRaiseDCDialog, setOpenRaiseDCDialog] = useState(false)
  const [openLocationDialog, setOpenLocationDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [employees, setEmployees] = useState<{ _id: string; name: string }[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  // Map to store existing DCs for each deal: dealId -> DC
  const [dealDCs, setDealDCs] = useState<Record<string, DC>>({})
  const [existingDC, setExistingDC] = useState<DC | null>(null)
  
  // Get current user to check role
  const currentUser = getCurrentUser()
  const isManager = currentUser?.role === 'Manager'
  
  // Form state for Raise DC modal
  const [dcDate, setDcDate] = useState('')
  const [dcRemarks, setDcRemarks] = useState('')
  const [dcCategory, setDcCategory] = useState('')
  const [dcNotes, setDcNotes] = useState('')
  
  // Product rows for DC (like in the Raise DC form)
  type ProductRow = {
    id: string
    product: string
    class: string
    category: string
    productName: string
    quantity: number
    strength?: number
  }
  const [productRows, setProductRows] = useState<ProductRow[]>([
    { id: '1', product: 'Abacus', class: '1', category: 'New Students', productName: '', quantity: 0, strength: 0 }
  ])
  
  const availableClasses = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  const availableCategories = ['New Students', 'Existing Students', 'Both']
  const availableProducts = ['Abacus', 'Vedic Maths', 'EELL', 'IIT', 'CodeChamp', 'Math Lab']

  const load = async () => {
    setLoading(true)
    try {
      // Try multiple statuses that might indicate closed deals
      // First try 'completed', then try all statuses to see what we have
      let data: DcOrder[] = []
      try {
        data = await apiRequest<DcOrder[]>(`/dc-orders?status=completed`)
      } catch (e) {
        // If no completed deals, try getting all deals and filter client-side
        console.log('No completed deals found, trying all deals...')
        const allDeals = await apiRequest<DcOrder[]>(`/dc-orders`)
        // Filter for deals that might be considered "closed"
        data = allDeals.filter((d: any) => 
          d.status === 'completed' || 
          d.status === 'in_transit' || 
          d.lead_status === 'Hot' ||
          d.status === 'hold'
        )
      }
      
      console.log('Loaded closed deals:', data)
      console.log('First deal sample:', data[0])
      
      // Load existing DCs for all deals
      const dcMap: Record<string, DC> = {}
      try {
        const allDealIds = data.map((d: any) => d._id)
        for (const dealId of allDealIds) {
          try {
            const dcs = await apiRequest<DC[]>(`/dc?dcOrderId=${dealId}`)
            if (dcs && dcs.length > 0) {
              // Get the most recent DC for this deal
              dcMap[dealId] = dcs[0]
            }
          } catch (e) {
            console.warn(`Failed to load DC for deal ${dealId}:`, e)
          }
        }
        setDealDCs(dcMap)
        console.log('Loaded DCs for deals:', dcMap)
      } catch (e) {
        console.warn('Failed to load DCs:', e)
      }
      
      // Ensure all deals have proper structure
      const normalizedData = data.map((deal: any) => {
        // Handle assigned_to - preserve populated object if it exists
        let assignedTo = deal.assigned_to || deal.assignedTo
        
        console.log('Processing deal:', deal.school_name)
        console.log('  - assigned_to raw:', assignedTo)
        console.log('  - assigned_to type:', typeof assignedTo)
        
        if (assignedTo) {
          if (typeof assignedTo === 'object' && assignedTo !== null && '_id' in assignedTo) {
            // Already populated, keep it
            console.log('  - Keeping populated object:', assignedTo)
            assignedTo = assignedTo
          } else if (typeof assignedTo === 'string' && assignedTo.trim() !== '') {
            // It's just an ID string - try to fetch employee name
            console.log('  - It\'s a string ID, will try to get from API')
            // Keep it as is for now, the getOne API should populate it
            assignedTo = { _id: assignedTo, name: 'Loading...' }
          } else {
            console.log('  - assigned_to is invalid, setting to undefined')
            assignedTo = undefined
          }
        } else {
          console.log('  - No assigned_to found')
          assignedTo = undefined
        }
        
        return {
          ...deal,
          school_name: deal.school_name || deal.schoolName || '',
          contact_person: deal.contact_person || deal.contactPerson || '',
          contact_mobile: deal.contact_mobile || deal.contactMobile || deal.mobile || '',
          zone: deal.zone || '',
          location: deal.location || deal.address || '',
          address: deal.address || deal.location || '',
          products: deal.products || [],
          assigned_to: assignedTo,
          school_type: deal.school_type || deal.schoolType || '',
          dc_code: deal.dc_code || deal.dcCode || '',
          remarks: deal.remarks || '',
          cluster: deal.cluster || '',
        }
      })
      
      setItems(normalizedData)
      console.log('Normalized deals:', normalizedData)
      console.log('First deal assigned_to:', normalizedData[0]?.assigned_to)
    } catch (e: any) {
      console.error('Failed to load closed deals:', e)
      alert(`Error loading deals: ${e?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Load employees for assignment dropdown
    const loadEmployees = async () => {
      try {
        const data = await apiRequest<any[]>('/employees?isActive=true')
        const list = Array.isArray(data) ? data : []
        setEmployees(list.map((u: any) => ({ _id: u._id || u.id, name: u.name || 'Unknown' })).filter(e => e.name !== 'Unknown'))
      } catch (e) {
        console.error('Failed to load employees:', e)
      }
    }
    loadEmployees()
  }, [])

  const openRaiseDC = async (deal: DcOrder) => {
    try {
      // Check if DC already exists for this deal
      const existingDCForDeal = dealDCs[deal._id]
      setExistingDC(existingDCForDeal || null)
      
      // Fetch full deal details to ensure all data is populated
      const fullDeal = await apiRequest<DcOrder>(`/dc-orders/${deal._id}`)
      console.log('Full deal data from API:', fullDeal)
      console.log('Existing DC for this deal:', existingDCForDeal)
      console.log('assigned_to from API:', fullDeal.assigned_to)
      console.log('assigned_to type:', typeof fullDeal.assigned_to)
      
      // Handle assigned_to - could be ObjectId string, populated object, or null/undefined
      let assignedTo = undefined
      
      // First check the fullDeal from API
      if (fullDeal.assigned_to) {
        if (typeof fullDeal.assigned_to === 'object' && fullDeal.assigned_to !== null && '_id' in fullDeal.assigned_to) {
          // Already populated object with _id
          if ('name' in fullDeal.assigned_to && fullDeal.assigned_to.name) {
            assignedTo = fullDeal.assigned_to
          } else {
            // Has _id but no name - might need to use from deal list
            assignedTo = deal.assigned_to || fullDeal.assigned_to
          }
        } else if (typeof fullDeal.assigned_to === 'string') {
          // It's an ObjectId string - try to get from the deal list (which should be populated)
          assignedTo = deal.assigned_to || { _id: fullDeal.assigned_to as string, name: 'Unknown' }
        }
      }
      
      // Fallback to deal's assigned_to from the list (which should be populated)
      if (!assignedTo && deal.assigned_to) {
        if (typeof deal.assigned_to === 'object' && deal.assigned_to !== null && '_id' in deal.assigned_to) {
          assignedTo = deal.assigned_to
        }
      }
      
      console.log('=== ASSIGNED TO DEBUG ===')
      console.log('fullDeal.assigned_to:', fullDeal.assigned_to)
      console.log('fullDeal.assigned_to type:', typeof fullDeal.assigned_to)
      console.log('deal.assigned_to:', deal.assigned_to)
      console.log('deal.assigned_to type:', typeof deal.assigned_to)
      console.log('Final processed assignedTo:', assignedTo)
      console.log('Has assigned employee?', !!assignedTo && typeof assignedTo === 'object' && '_id' in assignedTo && 'name' in assignedTo)
      
      // Normalize the deal data
      const normalizedDeal: DcOrder = {
        ...fullDeal,
        school_name: fullDeal.school_name || deal.school_name || '',
        school_type: fullDeal.school_type || deal.school_type || '',
        contact_person: fullDeal.contact_person || deal.contact_person || '',
        contact_mobile: fullDeal.contact_mobile || deal.contact_mobile || '',
        email: fullDeal.email || deal.email || '',
        address: fullDeal.address || deal.address || deal.location || '',
        location: fullDeal.location || deal.location || deal.address || '',
        zone: fullDeal.zone || deal.zone || '',
        cluster: fullDeal.cluster || deal.cluster || '',
        remarks: fullDeal.remarks || deal.remarks || '',
        dc_code: fullDeal.dc_code || deal.dc_code || '',
        products: fullDeal.products || deal.products || [],
        assigned_to: assignedTo,
      }
      
      setSelectedDeal(normalizedDeal)
      // Set selected employee if already assigned
      if (normalizedDeal.assigned_to && typeof normalizedDeal.assigned_to === 'object' && '_id' in normalizedDeal.assigned_to) {
        setSelectedEmployeeId(normalizedDeal.assigned_to._id)
      } else {
        setSelectedEmployeeId('')
      }
      // If DC exists, load its data; otherwise start fresh
      if (existingDCForDeal) {
        // Load full DC details to get all fields
        try {
          const fullDC = await apiRequest<DC>(`/dc/${existingDCForDeal._id}`)
          console.log('Loading existing DC data:', fullDC)
          
          setDcDate(fullDC.dcDate ? new Date(fullDC.dcDate).toISOString().split('T')[0] : '')
          setDcRemarks(fullDC.dcRemarks || '')
          setDcCategory(fullDC.dcCategory || '')
          setDcNotes(fullDC.dcNotes || '')
          
          // Load product rows from DC productDetails or DcOrder products
          if (fullDC.productDetails && Array.isArray(fullDC.productDetails) && fullDC.productDetails.length > 0) {
            setProductRows(fullDC.productDetails.map((p, idx) => ({
              id: String(idx + 1),
              product: p.product || 'Abacus',
              class: p.class || '1',
              category: p.category || 'New Students',
              productName: p.productName || '',
              quantity: p.quantity || 0,
              strength: p.strength || 0,
            })))
          } else if (normalizedDeal.products && Array.isArray(normalizedDeal.products) && normalizedDeal.products.length > 0) {
            setProductRows(normalizedDeal.products.map((p: any, idx: number) => ({
              id: String(idx + 1),
              product: p.product_name || 'Abacus',
              class: '1',
              category: 'New Students',
              productName: p.product_name || '',
              quantity: p.quantity || 0,
              strength: p.strength || 0,
            })))
          } else {
            setProductRows([{ id: '1', product: 'Abacus', class: '1', category: 'New Students', productName: '', quantity: 0, strength: 0 }])
          }
        } catch (e) {
          console.error('Failed to load existing DC:', e)
          // Fallback to empty form
          setDcDate('')
          setDcRemarks('')
          setDcCategory('')
          setDcNotes('')
          if (normalizedDeal.products && Array.isArray(normalizedDeal.products) && normalizedDeal.products.length > 0) {
            setProductRows(normalizedDeal.products.map((p: any, idx: number) => ({
              id: String(idx + 1),
              product: p.product_name || 'Abacus',
              class: '1',
              category: 'New Students',
              productName: p.product_name || '',
              quantity: p.quantity || 0,
              strength: p.strength || 0,
            })))
          } else {
            setProductRows([{ id: '1', product: 'Abacus', class: '1', category: 'New Students', productName: '', quantity: 0, strength: 0 }])
          }
        }
      } else {
        // No existing DC, start with fresh form
        setDcDate('')
        setDcRemarks('')
        setDcCategory('')
        setDcNotes('')
        // Initialize product rows from existing products in deal, or start with one empty row
        if (normalizedDeal.products && Array.isArray(normalizedDeal.products) && normalizedDeal.products.length > 0) {
          setProductRows(normalizedDeal.products.map((p: any, idx: number) => ({
            id: String(idx + 1),
            product: p.product_name || 'Abacus',
            class: '1',
            category: 'New Students',
            productName: p.product_name || '',
            quantity: p.quantity || 0,
            strength: p.strength || 0,
          })))
        } else {
          setProductRows([{ id: '1', product: 'Abacus', class: '1', category: 'New Students', productName: '', quantity: 0, strength: 0 }])
        }
      }
      setOpenRaiseDCDialog(true)
      
      console.log('Normalized deal for modal:', normalizedDeal)
      console.log('Final assigned_to in normalized deal:', normalizedDeal.assigned_to)
    } catch (e: any) {
      console.error('Failed to load full deal details:', e)
      // Fallback to using the deal data we have
      setSelectedDeal(deal)
      setOpenRaiseDCDialog(true)
      alert('Warning: Could not load full deal details. Some fields may be empty.')
    }
  }

  const openViewLocation = (deal: DcOrder) => {
    setSelectedDeal(deal)
    setOpenLocationDialog(true)
  }

  const handleSubmitToManager = async () => {
    if (!selectedDeal) return

    // Check if employee is assigned - prioritize deal's assigned employee
    let employeeId = null
    
    // First, check if deal already has an assigned employee
    if (selectedDeal.assigned_to) {
      if (typeof selectedDeal.assigned_to === 'object' && '_id' in selectedDeal.assigned_to) {
        employeeId = selectedDeal.assigned_to._id
      } else if (typeof selectedDeal.assigned_to === 'string') {
        employeeId = selectedDeal.assigned_to
      }
    }
    
    // If no employee from deal, use the selected employee from dropdown (only if deal doesn't have one)
    if (!employeeId && selectedEmployeeId) {
      employeeId = selectedEmployeeId
    }

    // Only require employee assignment if deal truly doesn't have one
    if (!employeeId) {
      alert('Please assign an employee before submitting to Manager')
      return
    }

    setSubmitting(true)
    try {
      // First, raise DC (creates or gets existing DC)
      const raisePayload: any = {
        dcOrderId: selectedDeal._id,
        dcDate: dcDate || undefined,
        dcRemarks: dcRemarks || undefined,
        dcNotes: dcNotes || undefined,
      }
      
      // Only include employeeId if deal doesn't already have one assigned (backend will use deal's assigned_to if available)
      if (!selectedDeal.assigned_to && employeeId) {
        raisePayload.employeeId = employeeId
      }

      // Calculate requested quantity from product rows
      const totalQuantity = productRows.reduce((sum, row) => sum + (row.quantity || 0), 0)
      raisePayload.requestedQuantity = totalQuantity || 1
      
      // Include product details in payload
      raisePayload.productDetails = productRows.map(row => ({
        product: row.product,
        class: row.class,
        category: row.category,
        productName: row.productName,
        quantity: row.quantity,
        strength: row.strength || 0,
      }))

      let dc: DC
      
      // If DC exists, update it; otherwise create new one
      if (existingDC) {
        // Update existing DC
        await apiRequest(`/dc/${existingDC._id}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...raisePayload,
            financeRemarks: raisePayload.financeRemarks,
            splApproval: raisePayload.splApproval,
            dcDate: raisePayload.dcDate,
            dcRemarks: raisePayload.dcRemarks,
            dcCategory: raisePayload.dcCategory,
            dcNotes: raisePayload.dcNotes,
            productDetails: raisePayload.productDetails,
          }),
        })
        dc = existingDC
      } else {
        // Create new DC
        dc = await apiRequest<DC>(`/dc/raise`, {
          method: 'POST',
          body: JSON.stringify(raisePayload),
        })
      }

      // Then submit to manager (moves to sent_to_manager, then appears in Pending DC)
      await apiRequest(`/dc/${dc._id}/submit-to-manager`, {
        method: 'POST',
        body: JSON.stringify({
          requestedQuantity: totalQuantity || 1,
          remarks: dcRemarks || dcNotes || undefined,
        }),
      })

      alert(existingDC ? 'DC updated and submitted to Manager successfully!' : 'DC created and submitted to Manager successfully! It will appear in Pending DC list.')
      setOpenRaiseDCDialog(false)
      // Reload to refresh the DC map
      load()
    } catch (e: any) {
      alert(e?.message || 'Failed to submit to Manager')
    } finally {
      setSubmitting(false)
    }
  }

  // Get products display string
  const getProductsDisplay = (deal: DcOrder) => {
    if (!deal.products || !Array.isArray(deal.products)) return '-'
    return deal.products.map(p => `${p.product_name}${p.quantity ? ` - ${p.quantity}` : ''}`).join(', ')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Closed Leads List</h1>
      
      {/* Search/Filter Section */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input placeholder="By School Name" />
          <Input placeholder="By Contact Mobile No" />
          <Input type="date" placeholder="From Date" />
          <Input type="date" placeholder="To Date" />
          <Input placeholder="Select Zone" />
          <Input placeholder="Select Executive" />
          <Input placeholder="By Town" />
          <Button className="bg-blue-600 hover:bg-blue-700">Search</Button>
        </div>
      </Card>

      <Card className="p-0 overflow-x-auto">
        {loading && <div className="p-4">Loading...</div>}
        {!loading && items.length === 0 && <div className="p-4">No closed deals found.</div>}
        {!loading && items.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sky-50/70 border-b text-neutral-700">
                <th className="py-2 px-3 text-left">Created On</th>
                <th className="py-2 px-3 text-left">School Type</th>
                <th className="py-2 px-3 text-left">Zone</th>
                <th className="py-2 px-3 text-left">Town</th>
                <th className="py-2 px-3 text-left">School Name</th>
                <th className="py-2 px-3 text-left">Executive</th>
                <th className="py-2 px-3 text-left">Mobile</th>
                <th className="py-2 px-3 text-left">Products</th>
                <th className="py-2 px-3 text-left">PO</th>
                <th className="py-2 px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d._id} className="border-b last:border-0">
                  <td className="py-2 px-3">
                    {d.created_at ? new Date(d.created_at).toLocaleString() : 
                     d.createdAt ? new Date(d.createdAt).toLocaleString() : '-'}
                  </td>
                  <td className="py-2 px-3">{d.school_type || '-'}</td>
                  <td className="py-2 px-3">{d.zone || '-'}</td>
                  <td className="py-2 px-3">{d.location || d.address?.split(',')[0] || '-'}</td>
                  <td className="py-2 px-3">{d.school_name || '-'}</td>
                  <td className="py-2 px-3">{d.assigned_to?.name || '-'}</td>
                  <td className="py-2 px-3">{d.contact_mobile || '-'}</td>
                  <td className="py-2 px-3">{getProductsDisplay(d)}</td>
                  <td className="py-2 px-3">
                    {/* PO thumbnail would go here if available */}
                    <span className="text-xs text-gray-500">-</span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex flex-col gap-1">
                      {!isManager && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => openRaiseDC(d)}
                          >
                            {dealDCs[d._id] ? 'Update DC' : 'Raise DC'}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => openViewLocation(d)}
                          >
                            View Location
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Raise DC Modal */}
      <Dialog open={openRaiseDCDialog} onOpenChange={setOpenRaiseDCDialog}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              Viswam Edutech - {existingDC ? 'Update DC' : 'Raise DC'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {existingDC ? 'Update DC details and submit to Manager' : 'Fill in DC details and submit to Manager'}
            </DialogDescription>
          </DialogHeader>
          {selectedDeal ? (
            <div className="space-y-6 py-4">
              {/* Debug info - remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <strong>Debug:</strong> School: {selectedDeal.school_name || 'EMPTY'}, Contact: {selectedDeal.contact_person || 'EMPTY'}, Products: {selectedDeal.products?.length || 0}
                </div>
              )}
              {/* Lead Information and More Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lead Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Lead Information</h3>
                  <div>
                    <Label>School Type</Label>
                    <Input 
                      value={selectedDeal.school_type || ''} 
                      disabled 
                      className="bg-gray-100 text-gray-900" 
                      placeholder="School Type"
                    />
                  </div>
                  <div>
                    <Label>School Name</Label>
                    <Input 
                      value={selectedDeal.school_name || ''} 
                      disabled 
                      className="bg-gray-100 text-gray-900" 
                      placeholder="School Name"
                    />
                  </div>
                  <div>
                    <Label>School Code</Label>
                    <Input 
                      value={selectedDeal.dc_code || ''} 
                      disabled 
                      className="bg-gray-100 text-gray-900" 
                      placeholder="School Code"
                    />
                  </div>
                  <div>
                    <Label>Contact Person Name</Label>
                    <Input 
                      value={selectedDeal.contact_person || ''} 
                      disabled 
                      className="bg-gray-100 text-gray-900" 
                      placeholder="Contact Person Name"
                    />
                  </div>
                  <div>
                    <Label>Contact Mobile</Label>
                    <Input 
                      value={selectedDeal.contact_mobile || ''} 
                      disabled 
                      className="bg-gray-100 text-gray-900" 
                      placeholder="Contact Mobile"
                    />
                  </div>
                  <div>
                    <Label>Assigned To</Label>
                    {(() => {
                      // Check if deal has assigned employee - be more lenient with the check
                      const assignedTo = selectedDeal.assigned_to
                      
                      // Check if we have a valid assigned employee
                      let hasAssignedEmployee = false
                      let employeeName = ''
                      
                      if (assignedTo) {
                        if (typeof assignedTo === 'object' && assignedTo !== null) {
                          // It's an object - check if it has name or _id
                          if ('name' in assignedTo && assignedTo.name) {
                            hasAssignedEmployee = true
                            employeeName = String(assignedTo.name)
                          } else if ('_id' in assignedTo) {
                            // Has _id but might not have name - still consider it assigned
                            hasAssignedEmployee = true
                            employeeName = 'Employee (ID: ' + String(assignedTo._id) + ')'
                          }
                        } else if (typeof assignedTo === 'string') {
                          // It's a string ID - not ideal but if it exists, try to find name
                          hasAssignedEmployee = false // Will show dropdown but pre-select
                        }
                      }
                      
                      console.log('Modal - assignedTo:', assignedTo)
                      console.log('Modal - hasAssignedEmployee:', hasAssignedEmployee)
                      console.log('Modal - employeeName:', employeeName)
                      
                      if (hasAssignedEmployee && employeeName) {
                        // Show assigned employee name (read-only)
                        return (
                          <Input 
                            value={employeeName} 
                            disabled 
                            className="bg-gray-100 text-gray-900" 
                            placeholder="Assigned To"
                          />
                        )
                      } else {
                        // Show dropdown if no employee is assigned
                        return (
                          <>
                            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId} required>
                              <SelectTrigger className="bg-white text-gray-900">
                                <SelectValue placeholder="Select Employee *" />
                              </SelectTrigger>
                              <SelectContent>
                                {employees.length === 0 ? (
                                  <div className="px-2 py-1.5 text-sm text-gray-500">Loading employees...</div>
                                ) : (
                                  employees.map((emp) => (
                                    <SelectItem key={emp._id} value={emp._id}>
                                      {emp.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            {!selectedEmployeeId && (
                              <p className="text-xs text-red-500 mt-1">Please assign an employee to continue</p>
                            )}
                          </>
                        )
                      }
                    })()}
                  </div>
                </div>

                {/* More Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">More Information</h3>
                  <div>
                    <Label>Town</Label>
                    <Input 
                      value={selectedDeal.location || selectedDeal.address?.split(',')[0] || ''} 
                      disabled 
                      className="bg-gray-100 text-gray-900" 
                      placeholder="Town"
                    />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Textarea 
                      value={selectedDeal.address || selectedDeal.location || ''} 
                      disabled 
                      className="bg-gray-100 text-gray-900" 
                      rows={3} 
                      placeholder="Address"
                    />
                  </div>
                  <div>
                    <Label>Zone</Label>
                    <Input 
                      value={selectedDeal.zone || ''} 
                      disabled 
                      className="bg-gray-100 text-gray-900" 
                      placeholder="Zone"
                    />
                  </div>
                  <div>
                    <Label>Cluster</Label>
                    <Input 
                      value={selectedDeal.cluster || ''} 
                      disabled 
                      className="bg-gray-100 text-gray-900" 
                      placeholder="Cluster"
                    />
                  </div>
                  <div>
                    <Label>Remarks</Label>
                    <Textarea 
                      value={selectedDeal.remarks || ''} 
                      disabled 
                      className="bg-gray-100 text-gray-900" 
                      rows={2} 
                      placeholder="Remarks"
                    />
                  </div>
                </div>
              </div>

              {/* Products Table - Where quantities are added */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-lg font-semibold text-gray-900">Products & Quantities</Label>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      setProductRows([...productRows, {
                        id: Date.now().toString(),
                        product: 'Abacus',
                        class: '1',
                        category: 'New Students',
                        productName: '',
                        quantity: 0,
                        strength: 0
                      }])
                    }}
                  >
                    (+) Add
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="py-2 px-3 text-left border-r text-gray-900">Product</th>
                        <th className="py-2 px-3 text-left border-r text-gray-900">Class</th>
                        <th className="py-2 px-3 text-left border-r text-gray-900">Category</th>
                        <th className="py-2 px-3 text-left border-r text-gray-900">Product Name</th>
                        <th className="py-2 px-3 text-left border-r text-gray-900">Qty</th>
                        <th className="py-2 px-3 text-left text-gray-900">Strength</th>
                        <th className="py-2 px-3 text-center text-gray-900">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productRows.map((row, idx) => (
                        <tr key={row.id} className="border-b bg-white">
                          <td className="py-2 px-3 border-r">
                            <Select value={row.product} onValueChange={(v) => {
                              const updated = [...productRows]
                              updated[idx].product = v
                              setProductRows(updated)
                            }}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableProducts.map(p => (
                                  <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-2 px-3 border-r">
                            <Select value={row.class} onValueChange={(v) => {
                              const updated = [...productRows]
                              updated[idx].class = v
                              setProductRows(updated)
                            }}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableClasses.map(c => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-2 px-3 border-r">
                            <Select value={row.category} onValueChange={(v) => {
                              const updated = [...productRows]
                              updated[idx].category = v
                              setProductRows(updated)
                            }}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableCategories.map(cat => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-2 px-3 border-r">
                            <Input
                              type="text"
                              className="h-8 text-xs"
                              value={row.productName}
                              onChange={(e) => {
                                const updated = [...productRows]
                                updated[idx].productName = e.target.value
                                setProductRows(updated)
                              }}
                              placeholder="Select Item"
                            />
                          </td>
                          <td className="py-2 px-3 border-r">
                            <Input
                              type="number"
                              className="h-8 text-xs"
                              value={row.quantity || ''}
                              onChange={(e) => {
                                const updated = [...productRows]
                                updated[idx].quantity = Number(e.target.value) || 0
                                setProductRows(updated)
                              }}
                              placeholder="0"
                              min="0"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              className="h-8 text-xs"
                              value={row.strength || ''}
                              onChange={(e) => {
                                const updated = [...productRows]
                                updated[idx].strength = Number(e.target.value) || 0
                                setProductRows(updated)
                              }}
                              placeholder="Enter Strength"
                              min="0"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            {productRows.length > 1 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                onClick={() => {
                                  setProductRows(productRows.filter((_, i) => i !== idx))
                                }}
                              >
                                ×
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DC Details */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-gray-900">DC Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>DC Date</Label>
                    <Input
                      type="date"
                      value={dcDate}
                      onChange={(e) => setDcDate(e.target.value)}
                      placeholder="mm/dd/yyyy"
                    />
                  </div>
                  <div>
                    <Label>DC Category</Label>
                    <Select value={dcCategory} onValueChange={setDcCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select DC Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Term 1">Term 1</SelectItem>
                        <SelectItem value="Term 2">Term 2</SelectItem>
                        <SelectItem value="Both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>DC Remarks</Label>
                    <Input
                      value={dcRemarks}
                      onChange={(e) => setDcRemarks(e.target.value)}
                      placeholder="Remarks"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>DC Notes</Label>
                    <Textarea
                      value={dcNotes}
                      onChange={(e) => setDcNotes(e.target.value)}
                      placeholder="Notes"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center border-t pt-4">
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="bg-red-600 text-white hover:bg-red-700"
                    onClick={() => window.print()}
                  >
                    Print
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      // Save without submitting (optional feature)
                      alert('Save functionality can be implemented to save draft')
                    }}
                  >
                    Save
                  </Button>
                </div>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleSubmitToManager}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit to Manager'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>Loading deal details...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Location Modal */}
      <Dialog open={openLocationDialog} onOpenChange={setOpenLocationDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>View Location</DialogTitle>
            <DialogDescription>
              Location details for {selectedDeal?.school_name || 'this deal'}
            </DialogDescription>
          </DialogHeader>
          {selectedDeal && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Address</Label>
                <Textarea value={selectedDeal.address || selectedDeal.location || 'N/A'} disabled rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Zone</Label>
                  <Input value={selectedDeal.zone || '-'} disabled />
                </div>
                <div>
                  <Label>Location/Town</Label>
                  <Input value={selectedDeal.location || '-'} disabled />
                </div>
              </div>
              {selectedDeal.address && (
                <div>
                  <Label>Map</Label>
                  <div className="mt-2 p-4 bg-gray-100 rounded text-center text-sm text-gray-500">
                    Map view would be integrated here
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenLocationDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}