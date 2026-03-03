'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { apiRequest } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { toast } from 'sonner'
import { ArrowLeft, Plus, X, DollarSign, Package, Building2, Briefcase } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Vendor = {
  _id: string
  name: string
  email: string
}

type Product = {
  _id: string
  productName: string
}

type School = {
  _id: string
  school_name: string
  school_code?: string
  zone?: string
  location?: string
}

type EnterpriseSchool = {
  schoolId: string
  schoolName: string
  schoolCode?: string
}

type Enterprise = {
  enterpriseName: string
  enterpriseCost: number
  schools: EnterpriseSchool[]
}

type ProductCost = {
  productId: string
  productName: string
  defaultCost: number
  enterprises: Enterprise[]
}

type VendorCost = {
  vendorId: string
  products: ProductCost[]
}

export default function AssignCostPage() {
  const router = useRouter()
  const params = useParams()
  const vendorId = params.id as string
  const currentUser = getCurrentUser()
  
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [allSchools, setAllSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [selectedProductForEnterprise, setSelectedProductForEnterprise] = useState<string>('')
  const [addEnterpriseDialogOpen, setAddEnterpriseDialogOpen] = useState(false)
  const [addSchoolDialogOpen, setAddSchoolDialogOpen] = useState(false)
  const [enterpriseName, setEnterpriseName] = useState('')
  const [enterpriseCost, setEnterpriseCost] = useState('')
  const [selectedEnterpriseIndex, setSelectedEnterpriseIndex] = useState<number | null>(null)
  const [selectedSchoolForAdd, setSelectedSchoolForAdd] = useState<School | null>(null)
  const [schoolSearchTerm, setSchoolSearchTerm] = useState('')
  
  const [vendorCost, setVendorCost] = useState<VendorCost>({
    vendorId,
    products: [],
  })

  const hasLoadedRef = useRef(false)

  const loadData = useCallback(async () => {
    if (!vendorId || hasLoadedRef.current) return
    
    hasLoadedRef.current = true
    setLoading(true)
    try {
      console.log('Loading vendor cost data for vendor:', vendorId)
      
      // Load vendor, products, schools, and vendor cost in parallel
      const [vendorData, productsData, schoolsData, costData] = await Promise.all([
        apiRequest<Vendor>(`/vendors/${vendorId}`).catch((e: any) => {
          console.error('Failed to load vendor:', e)
          throw new Error('Failed to load vendor: ' + (e?.message || 'Unknown error'))
        }),
        apiRequest<Product[]>(`/products/active`).catch((e: any) => {
          console.error('Failed to load products:', e)
          return []
        }),
        apiRequest<School[]>(`/vendor-costs/schools`).catch((e: any) => {
          console.error('Failed to load schools:', e)
          return []
        }),
        apiRequest<VendorCost>(`/vendor-costs/${vendorId}`).catch((e: any) => {
          // If no cost config exists, return default
          return { vendorId, products: [] }
        })
      ])
      
      console.log('Vendor loaded:', vendorData)
      setVendor(vendorData)
      
      console.log('Products loaded:', productsData)
      setProducts(Array.isArray(productsData) ? productsData : [])
      
      console.log('Schools loaded:', schoolsData)
      setAllSchools(Array.isArray(schoolsData) ? schoolsData : [])
      
      console.log('Vendor cost data loaded:', costData)
      if (costData && costData.vendorId) {
        setVendorCost(costData)
      }
    } catch (err: any) {
      console.error('Error loading data:', err)
      toast.error(err?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [vendorId])

  useEffect(() => {
    if (!vendorId) {
      toast.error('Vendor ID is missing')
      router.push('/dashboard/products/vendors')
      return
    }
    
    if (!currentUser) {
      return
    }
    
    if (currentUser.role !== 'Admin' && currentUser.role !== 'Super Admin') {
      toast.error('Access denied. Admin privileges required.')
      router.push('/dashboard/products/vendors')
      return
    }
    
    loadData()
  }, [vendorId, currentUser, loadData, router])

  const handleAddProduct = () => {
    if (!selectedProduct) {
      toast.error('Please select a product first')
      return
    }
    
    const product = products.find(p => p._id === selectedProduct)
    if (!product) {
      toast.error('Product not found')
      return
    }
    
    // Check if product already exists
    const existingProduct = vendorCost.products.find(p => p.productId === selectedProduct)
    if (existingProduct) {
      toast.error('This product is already added')
      return
    }
    
    // Add new product with default cost 0
    const newProduct: ProductCost = {
      productId: selectedProduct,
      productName: product.productName,
      defaultCost: 0,
      enterprises: [],
    }
    
    setVendorCost(prev => ({
      ...prev,
      products: [...prev.products, newProduct],
    }))
    
    setSelectedProduct('')
    toast.success('Product added successfully')
  }

  const handleRemoveProduct = (productIndex: number) => {
    setVendorCost(prev => ({
      ...prev,
      products: prev.products.filter((_, idx) => idx !== productIndex),
    }))
    toast.success('Product removed')
  }

  const handleUpdateProductDefaultCost = (productIndex: number, defaultCost: number) => {
    if (defaultCost < 0) {
      toast.error('Default cost cannot be negative')
      return
    }
    setVendorCost(prev => ({
      ...prev,
      products: prev.products.map((product, idx) => 
        idx === productIndex 
          ? { ...product, defaultCost }
          : product
      ),
    }))
  }

  const openAddEnterpriseDialog = (productIndex: number) => {
    setSelectedProductForEnterprise(vendorCost.products[productIndex].productId)
    setSelectedEnterpriseIndex(productIndex)
    setEnterpriseName('')
    setEnterpriseCost('')
    setAddEnterpriseDialogOpen(true)
  }

  const handleAddEnterprise = () => {
    if (!enterpriseName.trim()) {
      toast.error('Please enter enterprise name')
      return
    }
    
    const cost = parseFloat(enterpriseCost) || 0
    if (cost < 0) {
      toast.error('Enterprise cost cannot be negative')
      return
    }
    
    if (selectedEnterpriseIndex === null) {
      toast.error('Product not found')
      return
    }
    
    const product = vendorCost.products[selectedEnterpriseIndex]
    
    // Check if enterprise name already exists for this product
    const existingEnterprise = product.enterprises.find(e => e.enterpriseName.toLowerCase() === enterpriseName.trim().toLowerCase())
    if (existingEnterprise) {
      toast.error('Enterprise with this name already exists for this product')
      return
    }
    
    const newEnterprise: Enterprise = {
      enterpriseName: enterpriseName.trim(),
      enterpriseCost: cost,
      schools: [],
    }
    
    setVendorCost(prev => ({
      ...prev,
      products: prev.products.map((p, idx) => 
        idx === selectedEnterpriseIndex 
          ? { ...p, enterprises: [...p.enterprises, newEnterprise] }
          : p
      ),
    }))
    
    setAddEnterpriseDialogOpen(false)
    setEnterpriseName('')
    setEnterpriseCost('')
    setSelectedEnterpriseIndex(null)
    toast.success('Enterprise added successfully')
  }

  const handleRemoveEnterprise = (productIndex: number, enterpriseIndex: number) => {
    setVendorCost(prev => ({
      ...prev,
      products: prev.products.map((product, pIdx) => 
        pIdx === productIndex 
          ? { ...product, enterprises: product.enterprises.filter((_, eIdx) => eIdx !== enterpriseIndex) }
          : product
      ),
    }))
    toast.success('Enterprise removed')
  }

  const handleUpdateEnterpriseCost = (productIndex: number, enterpriseIndex: number, cost: number) => {
    if (cost < 0) {
      toast.error('Enterprise cost cannot be negative')
      return
    }
    setVendorCost(prev => ({
      ...prev,
      products: prev.products.map((product, pIdx) => 
        pIdx === productIndex 
          ? {
              ...product,
              enterprises: product.enterprises.map((enterprise, eIdx) => 
                eIdx === enterpriseIndex 
                  ? { ...enterprise, enterpriseCost: cost }
                  : enterprise
              )
            }
          : product
      ),
    }))
  }

  const openAddSchoolDialog = (productIndex: number, enterpriseIndex: number) => {
    setSelectedProductForEnterprise(vendorCost.products[productIndex].productId)
    setSelectedEnterpriseIndex(enterpriseIndex)
    setSelectedSchoolForAdd(null)
    setSchoolSearchTerm('')
    setAddSchoolDialogOpen(true)
  }

  const handleAddSchool = () => {
    if (!selectedSchoolForAdd) {
      toast.error('Please select a school')
      return
    }
    
    if (selectedEnterpriseIndex === null) {
      toast.error('Enterprise not found')
      return
    }
    
    // Find the product and enterprise indices
    const productIndex = vendorCost.products.findIndex(p => p.productId === selectedProductForEnterprise)
    if (productIndex === -1) {
      toast.error('Product not found')
      return
    }
    
    const product = vendorCost.products[productIndex]
    const enterprise = product.enterprises[selectedEnterpriseIndex]
    
    // Check if school already exists in this enterprise
    const schoolExists = enterprise.schools.some(s => s.schoolId === selectedSchoolForAdd._id)
    if (schoolExists) {
      toast.error('This school is already added to this enterprise')
      return
    }
    
    const newSchool: EnterpriseSchool = {
      schoolId: selectedSchoolForAdd._id,
      schoolName: selectedSchoolForAdd.school_name,
      schoolCode: selectedSchoolForAdd.school_code || '',
    }
    
    setVendorCost(prev => ({
      ...prev,
      products: prev.products.map((p, pIdx) => 
        pIdx === productIndex 
          ? {
              ...p,
              enterprises: p.enterprises.map((e, eIdx) => 
                eIdx === selectedEnterpriseIndex 
                  ? { ...e, schools: [...e.schools, newSchool] }
                  : e
              )
            }
          : p
      ),
    }))
    
    setAddSchoolDialogOpen(false)
    setSelectedSchoolForAdd(null)
    setSchoolSearchTerm('')
    setSelectedEnterpriseIndex(null)
    toast.success('School added successfully')
  }

  const handleRemoveSchool = (productIndex: number, enterpriseIndex: number, schoolIndex: number) => {
    setVendorCost(prev => ({
      ...prev,
      products: prev.products.map((product, pIdx) => 
        pIdx === productIndex 
          ? {
              ...product,
              enterprises: product.enterprises.map((enterprise, eIdx) => 
                eIdx === enterpriseIndex 
                  ? { ...enterprise, schools: enterprise.schools.filter((_, sIdx) => sIdx !== schoolIndex) }
                  : enterprise
              )
            }
          : product
      ),
    }))
    toast.success('School removed')
  }

  const handleSave = async () => {
    // Validate all products have default cost
    for (const product of vendorCost.products) {
      if (product.defaultCost < 0) {
        toast.error(`Product ${product.productName}: Default cost cannot be negative`)
        return
      }
      
      // Validate enterprises
      for (const enterprise of product.enterprises) {
        if (enterprise.enterpriseCost < 0) {
          toast.error(`Enterprise ${enterprise.enterpriseName} in ${product.productName}: Cost cannot be negative`)
          return
        }
      }
    }
    
    setSaving(true)
    try {
      await apiRequest(`/vendor-costs/${vendorId}`, {
        method: 'PUT',
        body: JSON.stringify(vendorCost),
      })
      toast.success('Cost configuration saved successfully!')
      router.push('/dashboard/products/vendors')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save cost configuration')
    } finally {
      setSaving(false)
    }
  }

  // Filter schools for dialog
  const filteredSchools = allSchools.filter(school => {
    if (!schoolSearchTerm) return true
    const search = schoolSearchTerm.toLowerCase()
    return (
      school.school_name.toLowerCase().includes(search) ||
      (school.school_code && school.school_code.toLowerCase().includes(search)) ||
      (school.zone && school.zone.toLowerCase().includes(search))
    )
  })

  // Get schools already assigned to any enterprise in the selected product
  const getAssignedSchoolIds = (productIndex: number): string[] => {
    const product = vendorCost.products[productIndex]
    if (!product) return []
    const assignedIds: string[] = []
    product.enterprises.forEach(enterprise => {
      enterprise.schools.forEach(school => {
        assignedIds.push(school.schoolId)
      })
    })
    return assignedIds
  }

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <div className="text-center text-neutral-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading vendor cost configuration...</p>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="space-y-6 p-8">
        <div className="text-center text-red-600">
          <p>Vendor not found</p>
          <Link href="/dashboard/products/vendors" className="text-blue-600 hover:underline mt-2 inline-block">
            Go back to vendors
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/products/vendors"
        className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Vendors
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Assign Cost - {vendor.name}</h1>
        <p className="text-sm text-neutral-600 mt-1">Configure product costs: default cost applies to all schools, enterprise costs apply to specific schools</p>
      </div>

      <Card className="p-4 md:p-6 space-y-6">
        {/* Product Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-neutral-900">Select Product</h2>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products
                  .filter(p => !vendorCost.products.some(vp => vp.productId === p._id))
                  .map(product => (
                    <SelectItem key={product._id} value={product._id}>
                      {product.productName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAddProduct}
              disabled={!selectedProduct}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Products List */}
        {vendorCost.products.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 border border-dashed border-neutral-300 rounded-lg">
            <Package className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
            <p>No products added yet. Select a product and click "Add Product" to get started.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {vendorCost.products.map((product, productIndex) => (
              <Card key={productIndex} className="p-4 border-2 border-neutral-200">
                <div className="space-y-4">
                  {/* Product Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-base font-semibold px-3 py-1">
                        {product.productName}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveProduct(productIndex)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove Product
                    </Button>
                  </div>

                  {/* Default Cost */}
                  <div>
                    <Label>Default Cost (₹) - Applies to all schools not in any enterprise</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={product.defaultCost}
                      onChange={(e) => handleUpdateProductDefaultCost(productIndex, parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      This default price will be shown to vendor in their dashboard for all schools not assigned to any enterprise
                    </p>
                  </div>

                  {/* Enterprises */}
                  <div className="space-y-3 pt-4 border-t border-neutral-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <Label className="text-sm font-medium">Enterprises ({product.enterprises.length})</Label>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddEnterpriseDialog(productIndex)}
                        className="border-green-200 text-green-700 hover:bg-green-50"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Enterprise
                      </Button>
                    </div>

                    {product.enterprises.length === 0 ? (
                      <div className="text-sm text-neutral-500 py-4 text-center border border-dashed border-neutral-200 rounded">
                        No enterprises added. Click "Add Enterprise" to add enterprise costs with specific schools.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {product.enterprises.map((enterprise, enterpriseIndex) => (
                          <Card key={enterpriseIndex} className="p-3 border border-neutral-200 bg-neutral-50">
                            <div className="space-y-3">
                              {/* Enterprise Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-sm font-medium">
                                    {enterprise.enterpriseName}
                                  </Badge>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveEnterprise(productIndex, enterpriseIndex)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Enterprise Cost */}
                              <div>
                                <Label className="text-xs text-neutral-600">Enterprise Cost (₹)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={enterprise.enterpriseCost}
                                  onChange={(e) => handleUpdateEnterpriseCost(productIndex, enterpriseIndex, parseFloat(e.target.value) || 0)}
                                  placeholder="0.00"
                                  className="h-8 text-sm mt-1"
                                />
                              </div>

                              {/* Schools in Enterprise */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs text-neutral-600">
                                    Schools ({enterprise.schools.length})
                                  </Label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openAddSchoolDialog(productIndex, enterpriseIndex)}
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs h-7"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add School
                                  </Button>
                                </div>

                                {enterprise.schools.length === 0 ? (
                                  <div className="text-xs text-neutral-500 py-2 text-center border border-dashed border-neutral-200 rounded">
                                    No schools added. Click "Add School" to assign schools to this enterprise.
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {enterprise.schools.map((school, schoolIndex) => (
                                      <div key={schoolIndex} className="flex items-center justify-between p-2 bg-white rounded border border-neutral-200">
                                        <div className="flex items-center gap-2">
                                          <Building2 className="w-3 h-3 text-neutral-500" />
                                          <span className="text-sm font-medium">{school.schoolName}</span>
                                          {school.schoolCode && (
                                            <Badge variant="secondary" className="text-xs">
                                              {school.schoolCode}
                                            </Badge>
                                          )}
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveSchool(productIndex, enterpriseIndex, schoolIndex)}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-4 pt-6 border-t border-neutral-200">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/products/vendors')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            {saving ? 'Saving...' : 'Save Cost Configuration'}
          </Button>
        </div>
      </Card>

      {/* Add Enterprise Dialog */}
      <Dialog open={addEnterpriseDialogOpen} onOpenChange={setAddEnterpriseDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Enterprise</DialogTitle>
            <DialogDescription>
              Add an enterprise with a specific cost. Schools assigned to this enterprise will use this cost instead of the default cost.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Enterprise Name</Label>
              <Input
                value={enterpriseName}
                onChange={(e) => setEnterpriseName(e.target.value)}
                placeholder="Enter enterprise name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Enterprise Cost (₹)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={enterpriseCost}
                onChange={(e) => setEnterpriseCost(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddEnterpriseDialogOpen(false)
                setEnterpriseName('')
                setEnterpriseCost('')
                setSelectedEnterpriseIndex(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddEnterprise}
              disabled={!enterpriseName.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              Add Enterprise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add School Dialog */}
      <Dialog open={addSchoolDialogOpen} onOpenChange={setAddSchoolDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add School to Enterprise</DialogTitle>
            <DialogDescription>
              Select a school to assign to this enterprise. Schools in enterprises use enterprise cost instead of default cost.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Search School</Label>
              <Input
                value={schoolSearchTerm}
                onChange={(e) => setSchoolSearchTerm(e.target.value)}
                placeholder="Search by name, code, or zone..."
                className="mt-1"
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto border border-neutral-200 rounded">
              {filteredSchools.length === 0 ? (
                <div className="p-4 text-center text-neutral-500 text-sm">
                  No schools found
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {filteredSchools
                    .filter(school => {
                      // Filter out schools already assigned to any enterprise in this product
                      const productIndex = vendorCost.products.findIndex(p => p.productId === selectedProductForEnterprise)
                      if (productIndex === -1) return true
                      const assignedIds = getAssignedSchoolIds(productIndex)
                      return !assignedIds.includes(school._id)
                    })
                    .map(school => (
                      <button
                        key={school._id}
                        onClick={() => setSelectedSchoolForAdd(school)}
                        className={`w-full p-3 text-left hover:bg-neutral-50 transition-colors ${
                          selectedSchoolForAdd?._id === school._id ? 'bg-blue-50 border-l-2 border-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-neutral-500" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{school.school_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {school.school_code && (
                                <span className="text-xs text-neutral-500">Code: {school.school_code}</span>
                              )}
                              {school.zone && (
                                <span className="text-xs text-neutral-500">Zone: {school.zone}</span>
                              )}
                            </div>
                          </div>
                          {selectedSchoolForAdd?._id === school._id && (
                            <Badge variant="secondary" className="text-xs">Selected</Badge>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddSchoolDialogOpen(false)
                setSelectedSchoolForAdd(null)
                setSchoolSearchTerm('')
                setSelectedEnterpriseIndex(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSchool}
              disabled={!selectedSchoolForAdd}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              Add School
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
