'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Package, Plus, Upload, X } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { toast } from 'sonner'

type DC = {
  _id: string
  saleId?: {
    _id: string
    customerName?: string
    product?: string
    quantity?: number
  }
  dcOrderId?: {
    _id: string
    school_name?: string
    contact_person?: string
    contact_mobile?: string
    email?: string
    products?: any
    status?: string // Status of the DcOrder (e.g., 'saved' for closed leads)
    school_type?: string // 'Existing' for renewal leads, otherwise 'New School'
  }
  customerName?: string
  customerPhone?: string
  product?: string
  status?: string
  poPhotoUrl?: string
  createdAt?: string
  productDetails?: any[]
  _isConvertedLead?: boolean // Flag to indicate this is a converted lead (saved DcOrder)
}

export default function ClientDCPage() {
  const currentUser = getCurrentUser()
  const [items, setItems] = useState<DC[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDC, setSelectedDC] = useState<DC | null>(null)
  
  // Client DC Dialog (Full DC Management)
  const [clientDCDialogOpen, setClientDCDialogOpen] = useState(false)
  const [dcProductRows, setDcProductRows] = useState<Array<{
    id: string
    product: string
    class: string
    category: string
    quantity: number
    strength: number
    price: number
    total: number
    level: string
  }>>([])
  const [dcDate, setDcDate] = useState('')
  const [dcRemarks, setDcRemarks] = useState('')
  const [dcCategory, setDcCategory] = useState('')
  const [dcNotes, setDcNotes] = useState('')
  const [dcPoPhotoUrl, setDcPoPhotoUrl] = useState('')
  const [savingClientDC, setSavingClientDC] = useState(false)
  
  const availableProducts = ['Abacus', 'Vedic Maths', 'EEL', 'IIT', 'Financial literacy', 'Brain bytes', 'Spelling bee', 'Skill pro', 'Maths lab', 'Codechamp']
  // Product levels mapping based on requirements
  const productLevels: Record<string, string[]> = {
    'Abacus': ['L1', 'L2'],
    'Vedic Maths': ['L1', 'L2'],
    'EEL': ['L1'],
    'IIT': ['L1'],
    'Codechamp': ['L1'],
    'Maths lab': ['L1'],
    'Financial literacy': ['L1'],
    'Brain bytes': ['L1'],
    'Skill pro': ['L1'],
    'Spelling bee': ['L1'],
  }
  // Get available levels for a specific product, default to L1 if product not found
  const getAvailableLevels = (product: string): string[] => {
    return productLevels[product] || ['L1']
  }
  // Get default level for a product (first level in the array, usually L1)
  const getDefaultLevel = (product: string): string => {
    const levels = getAvailableLevels(product)
    return levels[0] || 'L1'
  }
  const availableClasses = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  const availableCategories = ['New Students', 'Existing Students', 'Both']
  const availableDCCategories = ['Term 1', 'Term 2', 'Term 3', 'Full Year']

  const load = async () => {
    setLoading(true)
    try {
      // Load all DCs (clients) for the employee - including closed leads (saved DcOrders)
      const data = await apiRequest<DC[]>(`/dc/employee/my`)
      console.log('Loaded clients (all):', data)
      
      // Filter: Show ALL closed leads (anything with dcOrderId) and clients with products
      // The backend already filters for this employee's clients, so we show:
      // 1. ALL items with dcOrderId (these are from closed leads) - show them all
      // 2. Clients with products added and submitted (for backward compatibility)
      const filteredClients = data.filter((dc: DC) => {
        // If it has a dcOrderId, it's from a closed lead - show it
        const hasDcOrderId = dc.dcOrderId && typeof dc.dcOrderId === 'object'
        
        if (hasDcOrderId) {
          console.log('Including closed lead:', dc.customerName || dc.dcOrderId?.school_name, {
            _isConvertedLead: dc._isConvertedLead,
            dcOrderIdStatus: dc.dcOrderId?.status,
            dcStatus: dc.status,
            hasDcOrderId: true
          })
          return true
        }
        
        // For DCs without dcOrderId (from Sale), check if client has productDetails with at least one valid product
        // A valid product must have: product name, and either price or strength > 0
        const hasProducts = dc.productDetails && 
                           Array.isArray(dc.productDetails) && 
                           dc.productDetails.length > 0 &&
                           dc.productDetails.some((p: any) => {
                             return p && 
                                    p.product && 
                                    p.product.trim() !== '' && 
                                    (Number(p.price) > 0 || Number(p.strength) > 0)
                           })
        
        // Check if products have been submitted (status indicates submission after adding products)
        // Status 'sent_to_manager' means products were added and submitted
        // Status 'po_submitted' means PO was submitted (products should already be added)
        // Other statuses like 'pending_dc', 'warehouse_processing', 'completed' also indicate submission
        const isSubmitted = dc.status === 'sent_to_manager' || 
                           dc.status === 'po_submitted' || 
                           dc.status === 'pending_dc' ||
                           dc.status === 'warehouse_processing' ||
                           dc.status === 'completed'
        
        // Show if products exist AND have been submitted
        if (hasProducts && isSubmitted) {
          console.log('Including client with products:', dc.customerName, { status: dc.status, hasProducts })
        }
        return hasProducts && isSubmitted
      })
      
      console.log('Filtered clients (closed leads + with products):', filteredClients)
      setItems(filteredClients)
    } catch (e: any) {
      console.error('Failed to load DCs:', e)
      toast.error(`Error loading DCs: ${e?.message || 'Unknown error'}`)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openClientDCDialog = async (dc: DC) => {
    setSelectedDC(dc)
    
    // Determine category automatically based on school_type from dcOrderId
    // If school_type is 'Existing', it's a renewal/existing school, otherwise it's a new school
    const autoCategory = dc.dcOrderId && typeof dc.dcOrderId === 'object' && dc.dcOrderId.school_type === 'Existing'
      ? 'Existing School'
      : 'New School'
    
    // Load full DC details
    try {
      const fullDC = await apiRequest<any>(`/dc/${dc._id}`)
      
      // Load existing product details - only show products that were added via "Add Products"
      if (fullDC.productDetails && Array.isArray(fullDC.productDetails) && fullDC.productDetails.length > 0) {
        // Only show products that were actually added (have product name and details)
        const addedProducts = fullDC.productDetails.filter((p: any) => p.product && (p.price > 0 || p.strength > 0))
        if (addedProducts.length > 0) {
          console.log('Loading products for Client DC:', JSON.stringify(addedProducts, null, 2))
          setDcProductRows(addedProducts.map((p: any, idx: number) => {
            // Read values directly - preserve 0 values, only default if null/undefined
            const priceNum = p.price !== null && p.price !== undefined ? Number(p.price) : 0
            const strengthNum = p.strength !== null && p.strength !== undefined ? Number(p.strength) : 0
            const quantityNum = p.quantity !== null && p.quantity !== undefined ? Number(p.quantity) : strengthNum
            const totalNum = p.total !== null && p.total !== undefined && p.total !== 0
              ? Number(p.total)
              : (priceNum * strengthNum)
            
            const row = {
              id: String(idx + 1),
              product: p.product || '',
              class: p.class || '1',
              category: autoCategory, // Use auto-determined category
              quantity: quantityNum,
              strength: strengthNum,
              price: priceNum,
              total: totalNum,
              level: p.level || getDefaultLevel(p.product || 'Abacus'),
            }
            console.log(`Client DC Product ${idx + 1}:`, {
              raw: { price: p.price, total: p.total, strength: p.strength },
              converted: { price: priceNum, total: totalNum, strength: strengthNum },
            })
            return row
          }))
        } else {
          // No products added yet - show empty state
          setDcProductRows([])
        }
      } else {
        // No productDetails at all - show empty state
        setDcProductRows([])
      }
      
      // Load DC details
      setDcDate(fullDC.dcDate ? new Date(fullDC.dcDate).toISOString().split('T')[0] : '')
      setDcRemarks(fullDC.dcRemarks || '')
      setDcCategory(fullDC.dcCategory || '')
      setDcNotes(fullDC.dcNotes || '')
      setDcPoPhotoUrl(fullDC.poPhotoUrl || '')
    } catch (e) {
      console.error('Failed to load DC details:', e)
      // Initialize with empty state - no products until added via "Add Products"
      setDcProductRows([])
      setDcDate('')
      setDcRemarks('')
      setDcCategory('')
      setDcNotes('')
      setDcPoPhotoUrl(dc.poPhotoUrl || '')
    }
    
    setClientDCDialogOpen(true)
  }

  const saveClientDC = async () => {
    if (!selectedDC) return

    // Allow saving even if no products - products can be added directly in this dialog
    // But if products are present, validate them
    if (dcProductRows.length > 0) {

      // Validate products
      const invalidProducts = dcProductRows.filter(p => !p.product || !p.quantity || !p.strength)
      if (invalidProducts.length > 0) {
        toast.error('Please fill in Product, Quantity, and Strength for all products')
        return
      }
    }

    setSavingClientDC(true)
    try {
      // Prepare product details - only include products that were added
      // Save ALL fields exactly as entered by employee - this will appear in Closed Sales
      const productDetails = dcProductRows.length > 0 
        ? dcProductRows.map(row => {
            const savedProduct = {
              product: row.product || '',
              class: row.class || '1',
              category: row.category || 'New School', // Auto-determined category
              quantity: Number(row.quantity) || 0,
              strength: Number(row.strength) || 0,
              price: Number(row.price) || 0,
              total: Number(row.total) || (Number(row.price) || 0) * (Number(row.strength) || 0), // Calculate if missing
              level: row.level || getDefaultLevel(row.product || 'Abacus'),
            }
            console.log('Saving product from Client DC:', savedProduct)
            return savedProduct
          })
        : undefined // Don't update productDetails if no products in this dialog

      const totalQuantity = dcProductRows.length > 0 
        ? dcProductRows.reduce((sum, p) => sum + (p.quantity || 0), 0)
        : undefined

      // Update DC with all details
      const updatePayload: any = {
        dcDate: dcDate || undefined,
        dcRemarks: dcRemarks || undefined,
        dcCategory: dcCategory || undefined,
        dcNotes: dcNotes || undefined,
        status: 'sent_to_manager', // Submit to closed sales for coordinator/admin verification
      }

      // Only update productDetails if products were modified in this dialog
      // Otherwise, keep the existing productDetails from "Add Products"
      if (productDetails !== undefined) {
        updatePayload.productDetails = productDetails
      }
      if (totalQuantity !== undefined) {
        updatePayload.requestedQuantity = totalQuantity
      }

      // Update PO photo if provided
      if (dcPoPhotoUrl) {
        updatePayload.poPhotoUrl = dcPoPhotoUrl
        updatePayload.poDocument = dcPoPhotoUrl
      }

      await apiRequest(`/dc/${selectedDC._id}`, {
        method: 'PUT',
        body: JSON.stringify(updatePayload),
      })

      // If PO photo is provided and status is created, also submit PO
      if (dcPoPhotoUrl && selectedDC.status === 'created') {
        try {
          await apiRequest(`/dc/${selectedDC._id}/submit-po`, {
            method: 'POST',
            body: JSON.stringify({ 
              poPhotoUrl: dcPoPhotoUrl,
              remarks: dcRemarks || 'PO submitted via Client DC'
            }),
          })
        } catch (poErr) {
          console.error('PO submission failed:', poErr)
          // Continue even if PO submission fails
        }
      }

      toast.success('Client DC saved successfully! It will be sent to Closed Sales for coordinator/admin verification.')
      setClientDCDialogOpen(false)
      load()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save Client DC')
    } finally {
      setSavingClientDC(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Client DC</h1>
          <p className="text-sm text-neutral-600 mt-1">Manage products, PO photos, and DC details for your clients</p>
        </div>
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>

      <Card className="p-0 overflow-x-auto">
        {loading && <div className="p-4">Loading…</div>}
        {!loading && items.length === 0 && (
          <div className="p-4">
            <p className="text-neutral-600">No clients found with products added.</p>
            <p className="text-sm text-neutral-500 mt-2">
              Closed leads and clients with products added and submitted will appear here.
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              Closed leads appear here automatically. You can add products and manage client details directly from this page.
            </p>
          </div>
        )}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {items.map((d) => (
              <Card key={d._id} className="p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-neutral-900">
                      {d.customerName || d.saleId?.customerName || d.dcOrderId?.school_name || 'Unknown Client'}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      d.status === 'created' ? 'bg-blue-100 text-blue-700' :
                      d.status === 'po_submitted' ? 'bg-yellow-100 text-yellow-700' :
                      d.status === 'sent_to_manager' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {d.status || 'created'}
                    </span>
                  </div>
                  <div className="text-sm text-neutral-600 space-y-1">
                    <p><span className="font-medium">Phone:</span> {d.customerPhone || d.dcOrderId?.contact_mobile || '-'}</p>
                    <p><span className="font-medium">Product:</span> {d.product || d.saleId?.product || (d.dcOrderId?.products && Array.isArray(d.dcOrderId.products) ? d.dcOrderId.products.map((p: any) => p.product_name || p.product).join(', ') : '-')}</p>
                    <p><span className="font-medium">Created:</span> {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '-'}</p>
                  </div>
                </div>
                
                {d.poPhotoUrl && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-neutral-900">PO</h4>
                    </div>
                    <div className="relative">
                      {d.poPhotoUrl.startsWith('data:') || d.poPhotoUrl.startsWith('http') ? (
                        <img 
                          src={d.poPhotoUrl} 
                          alt="PO Document" 
                          className="w-full h-auto rounded border max-h-32 object-contain bg-neutral-50"
                        />
                      ) : (
                        <div className="w-full h-24 rounded border bg-neutral-50 flex items-center justify-center text-sm text-neutral-500">
                          PO Document
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="pt-2 border-t">
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => openClientDCDialog(d)}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Manage DC
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Client DC Dialog - Full DC Management */}
      <Dialog open={clientDCDialogOpen} onOpenChange={setClientDCDialogOpen}>
        <DialogContent className="sm:max-w-[95vw] lg:max-w-[1200px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client DC - Manage Products & Details</DialogTitle>
            <DialogDescription>
              Manage products, PO photo, and DC details for {selectedDC?.customerName || selectedDC?.dcOrderId?.school_name || 'this client'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            {/* PO Photo Section */}
            <div className="border rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">PO Photo</Label>
                {dcPoPhotoUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDcPoPhotoUrl('')}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
              {dcPoPhotoUrl ? (
                <div className="relative">
                  <img 
                    src={dcPoPhotoUrl} 
                    alt="PO Document" 
                    className="w-full h-auto rounded border max-h-64 object-contain bg-neutral-50"
                  />
                  <div className="mt-2">
                    <Input
                      type="text"
                      placeholder="PO Photo URL"
                      value={dcPoPhotoUrl}
                      onChange={(e) => setDcPoPhotoUrl(e.target.value)}
                      className="mb-2"
                    />
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setDcPoPhotoUrl(reader.result as string)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                  <Input
                    type="text"
                    placeholder="PO Photo URL"
                    value={dcPoPhotoUrl}
                    onChange={(e) => setDcPoPhotoUrl(e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setDcPoPhotoUrl(reader.result as string)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Products Table */}
            <div className="border rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Products & Quantities</Label>
                <div className="flex gap-2">
                  {dcProductRows.length === 0 && (
                    <p className="text-sm text-neutral-500 mr-2">Add products using the form below</p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Determine category automatically based on selectedDC's school_type
                      const autoCategory = selectedDC?.dcOrderId && typeof selectedDC.dcOrderId === 'object' && selectedDC.dcOrderId.school_type === 'Existing'
                        ? 'Existing School'
                        : 'New School'
                      
                      setDcProductRows([...dcProductRows, {
                        id: Date.now().toString(),
                        product: 'Abacus',
                        class: '1',
                        category: autoCategory,
                        quantity: 0,
                        strength: 0,
                        price: 0,
                        total: 0,
                        level: getDefaultLevel('Abacus'),
                      }])
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Row
                  </Button>
                </div>
              </div>
              
              {dcProductRows.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                  <p className="text-sm">No products added yet</p>
                  <p className="text-xs mt-1">Use the "Add Product" button below to add products to this client</p>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 border-b">
                      <th className="py-3 px-4 text-left text-sm font-semibold border-r">Product</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold border-r">Class</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold border-r">Category</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold border-r">Qty</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold border-r">Strength</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold border-r">Price</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold border-r">Total</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold border-r">Level</th>
                      <th className="py-3 px-4 text-center text-sm font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dcProductRows.map((row, idx) => (
                      <tr key={row.id} className="border-b">
                        <td className="py-3 px-4 border-r">
                          <Select value={row.product} onValueChange={(v) => {
                            const updated = [...dcProductRows]
                            updated[idx].product = v
                            // Update level to default for the selected product
                            updated[idx].level = getDefaultLevel(v)
                            setDcProductRows(updated)
                          }}>
                            <SelectTrigger className="h-10 text-sm">
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
                            const updated = [...dcProductRows]
                            updated[idx].class = v
                            setDcProductRows(updated)
                          }}>
                            <SelectTrigger className="h-10 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableClasses.map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4 border-r">
                          <Input
                            type="text"
                            className="h-10 text-sm bg-neutral-50"
                            value={row.category}
                            readOnly
                            disabled
                          />
                        </td>
                        <td className="py-3 px-4 border-r">
                          <Input
                            type="number"
                            className="h-10 text-sm"
                            value={row.quantity || ''}
                            onChange={(e) => {
                              const updated = [...dcProductRows]
                              updated[idx].quantity = Number(e.target.value) || 0
                              setDcProductRows(updated)
                            }}
                            placeholder="0"
                            min="0"
                          />
                        </td>
                        <td className="py-3 px-4 border-r">
                          <Input
                            type="number"
                            className="h-10 text-sm"
                            value={row.strength || ''}
                            onChange={(e) => {
                              const updated = [...dcProductRows]
                              updated[idx].strength = Number(e.target.value) || 0
                              updated[idx].total = updated[idx].price * updated[idx].strength
                              setDcProductRows(updated)
                            }}
                            placeholder="0"
                            min="0"
                          />
                        </td>
                        <td className="py-3 px-4 border-r">
                          <Input
                            type="number"
                            className="h-10 text-sm"
                            value={row.price || ''}
                            onChange={(e) => {
                              const updated = [...dcProductRows]
                              updated[idx].price = Number(e.target.value) || 0
                              updated[idx].total = updated[idx].price * updated[idx].strength
                              setDcProductRows(updated)
                            }}
                            placeholder="0"
                            min="0"
                          />
                        </td>
                        <td className="py-3 px-4 border-r">
                          <Input
                            type="number"
                            className="h-10 text-sm bg-neutral-50"
                            value={row.total || 0}
                            disabled
                            placeholder="Auto"
                          />
                        </td>
                        <td className="py-3 px-4 border-r">
                          <Select value={row.level} onValueChange={(v) => {
                            const updated = [...dcProductRows]
                            updated[idx].level = v
                            setDcProductRows(updated)
                          }}>
                            <SelectTrigger className="h-10 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableLevels(row.product).map(level => (
                                <SelectItem key={level} value={level}>{level}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {dcProductRows.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 h-10 w-10 p-0"
                              onClick={() => {
                                setDcProductRows(dcProductRows.filter((_, i) => i !== idx))
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>

            {/* DC Details */}
            <div className="border rounded-lg p-6 space-y-5">
              <Label className="text-lg font-semibold">DC Details</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label className="text-sm font-medium mb-2 block">DC Date</Label>
                  <Input
                    type="date"
                    value={dcDate}
                    onChange={(e) => setDcDate(e.target.value)}
                    className="h-11 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">DC Category</Label>
                  <Select value={dcCategory} onValueChange={setDcCategory}>
                    <SelectTrigger className="h-11 text-sm">
                      <SelectValue placeholder="Select DC Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDCCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium mb-2 block">DC Remarks</Label>
                  <Textarea
                    value={dcRemarks}
                    onChange={(e) => setDcRemarks(e.target.value)}
                    placeholder="Enter DC remarks..."
                    rows={3}
                    className="text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium mb-2 block">DC Notes</Label>
                  <Textarea
                    value={dcNotes}
                    onChange={(e) => setDcNotes(e.target.value)}
                    placeholder="Enter DC notes..."
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setClientDCDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveClientDC} disabled={savingClientDC}>
              {savingClientDC ? 'Saving...' : 'Save & Submit to Closed Sales'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

