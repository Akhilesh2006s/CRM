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

type FranchiseSchool = {
  schoolId: string
  schoolName: string
  schoolCode?: string
}

type Franchise = {
  franchiseName: string
  franchiseEmail: string
  franchiseCost: number
  zones: string[]
  schools: FranchiseSchool[]
}

type ProductCost = {
  productId: string
  productName: string
  defaultCost: number
  franchises: Franchise[]
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
  const [selectedProductForFranchise, setSelectedProductForFranchise] = useState<string>('')
  const [addFranchiseDialogOpen, setAddFranchiseDialogOpen] = useState(false)
  const [addZoneDialogOpen, setAddZoneDialogOpen] = useState(false)
  const [franchiseName, setFranchiseName] = useState('')
  const [franchiseEmail, setFranchiseEmail] = useState('')
  const [franchisePassword, setFranchisePassword] = useState('')
  const [franchiseCost, setFranchiseCost] = useState('')
  const [selectedFranchiseIndex, setSelectedFranchiseIndex] = useState<number | null>(null)
  const [selectedZones, setSelectedZones] = useState<string[]>([])
  const [availableZones, setAvailableZones] = useState<string[]>([])
  
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
      
      // Load vendor, products, schools, zones, and vendor cost in parallel
      const [vendorData, productsData, schoolsData, zonesData, costData] = await Promise.all([
        apiRequest<Vendor>(`/partners/${vendorId}`).catch((e: any) => {
          console.error('Failed to load partner:', e)
          throw new Error('Failed to load partner: ' + (e?.message || 'Unknown error'))
        }),
        apiRequest<Product[]>(`/products/active`).catch((e: any) => {
          console.error('Failed to load products:', e)
          return []
        }),
        apiRequest<School[]>(`/partner-costs/schools`).catch((e: any) => {
          console.error('Failed to load schools:', e)
          return []
        }),
        apiRequest<string[]>(`/partner-costs/zones`).catch((e: any) => {
          console.error('Failed to load zones:', e)
          return []
        }),
        apiRequest<VendorCost>(`/partner-costs/${vendorId}`).catch((e: any) => {
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
      
      console.log('Zones loaded:', zonesData)
      setAvailableZones(Array.isArray(zonesData) ? zonesData : [])
      
      console.log('Partner cost data loaded:', costData)
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
      franchises: [],
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

  const openAddFranchiseDialog = (productIndex: number) => {
    setSelectedProductForFranchise(vendorCost.products[productIndex].productId)
    setSelectedFranchiseIndex(productIndex)
    setFranchiseName('')
    setFranchiseEmail('')
    setFranchisePassword('')
    setFranchiseCost('')
    setAddFranchiseDialogOpen(true)
  }

  const handleAddFranchise = async () => {
    if (!franchiseName.trim()) {
      toast.error('Please enter franchise name')
      return
    }
    
    if (!franchiseEmail.trim()) {
      toast.error('Please enter franchise email')
      return
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(franchiseEmail.trim())) {
      toast.error('Please enter a valid email address')
      return
    }
    
    if (!franchisePassword.trim()) {
      toast.error('Please enter franchise password')
      return
    }
    
    // Password validation: min 6 characters
    if (franchisePassword.trim().length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    const cost = parseFloat(franchiseCost) || 0
    if (cost < 0) {
      toast.error('Franchise cost cannot be negative')
      return
    }
    
    if (selectedFranchiseIndex === null) {
      toast.error('Product not found')
      return
    }
    
    const product = vendorCost.products[selectedFranchiseIndex]
    
    // Check if franchise name already exists for this product
    const existingFranchise = product.franchises.find(f => f.franchiseName.toLowerCase() === franchiseName.trim().toLowerCase())
    if (existingFranchise) {
      toast.error('Franchise with this name already exists for this product')
      return
    }
    
    // Check if franchise email already exists for this product
    const existingEmail = product.franchises.find(f => f.franchiseEmail.toLowerCase() === franchiseEmail.trim().toLowerCase())
    if (existingEmail) {
      toast.error('Franchise with this email already exists for this product')
      return
    }
    
    // Create or update User account for franchise
    try {
      await apiRequest('/auth/register-franchise', {
        method: 'POST',
        body: JSON.stringify({
          name: franchiseName.trim(),
          email: franchiseEmail.trim().toLowerCase(),
          password: franchisePassword.trim(),
        }),
      })
    } catch (err: any) {
      // If user already exists, that's okay - just continue
      if (!err?.message?.includes('already exists') && !err?.message?.includes('Email already')) {
        console.error('Failed to create franchise user account:', err)
        toast.error('Franchise created but failed to create login account. You may need to create it manually.')
      }
    }
    
    const newFranchise: Franchise = {
      franchiseName: franchiseName.trim(),
      franchiseEmail: franchiseEmail.trim().toLowerCase(),
      franchiseCost: cost,
      zones: [],
      schools: [],
    }
    
    setVendorCost(prev => ({
      ...prev,
      products: prev.products.map((p, idx) => 
        idx === selectedFranchiseIndex 
          ? { ...p, franchises: [...p.franchises, newFranchise] }
          : p
      ),
    }))
    
    setAddFranchiseDialogOpen(false)
    setFranchiseName('')
    setFranchiseEmail('')
    setFranchisePassword('')
    setFranchiseCost('')
    setSelectedFranchiseIndex(null)
    toast.success('Franchise added successfully with login account')
  }

  const handleRemoveFranchise = (productIndex: number, franchiseIndex: number) => {
    setVendorCost(prev => ({
      ...prev,
      products: prev.products.map((product, pIdx) => 
        pIdx === productIndex 
          ? { ...product, franchises: product.franchises.filter((_, fIdx) => fIdx !== franchiseIndex) }
          : product
      ),
    }))
    toast.success('Franchise removed')
  }

  const handleUpdateFranchiseCost = (productIndex: number, franchiseIndex: number, cost: number) => {
    if (cost < 0) {
      toast.error('Franchise cost cannot be negative')
      return
    }
    setVendorCost(prev => ({
      ...prev,
      products: prev.products.map((product, pIdx) => 
        pIdx === productIndex 
          ? {
              ...product,
              franchises: product.franchises.map((franchise, fIdx) => 
                fIdx === franchiseIndex 
                  ? { ...franchise, franchiseCost: cost }
                  : franchise
              )
            }
          : product
      ),
    }))
  }

  const openAddZoneDialog = (productIndex: number, franchiseIndex: number) => {
    setSelectedProductForFranchise(vendorCost.products[productIndex].productId)
    setSelectedFranchiseIndex(franchiseIndex)
    setSelectedZones([])
    setAddZoneDialogOpen(true)
  }

  const handleAddZones = () => {
    if (selectedZones.length === 0) {
      toast.error('Please select at least one zone')
      return
    }
    
    if (selectedFranchiseIndex === null) {
      toast.error('Franchise not found')
      return
    }
    
    // Find the product and franchise indices
    const productIndex = vendorCost.products.findIndex(p => p.productId === selectedProductForFranchise)
    if (productIndex === -1) {
      toast.error('Product not found')
      return
    }
    
    const product = vendorCost.products[productIndex]
    const franchise = product.franchises[selectedFranchiseIndex]
    
    // Get all schools from selected zones
    const schoolsFromZones: FranchiseSchool[] = []
    const addedSchoolIds = new Set<string>(franchise.schools.map(s => s.schoolId))
    
    selectedZones.forEach(zone => {
      const schoolsInZone = allSchools.filter(school => school.zone === zone)
      schoolsInZone.forEach(school => {
        if (!addedSchoolIds.has(school._id)) {
          schoolsFromZones.push({
            schoolId: school._id,
            schoolName: school.school_name,
            schoolCode: school.school_code || '',
          })
          addedSchoolIds.add(school._id)
        }
      })
    })
    
    if (schoolsFromZones.length === 0) {
      toast.error('No schools found in selected zones')
      return
    }
    
    // Update franchise with new zones and schools
    const updatedZones = [...new Set([...franchise.zones, ...selectedZones])]
    
    setVendorCost(prev => ({
      ...prev,
      products: prev.products.map((p, pIdx) => 
        pIdx === productIndex 
          ? {
              ...p,
              franchises: p.franchises.map((f, fIdx) => 
                fIdx === selectedFranchiseIndex 
                  ? { 
                      ...f, 
                      zones: updatedZones,
                      schools: [...f.schools, ...schoolsFromZones] 
                    }
                  : f
              )
            }
          : p
      ),
    }))
    
    setAddZoneDialogOpen(false)
    setSelectedZones([])
    setSelectedFranchiseIndex(null)
    toast.success(`Added ${schoolsFromZones.length} school(s) from ${selectedZones.length} zone(s)`)
  }

  const handleRemoveSchool = (productIndex: number, franchiseIndex: number, schoolIndex: number) => {
    setVendorCost(prev => ({
      ...prev,
      products: prev.products.map((product, pIdx) => 
        pIdx === productIndex 
          ? {
              ...product,
              franchises: product.franchises.map((franchise, fIdx) => 
                fIdx === franchiseIndex 
                  ? { ...franchise, schools: franchise.schools.filter((_, sIdx) => sIdx !== schoolIndex) }
                  : franchise
              )
            }
          : product
      ),
    }))
    toast.success('School removed')
  }
  
  const handleRemoveZone = (productIndex: number, franchiseIndex: number, zoneToRemove: string) => {
    const product = vendorCost.products[productIndex]
    const franchise = product.franchises[franchiseIndex]
    
    // Remove zone and all schools from that zone
    const schoolsInZone = allSchools
      .filter(school => school.zone === zoneToRemove)
      .map(school => school._id)
    
    setVendorCost(prev => ({
      ...prev,
      products: prev.products.map((p, pIdx) => 
        pIdx === productIndex 
          ? {
              ...p,
              franchises: p.franchises.map((f, fIdx) => 
                fIdx === franchiseIndex 
                  ? { 
                      ...f, 
                      zones: f.zones.filter(z => z !== zoneToRemove),
                      schools: f.schools.filter(s => !schoolsInZone.includes(s.schoolId))
                    }
                  : f
              )
            }
          : p
      ),
    }))
    toast.success(`Zone "${zoneToRemove}" and its schools removed`)
  }

  const handleSave = async () => {
    // Validate all products have default cost
    for (const product of vendorCost.products) {
      if (product.defaultCost < 0) {
        toast.error(`Product ${product.productName}: Default cost cannot be negative`)
        return
      }
      
      // Validate franchises
      for (const franchise of product.franchises) {
        if (franchise.franchiseCost < 0) {
          toast.error(`Franchise ${franchise.franchiseName} in ${product.productName}: Cost cannot be negative`)
          return
        }
      }
    }
    
    setSaving(true)
    try {
      await apiRequest(`/partner-costs/${vendorId}`, {
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

  // Get schools already assigned to any franchise in the selected product
  const getAssignedSchoolIds = (productIndex: number): string[] => {
    const product = vendorCost.products[productIndex]
    if (!product) return []
    const assignedIds: string[] = []
    product.franchises.forEach(franchise => {
      franchise.schools.forEach(school => {
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
          <p>Loading partner cost configuration...</p>
        </div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="space-y-6 p-8">
        <div className="text-center text-red-600">
          <p>Partner not found</p>
          <Link href="/dashboard/products/vendors" className="text-blue-600 hover:underline mt-2 inline-block">
            Go back to partners
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
        Back to Partners
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">Assign Cost - {vendor.name}</h1>
        <p className="text-sm text-neutral-600 mt-1">Configure product costs: default cost applies to all schools, franchise costs apply to schools in selected zones</p>
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
                    <Label>Default Cost (₹) - Applies to all schools not in any franchise</Label>
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
                      This default price will be shown to partner in their dashboard for all schools not assigned to any franchise
                    </p>
                  </div>

                  {/* Franchises */}
                  <div className="space-y-3 pt-4 border-t border-neutral-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <Label className="text-sm font-medium">Franchises ({product.franchises.length})</Label>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddFranchiseDialog(productIndex)}
                        className="border-green-200 text-green-700 hover:bg-green-50"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Franchise
                      </Button>
                    </div>

                    {product.franchises.length === 0 ? (
                      <div className="text-sm text-neutral-500 py-4 text-center border border-dashed border-neutral-200 rounded">
                        No franchises added. Click "Add Franchise" to add franchise costs with specific zones.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {product.franchises.map((franchise, franchiseIndex) => (
                          <Card key={franchiseIndex} className="p-3 border border-neutral-200 bg-neutral-50">
                            <div className="space-y-3">
                              {/* Franchise Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-sm font-medium w-fit">
                                      {franchise.franchiseName}
                                    </Badge>
                                    <Link 
                                      href={`/dashboard/franchises/${encodeURIComponent(franchise.franchiseEmail)}`}
                                      target="_blank"
                                    >
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                                      >
                                        View Dashboard
                                      </Button>
                                    </Link>
                                  </div>
                                  <span className="text-xs text-neutral-500">{franchise.franchiseEmail}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveFranchise(productIndex, franchiseIndex)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Franchise Cost */}
                              <div>
                                <Label className="text-xs text-neutral-600">Franchise Cost (₹)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={franchise.franchiseCost}
                                  onChange={(e) => handleUpdateFranchiseCost(productIndex, franchiseIndex, parseFloat(e.target.value) || 0)}
                                  placeholder="0.00"
                                  className="h-8 text-sm mt-1"
                                />
                              </div>

                              {/* Zones in Franchise */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs text-neutral-600">
                                    Zones ({franchise.zones.length})
                                  </Label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openAddZoneDialog(productIndex, franchiseIndex)}
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs h-7"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Zone
                                  </Button>
                                </div>

                                {franchise.zones.length === 0 ? (
                                  <div className="text-xs text-neutral-500 py-2 text-center border border-dashed border-neutral-200 rounded">
                                    No zones added. Click "Add Zone" to assign zones to this franchise. Schools in selected zones will be automatically added.
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {franchise.zones.map((zone, zoneIndex) => (
                                      <div key={zoneIndex} className="flex items-center justify-between p-2 bg-white rounded border border-neutral-200">
                                        <div className="flex items-center gap-2">
                                          <Building2 className="w-3 h-3 text-neutral-500" />
                                          <span className="text-sm font-medium">{zone}</span>
                                          <Badge variant="secondary" className="text-xs">
                                            {franchise.schools.filter(s => {
                                              const school = allSchools.find(sc => sc._id === s.schoolId)
                                              return school?.zone === zone
                                            }).length} schools
                                          </Badge>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRemoveZone(productIndex, franchiseIndex, zone)}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Schools in Franchise (read-only display) */}
                              {franchise.schools.length > 0 && (
                                <div className="space-y-2 pt-2 border-t border-neutral-200">
                                  <Label className="text-xs text-neutral-600">
                                    Schools ({franchise.schools.length})
                                  </Label>
                                  <div className="max-h-32 overflow-y-auto space-y-1">
                                    {franchise.schools.map((school, schoolIndex) => (
                                      <div key={schoolIndex} className="flex items-center gap-2 p-1.5 bg-white rounded border border-neutral-200 text-xs">
                                        <Building2 className="w-3 h-3 text-neutral-400" />
                                        <span className="text-neutral-700">{school.schoolName}</span>
                                        {school.schoolCode && (
                                          <Badge variant="outline" className="text-xs">
                                            {school.schoolCode}
                                          </Badge>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
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

      {/* Add Franchise Dialog */}
      <Dialog open={addFranchiseDialogOpen} onOpenChange={setAddFranchiseDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Franchise</DialogTitle>
            <DialogDescription>
              Add a franchise with a specific cost. Schools in selected zones will automatically be added and use this cost instead of the default cost.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Franchise Name</Label>
              <Input
                value={franchiseName}
                onChange={(e) => setFranchiseName(e.target.value)}
                placeholder="Enter franchise name"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Franchise Email</Label>
              <Input
                type="email"
                value={franchiseEmail}
                onChange={(e) => setFranchiseEmail(e.target.value)}
                placeholder="Enter franchise email"
                className="mt-1"
              />
              <p className="text-xs text-neutral-500 mt-1">This email will be used for login</p>
            </div>
            
            <div>
              <Label>Franchise Password</Label>
              <Input
                type="password"
                value={franchisePassword}
                onChange={(e) => setFranchisePassword(e.target.value)}
                placeholder="Enter password (min 6 characters)"
                className="mt-1"
              />
              <p className="text-xs text-neutral-500 mt-1">Password for franchise login (minimum 6 characters)</p>
            </div>
            
            <div>
              <Label>Franchise Cost (₹)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={franchiseCost}
                onChange={(e) => setFranchiseCost(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddFranchiseDialogOpen(false)
                setFranchiseName('')
                setFranchiseEmail('')
                setFranchisePassword('')
                setFranchiseCost('')
                setSelectedFranchiseIndex(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddFranchise}
              disabled={!franchiseName.trim() || !franchiseEmail.trim() || !franchisePassword.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              Add Franchise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Zone Dialog */}
      <Dialog open={addZoneDialogOpen} onOpenChange={setAddZoneDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Zones to Franchise</DialogTitle>
            <DialogDescription>
              Select zones to add to this franchise. All schools in the selected zones will be automatically added.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Select Zones</Label>
              <div className="max-h-60 overflow-y-auto border border-neutral-200 rounded mt-1">
                {availableZones.length === 0 ? (
                  <div className="p-4 text-center text-neutral-500 text-sm">
                    No zones available
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-200">
                    {availableZones.map(zone => {
                      const schoolsInZone = allSchools.filter(s => s.zone === zone).length
                      const isSelected = selectedZones.includes(zone)
                      return (
                        <button
                          key={zone}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedZones(prev => prev.filter(z => z !== zone))
                            } else {
                              setSelectedZones(prev => [...prev, zone])
                            }
                          }}
                          className={`w-full p-3 text-left hover:bg-neutral-50 transition-colors ${
                            isSelected ? 'bg-blue-50 border-l-2 border-blue-600' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-neutral-500" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{zone}</p>
                              <p className="text-xs text-neutral-500 mt-1">{schoolsInZone} school(s) in this zone</p>
                            </div>
                            {isSelected && (
                              <Badge variant="secondary" className="text-xs">Selected</Badge>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddZoneDialogOpen(false)
                setSelectedZones([])
                setSelectedFranchiseIndex(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddZones}
              disabled={selectedZones.length === 0}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              Add {selectedZones.length > 0 ? `${selectedZones.length} Zone(s)` : 'Zones'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
