'use client'

import { useEffect, useState } from 'react'
import { apiRequest } from '@/lib/api'
import { useProducts } from '@/hooks/useProducts'
import {
  type CloseProductSection,
  type CloseProductSectionLine,
  type ProductDetailRow,
  type GroupProductOpts,
  expandSectionsToProductDetails,
  getLineClassSelections,
  groupProductDetailsByProductAndClass,
  lineHasValidClassSelections,
  lineHasValidLevelSelections,
  makeRowId,
  sectionHasValidClassSelections,
  buildDcOrderProductsFromDetails,
  validateCloseLeadProductConfig,
} from '@/lib/closeLeadProductConfig'

export type UseCloseLeadProductConfigOptions = {
  schoolType?: string
}

export function useCloseLeadProductConfig(options: UseCloseLeadProductConfigOptions = {}) {
  const { schoolType } = options

  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [productDetails, setProductDetails] = useState<ProductDetailRow[]>([])
  const [productSections, setProductSections] = useState<CloseProductSection[]>([])
  const [expandedLineBySection, setExpandedLineBySection] = useState<
    Record<string, string | null>
  >({})
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [deliverablesByProduct, setDeliverablesByProduct] = useState<Record<string, string[]>>(
    {}
  )

  const {
    products: catalogProducts,
    productNames: availableProducts,
    getProductLevels,
    getDefaultLevel,
    getProductSpecs,
    getProductSubjects,
    hasProductSubjects,
    getProductCategories,
    hasProductCategories,
    getProductId,
    getCalculationType,
    getCatalogFallbackCount,
  } = useProducts()

  const groupProductOpts: GroupProductOpts = {
    getCalculationType,
    getCatalogFallbackCount,
  }

  useEffect(() => {
    const details = expandSectionsToProductDetails(productSections, {
      hasProductSubjects,
      getProductCategories,
      hasProductCategories,
      schoolType,
    })
    setProductDetails(details)
    const names = [...new Set(productSections.flatMap((s) => s.lines.map((l) => l.product)))]
    setSelectedProducts(names)
    // Only stable deps: useProducts() returns new function references every render, so including
    // hasProductSubjects / getProductCategories / hasProductCategories caused maximum update depth.
    // Re-run when the catalog list identity changes (e.g. after /products/active loads).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSections, schoolType, catalogProducts])

  const childProductRows = productDetails.filter((pd) => !pd.isParentRow)
  const groupedChildProductRows = groupProductDetailsByProductAndClass(
    childProductRows,
    groupProductOpts
  )
  const showSpecsColumn = childProductRows.some((pd) => {
    const specs = String(pd.specs || '').trim()
    return specs.length > 0 && specs.toLowerCase() !== 'regular'
  })
  const showSubjectsColumn = childProductRows.some(
    (pd) => String(pd.subject || '').trim().length > 0
  )

  // Fetch deliverables for parent-row products when Product Configuration is shown
  const parentProductNames = productSections.flatMap((s) => s.lines.map((l) => l.product))
  useEffect(() => {
    parentProductNames.forEach(async (productName) => {
      const productId = getProductId(productName)
      if (!productId) return
      try {
        const items = await apiRequest<Array<{ deliverableName: string }>>(
          `/deliverables/by-product/${productId}`
        )
        const names = Array.isArray(items) ? items.map((d) => d.deliverableName) : []
        setDeliverablesByProduct((prev) => ({ ...prev, [productName]: names }))
      } catch {
        setDeliverablesByProduct((prev) => ({ ...prev, [productName]: [] }))
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentProductNames.join(',')])

  const filteredProducts = availableProducts

  const lineAllowsProductConfig = (sec: CloseProductSection, line: CloseProductSectionLine) => {
    return (
      lineHasValidClassSelections(line, sec) &&
      Boolean(line.product?.trim()) &&
      lineHasValidLevelSelections(line, getDefaultLevel, getProductLevels)
    )
  }

  const updateLineInSection = (
    sectionId: string,
    lineId: string,
    updater: (line: CloseProductSectionLine) => CloseProductSectionLine
  ) => {
    setProductSections((prev) =>
      prev.map((sec) =>
        sec.id !== sectionId
          ? sec
          : { ...sec, lines: sec.lines.map((l) => (l.id === lineId ? updater(l) : l)) }
      )
    )
  }

  const toggleLineClass = (
    sectionId: string,
    lineId: string,
    classValue: string,
    checked: boolean
  ) => {
    updateLineInSection(sectionId, lineId, (line) => {
      const existing = getLineClassSelections(line)
      if (checked) {
        if (existing.some((s) => s.class === classValue)) return line
        let defaultStrength = existing[0]?.strength || 0
        if (line.sameStrengthForAllClasses && existing.length > 0) {
          const withStrength = existing.find((s) => Number(s.strength) > 0)
          if (withStrength) defaultStrength = withStrength.strength
        }
        return {
          ...line,
          classSelections: [
            ...existing,
            { class: classValue, strength: defaultStrength > 0 ? defaultStrength : 0 },
          ],
        }
      }
      return {
        ...line,
        classSelections: existing.filter((s) => s.class !== classValue),
      }
    })
  }

  const updateLineClassStrength = (
    sectionId: string,
    lineId: string,
    classValue: string,
    strength: number
  ) => {
    updateLineInSection(sectionId, lineId, (line) => ({
      ...line,
      classSelections: getLineClassSelections(line).map((s) =>
        s.class === classValue ? { ...s, strength } : s
      ),
    }))
  }

  const applyLineBulkStrength = (sectionId: string, lineId: string, strength: number) => {
    updateLineInSection(sectionId, lineId, (line) => ({
      ...line,
      sameStrengthForAllClasses: true,
      classSelections: getLineClassSelections(line).map((s) => ({ ...s, strength })),
    }))
  }

  const setLineSameStrengthForAll = (sectionId: string, lineId: string, enabled: boolean) => {
    updateLineInSection(sectionId, lineId, (line) => {
      if (!enabled) return { ...line, sameStrengthForAllClasses: false }
      const existing = getLineClassSelections(line)
      const bulk =
        existing.find((s) => Number(s.strength) > 0)?.strength ?? existing[0]?.strength ?? 0
      return {
        ...line,
        sameStrengthForAllClasses: true,
        classSelections: existing.map((s) => ({
          ...s,
          strength: bulk > 0 ? bulk : s.strength,
        })),
      }
    })
  }

  const lineBulkStrengthValue = (line: CloseProductSectionLine): string => {
    const selections = getLineClassSelections(line)
    if (selections.length === 0) return ''
    const first = Number(selections[0].strength) || 0
    const allSame = selections.every((s) => (Number(s.strength) || 0) === first)
    return allSame && first > 0 ? String(first) : first > 0 ? String(first) : ''
  }

  const addEmptyProductSection = () => {
    const id = makeRowId()
    setProductSections((prev) => [...prev, { id, classSelections: [], lines: [] }])
    setExpandedLineBySection((prev) => ({ ...prev, [id]: null }))
  }

  const removeProductSection = (sectionId: string) => {
    setProductSections((prev) => prev.filter((s) => s.id !== sectionId))
    setExpandedLineBySection((prev) => {
      const next = { ...prev }
      delete next[sectionId]
      return next
    })
  }

  const addProductLineToSection = (sectionId: string, product: string) => {
    const newLineId = makeRowId()
    setProductSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec
        const catalogLevels = getProductLevels(product)
        const newLine: CloseProductSectionLine = {
          id: newLineId,
          parentRowId: makeRowId(),
          product,
          level: getDefaultLevel(product),
          selectedLevels:
            catalogLevels.length === 1
              ? [catalogLevels[0]]
              : catalogLevels.length > 0
                ? [getDefaultLevel(product)]
                : [],
          classSelections: [],
          sameStrengthForAllClasses: false,
          selectedSpecs: getProductSpecs(product).slice(0, 1),
          selectedSubjects: [],
          selectedDeliverables: [],
          selectedCategories: undefined,
          sameRateForAllClasses: false,
          price: 0,
        }
        return { ...sec, lines: [...sec.lines, newLine] }
      })
    )
    setExpandedLineBySection((prev) => ({ ...prev, [sectionId]: newLineId }))
    return newLineId
  }

  const updateProductSectionLine = (
    sectionId: string,
    lineId: string,
    patch: Partial<CloseProductSectionLine>
  ) => {
    setProductSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec
        return {
          ...sec,
          lines: sec.lines.map((line) => (line.id === lineId ? { ...line, ...patch } : line)),
        }
      })
    )
  }

  const removeProductSectionLine = (sectionId: string, lineId: string) => {
    setProductSections((prev) => {
      const next = prev.map((sec) =>
        sec.id !== sectionId
          ? sec
          : { ...sec, lines: sec.lines.filter((l) => l.id !== lineId) }
      )
      const sec = next.find((s) => s.id === sectionId)
      const remaining = sec?.lines ?? []
      setExpandedLineBySection((exp) => ({
        ...exp,
        [sectionId]:
          exp[sectionId] === lineId ? remaining[0]?.id ?? null : exp[sectionId] ?? null,
      }))
      return next
    })
  }

  const updateLineUnitPrice = (sectionId: string, lineId: string, unitPrice: number) => {
    setProductSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec
        return {
          ...sec,
          lines: sec.lines.map((line) =>
            line.id === lineId ? { ...line, price: unitPrice } : line
          ),
        }
      })
    )
  }

  const generateRowsFromRange = (
    parentId: string,
    fromClass: string,
    toClass: string,
    defaultStrength?: number,
    defaultPrice?: number
  ) => {
    setProductDetails((currentDetails) => {
      const parentRow = currentDetails.find((p) => p.id === parentId)
      if (!parentRow || !parentRow.isParentRow) return currentDetails

      const from = parseInt(fromClass, 10) || 0
      const to = parseInt(toClass, 10) || 0

      if ((from === 0 && to === 0) || from > to) {
        const otherParentRows = currentDetails.filter((p) => p.isParentRow && p.id !== parentId)
        const otherChildRows = currentDetails.filter(
          (p) => !p.isParentRow && !p.id.startsWith(parentId + '_')
        )
        const updatedParent = { ...parentRow, fromClass, toClass }
        return [...otherParentRows, updatedParent, ...otherChildRows]
      }
      const selectedSpecs = parentRow.selectedSpecs || []
      const specsToUse = selectedSpecs.length > 0 ? selectedSpecs : ['Regular']
      const selectedSubjects = parentRow.selectedSubjects || []
      const hasSubjects = hasProductSubjects(parentRow.product) && selectedSubjects.length > 0
      const subjectsToUse = hasSubjects ? selectedSubjects : [undefined]
      const selectedCategories = parentRow.selectedCategories || []
      const categoriesToUse = hasProductCategories(parentRow.product)
        ? selectedCategories.length > 0
          ? selectedCategories
          : getProductCategories(parentRow.product)
        : [schoolType === 'Existing' ? 'Existing Students' : 'New Students']

      const strengthToUse =
        typeof defaultStrength === 'number' ? defaultStrength : parentRow.strength || 0
      const priceToUse =
        typeof defaultPrice === 'number' ? defaultPrice : parentRow.price || 0

      const otherParentRows = currentDetails.filter((p) => p.isParentRow && p.id !== parentId)
      const otherChildRows = currentDetails.filter(
        (p) => !p.isParentRow && !p.id.startsWith(parentId + '_')
      )

      const newRows: Array<typeof parentRow> = []
      let rowIdx = 0
      for (let classNum = from; classNum <= to; classNum++) {
        specsToUse.forEach((spec) => {
          categoriesToUse.forEach((category) => {
            const subjectDisplay =
              hasSubjects && selectedSubjects.length > 0
                ? selectedSubjects.join(', ')
                : undefined
            newRows.push({
              id: parentId + '_' + classNum + '_' + rowIdx++,
              product: parentRow.product,
              class: classNum.toString(),
              category: category,
              productCategory: hasProductCategories(parentRow.product) ? category : undefined,
              quantity: strengthToUse || 1,
              strength: strengthToUse || 0,
              price: priceToUse || 0,
              total: (strengthToUse || 0) * (priceToUse || 0),
              level: parentRow.level,
              specs: spec,
              subject: subjectDisplay,
              isParentRow: false,
              sameRateForAllClasses: false,
            })
          })
        })
      }
      const updatedParent = { ...parentRow, fromClass, toClass }
      return [...otherParentRows, updatedParent, ...otherChildRows, ...newRows]
    })
  }

  const updateParentUnitPrice = (parentId: string, unitPrice: number) => {
    setProductDetails((currentDetails) =>
      currentDetails.map((row) => {
        if (row.id === parentId) {
          return { ...row, price: unitPrice }
        }
        if (!row.isParentRow && row.id.startsWith(parentId + '_')) {
          const strength = Number(row.strength) || 0
          return {
            ...row,
            price: unitPrice,
            total: strength * unitPrice,
          }
        }
        return row
      })
    )
  }

  const updateProductDetail = (id: string, field: string, value: any) => {
    setProductDetails((currentDetails) => {
      const rowToUpdate = currentDetails.find((p) => p.id === id)
      if (!rowToUpdate) return currentDetails

      const updated = { ...rowToUpdate, [field]: value }

      if (field === 'price' || field === 'strength') {
        updated.total = (Number(updated.strength) || 0) * (Number(updated.price) || 0)

        if (!rowToUpdate.isParentRow) {
          if (field === 'strength') {
            return currentDetails.map((p) => {
              if (
                !p.isParentRow &&
                p.product === updated.product &&
                p.class === updated.class
              ) {
                const newStrength = value
                const price = Number(p.price) || 0
                return {
                  ...p,
                  strength: newStrength,
                  total: (Number(newStrength) || 0) * price,
                }
              }
              if (p.id === id) return updated
              return p
            })
          }

          if (field === 'price') {
            const parentRow = currentDetails.find(
              (p) =>
                p.isParentRow &&
                p.product === rowToUpdate.product &&
                p.id === rowToUpdate.id.split('_')[0]
            )

            if (parentRow?.sameRateForAllClasses) {
              return currentDetails.map((p) => {
                if (
                  !p.isParentRow &&
                  p.product === updated.product &&
                  p.class === updated.class &&
                  p.level === updated.level
                ) {
                  const strength = Number(p.strength) || 0
                  const newPrice = value
                  return {
                    ...p,
                    price: newPrice,
                    total: strength * (Number(newPrice) || 0),
                  }
                }
                if (p.id === id) return updated
                return p
              })
            }
          }
        }
      }

      if (rowToUpdate.isParentRow && field === 'fromClass') {
        const newFrom = parseInt(String(value), 10)
        const currentTo = parseInt(String(updated.toClass || '0'), 10)
        if (!isNaN(newFrom) && !isNaN(currentTo) && currentTo < newFrom) {
          updated.toClass = String(newFrom)
        }
      }

      if (
        rowToUpdate.isParentRow &&
        (field === 'fromClass' ||
          field === 'toClass' ||
          field === 'selectedSubjects' ||
          field === 'selectedSpecs' ||
          field === 'selectedCategories')
      ) {
        setTimeout(() => {
          generateRowsFromRange(id, updated.fromClass || '0', updated.toClass || '0')
        }, 0)
      }

      return currentDetails.map((p) => (p.id === id ? updated : p))
    })
  }

  const removeProductDetail = (id: string) => {
    const rowToRemove = productDetails.find((p) => p.id === id)

    if (rowToRemove?.isParentRow) {
      setProductSections((prev) =>
        prev.map((sec) => ({
          ...sec,
          lines: sec.lines.filter((l) => l.parentRowId !== id),
        }))
      )
      return
    }
    setProductDetails(productDetails.filter((p) => p.id !== id))
    const remainingProducts = productDetails
      .filter((p) => p.id !== id)
      .map((p) => p.product)
      .filter((p, idx, arr) => arr.indexOf(p) === idx)
    setSelectedProducts(remainingProducts)
  }

  const buildDcOrderProducts = () =>
    buildDcOrderProductsFromDetails(childProductRows, {
      productDetails,
      getCalculationType,
      getCatalogFallbackCount,
      hasProductCategories,
      getProductCategories,
    })

  const validateProducts = (opts?: {
    requireDeliverables?: boolean
    requireUnitPrice?: boolean
  }) =>
    validateCloseLeadProductConfig({
      productDetails,
      productSections,
      deliverablesByProduct,
      getCalculationType,
      getCatalogFallbackCount,
      requireDeliverables: opts?.requireDeliverables,
      requireUnitPrice: opts?.requireUnitPrice,
    })

  return {
    // state
    productDialogOpen,
    setProductDialogOpen,
    productDetails,
    setProductDetails,
    productSections,
    setProductSections,
    expandedLineBySection,
    setExpandedLineBySection,
    selectedProducts,
    setSelectedProducts,
    deliverablesByProduct,
    setDeliverablesByProduct,
    // derived
    childProductRows,
    groupedChildProductRows,
    showSpecsColumn,
    showSubjectsColumn,
    filteredProducts,
    groupProductOpts,
    // catalog
    catalogProducts,
    availableProducts,
    getProductLevels,
    getDefaultLevel,
    getProductSpecs,
    getProductSubjects,
    hasProductSubjects,
    getProductCategories,
    hasProductCategories,
    getProductId,
    getCalculationType,
    getCatalogFallbackCount,
    // handlers
    lineAllowsProductConfig,
    toggleLineClass,
    updateLineClassStrength,
    applyLineBulkStrength,
    setLineSameStrengthForAll,
    lineBulkStrengthValue,
    addEmptyProductSection,
    removeProductSection,
    addProductLineToSection,
    updateProductSectionLine,
    removeProductSectionLine,
    updateLineUnitPrice,
    generateRowsFromRange,
    updateParentUnitPrice,
    updateProductDetail,
    removeProductDetail,
    // helpers
    sectionHasValidClassSelections,
    getLineClassSelections,
    lineHasValidClassSelections,
    buildDcOrderProducts,
    validateProducts,
    schoolType,
  }
}

export type CloseLeadProductConfigApi = ReturnType<typeof useCloseLeadProductConfig>
