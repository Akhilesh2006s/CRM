const DC = require('../models/DC');
const Sale = require('../models/Sale');
const DcOrder = require('../models/DcOrder');
const ProgramBilling = require('../models/ProgramBilling');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const StockMovement = require('../models/StockMovement');
const { normalizeCalculationType } = require('../utils/paymentDivisor');
const {
  recordLevelDelivery,
  recomputeProgramPayable,
  roundToTwo,
} = require('../services/programBillingService');
const ExcelJS = require('exceljs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateSetPendingDc } = require('../utils/dcStatusFlow');
const { validateRaiseDcDetails, validatePendingDcDetails } = require('../utils/raiseDcDetailsValidation');
const { partitionProductsForCloseLeadRouting, resolveExistingProductTerm, persistProductTerm } = require('../utils/productTerm');
const {
  siblingTermWiseRows,
  keepMyClientsOwnedProductRows,
  displayLevelValue,
  logDcProductAssoc,
} = require('../utils/productLineIdentity');
const { validateDcStockAgainstInventory } = require('../utils/warehouseInventoryMatch');
const { ensureDuplicatesConsolidated } = require('../utils/warehouseDuplicateConsolidate');

/** Closed Sales → Saved DC → Pending DC. Do not re-run Close Lead Term-Wise split/strip. */
const CLOSED_SALES_PIPELINE_ORDER_STATUSES = new Set([
  'dc_requested',
  'dc_accepted',
  'dc_approved',
  'dc_sent_to_senior',
]);
function isClosedSalesPipelineOrder(status) {
  return CLOSED_SALES_PIPELINE_ORDER_STATUSES.has(String(status || ''));
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/po');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'po-' + uniqueSuffix + ext);
  }
});

// File filter to accept images and PDFs
const fileFilter = (req, file, cb) => {
  // Accept images and PDFs
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG) and PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

const ALLOWED_SHORTAGE_ROLES = new Set(['Admin', 'Super Admin', 'Executive', 'Sales Executive']);

const {
  normalizeProductForKey,
  getShortageParentMatchKey,
  findParentRowForShortage,
} = require('../utils/shortageDcRowKey');

const getRowKey = (row = {}) => {
  const product = normalizeProductForKey(row.product || row.productName || '');
  const cls = String(row.class || '').trim().toLowerCase();
  const category = String(row.category || '').trim().toLowerCase();
  const term = String(row.term || 'Term 1').trim().toLowerCase();
  return `${product}::${cls}::${category}::${term}`;
};

const qtyFromRow = (row = {}) => {
  const quantity = Number(row.quantity);
  const strength = Number(row.strength);
  return Number.isFinite(quantity) && quantity > 0
    ? quantity
    : (Number.isFinite(strength) && strength > 0 ? strength : 0);
};

const STUDENT_ENROLLMENT_CATEGORIES = new Set([
  'new students',
  'existing students',
  'both',
  'new school',
  'existing school',
]);

const normalizeProductDetails = (rows = [], { isShortage = false } = {}) =>
  (Array.isArray(rows) ? rows : []).map((p) => {
    const quantity = qtyFromRow(p);
    const deliveredQuantity = Number.isFinite(Number(p.deliveredQuantity)) ? Number(p.deliveredQuantity) : 0;
    const shortageQuantity = Number.isFinite(Number(p.shortageQuantity))
      ? Number(p.shortageQuantity)
      : (isShortage ? quantity : 0);
    const strength = Number.isFinite(Number(p.strength)) && Number(p.strength) > 0 ? Number(p.strength) : quantity;
    const price = Number(p.price) || 0;
    const rawClass =
      p.class !== undefined && p.class !== null && String(p.class).trim() !== ''
        ? String(p.class).trim()
        : '';
    const classVal = rawClass && rawClass !== '0' ? rawClass : '1';
    const catRaw = typeof p.category === 'string' ? p.category.trim() : '';
    const catLower = catRaw.toLowerCase();
    const studentLike = catLower && STUDENT_ENROLLMENT_CATEGORIES.has(catLower);
    let productCategory =
      typeof p.productCategory === 'string' ? p.productCategory.trim() : '';
    if (productCategory && STUDENT_ENROLLMENT_CATEGORIES.has(productCategory.toLowerCase())) {
      productCategory = '';
    }
    if (!productCategory && catRaw && !studentLike) {
      productCategory = catRaw;
    }
    let specs =
      p.specs !== undefined && p.specs !== null && String(p.specs).trim() !== ''
        ? String(p.specs).trim()
        : '';
    if ((!specs || specs === 'Regular') && productCategory && !studentLike) {
      specs = productCategory;
    }
    if (!specs) specs = 'Regular';
    return {
      product: p.product || p.productName || '',
      class: classVal,
      category: (() => {
        const raw = String(p.category || '').trim();
        if (isShortage && (!raw || /^shortage$/i.test(raw))) return 'new Students';
        return raw || 'new Students';
      })(),
      productName: p.productName || p.product || '',
      productCategory: productCategory || undefined,
      quantity,
      deliveredQuantity,
      shortageQuantity,
      strength,
      price,
      total: Number(p.total) || (price * strength),
      level: displayLevelValue(p.level),
      specs,
      subject: p.subject || undefined,
      term: persistProductTerm(p),
      ...(p.closeLeadDestination === 'MY_CLIENT' || p.closeLeadDestination === 'TERM_WISE_DC'
        ? { closeLeadDestination: p.closeLeadDestination }
        : {}),
    };
  });

const calculateTotalQuantity = (rows = []) =>
  (Array.isArray(rows) ? rows : []).reduce((sum, row) => sum + qtyFromRow(row), 0);

/**
 * Persist per-product Close Lead routing for a sale:
 * My Clients DC gets MY_CLIENT rows; Term-Wise DC gets only paired Level 2 / Term 2 rows.
 * Removes incorrect Term-Wise companions (e.g. Term-2-only products).
 */
async function repairSaleCloseLeadRouting(dcOrderId) {
  if (!dcOrderId) return null;

  const order = await DcOrder.findById(dcOrderId).select('status').lean();
  const isPipeline = isClosedSalesPipelineOrder(order?.status);

  const sourceDcs = await DC.find({ dcOrderId }).sort({ createdAt: 1 });

  if (!sourceDcs.length) return null;

  const mainDcs = sourceDcs.filter((d) => d.status !== 'scheduled_for_later');
  const twDcs = sourceDcs.filter((d) => d.status === 'scheduled_for_later');
  const qty = (rows) =>
    rows.reduce((s, p) => s + (Number(p.quantity) || Number(p.strength) || 0), 0) || 1;
  const nameOf = (rows, fallback) =>
    (rows[0] && (rows[0].product || rows[0].productName)) || fallback;
  const toPlain = (p) => (typeof p.toObject === 'function' ? p.toObject() : { ...p });

  const twRows = [];
  for (const tw of twDcs) {
    for (const p of tw.productDetails || []) twRows.push(toPlain(p));
  }

  // Each DC is the source of truth. Never pool sibling lines back onto My Clients.
  // Always strip Term-Wise companions that leaked onto a My Clients DC — including
  // after Request DC (order is already in the Closed Sales pipeline).
  for (const mainDc of mainDcs) {
    const rows = (mainDc.productDetails || []).map(toPlain);
    const kept = keepMyClientsOwnedProductRows(rows, twRows);
    if (kept.length !== rows.length) {
      logDcProductAssoc('repairSale stripped Term-Wise companions from My Clients DC', {
        dcId: mainDc._id,
        orderId: dcOrderId,
        rows: kept,
      });
      mainDc.productDetails = normalizeProductDetails(kept);
      mainDc.requestedQuantity = qty(kept);
      mainDc.product = nameOf(kept, mainDc.product);
      await mainDc.save();
    }
  }

  // Do not create a new Term-Wise split once the sale is already in Closed Sales.
  if (isPipeline) return null;

  // Legacy only: Term-Wise DC is missing while My Clients still holds both stages.
  if (twDcs.length === 0 && mainDcs.length > 0) {
    const allRows = [];
    for (const d of mainDcs) {
      for (const p of d.productDetails || []) {
        const plain = toPlain(p);
        delete plain.closeLeadDestination;
        delete plain._id;
        allRows.push(plain);
      }
    }
    const { myClientsProducts, termWiseProducts, needsTermWiseSplit } =
      partitionProductsForCloseLeadRouting(allRows);
    if (needsTermWiseSplit && termWiseProducts.length > 0) {
      const mainDc = mainDcs[0];
      mainDc.productDetails = normalizeProductDetails(myClientsProducts);
      mainDc.requestedQuantity = qty(myClientsProducts);
      mainDc.product = nameOf(myClientsProducts, mainDc.product);
      await mainDc.save();
      await DC.create({
        dcOrderId: mainDc.dcOrderId,
        employeeId: mainDc.employeeId,
        customerName: mainDc.customerName,
        customerEmail: mainDc.customerEmail,
        customerAddress: mainDc.customerAddress,
        customerPhone: mainDc.customerPhone,
        product: nameOf(termWiseProducts, mainDc.product),
        requestedQuantity: qty(termWiseProducts),
        deliverableQuantity: 0,
        status: 'scheduled_for_later',
        createdBy: mainDc.createdBy,
        productDetails: normalizeProductDetails(termWiseProducts),
        dcType: 'normal',
        fulfillmentStatus: 'full',
        poPhotoUrl: mainDc.poPhotoUrl,
        poDocument: mainDc.poDocument,
      });
      return { myClientsProducts, termWiseProducts, needsTermWiseSplit };
    }
  }

  return { strippedLeaks: true };
}

const hasQuantityFieldsInUpdate = (body = {}) =>
  body.requestedQuantity !== undefined ||
  body.productDetails !== undefined ||
  body.availableQuantity !== undefined ||
  body.deliverableQuantity !== undefined;

const deriveLevelNumber = (dc) => {
  if (Number.isFinite(Number(dc.levelNumber)) && Number(dc.levelNumber) > 0) {
    return Number(dc.levelNumber);
  }
  const terms = (dc.productDetails || []).map((row) => String(row.term || '').trim().toLowerCase());
  if (terms.includes('term 2')) return 2;
  if (terms.includes('term 3')) return 3;
  return 1;
};

const deriveDeliveredStudents = (dc) =>
  (Array.isArray(dc.productDetails) ? dc.productDetails : []).reduce((sum, row) => {
    const delivered = Number(row.deliveredQuantity);
    if (Number.isFinite(delivered) && delivered >= 0) return sum + delivered;
    return sum;
  }, 0);

/**
 * Mutually exclusive workflow stage (ClosedSales → PendingDC → EmpDC → CompletedDC).
 * Updates both DC and parent DcOrder so list APIs never return the same sale twice.
 */
const {
  WORKFLOW_STAGE,
  workflowStageFromDcStatus,
  POST_CLOSED_SALES_STAGES,
} = require('../constants/dcWorkflow');

async function setSaleWorkflowStage(dcOrderId, stage, options = {}) {
  if (!dcOrderId || !stage) return;
  const orderId = dcOrderId._id || dcOrderId;
  const orderUpdate = { workflowStage: stage };

  // Closed Sales list uses status=dc_requested|dc_accepted. Leave those only on ClosedSales.
  if (POST_CLOSED_SALES_STAGES.includes(stage)) {
    orderUpdate.status = 'dc_sent_to_senior';
  }
  if (stage === WORKFLOW_STAGE.ClosedSales) {
    // Keep caller-provided Closed Sales statuses (dc_requested / dc_accepted / saved)
  }

  const updated = await DcOrder.findByIdAndUpdate(orderId, { $set: orderUpdate }, { new: true });
  if (!updated) {
    throw new Error(`DcOrder ${orderId} not found while setting workflowStage=${stage}`);
  }

  if (options.dcId) {
    await DC.findByIdAndUpdate(options.dcId, { $set: { workflowStage: stage } });
  } else if (options.syncAllLinkedDcs) {
    await DC.updateMany(
      { dcOrderId: orderId, status: { $ne: 'scheduled_for_later' } },
      { $set: { workflowStage: stage } }
    );
  }
  console.log(`📍 workflowStage → ${stage} (DcOrder ${orderId}, status → ${updated.status})`);
  return updated;
}

const PRE_CLOSED_SALES_ORDER_STATUSES = new Set([
  'saved',
  'pending',
  'completed',
  'hold',
  'in_transit',
]);

/**
 * My Clients "Request DC" (DC → po_submitted) must place the sale on Super Admin Closed Sales.
 * Do not wait for a second frontend PUT /dc-orders (that call can 403 or fail validators).
 */
async function promoteOrderToClosedSalesQueue(dcOrderId, userId, extra = {}) {
  if (!dcOrderId) return null;
  const orderId = dcOrderId._id || dcOrderId;
  const order = await DcOrder.findById(orderId);
  if (!order) return null;
  if (['dc_accepted', 'dc_approved', 'dc_sent_to_senior'].includes(order.status)) return order;
  if (
    order.status !== 'dc_requested' &&
    !PRE_CLOSED_SALES_ORDER_STATUSES.has(order.status)
  ) {
    return order;
  }

  const update = {
    status: 'dc_requested',
    workflowStage: WORKFLOW_STAGE.ClosedSales,
    requestedAt: order.requestedAt || new Date(),
  };
  if (userId) update.requestedBy = userId;
  else if (order.requestedBy) update.requestedBy = order.requestedBy;
  if (extra.pod_proof_url) update.pod_proof_url = extra.pod_proof_url;
  if (extra.dcRequestData) {
    const raw = extra.dcRequestData;
    const employeeId =
      raw.employeeId && typeof raw.employeeId === 'object' ? raw.employeeId._id : raw.employeeId;
    update.dcRequestData = {
      requestedQuantity: raw.requestedQuantity,
      productDetails: raw.productDetails,
      employeeId: employeeId || userId,
      dcRemarks: raw.dcRemarks,
      dcNotes: raw.dcNotes,
      dcCategory: raw.dcCategory,
      dcDate: raw.dcDate,
    };
  }

  const updated = await DcOrder.findByIdAndUpdate(orderId, { $set: update }, { new: true });
  console.log(`📍 Closed Sales queue ← DcOrder ${orderId} (${order.status} → dc_requested)`);
  return updated;
}

/** Keep DC.status and DC.workflowStage in lockstep. Pre-pipeline statuses must not stay EmpDC. */
async function syncDcWorkflowFromStatus(dc) {
  if (!dc) return null;
  const stage = workflowStageFromDcStatus(dc.status);
  const orderId = dc.dcOrderId?._id || dc.dcOrderId;

  if (stage) {
    dc.workflowStage = stage;
    await dc.save({ validateBeforeSave: false });
    if (orderId) {
      await setSaleWorkflowStage(orderId, stage, { dcId: dc._id });
    }
    return stage;
  }

  dc.workflowStage = undefined;
  await dc.save({ validateBeforeSave: false });
  await DC.updateOne({ _id: dc._id }, { $unset: { workflowStage: 1 } });
  if (orderId) {
    await DcOrder.updateOne(
      { _id: orderId },
      { $set: { workflowStage: WORKFLOW_STAGE.ClosedSales } }
    );
  }
  return null;
}

async function syncWorkflowFromDc(dc) {
  if (!dc) return;
  const stage = workflowStageFromDcStatus(dc.status);
  if (!stage) return;
  const orderId = dc.dcOrderId?._id || dc.dcOrderId;
  await setSaleWorkflowStage(orderId, stage, { dcId: dc._id });
}

const deriveUnitPrice = async (dc) => {
  const details = Array.isArray(dc.productDetails) ? dc.productDetails : [];
  const detailPrices = details
    .map((row) => Number(row.price))
    .filter((value) => Number.isFinite(value) && value >= 0);
  if (detailPrices.length > 0) {
    return detailPrices[0];
  }
  if (!dc.dcOrderId) return 0;
  const order = await DcOrder.findById(dc.dcOrderId).select('products').lean();
  const firstProduct = Array.isArray(order?.products) && order.products.length > 0 ? order.products[0] : null;
  return Number(firstProduct?.unit_price) || 0;
};

const deriveTotalLevels = async (dc) => {
  if (Number.isFinite(Number(dc.totalLevels)) && Number(dc.totalLevels) > 0) {
    return Number(dc.totalLevels);
  }
  if (!dc.dcOrderId) return 1;
  const siblingDcs = await DC.find({ dcOrderId: dc.dcOrderId }).select('levelNumber productDetails').lean();
  const levelsFromDcs = new Set();
  siblingDcs.forEach((row) => {
    if (Number.isFinite(Number(row.levelNumber)) && Number(row.levelNumber) > 0) {
      levelsFromDcs.add(Number(row.levelNumber));
      return;
    }
    const terms = (row.productDetails || []).map((p) => String(p.term || '').trim().toLowerCase());
    if (terms.includes('term 1')) levelsFromDcs.add(1);
    if (terms.includes('term 2')) levelsFromDcs.add(2);
    if (terms.includes('term 3')) levelsFromDcs.add(3);
  });
  return Math.max(1, levelsFromDcs.size || 1);
};

const escapeRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findProductCatalogByDcProductName = async (name) => {
  const n = String(name || '').trim();
  if (!n) return null;
  return Product.findOne({ productName: new RegExp(`^${escapeRegex(n)}$`, 'i') }).lean();
};

const deriveSubjectDivisorFromDc = (dc) => {
  const target = String(dc.product || '').toLowerCase().trim();
  const rows = Array.isArray(dc.productDetails) ? dc.productDetails : [];
  const subs = new Set();
  rows.forEach((row) => {
    const pn = String(row.product || row.productName || '').toLowerCase().trim();
    if (pn !== target) return;
    const s = String(row.subject || '').trim().toLowerCase();
    if (s) subs.add(s);
  });
  return Math.max(1, subs.size);
};

const deriveProgramPaymentDivisor = async (dc, productDoc) => {
  const ct = normalizeCalculationType(productDoc?.calculationType);
  if (ct === 'subject_based') {
    const fromRows = deriveSubjectDivisorFromDc(dc);
    const catalogCount = Array.isArray(productDoc?.subjects) ? productDoc.subjects.length : 0;
    return Math.max(1, fromRows > 1 ? fromRows : catalogCount || 1);
  }
  if (ct === 'level_based') {
    return deriveTotalLevels(dc);
  }
  return 1;
};

const deriveDeliverySlotNumber = (dc, productDoc) => {
  const ct = normalizeCalculationType(productDoc?.calculationType);
  if (ct !== 'subject_based') {
    return deriveLevelNumber(dc);
  }
  const target = String(dc.product || '').toLowerCase().trim();
  const rows = Array.isArray(dc.productDetails) ? dc.productDetails : [];
  const row = rows.find(
    (r) => String(r.product || '').toLowerCase().trim() === target && String(r.subject || '').trim()
  );
  const subj = String(row?.subject || '').trim().toLowerCase();
  const list = Array.isArray(productDoc?.subjects) ? productDoc.subjects : [];
  const idx = list.findIndex((s) => String(s).trim().toLowerCase() === subj);
  if (idx >= 0) return idx + 1;
  return deriveLevelNumber(dc);
};

const recomputeBillingForCompletedDC = async (dc) => {
  const featureFlag = String(process.env.ENABLE_PROGRAM_BILLING_ABACUS || 'false').toLowerCase() === 'true';
  if (!featureFlag) {
    return null;
  }
  const isLegacyAbacus = String(dc.product || '').toLowerCase() === 'abacus';
  let productDoc = await findProductCatalogByDcProductName(dc.product);
  if (!productDoc && isLegacyAbacus) {
    productDoc = { calculationType: 'level_based', subjects: [] };
  } else if (
    productDoc &&
    normalizeCalculationType(productDoc.calculationType) === 'normal' &&
    isLegacyAbacus
  ) {
    productDoc = { ...productDoc, calculationType: 'level_based' };
  }
  if (!productDoc || normalizeCalculationType(productDoc.calculationType) === 'normal') {
    return null;
  }

  const deliveredStudents = deriveDeliveredStudents(dc);
  const levelNumber = deriveDeliverySlotNumber(dc, productDoc);
  const totalLevels = await deriveProgramPaymentDivisor(dc, productDoc);
  const unitPrice = await deriveUnitPrice(dc);
  if (!dc.dcOrderId || deliveredStudents < 0 || unitPrice < 0) {
    return null;
  }

  let program = await ProgramBilling.findOne({
    dcOrderId: dc.dcOrderId,
    product: dc.product,
  });
  if (!program) {
    program = await ProgramBilling.create({
      dcOrderId: dc.dcOrderId,
      product: dc.product,
      totalLevels,
      unitPrice: roundToTwo(unitPrice),
      currency: 'INR',
    });
  } else if (program.totalLevels !== totalLevels || program.unitPrice !== unitPrice) {
    program.totalLevels = totalLevels;
    program.unitPrice = roundToTwo(unitPrice);
    await program.save();
  }

  await recordLevelDelivery({
    programId: program._id,
    levelNumber,
    studentsCount: deliveredStudents,
    dcId: dc._id,
    deliveredAt: dc.completedAt || new Date(),
  });

  return recomputeProgramPayable(program._id, { sourceDcId: dc._id });
};


// @desc    Get all DCs with filtering
// @route   GET /api/dc
// @access  Private
const getDCs = async (req, res) => {
  try {
    const { status, employeeId, saleId, dcOrderId, zone, schoolName, schoolCode, contactMobile, fromDate, toDate, visitCategory, workflowStage } = req.query;
    const filter = {};
    const andClauses = [];

    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;
    if (saleId) filter.saleId = saleId;
    if (dcOrderId) filter.dcOrderId = dcOrderId;
    if (visitCategory) filter.dcCategory = visitCategory;

    // All Created DCs (status=created): same complete list for Super Admin / Admin / Coordinator.
    // Page access is enforced by frontend route/RBAC; do not partial-filter Coordinators here.

    // List pages key off DC.status. Do not also require workflowStage — leftover EmpDC
    // after Accept / Send to Senior would hide the row from Pending DC entirely.
    if (!status && workflowStage) {
      filter.workflowStage = workflowStage;
    }
    
    // Date filtering on dcDate or createdAt
    if (fromDate || toDate) {
      const dateFilter = {};
      if (fromDate) dateFilter.$gte = new Date(fromDate);
      if (toDate) dateFilter.$lte = new Date(toDate + 'T23:59:59.999Z');
      andClauses.push({
        $or: [
          { dcDate: dateFilter },
          { createdAt: dateFilter },
        ],
      });
    }

    if (andClauses.length > 0) {
      filter.$and = andClauses;
    }

    // Optimize query - fetch without populate first, then populate if needed
    let dcs = await DC.find(filter)
      .select('_id saleId dcOrderId parentDcId clusterId dcType fulfillmentStatus employeeId customerName customerPhone customerEmail customerAddress product requestedQuantity availableQuantity deliverableQuantity status workflowStage poPhotoUrl poDocument productDetails dcDate dcRemarks deliveryNotes dcCategory dcNotes transport lrNo lrDate lrCost boxes transportArea deliveryStatus financeRemarks splApproval smeRemarks warehouseProcessedAt warehouseProcessedBy completedAt completedBy createdBy dc_code createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean()
      .maxTimeMS(20000); // 20 second timeout

    // Populate in a separate step if we got results (but don't fail if it times out)
    if (dcs && dcs.length > 0) {
      try {
        const populatedPromise = DC.find({ _id: { $in: dcs.map(dc => dc._id) } })
          .populate('saleId', 'customerName product quantity status poDocument')
          .populate('dcOrderId', 'school_name school_code school_type contact_person contact_mobile email address location zone products dc_code status assigned_to created_by createdAt')
          .populate('employeeId', 'name email role')
          .populate('createdBy', 'name email role')
          .populate('submittedBy', 'name email')
          .populate('warehouseProcessedBy', 'name email')
          .populate('deliverySubmittedBy', 'name email')
          .populate('completedBy', 'name email')
          .sort({ createdAt: -1 })
          .maxTimeMS(15000)
          .lean();
        
        const populatedTimeout = new Promise((resolve) => 
          setTimeout(() => resolve(dcs), 15000)
        );
        
        const populated = await Promise.race([populatedPromise, populatedTimeout]);
        if (populated && populated.length > 0 && Array.isArray(populated)) {
          dcs = populated;
        }
      } catch (popErr) {
        console.warn('Population failed, using unpopulated data:', popErr.message);
        // Keep unpopulated dcs
      }
    }

    // Apply additional filters that need to check populated fields
    let filteredDCs = dcs;
    
    if (zone) {
      filteredDCs = filteredDCs.filter(dc => 
        (dc.dcOrderId && dc.dcOrderId.zone && dc.dcOrderId.zone.toLowerCase().includes(zone.toLowerCase())) ||
        (dc.saleId && dc.saleId.zone && dc.saleId.zone.toLowerCase().includes(zone.toLowerCase()))
      );
    }
    
    if (schoolName) {
      filteredDCs = filteredDCs.filter(dc => 
        (dc.dcOrderId && dc.dcOrderId.school_name && dc.dcOrderId.school_name.toLowerCase().includes(schoolName.toLowerCase())) ||
        (dc.customerName && dc.customerName.toLowerCase().includes(schoolName.toLowerCase()))
      );
    }
    
    if (schoolCode) {
      const q = schoolCode.toLowerCase();
      filteredDCs = filteredDCs.filter(dc => {
        if (!dc.dcOrderId) return false;
        const code = (dc.dcOrderId.school_code || dc.dcOrderId.dc_code || '').toLowerCase();
        return code.includes(q);
      });
    }
    
    if (contactMobile) {
      filteredDCs = filteredDCs.filter(dc => 
        (dc.dcOrderId && dc.dcOrderId.contact_mobile && dc.dcOrderId.contact_mobile.includes(contactMobile)) ||
        (dc.customerPhone && dc.customerPhone.includes(contactMobile))
      );
    }

    // Pending DC: one row per school/sale. Duplicates often have different dcOrderIds
    // (same school_code) after repeated Create Sale / Raise — collapse by school identity.
    if (status === 'pending_dc' || String(workflowStage || '') === 'PendingDC') {
      const identityKey = (dc) => {
        const code = String(dc.dcOrderId?.school_code || '').trim().toUpperCase();
        if (code) return `code:${code}`;
        const name = String(dc.dcOrderId?.school_name || dc.customerName || '')
          .toLowerCase()
          .trim();
        const phone = String(dc.dcOrderId?.contact_mobile || dc.customerPhone || '').trim();
        if (name && phone) return `np:${name}|${phone}`;
        if (name) return `n:${name}`;
        return `id:${String(dc.dcOrderId?._id || dc.dcOrderId || dc._id)}`;
      };

      const byIdentity = new Map();
      const losers = [];
      for (const dc of filteredDCs) {
        const key = identityKey(dc);
        const prev = byIdentity.get(key);
        if (!prev) {
          byIdentity.set(key, dc);
          continue;
        }
        const prevTime = new Date(prev.updatedAt || prev.createdAt || 0).getTime();
        const curTime = new Date(dc.updatedAt || dc.createdAt || 0).getTime();
        if (curTime >= prevTime) {
          losers.push(prev);
          byIdentity.set(key, dc);
        } else {
          losers.push(dc);
        }
      }
      filteredDCs = Array.from(byIdentity.values());

      // Soft-remove duplicate pending rows so they never reappear
      if (losers.length > 0) {
        const loserIds = losers.map((d) => d._id).filter(Boolean);
        DC.updateMany(
          { _id: { $in: loserIds }, status: 'pending_dc' },
          { $set: { status: 'created', workflowStage: null } }
        ).catch((err) => console.warn('Failed to demote duplicate pending DCs:', err?.message));
        console.log(`🧹 Demoted ${loserIds.length} duplicate Pending DC row(s)`);
      }
    }

    // Persist per-product Close Lead routing so Term-Wise / My Clients survive refresh.
    // Fixes legacy sales that wrongly stored Term-2-only (or whole-sale) rows on Term-Wise.
    if (
      status === 'scheduled_for_later' ||
      status === 'created' ||
      status === 'po_submitted'
    ) {
      const orderIds = [
        ...new Set(
          filteredDCs
            .map((dc) => String(dc.dcOrderId?._id || dc.dcOrderId || ''))
            .filter(Boolean)
        ),
      ];
      for (const orderId of orderIds) {
        try {
          await repairSaleCloseLeadRouting(orderId);
        } catch (repairErr) {
          console.warn('repairSaleCloseLeadRouting failed:', orderId, repairErr?.message || repairErr);
        }
      }
      if (orderIds.length > 0) {
        const existingIds = filteredDCs.map((dc) => dc._id);
        let refreshed = await DC.find({ _id: { $in: existingIds } })
          .populate('saleId', 'customerName product quantity status poDocument')
          .populate('dcOrderId', 'school_name school_code school_type contact_person contact_mobile email address location zone products dc_code status assigned_to created_by createdAt')
          .populate('employeeId', 'name email role')
          .populate('createdBy', 'name email role')
          .lean();

        if (status === 'scheduled_for_later') {
          refreshed = refreshed.filter((dc) => dc.status === 'scheduled_for_later');
          const extras = await DC.find({
            dcOrderId: { $in: orderIds },
            status: 'scheduled_for_later',
            _id: { $nin: existingIds },
          })
            .populate('saleId', 'customerName product quantity status poDocument')
            .populate('dcOrderId', 'school_name school_code school_type contact_person contact_mobile email address location zone products dc_code status assigned_to created_by createdAt')
            .populate('employeeId', 'name email role')
            .populate('createdBy', 'name email role')
            .lean();
          refreshed = [...refreshed, ...extras];
        } else {
          refreshed = refreshed.filter((dc) => dc.status === status);
        }
        filteredDCs = refreshed;
      }
    }

    res.json(filteredDCs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single DC
// @route   GET /api/dc/:id
// @access  Private
const getDC = async (req, res) => {
  try {
    const dc = await DC.findById(req.params.id)
      .populate('saleId', 'customerName product quantity status poDocument poSubmittedAt poSubmittedBy')
      .populate({
        path: 'dcOrderId',
        select:
          'school_name school_code school_type dc_code contact_person contact_mobile email address location zone cluster_code products due_amount due_percentage transport_name transport_location transportation_landmark pincode assigned_to remarks status',
        populate: { path: 'assigned_to', select: 'name email cluster' },
      })
      .populate('parentDcId', '_id dc_code status requestedQuantity deliverableQuantity fulfillmentStatus dcType')
      .populate('employeeId', 'name email cluster')
      .populate('adminId', 'name email')
      .populate('managerId', 'name email')
      .populate('warehouseId', 'name email')
      .populate('createdBy', 'name email')
      .populate('submittedBy', 'name email')
      .populate('warehouseProcessedBy', 'name email')
      .populate('deliverySubmittedBy', 'name email')
      .populate('completedBy', 'name email');

    if (!dc) {
      return res.status(404).json({ message: 'DC not found' });
    }

    if (
      dc.status !== 'scheduled_for_later' &&
      dc.dcOrderId &&
      Array.isArray(dc.productDetails)
    ) {
      const twRows = await siblingTermWiseRows(DC, dc.dcOrderId._id || dc.dcOrderId, dc._id);
      const owned = keepMyClientsOwnedProductRows(dc.productDetails, twRows);
      logDcProductAssoc('GET /dc/:id My Clients owned rows', {
        dcId: dc._id,
        orderId: dc.dcOrderId._id || dc.dcOrderId,
        rows: owned,
      });
      dc.productDetails = owned;
    }

    // Ensure productDetails always have specs and subject fields
    // Only set defaults if they're actually missing (undefined/null), not if they're empty strings
    if (dc.productDetails && Array.isArray(dc.productDetails)) {
      dc.productDetails = dc.productDetails.map(p => ({
        ...p,
        specs: (p.specs !== undefined && p.specs !== null && p.specs !== '') ? p.specs : 'Regular',
        subject: (p.subject !== undefined && p.subject !== null && p.subject !== '') ? p.subject : undefined,
        term: persistProductTerm(p),
      }));
    }

    res.json(dc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Raise DC from closed deal (Admin can do this)
// @route   POST /api/dc/raise
// @access  Private
const raiseDC = async (req, res) => {
  try {
    console.log('📦 RAISE DC request received:', {
      dcOrderId: req.body.dcOrderId,
      employeeId: req.body.employeeId,
      status: req.body.status,
      hasProductDetails: !!req.body.productDetails,
      productDetailsCount: req.body.productDetails?.length || 0
    });
    
    const { dcOrderId, dcDate, dcRemarks, dcCategory, dcNotes, requestedQuantity } = req.body;
    let productDetailsFromBody = req.body.productDetails && Array.isArray(req.body.productDetails) ? req.body.productDetails : null;

    if (!dcOrderId) {
      console.log('❌ DC Order ID is missing');
      return res.status(400).json({ message: 'DC Order ID is required' });
    }

    // Closed Sales Raise/Accept/Send defaults to pending_dc — require DC Date + Category.
    // Saved DC Submit may send requireDcRemarks: true to also require Remarks.
    // Other raise callers (lead convert → created, term split → scheduled_for_later) skip this.
    const statusForDetailsValidation = req.body.status || 'pending_dc';
    if (statusForDetailsValidation === 'pending_dc') {
      const detailsCheck = validateRaiseDcDetails(req.body, {
        requireRemarks: Boolean(req.body.requireDcRemarks),
      });
      if (!detailsCheck.ok) {
        return res.status(400).json({ message: detailsCheck.message });
      }
    }

    const DcOrder = require('../models/DcOrder');
    const Lead = require('../models/Lead');
    let dcOrder = await DcOrder.findById(dcOrderId)
      .populate('assigned_to', 'name email');

    // If no DcOrder found, the id may be a Lead id (close lead from follow-up → Turn to Client)
    if (!dcOrder) {
      const lead = await Lead.findById(dcOrderId);
      if (lead) {
        console.log('📋 Lead found (converting to client), creating DcOrder from lead:', lead.school_name);
        const productsFromDetails = (productDetailsFromBody && Array.isArray(productDetailsFromBody))
          ? productDetailsFromBody.map(p => ({
              product_name: p.product || p.product_name || 'Abacus',
              quantity: Number(p.quantity) || Number(p.strength) || 1,
              unit_price: Number(p.price) || 0,
              class: p.class ? String(p.class).trim() : '1',
              strength: Number(p.strength) || Number(p.quantity) || 0,
              level: p.level,
              term: persistProductTerm(p),
              specs: p.specs,
              subject: p.subject,
              selected_subjects: Array.isArray(p.selected_subjects) ? p.selected_subjects : undefined,
              closeLeadDestination: p.closeLeadDestination,
              lineId: p.lineId,
            }))
          : (lead.products && lead.products.length) ? lead.products : [{ product_name: 'Abacus', quantity: 1, unit_price: 0 }];
        const { ensureSchoolCode } = require('../utils/clientSchoolCode');
        const schoolCodeForClient = await ensureSchoolCode(lead);
        dcOrder = await DcOrder.create({
          school_name: lead.school_name || 'School',
          school_code: schoolCodeForClient || lead.school_code,
          contact_person: lead.contact_person,
          contact_mobile: lead.contact_mobile,
          email: lead.email,
          location: lead.location,
          zone: lead.zone,
          region: lead.region,
          city: lead.city,
          school_type: lead.school_type || 'New',
          products: productsFromDetails,
          assigned_to: req.body.employeeId || req.user._id,
          status: 'completed',
          estimated_delivery_date: req.body.dcDate ? new Date(req.body.dcDate) : undefined,
          created_by: req.user._id,
        });
        console.log('✅ DcOrder created from lead:', dcOrder._id);
      }
    }

    if (!dcOrder) {
      console.log('❌ DcOrder/Lead not found:', dcOrderId);
      return res.status(404).json({ message: 'Deal/Lead not found' });
    }

    // Prevent duplicate Raise: sale already in PendingDC / EmpDC / CompletedDC pipeline
    const requestedRaiseStatus = req.body.status || 'pending_dc';
    if (requestedRaiseStatus === 'pending_dc') {
      const alreadyRaised = await DC.findOne({
        dcOrderId: dcOrder._id,
        status: { $in: ['pending_dc', 'sent_to_manager', 'warehouse_processing', 'hold', 'completed'] },
      }).sort({ createdAt: -1 });

      if (alreadyRaised && req.body.forceNew === true) {
        return res.status(400).json({
          message: 'DC already raised',
          dcId: alreadyRaised._id,
          status: alreadyRaised.status,
          workflowStage: alreadyRaised.workflowStage,
        });
      }
      if (
        alreadyRaised &&
        ['sent_to_manager', 'warehouse_processing', 'hold', 'completed'].includes(alreadyRaised.status)
      ) {
        return res.status(400).json({
          message: 'DC already raised',
          dcId: alreadyRaised._id,
          status: alreadyRaised.status,
          workflowStage: alreadyRaised.workflowStage,
        });
      }

      // Same school (school_code / name+phone) already has a Pending DC under another DcOrder
      const schoolCode = String(dcOrder.school_code || '').trim();
      const schoolName = String(dcOrder.school_name || '').trim();
      const mobile = String(dcOrder.contact_mobile || '').trim();
      const siblingFilter = [];
      if (schoolCode) siblingFilter.push({ school_code: schoolCode });
      if (schoolName && mobile) {
        siblingFilter.push({
          school_name: new RegExp(`^${schoolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
          contact_mobile: mobile,
        });
      }
      if (siblingFilter.length > 0) {
        const siblingOrders = await DcOrder.find({ $or: siblingFilter }).select('_id').lean();
        const siblingIds = siblingOrders
          .map((o) => o._id)
          .filter((id) => String(id) !== String(dcOrder._id));
        if (siblingIds.length > 0) {
          const schoolPending = await DC.findOne({
            dcOrderId: { $in: siblingIds },
            status: { $in: ['pending_dc', 'sent_to_manager', 'warehouse_processing', 'hold'] },
          }).sort({ createdAt: -1 });
          if (schoolPending) {
            return res.status(400).json({
              message: 'DC already raised',
              dcId: schoolPending._id,
              status: schoolPending.status,
              workflowStage: schoolPending.workflowStage,
            });
          }
        }
      }
    }

    if (!dcOrder.school_code) {
      const { ensureSchoolCode } = require('../utils/clientSchoolCode');
      const code = await ensureSchoolCode(dcOrder);
      if (code) {
        dcOrder.school_code = code;
        await dcOrder.save();
      }
    }

    // Resolve employeeId once
    let employeeId = req.body.employeeId || req.body.assignedTo
      || (dcOrder.assigned_to ? (typeof dcOrder.assigned_to === 'object' ? dcOrder.assigned_to._id : dcOrder.assigned_to) : null)
      || req.user._id;
    if (!employeeId) {
      return res.status(400).json({ message: 'Deal must be assigned to an employee before raising DC.' });
    }

    const requestedDcType = req.body.dcType === 'shortage' ? 'shortage' : 'normal';
    const parentDcId = req.body.parentDcId || null;

    if (requestedDcType === 'shortage') {
      if (!parentDcId) {
        return res.status(400).json({ message: 'parentDcId is required for shortage DC' });
      }
      const parentDc = await DC.findById(parentDcId).lean();
      if (!parentDc) {
        return res.status(404).json({ message: 'Parent DC not found' });
      }
      if (String(parentDc.dcOrderId) !== String(dcOrder._id)) {
        return res.status(400).json({ message: 'Shortage DC must use the same dcOrderId as parent DC' });
      }
      if (parentDc.status !== 'completed') {
        return res.status(400).json({ message: 'Shortage DC can only be raised for a completed parent DC' });
      }

      const shortageRows = normalizeProductDetails(productDetailsFromBody || [], { isShortage: true });
      if (!shortageRows.length) {
        return res.status(400).json({ message: 'At least one shortage product line is required' });
      }

      const siblingShortages = await DC.find({ parentDcId: parentDc._id, dcType: 'shortage', status: { $ne: 'hold' } })
        .select('productDetails')
        .lean();
      const consumedByRow = new Map();
      siblingShortages.forEach((dcRow) => {
        (dcRow.productDetails || []).forEach((p) => {
          const key = getShortageParentMatchKey(p);
          const current = consumedByRow.get(key) || 0;
          consumedByRow.set(key, current + qtyFromRow(p));
        });
      });

      for (const row of shortageRows) {
        const key = getShortageParentMatchKey(row);
        const parentRow = findParentRowForShortage(parentDc.productDetails, row);
        if (!parentRow) {
          return res.status(400).json({ message: `Shortage item "${row.product}" not found on parent DC` });
        }
        const parentQty = qtyFromRow(parentRow);
        const alreadyShortaged = consumedByRow.get(key) || 0;
        const remaining = parentQty - alreadyShortaged;
        if (qtyFromRow(row) <= 0 || qtyFromRow(row) > remaining) {
          return res.status(400).json({
            message: `Invalid shortage quantity for "${row.product}". Remaining allowed: ${Math.max(remaining, 0)}`,
          });
        }
      }

      const shortageQty = requestedQuantity != null ? Number(requestedQuantity) : calculateTotalQuantity(shortageRows);
      const shortageDc = await DC.create({
        dcOrderId: dcOrder._id,
        employeeId,
        customerName: dcOrder.school_name,
        customerEmail: dcOrder.email || undefined,
        customerAddress: dcOrder.address || dcOrder.location || 'N/A',
        customerPhone: dcOrder.contact_mobile || dcOrder.contact_person || 'N/A',
        product: (shortageRows[0] && (shortageRows[0].product || shortageRows[0].productName)) || 'Abacus',
        requestedQuantity: shortageQty || 1,
        deliverableQuantity: 0,
        status: req.body.status || 'pending_dc',
        createdBy: req.user._id,
        productDetails: shortageRows,
        dcType: 'shortage',
        parentDcId: parentDc._id,
        clusterId: parentDc.clusterId || parentDc._id.toString(),
        fulfillmentStatus: 'partial',
        ...(req.body.dcDate && { dcDate: new Date(req.body.dcDate) }),
        ...(req.body.dcRemarks && { dcRemarks: req.body.dcRemarks }),
        ...(req.body.dcCategory && { dcCategory: req.body.dcCategory }),
        ...(req.body.dcNotes && { dcNotes: req.body.dcNotes }),
      });

      await DC.findByIdAndUpdate(parentDc._id, {
        $set: {
          fulfillmentStatus: 'partial',
          clusterId: parentDc.clusterId || parentDc._id.toString(),
        },
      });

      const populatedShortageDc = await DC.findById(shortageDc._id)
        .populate('dcOrderId', 'school_name school_code contact_person contact_mobile email address location zone products dc_code')
        .populate('parentDcId', '_id dc_code status requestedQuantity deliveredQuantity fulfillmentStatus')
        .populate('employeeId', 'name email')
        .populate('createdBy', 'name email');
      return res.status(200).json(populatedShortageDc);
    }

    // --- Close Lead row routing (group by product) ---
    // Level/Term 2 → Term-Wise ONLY when the same product also has Level/Term 1.
    // Term 2 alone / Level 2 alone / no term → My Clients.
    const {
      myClientsProducts,
      termWiseProducts,
      needsTermWiseSplit: closeLeadNeedsSplit,
    } = partitionProductsForCloseLeadRouting(productDetailsFromBody || []);
    const keepClosedSalesProducts = isClosedSalesPipelineOrder(dcOrder.status);
    const needsTermWiseSplit = keepClosedSalesProducts ? false : closeLeadNeedsSplit;
    const mainStatus = req.body.status || 'pending_dc';

    // Closed Sales Raise must not re-split, but must not keep leaked sibling Term-Wise rows.
    if (keepClosedSalesProducts && productDetailsFromBody && mainStatus !== 'scheduled_for_later') {
      const twRows = await siblingTermWiseRows(DC, dcOrder._id);
      productDetailsFromBody = keepMyClientsOwnedProductRows(productDetailsFromBody, twRows);
      req.body.productDetails = productDetailsFromBody;
      logDcProductAssoc('raiseDC Closed Sales payload after DC-owned filter', {
        orderId: dcOrder._id,
        rows: productDetailsFromBody,
      });
    }

    const buildDcPayload = (details, status, qty) => {
      const productName = (details && details[0] && (details[0].product || details[0].productName)) || (dcOrder.products && dcOrder.products[0] && dcOrder.products[0].product_name) || 'Abacus';
      const normalizedDetails = normalizeProductDetails(details || []);
      const payload = {
        dcOrderId: dcOrder._id,
        employeeId,
        customerName: dcOrder.school_name,
        customerEmail: dcOrder.email || undefined,
        customerAddress: dcOrder.address || dcOrder.location || 'N/A',
        customerPhone: dcOrder.contact_mobile || dcOrder.contact_person || 'N/A',
        product: productName,
        requestedQuantity: qty,
        deliverableQuantity: 0,
        status,
        workflowStage: workflowStageFromDcStatus(status) || undefined,
        createdBy: req.user._id,
        productDetails: normalizedDetails,
        dcType: 'normal',
        fulfillmentStatus: 'full',
        ...(req.body.dcDate && { dcDate: new Date(req.body.dcDate) }),
        ...(req.body.dcRemarks && { dcRemarks: req.body.dcRemarks }),
        ...(req.body.dcCategory && { dcCategory: req.body.dcCategory }),
        ...(req.body.dcNotes && { dcNotes: req.body.dcNotes }),
      };
      if (req.body.poPhotoUrl) {
        payload.poPhotoUrl = req.body.poPhotoUrl;
        payload.poDocument = req.body.poPhotoUrl;
      } else if (dcOrder.pod_proof_url) {
        payload.poPhotoUrl = dcOrder.pod_proof_url;
        payload.poDocument = dcOrder.pod_proof_url;
      }
      return payload;
    };

    if (needsTermWiseSplit) {
      // My Clients portion keeps caller status (created on Close Lead; pending_dc on Closed Sales raise).
      // Paired Level 2 / Term 2 rows only → Term-Wise DC (scheduled_for_later).
      let resolvedMainStatus = mainStatus;
      if (resolvedMainStatus === 'pending_dc') {
        const existingForCheck = await DC.findOne({ dcOrderId: dcOrder._id }).sort({ createdAt: -1 });
        const pendingCheck = validateSetPendingDc(existingForCheck, req.user?.role, 'pending_dc');
        if (!pendingCheck.allowed) {
          resolvedMainStatus = pendingCheck.coercedStatus || 'po_submitted';
        }
      }

      const myClientsQty = myClientsProducts.reduce((s, p) => s + (Number(p.quantity) || Number(p.strength) || 0), 0) || 1;
      const termWiseQty = termWiseProducts.reduce((s, p) => s + (Number(p.quantity) || Number(p.strength) || 0), 0) || 1;
      const existingDcs = await DC.find({ dcOrderId: dcOrder._id }).sort({ status: 1, createdAt: 1 });
      const dcMain = existingDcs.find(d => d.status !== 'scheduled_for_later');
      let dcTerm2 = existingDcs.find(d => d.status === 'scheduled_for_later');
      const mainStage = workflowStageFromDcStatus(resolvedMainStatus);

      if (dcMain) {
        dcMain.productDetails = normalizeProductDetails(myClientsProducts);
        dcMain.requestedQuantity = myClientsQty;
        dcMain.status = resolvedMainStatus;
        if (mainStage) dcMain.workflowStage = mainStage;
        else dcMain.workflowStage = undefined;
        dcMain.dcType = 'normal';
        dcMain.fulfillmentStatus = 'full';
        if (req.body.dcDate) dcMain.deliveryDate = new Date(req.body.dcDate);
        if (req.body.dcRemarks) dcMain.deliveryNotes = req.body.dcRemarks;
        if (req.body.dcNotes) dcMain.deliveryNotes = req.body.dcNotes ? (dcMain.deliveryNotes ? dcMain.deliveryNotes + '\n' + req.body.dcNotes : req.body.dcNotes) : dcMain.deliveryNotes;
        if (req.body.poPhotoUrl) { dcMain.poPhotoUrl = req.body.poPhotoUrl; dcMain.poDocument = req.body.poPhotoUrl; }
        if (!dcMain.poPhotoUrl && dcOrder.pod_proof_url) { dcMain.poPhotoUrl = dcOrder.pod_proof_url; dcMain.poDocument = dcOrder.pod_proof_url; }
        const mainProductName = (myClientsProducts[0] && (myClientsProducts[0].product || myClientsProducts[0].productName)) || dcMain.product;
        if (mainProductName) dcMain.product = mainProductName;
        console.log('💾 Saving My Clients DC (split) with productDetails:', {
          dcId: dcMain._id,
          status: resolvedMainStatus,
          productDetailsCount: dcMain.productDetails.length,
        });
        await dcMain.save();
        if (!mainStage) {
          await DC.updateOne({ _id: dcMain._id }, { $unset: { workflowStage: 1 } });
        }
      } else {
        const payload = buildDcPayload(myClientsProducts, resolvedMainStatus, myClientsQty);
        console.log('💾 Creating My Clients DC (split) with productDetails:', {
          status: resolvedMainStatus,
          productDetailsCount: payload.productDetails?.length || 0,
        });
        await DC.create(payload);
      }

      if (dcTerm2) {
        dcTerm2.productDetails = normalizeProductDetails(termWiseProducts);
        dcTerm2.requestedQuantity = termWiseQty;
        dcTerm2.status = 'scheduled_for_later';
        dcTerm2.dcType = 'normal';
        dcTerm2.fulfillmentStatus = 'full';
        const twName = (termWiseProducts[0] && (termWiseProducts[0].product || termWiseProducts[0].productName)) || dcTerm2.product;
        if (twName) dcTerm2.product = twName;
        if (req.body.dcDate) dcTerm2.deliveryDate = new Date(req.body.dcDate);
        if (req.body.poPhotoUrl) { dcTerm2.poPhotoUrl = req.body.poPhotoUrl; dcTerm2.poDocument = req.body.poPhotoUrl; }
        await dcTerm2.save();
      } else {
        const payload = buildDcPayload(termWiseProducts, 'scheduled_for_later', termWiseQty);
        dcTerm2 = await DC.create(payload);
      }

      // Remove leftover Term-Wise DCs for this sale (e.g. prior Term-2-only misroutes).
      if (dcTerm2?._id) {
        await DC.deleteMany({
          dcOrderId: dcOrder._id,
          status: 'scheduled_for_later',
          _id: { $ne: dcTerm2._id },
        });
      }

      const mainDc =
        (await DC.findOne({ dcOrderId: dcOrder._id, status: resolvedMainStatus }).sort({ createdAt: -1 })) ||
        (await DC.findOne({ dcOrderId: dcOrder._id, status: { $ne: 'scheduled_for_later' } }).sort({ createdAt: -1 }));
      const toReturn = mainDc || (await DC.findOne({ dcOrderId: dcOrder._id }).sort({ createdAt: -1 }));
      if (!dcOrder.assigned_to && employeeId) {
        await DcOrder.findByIdAndUpdate(dcOrder._id, { assigned_to: employeeId });
      }
      if (toReturn && resolvedMainStatus === 'pending_dc') {
        toReturn.status = 'pending_dc';
        toReturn.workflowStage = WORKFLOW_STAGE.PendingDC;
        await toReturn.save().catch(() => {});
        await setSaleWorkflowStage(dcOrder._id, WORKFLOW_STAGE.PendingDC, {
          dcId: toReturn._id,
          syncAllLinkedDcs: true,
        });
      } else if (toReturn) {
        await syncDcWorkflowFromStatus(toReturn);
      }
      await repairSaleCloseLeadRouting(dcOrder._id).catch((e) =>
        console.warn('post-raise repair failed:', e?.message || e)
      );
      const populatedDC = await DC.findById(toReturn._id)
        .populate('dcOrderId', 'school_name contact_person contact_mobile email address location zone products')
        .populate('saleId', 'customerName product quantity status poDocument')
        .populate('employeeId', 'name email')
        .populate('createdBy', 'name email');
      return res.status(200).json(populatedDC);
    }

    // Single DC — all rows are My Clients (includes Term 2 / Level 2 alone).
    // Prefer stamped rows from partition when body had productDetails.
    if (productDetailsFromBody && myClientsProducts.length > 0 && !keepClosedSalesProducts) {
      productDetailsFromBody = myClientsProducts;
      req.body.productDetails = myClientsProducts;
    }
    // No paired Term-Wise rows → remove leftover Term-Wise DCs (Close Lead only).
    if (!keepClosedSalesProducts) {
      await DC.deleteMany({ dcOrderId: dcOrder._id, status: 'scheduled_for_later' });
    }
    let requestedStatus = mainStatus;
    if (requestedStatus === 'pending_dc') {
      const existingForCheck = await DC.findOne({ dcOrderId: dcOrder._id }).sort({ createdAt: -1 });
      const pendingCheck = validateSetPendingDc(existingForCheck, req.user?.role, 'pending_dc');
      if (!pendingCheck.allowed) {
        requestedStatus = pendingCheck.coercedStatus || 'po_submitted';
      }
    }

    // Prefer an already-raised pipeline DC. Never let sort({status:1}) pick a leftover
    // status="created" row and promote it into a SECOND pending_dc.
    const PIPELINE_STATUSES = ['pending_dc', 'sent_to_manager', 'warehouse_processing', 'hold', 'completed'];
    let dc =
      (await DC.findOne({
        dcOrderId: dcOrder._id,
        status: { $in: PIPELINE_STATUSES },
      }).sort({ createdAt: -1 })) ||
      (await DC.findOne({
        dcOrderId: dcOrder._id,
        status: { $ne: 'scheduled_for_later' },
      }).sort({ createdAt: -1 }));

    if (requestedStatus === 'pending_dc' && dc && PIPELINE_STATUSES.includes(dc.status) && dc.status !== 'pending_dc') {
      return res.status(400).json({
        message: 'DC already raised',
        dcId: dc._id,
        status: dc.status,
        workflowStage: dc.workflowStage,
      });
    }

    const isTerm2Only = requestedStatus === 'scheduled_for_later' && dc && dc.status !== 'scheduled_for_later';
    if (dc && !isTerm2Only) {
      if (req.body.employeeId || req.body.assignedTo) dc.employeeId = req.body.employeeId || req.body.assignedTo;
      if (!dc.poPhotoUrl && dcOrder.pod_proof_url) { dc.poPhotoUrl = dcOrder.pod_proof_url; dc.poDocument = dcOrder.pod_proof_url; }
      if (req.body.poPhotoUrl) { dc.poPhotoUrl = req.body.poPhotoUrl; dc.poDocument = req.body.poPhotoUrl; }
      if (productDetailsFromBody && Array.isArray(productDetailsFromBody)) dc.productDetails = normalizeProductDetails(productDetailsFromBody);
      dc.status = requestedStatus;
      dc.dcType = 'normal';
      dc.fulfillmentStatus = 'full';
      if (req.body.requestedQuantity !== undefined) dc.requestedQuantity = req.body.requestedQuantity;
    }
    if (isTerm2Only) dc = null;

    if (!dc) {
      // Final duplicate guard before insert
      const dup = await DC.findOne({
        dcOrderId: dcOrder._id,
        status: { $in: PIPELINE_STATUSES },
      });
      if (dup) {
        return res.status(400).json({
          message: 'DC already raised',
          dcId: dup._id,
          status: dup.status,
          workflowStage: dup.workflowStage,
        });
      }
      const quantity = requestedQuantity != null ? requestedQuantity : (productDetailsFromBody && productDetailsFromBody.length > 0
        ? productDetailsFromBody.reduce((s, p) => s + (Number(p.quantity) || Number(p.strength) || 0), 0) || 1
        : (dcOrder.products && dcOrder.products.reduce((s, p) => s + (p.quantity || 1), 0)) || 1);
      const productName = (productDetailsFromBody && productDetailsFromBody[0] && (productDetailsFromBody[0].product || productDetailsFromBody[0].productName)) || (dcOrder.products && dcOrder.products[0] && dcOrder.products[0].product_name) || 'Abacus';
      dc = await DC.create({
        dcOrderId: dcOrder._id,
        employeeId,
        customerName: dcOrder.school_name,
        customerEmail: dcOrder.email || undefined,
        customerAddress: dcOrder.address || dcOrder.location || 'N/A',
        customerPhone: dcOrder.contact_mobile || dcOrder.contact_person || 'N/A',
        product: productName,
        requestedQuantity: quantity,
        deliverableQuantity: 0,
        status: requestedStatus,
        createdBy: req.user._id,
        productDetails: productDetailsFromBody ? normalizeProductDetails(productDetailsFromBody) : undefined,
        dcType: 'normal',
        fulfillmentStatus: 'full',
        ...(req.body.dcDate && { dcDate: new Date(req.body.dcDate), deliveryDate: new Date(req.body.dcDate) }),
        ...(req.body.dcRemarks && { dcRemarks: req.body.dcRemarks, deliveryNotes: req.body.dcRemarks }),
        ...(req.body.dcCategory && { dcCategory: req.body.dcCategory }),
        ...(req.body.dcNotes && { dcNotes: req.body.dcNotes }),
      });
      if (!dcOrder.assigned_to && employeeId) await DcOrder.findByIdAndUpdate(dcOrder._id, { assigned_to: employeeId });
      if (dcOrder.pod_proof_url) { dc.poPhotoUrl = dcOrder.pod_proof_url; dc.poDocument = dcOrder.pod_proof_url; }
      if (req.body.poPhotoUrl) { dc.poPhotoUrl = req.body.poPhotoUrl; dc.poDocument = req.body.poPhotoUrl; }
    }

    if (req.body.dcDate) {
      dc.dcDate = new Date(req.body.dcDate);
      dc.deliveryDate = new Date(req.body.dcDate);
    }
    if (req.body.dcRemarks !== undefined) {
      dc.dcRemarks = req.body.dcRemarks;
      if (req.body.dcRemarks) dc.deliveryNotes = req.body.dcRemarks;
    }
    if (req.body.dcCategory !== undefined) dc.dcCategory = req.body.dcCategory;
    if (req.body.dcNotes !== undefined) {
      dc.dcNotes = req.body.dcNotes;
      if (req.body.dcNotes) {
        dc.deliveryNotes = dc.deliveryNotes
          ? `${dc.deliveryNotes}\n${req.body.dcNotes}`
          : req.body.dcNotes;
      }
    }
    if (productDetailsFromBody && Array.isArray(productDetailsFromBody)) {
      dc.productDetails = normalizeProductDetails(productDetailsFromBody);
      if (req.body.requestedQuantity == null && productDetailsFromBody.length > 0) {
        const totalQty = productDetailsFromBody.reduce((sum, p) => sum + (Number(p.quantity) || Number(p.strength) || 0), 0);
        if (totalQty > 0) dc.requestedQuantity = totalQty;
      }
    }
    if (req.body.requestedQuantity !== undefined) dc.requestedQuantity = req.body.requestedQuantity;
    dc.status = requestedStatus;
    const raisedStageInline = workflowStageFromDcStatus(requestedStatus);
    if (raisedStageInline) dc.workflowStage = raisedStageInline;
    else dc.workflowStage = undefined;
    if (req.body.poPhotoUrl && !dc.poPhotoUrl) { dc.poPhotoUrl = req.body.poPhotoUrl; dc.poDocument = req.body.poPhotoUrl; }
    await dc.save();
    await syncDcWorkflowFromStatus(dc);

    // Collapse accidental duplicate pending_dc rows for the same sale (keep this one)
    if (requestedStatus === 'pending_dc' && dc?._id) {
      const extras = await DC.find({
        dcOrderId: dcOrder._id,
        status: 'pending_dc',
        _id: { $ne: dc._id },
      }).select('_id');
      if (extras.length > 0) {
        await DC.deleteMany({ _id: { $in: extras.map((e) => e._id) } });
        console.log(`🧹 Removed ${extras.length} duplicate pending_dc for DcOrder ${dcOrder._id}`);
      }
      // Also clear leftover pre-raise shells so they cannot be promoted again
      await DC.updateMany(
        {
          dcOrderId: dcOrder._id,
          status: { $in: ['created', 'po_submitted'] },
          _id: { $ne: dc._id },
        },
        { $set: { status: 'created' } }
      );
    }

    await repairSaleCloseLeadRouting(dcOrder._id).catch((e) =>
      console.warn('post-raise repair failed:', e?.message || e)
    );

    const populatedDC = await DC.findById(dc._id)
      .populate('dcOrderId', 'school_name contact_person contact_mobile email address location zone products')
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email');

    res.status(200).json(populatedDC);
  } catch (error) {
    console.error('Error raising DC:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit Saved DC to Senior Coordinator (Pending DC)
// @route   POST /api/dc/:id/submit-to-manager
// @access  Private (Admin / Coordinator)
const submitDCToManager = async (req, res) => {
  try {
    const { requestedQuantity, remarks } = req.body;

    const dc = await DC.findById(req.params.id);
    if (!dc) {
      return res.status(404).json({ message: 'DC not found' });
    }

    const pendingCheck = validateSetPendingDc(dc, req.user?.role, 'pending_dc');
    if (!pendingCheck.allowed) {
      return res.status(400).json({ message: pendingCheck.message });
    }

    if (requestedQuantity) dc.requestedQuantity = requestedQuantity;
    if (remarks) dc.deliveryNotes = remarks;

    // Saved DC / Closed Sales → Senior Coordinator = Pending DC.
    // Warehouse (sent_to_manager / EmpDC) is only set by manager-request after Pending DC.
    dc.status = 'pending_dc';
    dc.workflowStage = WORKFLOW_STAGE.PendingDC;
    dc.adminId = req.user._id;
    dc.adminReviewedAt = new Date();
    dc.adminReviewedBy = req.user._id;
    await dc.save();

    await syncDcWorkflowFromStatus(dc);

    const populatedDC = await DC.findById(dc._id)
      .populate('dcOrderId', 'school_name contact_person contact_mobile email address location zone products')
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('employeeId', 'name email')
      .populate('managerId', 'name email');

    res.json(populatedDC);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Manager requests quantity from warehouse
// @route   POST /api/dc/:id/request-warehouse
// @access  Private
const requestWarehouse = async (req, res) => {
  try {
    const { requestedQuantity } = req.body;

    if (!requestedQuantity || requestedQuantity <= 0) {
      return res.status(400).json({ message: 'Valid requested quantity is required' });
    }

    const dc = await DC.findById(req.params.id);
    if (!dc) {
      return res.status(404).json({ message: 'DC not found' });
    }

    if (dc.status !== 'Pending') {
      return res.status(400).json({ message: `DC must be in Pending status. Current status: ${dc.status}` });
    }

    // Update DC with requested quantity and move to Warehouse
    dc.requestedQuantity = requestedQuantity;
    dc.status = 'Warehouse';
    dc.warehouseRequestedAt = new Date();
    await dc.save();

    const populatedDC = await DC.findById(dc._id)
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email');

    res.json(populatedDC);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Warehouse updates quantities and submits
// @route   POST /api/dc/:id/warehouse-submit
// @access  Private
const warehouseSubmit = async (req, res) => {
  try {
    const { availableQuantity, deliverableQuantity } = req.body;

    const dc = await DC.findById(req.params.id);
    if (!dc) {
      return res.status(404).json({ message: 'DC not found' });
    }

    if (dc.status !== 'Warehouse') {
      return res.status(400).json({ message: `DC must be in Warehouse status. Current status: ${dc.status}` });
    }

    // Update quantities
    if (availableQuantity !== undefined) dc.availableQuantity = availableQuantity;
    if (deliverableQuantity !== undefined) {
      if (deliverableQuantity < 0) {
        return res.status(400).json({ message: 'Deliverable quantity cannot be negative' });
      }
      dc.deliverableQuantity = deliverableQuantity;
    }

    // Move to Employee status
    dc.status = 'Employee';
    dc.warehouseProcessedAt = new Date();
    dc.warehouseProcessedBy = req.user._id;
    await dc.save();

    const populatedDC = await DC.findById(dc._id)
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('employeeId', 'name email')
      .populate('warehouseProcessedBy', 'name email');

    res.json(populatedDC);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Employee submits delivery
// @route   POST /api/dc/:id/delivery-submit
// @access  Private
const deliverySubmit = async (req, res) => {
  try {
    const { deliveryNotes, deliveryProof, deliveredAt } = req.body;

    const dc = await DC.findById(req.params.id);
    if (!dc) {
      return res.status(404).json({ message: 'DC not found' });
    }

    if (dc.status !== 'Employee') {
      return res.status(400).json({ message: `DC must be in Employee status. Current status: ${dc.status}` });
    }

    // Update delivery details
    if (deliveryNotes !== undefined) dc.deliveryNotes = deliveryNotes;
    if (deliveryProof !== undefined) dc.deliveryProof = deliveryProof;
    if (deliveredAt) {
      dc.deliveredAt = new Date(deliveredAt);
    } else {
      dc.deliveredAt = new Date();
    }

    // Mark delivery as submitted (status stays Employee until Manager approves)
    dc.deliverySubmittedAt = new Date();
    dc.deliverySubmittedBy = req.user._id;
    await dc.save();

    const populatedDC = await DC.findById(dc._id)
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('employeeId', 'name email')
      .populate('deliverySubmittedBy', 'name email');

    res.json(populatedDC);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Manager approves DC and marks as Completed
// @route   POST /api/dc/:id/complete
// @access  Private
const completeDC = async (req, res) => {
  try {
    const dc = await DC.findById(req.params.id);
    if (!dc) {
      return res.status(404).json({ message: 'DC not found' });
    }

    if (dc.status !== 'Employee' || !dc.deliverySubmittedAt) {
      return res.status(400).json({ message: 'DC must be delivered and submitted by employee before completion' });
    }

    // Move to Completed
    dc.status = 'Completed';
    dc.completedAt = new Date();
    dc.completedBy = req.user._id;
    dc.workflowStage = WORKFLOW_STAGE.CompletedDC;
    await dc.save();
    await setSaleWorkflowStage(dc.dcOrderId, WORKFLOW_STAGE.CompletedDC, { dcId: dc._id });

    // Update sale status if needed
    if (dc.saleId) {
      const sale = await Sale.findById(dc.saleId);
      if (sale && sale.status !== 'Completed') {
        sale.status = 'Completed';
        await sale.save();
      }
    }

    try {
      await recomputeBillingForCompletedDC(dc);
    } catch (billingErr) {
      console.error('Program billing recompute failed in completeDC:', billingErr.message);
    }

    const populatedDC = await DC.findById(dc._id)
      .populate('saleId', 'customerName product quantity status')
      .populate('employeeId', 'name email')
      .populate('completedBy', 'name email');

    res.json(populatedDC);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Manager puts DC on Hold
// @route   POST /api/dc/:id/hold
// @access  Private
const holdDC = async (req, res) => {
  try {
    const { holdReason } = req.body;

    const dc = await DC.findById(req.params.id);
    if (!dc) {
      return res.status(404).json({ message: 'DC not found' });
    }

    // DC can be put on hold from sent_to_manager (warehouse), warehouse_processing, or legacy Employee/Warehouse status
    const allowedForHold = ['sent_to_manager', 'warehouse_processing', 'Employee', 'Warehouse'];
    if (!allowedForHold.includes(dc.status)) {
      return res.status(400).json({ message: `DC can only be put on hold from sent_to_manager or warehouse_processing. Current status: ${dc.status}` });
    }

    dc.status = 'hold';
    dc.holdReason = holdReason || 'No reason provided';
    dc.workflowStage = WORKFLOW_STAGE.EmpDC;
    await dc.save();
    await setSaleWorkflowStage(dc.dcOrderId, WORKFLOW_STAGE.EmpDC, { dcId: dc._id });

    const populatedDC = await DC.findById(dc._id)
      .populate('saleId', 'customerName product quantity status')
      .populate('employeeId', 'name email');

    res.json(populatedDC);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending DCs (for Manager)
// @route   GET /api/dc/pending
// @access  Private
const getPendingDCs = async (req, res) => {
  try {
    const dcs = await DC.find({ status: 'Pending' })
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('employeeId', 'name email')
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(dcs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get warehouse DCs (for Warehouse dashboard)
// @route   GET /api/dc/warehouse
// @access  Private
const getWarehouseDCs = async (req, res) => {
  try {
    const dcs = await DC.find({ status: 'Warehouse' })
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('employeeId', 'name email')
      .sort({ warehouseRequestedAt: -1 });

    res.json(dcs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get employee DCs (for Employee dashboard)
// @route   GET /api/dc/employee
// @access  Private
const getEmployeeDCs = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const filter = { status: 'Employee' };

    if (employeeId) {
      filter.employeeId = employeeId;
    }

    const dcs = await DC.find(filter)
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('employeeId', 'name email')
      .sort({ warehouseProcessedAt: -1 });

    res.json(dcs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get completed DCs (for Manager/Warehouse)
// @route   GET /api/dc/completed
// @access  Private
const getCompletedDCs = async (req, res) => {
  try {
    // Prefer workflowStage; fall back to legacy status for unmigrated docs
    let dcs = await DC.find({
      $or: [
        { workflowStage: WORKFLOW_STAGE.CompletedDC },
        { workflowStage: { $exists: false }, status: 'completed' },
        { workflowStage: null, status: 'completed' },
        { status: 'completed', workflowStage: WORKFLOW_STAGE.CompletedDC },
      ],
    })
      .select('_id saleId dcOrderId parentDcId clusterId dcType fulfillmentStatus employeeId customerName customerPhone customerEmail customerAddress product requestedQuantity availableQuantity deliverableQuantity status workflowStage poPhotoUrl poDocument productDetails dcDate dcRemarks deliveryNotes dcCategory dcNotes transport lrNo lrDate lrCost boxes transportArea deliveryStatus financeRemarks splApproval smeRemarks warehouseProcessedAt warehouseProcessedBy completedAt completedBy createdAt updatedAt')
      .sort({ completedAt: -1, createdAt: -1 })
      .lean()
      .maxTimeMS(20000);

    // Populate if we got results
    if (dcs && dcs.length > 0) {
      try {
        const populatedPromise = DC.find({ _id: { $in: dcs.map(dc => dc._id) }, status: 'completed' })
          .select('_id saleId dcOrderId parentDcId clusterId dcType fulfillmentStatus employeeId customerName customerPhone customerEmail customerAddress product requestedQuantity availableQuantity deliverableQuantity status poPhotoUrl poDocument productDetails dcDate dcRemarks deliveryNotes dcCategory dcNotes transport lrNo lrDate lrCost boxes transportArea deliveryStatus financeRemarks splApproval smeRemarks warehouseProcessedAt warehouseProcessedBy completedAt completedBy createdAt updatedAt')
          .populate('saleId', 'customerName product quantity status')
          .populate('dcOrderId', 'school_name school_code school_type contact_person contact_mobile email address location zone products dc_code')
          .populate('parentDcId', '_id dc_code status requestedQuantity deliverableQuantity fulfillmentStatus dcType')
          .populate('employeeId', 'name email')
          .populate('completedBy', 'name email')
          .populate('warehouseProcessedBy', 'name email')
          .sort({ completedAt: -1, createdAt: -1 }) // Sort by completedAt first, then createdAt as fallback
          .maxTimeMS(15000)
          .lean();
        
        const populatedTimeout = new Promise((resolve) => 
          setTimeout(() => resolve(dcs), 15000)
        );
        
        const populated = await Promise.race([populatedPromise, populatedTimeout]);
        if (populated && populated.length > 0 && Array.isArray(populated)) {
          dcs = populated;
        }
      } catch (popErr) {
        console.warn('Population failed for completed DCs, using unpopulated data:', popErr.message);
      }
    }

    console.log(`Found ${dcs.length} completed DCs`);
    
    // Ensure we return an array even if query fails
    if (!Array.isArray(dcs)) {
      console.warn('getCompletedDCs: dcs is not an array, returning empty array');
      dcs = [];
    }
    
    res.json(dcs);
  } catch (error) {
    console.error('Error in getCompletedDCs:', error);
    // Return empty array on error to prevent frontend from breaking
    if (error.message && error.message.includes('timed out')) {
      console.warn('Query timed out, returning empty array');
      return res.json([]);
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get hold DCs (for Manager)
// @route   GET /api/dc/hold
// @access  Private
const getHoldDCs = async (req, res) => {
  try {
    const dcs = await DC.find({ status: 'hold' })
      .populate('saleId', 'customerName product quantity status')
      .populate('dcOrderId', 'school_name school_code school_type contact_person contact_mobile email address location zone products dc_code')
      .populate('employeeId', 'name email')
      .populate('managerId', 'name email')
      .populate('warehouseId', 'name email')
      .sort({ updatedAt: -1 });

    res.json(dcs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Employee stats for DC
// @route   GET /api/dc/stats/employee
// @access  Private
const employeeStats = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const match = {};
    if (employeeId) match.employeeId = employeeId;

    const agg = await DC.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const totals = agg.reduce(
      (acc, row) => {
        acc.byStatus[row._id] = row.count;
        acc.total += row.count;
        return acc;
      },
      { total: 0, byStatus: { Pending: 0, Warehouse: 0, Employee: 0, Completed: 0, Hold: 0 } }
    );

    res.json(totals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Employee submits PO (Purchase Order)
// @route   POST /api/dc/:id/submit-po
// @access  Private
const submitPO = async (req, res) => {
  try {
    const { poPhotoUrl, remarks } = req.body;

    if (!poPhotoUrl) {
      return res.status(400).json({ message: 'PO photo URL is required' });
    }

    const dc = await DC.findById(req.params.id);
    if (!dc) {
      return res.status(404).json({ message: 'DC not found' });
    }

    // Check if DC is in correct status
    if (dc.status !== 'created') {
      return res.status(400).json({ message: `DC must be in 'created' status. Current status: ${dc.status}` });
    }

    // Check if employee is assigned to this DC
    if (!dc.employeeId) {
      return res.status(400).json({ message: 'DC does not have an assigned employee' });
    }
    
    if (dc.employeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to submit PO for this DC' });
    }

    // Update DC with PO photo and change status
    dc.poPhotoUrl = poPhotoUrl;
    dc.poDocument = poPhotoUrl; // Also update legacy field
    dc.status = 'po_submitted';
    dc.poSubmittedAt = new Date();
    dc.poSubmittedBy = req.user._id;
    if (remarks) {
      dc.deliveryNotes = remarks;
    }
    await dc.save();

    // Do not mark DcOrder completed here. Closed Sales is dc_requested after Request DC.
    // Close Lead PO upload stays in My Clients (saved) until the executive requests DC.

    // Update sale PO document if linked to Sale (optional, don't fail if Sale doesn't exist)
    if (dc.saleId) {
      try {
        const Sale = require('../models/Sale');
        await Sale.findByIdAndUpdate(dc.saleId, {
          poDocument: poPhotoUrl,
          poSubmittedAt: new Date(),
          poSubmittedBy: req.user._id,
        });
      } catch (err) {
        console.warn('Could not update Sale with PO document:', err.message);
        // Don't fail the entire operation if Sale update fails
      }
    }

    // Update DcOrder if linked to DcOrder (when created from deal/lead)
    if (dc.dcOrderId) {
      try {
        const DcOrder = require('../models/DcOrder');
        // Store PO proof only; DcOrder stays saved until executive requests DC (Closed Sales gate)
        await DcOrder.findByIdAndUpdate(dc.dcOrderId, {
          pod_proof_url: poPhotoUrl,
          updatedAt: new Date(),
        });
      } catch (err) {
        console.warn('Could not update DcOrder with PO document:', err.message);
        // Don't fail the entire operation if DcOrder update fails
      }
    }

    const populatedDC = await DC.findById(dc._id)
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('dcOrderId', 'school_name contact_person contact_mobile email address location zone products')
      .populate('employeeId', 'name email')
      .populate('poSubmittedBy', 'name email');

    res.json(populatedDC);
  } catch (error) {
    console.error('Error submitting PO:', error);
    console.error('Error stack:', error.stack);
    // Return more detailed error message in development
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Failed to submit PO. Please try again.' 
      : error.message || error.toString();
    res.status(500).json({ message: errorMessage });
  }
};

// @desc    Admin reviews and approves/rejects PO, forwards to Manager
// @route   POST /api/dc/:id/admin-review
// @access  Private (Admin only)
const adminReviewPO = async (req, res) => {
  try {
    const { action, remarks } = req.body; // action: 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: "Action must be 'approve' or 'reject'" });
    }

    const dc = await DC.findById(req.params.id);
    if (!dc) {
      return res.status(404).json({ message: 'DC not found' });
    }

    // Check if DC is in correct status
    if (dc.status !== 'po_submitted') {
      return res.status(400).json({ message: `DC must be in 'po_submitted' status. Current status: ${dc.status}` });
    }

    if (action === 'reject') {
      // Reject: Reset to created status
      dc.status = 'created';
      dc.poPhotoUrl = null;
      dc.poDocument = null;
      dc.poSubmittedAt = null;
      dc.poSubmittedBy = null;
      if (remarks) {
        dc.holdReason = `Rejected by Admin: ${remarks}`;
      }
    } else {
      // Approve: Forward to Manager
      dc.status = 'sent_to_manager';
      dc.adminId = req.user._id;
      dc.adminReviewedAt = new Date();
      dc.adminReviewedBy = req.user._id;
      dc.sentToManagerAt = new Date();
      if (remarks) {
        dc.deliveryNotes = remarks;
      }
    }
    await dc.save();

    const populatedDC = await DC.findById(dc._id)
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('employeeId', 'name email')
      .populate('adminId', 'name email')
      .populate('adminReviewedBy', 'name email');

    res.json(populatedDC);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Manager raises quantity request to Warehouse
// @route   POST /api/dc/:id/manager-request
// @access  Private (Manager only)
const managerRequestWarehouse = async (req, res) => {
  try {
    const dc = await DC.findById(req.params.id);
    if (!dc) {
      return res.status(404).json({ message: 'DC not found' });
    }

    if (dc.status === 'sent_to_manager' || dc.status === 'warehouse_processing') {
      const populatedDC = await DC.findById(dc._id)
        .populate('saleId', 'customerName product quantity status poDocument')
        .populate('employeeId', 'name email')
        .populate('managerId', 'name email')
        .populate('managerRequestedBy', 'name email');
      return res.json(populatedDC);
    }

    if (dc.status !== 'pending_dc') {
      return res.status(400).json({ message: `DC must be in 'pending_dc' status. Current status: ${dc.status}` });
    }

    const pendingDetailsCheck = validatePendingDcDetails({
      dcDate: dc.dcDate ? new Date(dc.dcDate).toISOString().slice(0, 10) : '',
      dcCategory: dc.dcCategory || '',
      financeRemarks: dc.financeRemarks || '',
      splApproval: dc.splApproval || '',
      dcRemarks: dc.dcRemarks || '',
      dcNotes: dc.dcNotes || '',
    });
    if (!pendingDetailsCheck.ok) {
      return res.status(400).json({ message: pendingDetailsCheck.message });
    }

    const bodyQty = Number(req.body.requestedQuantity);
    const detailsQty = calculateTotalQuantity(dc.productDetails);
    const requestedQuantity =
      Number.isFinite(bodyQty) && bodyQty > 0
        ? bodyQty
        : detailsQty;
    if (!requestedQuantity || requestedQuantity <= 0) {
      return res.status(400).json({ message: 'Valid requested quantity is required' });
    }

    dc.requestedQuantity = requestedQuantity;
    dc.status = 'sent_to_manager';
    dc.managerId = req.user._id;
    dc.managerRequestedAt = new Date();
    dc.managerRequestedBy = req.user._id;
    dc.sentToManagerAt = new Date();
    if (req.body.remarks) {
      dc.deliveryNotes = req.body.remarks;
    }
    dc.workflowStage = WORKFLOW_STAGE.EmpDC;
    await dc.save({ validateBeforeSave: false });

    try {
      await setSaleWorkflowStage(dc.dcOrderId, WORKFLOW_STAGE.EmpDC, { dcId: dc._id });
    } catch (stageErr) {
      console.warn('managerRequestWarehouse workflowStage sync failed:', stageErr?.message || stageErr);
    }

    const populatedDC = await DC.findById(dc._id)
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('employeeId', 'name email')
      .populate('managerId', 'name email')
      .populate('managerRequestedBy', 'name email');

    res.json(populatedDC);
  } catch (error) {
    console.error('managerRequestWarehouse error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Warehouse processes DC and submits
// @route   POST /api/dc/:id/warehouse-process
// @access  Private (Warehouse only)
const warehouseProcess = async (req, res) => {
  try {
    const { availableQuantity, deliverableQuantity, remarks } = req.body;

    const dc = await DC.findById(req.params.id);
    if (!dc) {
      return res.status(404).json({ message: 'DC not found' });
    }

    if (dc.status !== 'sent_to_manager' && dc.status !== 'warehouse_processing') {
      return res.status(400).json({ message: `DC must be in 'sent_to_manager' or 'warehouse_processing' status. Current status: ${dc.status}` });
    }

    if (deliverableQuantity !== undefined && deliverableQuantity < 0) {
      return res.status(400).json({ message: 'Deliverable quantity cannot be negative' });
    }

    const rows = (Array.isArray(dc.productDetails) ? dc.productDetails : []).map((r) =>
      r && typeof r.toObject === 'function' ? r.toObject() : r
    );
    try {
      await ensureDuplicatesConsolidated();
    } catch (mergeErr) {
      console.warn('Warehouse duplicate consolidate skipped:', mergeErr?.message || mergeErr);
    }
    const inventory = await Warehouse.find({});
    const stockCheck = validateDcStockAgainstInventory(rows, inventory);
    if (!stockCheck.ok) {
      return res.status(400).json({
        message: stockCheck.message,
        insufficient: stockCheck.insufficient,
      });
    }

    for (const alloc of stockCheck.allocations) {
      const splits =
        Array.isArray(alloc.splits) && alloc.splits.length > 0
          ? alloc.splits
          : alloc.item && alloc.requiredQty > 0
            ? [{ item: alloc.item, qty: alloc.requiredQty }]
            : [];
      for (const split of splits) {
        if (!split.item || split.qty <= 0) continue;
        const warehouseItem =
          inventory.find((i) => String(i._id) === String(split.item._id)) || split.item;
        const before = Number(warehouseItem.currentStock) || 0;
        if (before < split.qty) {
          return res.status(400).json({
            message: stockCheck.message || 'Insufficient stock. Please ensure sufficient stock before processing this DC.',
            insufficient: stockCheck.insufficient,
          });
        }
        warehouseItem.currentStock = before - split.qty;
        await warehouseItem.save();
        await StockMovement.create({
          productId: warehouseItem._id,
          movementType: 'Out',
          quantity: split.qty,
          reason: `DC ${dc._id} - ${dc.customerName || 'Customer'}`,
          createdBy: req.user._id,
        });
      }
    }

    if (availableQuantity !== undefined) dc.availableQuantity = availableQuantity;
    if (deliverableQuantity !== undefined) {
      dc.deliverableQuantity = deliverableQuantity;
    }

    dc.status = 'completed';
    dc.warehouseId = req.user._id;
    dc.warehouseProcessedAt = new Date();
    dc.warehouseProcessedBy = req.user._id;
    dc.completedAt = new Date();
    dc.completedBy = req.user._id;

    if (dc.availableQuantity !== undefined && dc.deliverableQuantity !== undefined &&
        dc.availableQuantity > dc.deliverableQuantity) {
      dc.listedAt = new Date();
    }

    if (remarks) {
      dc.deliveryNotes = remarks;
    }
    dc.workflowStage = WORKFLOW_STAGE.CompletedDC;
    await dc.save({ validateBeforeSave: false });

    try {
      await setSaleWorkflowStage(dc.dcOrderId, WORKFLOW_STAGE.CompletedDC, { dcId: dc._id });
    } catch (stageErr) {
      console.warn('warehouseProcess workflowStage sync failed:', stageErr?.message || stageErr);
    }

    try {
      await recomputeBillingForCompletedDC(dc);
    } catch (billingErr) {
      console.error('Program billing recompute failed in warehouseProcess:', billingErr.message);
    }

    const populatedDC = await DC.findById(dc._id)
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('employeeId', 'name email')
      .populate('warehouseId', 'name email')
      .populate('warehouseProcessedBy', 'name email');

    res.json(populatedDC);
  } catch (error) {
    console.error('warehouseProcess error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get DCs with PO submitted (for Admin review)
// @route   GET /api/dc/po-submitted
// @access  Private (Admin)
const getPOSubmittedDCs = async (req, res) => {
  try {
    const dcs = await DC.find({ status: 'po_submitted' })
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('employeeId', 'name email')
      .populate('poSubmittedBy', 'name email')
      .sort({ poSubmittedAt: -1 });

    res.json(dcs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get DCs sent to manager (for Manager review)
// @route   GET /api/dc/sent-to-manager
// @access  Private (Manager)
const getSentToManagerDCs = async (req, res) => {
  try {
    const dcs = await DC.find({
      status: { $in: ['sent_to_manager', 'warehouse_processing'] },
      $or: [
        { workflowStage: WORKFLOW_STAGE.EmpDC },
        { workflowStage: { $exists: false } },
        { workflowStage: null },
      ],
    })
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('dcOrderId', 'school_name contact_person contact_mobile email address location zone products pod_proof_url')
      .populate('employeeId', 'name email')
      .populate('adminId', 'name email')
      .populate('adminReviewedBy', 'name email')
      .sort({ sentToManagerAt: -1 });

    console.log(`Found ${dcs.length} DCs with status 'sent_to_manager'`);
    res.json(dcs);
  } catch (error) {
    console.error('Error in getSentToManagerDCs:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get DCs pending warehouse (for Warehouse processing)
// @route   GET /api/dc/pending-warehouse
// @access  Private (Warehouse)
const getPendingWarehouseDCs = async (req, res) => {
  try {
    // Only after Pending DC → Submit to Warehouse (sent_to_manager / EmpDC).
    // Do not treat PendingDC, Saved DC (created), or leftover EmpDC flags as warehouse-ready.
    const dcs = await DC.find({
      status: { $in: ['sent_to_manager', 'warehouse_processing'] },
      $or: [
        { workflowStage: WORKFLOW_STAGE.EmpDC },
        { workflowStage: { $exists: false } },
        { workflowStage: null },
      ],
    })
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate({
        path: 'dcOrderId',
        select:
          'school_name school_code school_type dc_code contact_person contact_mobile email address location zone cluster_code products transport_name transport_location transportation_landmark pincode assigned_to remarks',
        populate: { path: 'assigned_to', select: 'name email cluster' },
      })
      .populate('employeeId', 'name email cluster')
      .populate('managerId', 'name email')
      .populate('managerRequestedBy', 'name email')
      .sort({ managerRequestedAt: -1, sentToManagerAt: -1, createdAt: -1 });

    // Ensure productDetails always have specs and subject fields
    // Only set defaults if they're actually missing (undefined/null), not if they're empty strings
    dcs.forEach(dc => {
      if (dc.productDetails && Array.isArray(dc.productDetails)) {
        dc.productDetails = dc.productDetails.map(p => ({
          ...p,
          specs: (p.specs !== undefined && p.specs !== null && p.specs !== '') ? p.specs : 'Regular',
          subject: (p.subject !== undefined && p.subject !== null && p.subject !== '') ? p.subject : undefined,
        }));
      }
    });

    res.json(dcs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get employee DCs for their dashboard
// @route   GET /api/dc/employee/my
// @access  Private
const getMyDCs = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    if (connectionState !== 1) {
      console.warn(`MongoDB connection state: ${connectionState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
      return res.status(503).json({
        message: 'Database connection unavailable. Please check your MongoDB connection.',
        error: 'DATABASE_CONNECTION_ERROR',
        connectionState: connectionState
      });
    }

    const employeeId = req.user._id;
    const employeeIdObj = (mongoose.Types.ObjectId.isValid(employeeId))
      ? (employeeId instanceof mongoose.Types.ObjectId ? employeeId : new mongoose.Types.ObjectId(employeeId))
      : employeeId;
    const { status, limit = 50 } = req.query;

    // Get DCs assigned to this employee (My Clients — exclude Term-Wise companions)
    const filter = { employeeId: employeeIdObj, status: { $ne: 'scheduled_for_later' } };
    if (status) filter.status = status;

    // Use lean() for faster queries and only populate what's needed
    // Try a simpler query first without populate to see if we can get results faster
    // Use Promise.race to return data quickly even if query is slow
    // First try with minimal fields for speed
    const minimalQueryPromise = DC.find(filter)
      .select('_id dcOrderId customerName status productDetails createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .maxTimeMS(10000) // 10 seconds for minimal query
      .lean();

    const minimalTimeout = new Promise((resolve) => 
      setTimeout(() => resolve([]), 10000)
    );

    // Try minimal query first
    let dcs = await Promise.race([minimalQueryPromise, minimalTimeout]).catch(() => []);

    // If minimal query worked, try to get full data (but don't wait too long)
    if (dcs && dcs.length > 0) {
      try {
        const fullQueryPromise = DC.find({ _id: { $in: dcs.map(dc => dc._id) } })
          .select('saleId dcOrderId parentDcId clusterId dcType fulfillmentStatus employeeId customerName customerEmail customerAddress customerPhone product requestedQuantity status poPhotoUrl poDocument productDetails dcDate dcRemarks dcCategory dcNotes createdAt updatedAt')
          .maxTimeMS(5000) // 5 seconds for full query
          .lean();

        const fullTimeout = new Promise((resolve) => 
          setTimeout(() => resolve(dcs), 5000)
        );

        const fullData = await Promise.race([fullQueryPromise, fullTimeout]);
        if (fullData && fullData.length > 0) {
          dcs = fullData;
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch full DC data, using minimal data:', err.message);
        // Keep minimal dcs
      }
    } else {
      console.warn('⚠️ Minimal query also timed out or returned no results');
    }

    // If we got results, try to populate them (but don't fail if populate times out)
    // Use Promise.race to timeout populate quickly if it's slow
    if (dcs && dcs.length > 0) {
      try {
        const populatePromise = DC.find({ _id: { $in: dcs.map(dc => dc._id) } })
          .populate('saleId', 'customerName product quantity status poDocument')
          .populate('dcOrderId', 'school_name school_code contact_person contact_mobile email address location zone products dc_code status school_type')
          .populate('employeeId', 'name email')
          .populate('parentDcId', '_id dc_code status requestedQuantity deliverableQuantity fulfillmentStatus dcType')
          .maxTimeMS(8000) // Shorter timeout for populate
          .lean();
        
        const timeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve(dcs), 8000)
        );
        
        const populated = await Promise.race([populatePromise, timeoutPromise]);
        if (populated && populated.length > 0 && Array.isArray(populated)) {
          dcs = populated;
          console.log(`✅ Populated ${dcs.length} DCs successfully`);
        } else {
          console.warn('⚠️ Population timed out or failed, using unpopulated data');
        }
      } catch (popErr) {
        console.warn('⚠️ Population failed, using unpopulated data:', popErr.message);
        // Keep unpopulated dcs - they'll still work, just without populated fields
      }
    }

    // Also get DcOrders with 'saved' status assigned to this employee that don't have a DC yet
    // These are converted leads that should appear in "My Clients"
    const DcOrder = require('../models/DcOrder');
    // Use employeeIdObj so string/ObjectId from JWT matches DB
    const savedDcOrdersMinimalPromise = DcOrder.find({
      assigned_to: employeeIdObj,
      status: 'saved'
    })
      .select('_id school_name status createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .maxTimeMS(10000) // 10 seconds for minimal
      .lean();

    const savedDcOrdersMinimalTimeout = new Promise((resolve) => 
      setTimeout(() => resolve([]), 10000)
    );

    let savedDcOrders = await Promise.race([savedDcOrdersMinimalPromise, savedDcOrdersMinimalTimeout]).catch(() => []);

    // If minimal worked, try to get full data
    if (savedDcOrders && savedDcOrders.length > 0) {
      try {
        const savedDcOrdersFullPromise = DcOrder.find({
          _id: { $in: savedDcOrders.map(o => o._id) },
          assigned_to: employeeIdObj,
          status: 'saved'
        })
          .select('_id school_name school_code contact_person contact_mobile email address location zone products dc_code status school_type assigned_to created_by createdAt updatedAt pod_proof_url poChangeRequest')
          .maxTimeMS(5000) // 5 seconds for full
          .lean();

        const savedDcOrdersFullTimeout = new Promise((resolve) => 
          setTimeout(() => resolve(savedDcOrders), 5000)
        );

        const fullOrders = await Promise.race([savedDcOrdersFullPromise, savedDcOrdersFullTimeout]);
        if (fullOrders && fullOrders.length > 0) {
          savedDcOrders = fullOrders;
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch full DcOrder data, using minimal:', err.message);
        // Keep minimal savedDcOrders
      }
    }

    // Try to populate if we got results (but don't fail if it times out)
    if (savedDcOrders && savedDcOrders.length > 0) {
      try {
        const populatePromise = DcOrder.find({
          _id: { $in: savedDcOrders.map(o => o._id) },
          assigned_to: employeeIdObj,
          status: 'saved'
        })
          .populate('assigned_to', 'name email')
          .populate('created_by', 'name email')
          .maxTimeMS(8000) // Shorter timeout
          .lean();
        
        const timeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve(savedDcOrders), 8000)
        );
        
        const populatedOrders = await Promise.race([populatePromise, timeoutPromise]);
        if (populatedOrders && populatedOrders.length > 0 && Array.isArray(populatedOrders)) {
          savedDcOrders = populatedOrders;
          console.log(`✅ Populated ${savedDcOrders.length} DcOrders successfully`);
        } else {
          console.warn('⚠️ DcOrder population timed out, using unpopulated data');
        }
      } catch (popErr) {
        console.warn('⚠️ DcOrder population failed, using unpopulated data:', popErr.message);
        // Keep unpopulated savedDcOrders - they'll still work
      }
    }

    // Convert DcOrders to DC-like format for frontend compatibility
    // IMPORTANT: Include saved DcOrders even if they have a DC, but only if the DC doesn't have status 'created' or 'po_submitted'
    // This ensures closed leads always appear in "My Clients" for the employee to manage
    const dcOrderAsDCs = savedDcOrders.map(order => {
      // Check if a DC already exists for this DcOrder
      const existingDC = dcs.find(dc => {
        if (!dc.dcOrderId) return false;
        if (typeof dc.dcOrderId === 'object') {
          // Check if _id exists and is not null
          if (!dc.dcOrderId._id) return false;
          return dc.dcOrderId._id.toString() === order._id.toString();
        }
        return dc.dcOrderId.toString() === order._id.toString();
      });
      
      // If DC exists with status 'created' or 'po_submitted', skip this DcOrder (it's already in the dcs array and will be shown)
      if (existingDC && (existingDC.status === 'created' || existingDC.status === 'po_submitted')) {
        return null;
      }
      
      // If DC exists but with a different status (e.g., 'sent_to_manager', 'completed'), still show the DcOrder as 'created' in "My Clients"
      // This ensures closed leads always appear for the employee to manage, even if the DC has moved to a different workflow stage
      // The employee can still manage the client from "My Clients" page

      // Convert DcOrder to DC-like format
      const { myClientsProducts: virtualMyClients } = partitionProductsForCloseLeadRouting(
        (order.products || []).map((p) => ({
          product: p.product_name || p.product || 'Abacus',
          class: p.class,
          category: p.category,
          productCategory: p.productCategory,
          quantity: p.quantity,
          strength: p.strength,
          price: p.unit_price,
          level: p.level,
          term: persistProductTerm(p),
          specs: p.specs,
          subject: p.subject,
        }))
      );
      return {
        _id: order._id, // Use DcOrder ID temporarily
        dcOrderId: {
          _id: order._id,
          school_name: order.school_name,
          school_code: order.school_code,
          dc_code: order.dc_code,
          contact_person: order.contact_person,
          contact_mobile: order.contact_mobile,
          email: order.email,
          products: order.products,
          status: order.status,
          school_type: order.school_type, // Include school_type for category determination
          createdAt: order.createdAt, // Include createdAt for client turned date
          poChangeRequest: order.poChangeRequest || null, // For "Request DC" lock when pending
        },
        employeeId: order.assigned_to ? (typeof order.assigned_to === 'object' && order.assigned_to._id ? order.assigned_to._id : (typeof order.assigned_to === 'string' ? order.assigned_to : employeeId)) : employeeId,
        customerName: order.school_name,
        customerEmail: order.email,
        customerAddress: order.address || order.location || 'N/A',
        customerPhone: order.contact_mobile || order.contact_person || 'N/A',
        product: order.products && order.products.length > 0 ? (order.products[0].product_name || 'Abacus') : 'Abacus',
        requestedQuantity: order.products ? order.products.reduce((sum, p) => sum + (p.quantity || 1), 0) : 1,
        status: 'created', // Convert saved DcOrder to 'created' status DC for display in "My Clients"
        poPhotoUrl: order.pod_proof_url || null,
        poDocument: order.pod_proof_url || null,
        productDetails: virtualMyClients.map(p => ({
          product: p.product || p.product_name || 'Abacus',
          class: (p.class != null && String(p.class).trim() !== '') ? String(p.class).trim() : '1',
          category: order.school_type === 'Existing' ? 'Existing School' : 'New School',
          quantity: p.quantity || 1,
          strength: p.strength || 0,
          price: p.price || p.unit_price || 0,
          total: (p.quantity || 1) * (p.price || p.unit_price || 0),
          level: displayLevelValue(p.level),
          term: persistProductTerm(p),
        })),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        // Add a flag to indicate this is a converted DcOrder (for frontend to handle appropriately)
        _isConvertedLead: true,
      };
    }).filter(dc => dc !== null); // Remove null entries (DCs that already exist with correct status)

    // Combine DCs and converted DcOrders, remove duplicates
    const allDCs = [...dcs, ...dcOrderAsDCs];
    
    // Remove duplicates based on dcOrderId
    let uniqueDCs = [];
    const seenDcOrderIds = new Set();
    
    allDCs.forEach(dc => {
      let dcOrderId = null;
      if (dc.dcOrderId) {
        if (typeof dc.dcOrderId === 'object') {
          // Check if _id exists and is not null before accessing
          if (dc.dcOrderId._id) {
            dcOrderId = dc.dcOrderId._id.toString();
          }
        } else {
          dcOrderId = dc.dcOrderId.toString();
        }
      }
      
      if (dcOrderId && !seenDcOrderIds.has(dcOrderId)) {
        seenDcOrderIds.add(dcOrderId);
        uniqueDCs.push(dc);
      } else if (!dcOrderId) {
        // DCs without dcOrderId (from Sale) - include them
        uniqueDCs.push(dc);
      }
    });

    // Repair persisted My Clients / Term-Wise product split for each sale (source of truth).
    const repairOrderIds = [...seenDcOrderIds];
    for (const orderId of repairOrderIds) {
      try {
        await repairSaleCloseLeadRouting(orderId);
      } catch (repairErr) {
        console.warn('getMyDCs repair failed:', orderId, repairErr?.message || repairErr);
      }
    }
    if (repairOrderIds.length > 0) {
      const refreshed = await DC.find({
        _id: { $in: uniqueDCs.map((d) => d._id).filter(Boolean) },
        status: { $ne: 'scheduled_for_later' },
      })
        .populate('saleId', 'customerName product quantity status poDocument')
        .populate('dcOrderId', 'school_name school_code contact_person contact_mobile email address location zone products dc_code status school_type')
        .populate('employeeId', 'name email')
        .lean();
      const byId = new Map(refreshed.map((d) => [String(d._id), d]));
      uniqueDCs = uniqueDCs.map((d) => byId.get(String(d._id)) || d).filter((d) => d.status !== 'scheduled_for_later');
    }

    res.json(uniqueDCs);
  } catch (error) {
    if (error.message && (error.message.includes('timeout') || error.message.includes('connection') || error.message.includes('ECONNREFUSED') || error.message.includes('maxTimeMS'))) {
      console.error('MongoDB connection/query error in getMyDCs:', error.message);
      if (error.message.includes('maxTimeMS')) {
        console.error('Query exceeded 30 second timeout. Consider adding indexes or reducing data scope.');
      }
      return res.status(503).json({
        message: error.message.includes('maxTimeMS')
          ? 'Query is taking too long. Please try again or contact support if the issue persists.'
          : 'Database connection failed. Please check your MongoDB connection settings.',
        error: 'DATABASE_CONNECTION_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    console.error('Error in getMyDCs:', error);
    res.status(500).json({ message: error.message || 'Internal server error', error: 'INTERNAL_ERROR' });
  }
};

// @desc    Record shortage DC against a completed parent DC
// @route   POST /api/dc/:id/record-shortage
// @access  Private (Executive/Admin)
const recordShortageDC = async (req, res) => {
  try {
    if (!ALLOWED_SHORTAGE_ROLES.has(req.user?.role)) {
      return res.status(403).json({ message: 'You are not authorized to record shortage DCs' });
    }

    const parentDc = await DC.findById(req.params.id);
    if (!parentDc) {
      return res.status(404).json({ message: 'Parent DC not found' });
    }
    if (parentDc.status !== 'completed') {
      return res.status(400).json({ message: 'Shortage can only be recorded for completed DCs' });
    }

    req.body = {
      ...req.body,
      dcOrderId: String(parentDc.dcOrderId),
      parentDcId: parentDc._id,
      dcType: 'shortage',
      status: req.body.status || 'pending_dc',
      dcCategory: req.body.dcCategory || 'Shortage',
    };

    return raiseDC(req, res);
  } catch (error) {
    console.error('Error recording shortage DC:', error);
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update DC (for editing)
// @route   PUT /api/dc/:id
// @access  Private
const updateDC = async (req, res) => {
  try {
    const dc = await DC.findById(req.params.id);
    if (!dc) {
      return res.status(404).json({ message: 'DC not found' });
    }

    if (dc.status === 'completed' && hasQuantityFieldsInUpdate(req.body)) {
      const childShortageCount = await DC.countDocuments({ parentDcId: dc._id, dcType: 'shortage' });
      if (childShortageCount > 0) {
        return res.status(400).json({
          message: 'Quantity fields on a completed parent DC cannot be edited after shortage DC is raised.',
        });
      }
    }

    // Raise/Accept/Send from Closed Sales includes dcOrderId + productDetails (or pending_dc status)
    const isRaiseStyleUpdate =
      req.body.status === 'pending_dc' ||
      (req.body.dcOrderId != null && Array.isArray(req.body.productDetails));
    if (isRaiseStyleUpdate) {
      const mergedDetails = {
        dcDate:
          req.body.dcDate !== undefined
            ? req.body.dcDate
            : dc.dcDate
              ? new Date(dc.dcDate).toISOString().slice(0, 10)
              : '',
        dcCategory:
          req.body.dcCategory !== undefined ? req.body.dcCategory : dc.dcCategory || '',
        dcRemarks:
          req.body.dcRemarks !== undefined ? req.body.dcRemarks : dc.dcRemarks || '',
      };
      const detailsCheck = validateRaiseDcDetails(mergedDetails, {
        requireRemarks: Boolean(req.body.requireDcRemarks),
      });
      if (!detailsCheck.ok) {
        return res.status(400).json({ message: detailsCheck.message });
      }
    }

    // Pending DC Open Save sends financeRemarks + splApproval + dcNotes together
    const isPendingDcDetailsSave =
      req.body.financeRemarks !== undefined &&
      req.body.splApproval !== undefined &&
      req.body.dcNotes !== undefined;
    if (isPendingDcDetailsSave) {
      const pendingDetails = {
        dcDate:
          req.body.dcDate !== undefined
            ? req.body.dcDate
            : dc.dcDate
              ? new Date(dc.dcDate).toISOString().slice(0, 10)
              : '',
        dcCategory:
          req.body.dcCategory !== undefined ? req.body.dcCategory : dc.dcCategory || '',
        financeRemarks:
          req.body.financeRemarks !== undefined
            ? req.body.financeRemarks
            : dc.financeRemarks || '',
        splApproval:
          req.body.splApproval !== undefined ? req.body.splApproval : dc.splApproval || '',
        dcRemarks:
          req.body.dcRemarks !== undefined ? req.body.dcRemarks : dc.dcRemarks || '',
        dcNotes: req.body.dcNotes !== undefined ? req.body.dcNotes : dc.dcNotes || '',
      };
      const pendingCheck = validatePendingDcDetails(pendingDetails);
      if (!pendingCheck.ok) {
        return res.status(400).json({ message: pendingCheck.message });
      }
    }

    // Update fields from request body - only update provided fields
    if (req.body.dcDate !== undefined) {
      dc.dcDate = req.body.dcDate ? new Date(req.body.dcDate) : undefined;
    }
    if (req.body.dcRemarks !== undefined) dc.dcRemarks = req.body.dcRemarks;
    if (req.body.dcCategory !== undefined) dc.dcCategory = req.body.dcCategory;
    if (req.body.dcNotes !== undefined) dc.dcNotes = req.body.dcNotes;
    if (req.body.financeRemarks !== undefined) dc.financeRemarks = req.body.financeRemarks;
    if (req.body.splApproval !== undefined) dc.splApproval = req.body.splApproval;
    if (req.body.smeRemarks !== undefined) dc.smeRemarks = req.body.smeRemarks;
    if (req.body.productDetails !== undefined) {
      // Ensure productDetails is properly formatted with all fields
      if (Array.isArray(req.body.productDetails)) {
        let incoming = req.body.productDetails;
        if (dc.status !== 'scheduled_for_later' && dc.dcOrderId) {
          const twRows = await siblingTermWiseRows(DC, dc.dcOrderId, dc._id);
          incoming = keepMyClientsOwnedProductRows(incoming, twRows);
          logDcProductAssoc('PUT /dc/:id My Clients owned rows', {
            dcId: dc._id,
            orderId: dc.dcOrderId,
            rows: incoming,
          });
        }
        dc.productDetails = normalizeProductDetails(incoming, { isShortage: dc.dcType === 'shortage' });
        // Also update requestedQuantity if productDetails are provided
        if (dc.productDetails.length > 0) {
          const totalQuantity = calculateTotalQuantity(dc.productDetails);
          if (totalQuantity > 0) {
            dc.requestedQuantity = totalQuantity;
          }
        }
      } else {
        dc.productDetails = req.body.productDetails;
      }
    }
    if (req.body.requestedQuantity !== undefined) dc.requestedQuantity = req.body.requestedQuantity;
    if (req.body.status !== undefined) {
      const pendingCheck = validateSetPendingDc(dc, req.user?.role, req.body.status);
      if (!pendingCheck.allowed) {
        return res.status(400).json({ message: pendingCheck.message });
      }
      dc.status = req.body.status;
      // When moving from hold to sent_to_manager (e.g. "Move to DC@Warehouse"), set timestamps so DC appears in DC @ Warehouse list
      if (req.body.status === 'sent_to_manager') {
        dc.sentToManagerAt = dc.sentToManagerAt || new Date();
        dc.managerRequestedAt = dc.managerRequestedAt || new Date();
        if (req.user && req.user._id) {
          dc.managerId = req.user._id;
          dc.managerRequestedBy = req.user._id;
        }
      }
    }
    if (req.body.listedAt !== undefined) {
      dc.listedAt = req.body.listedAt ? new Date(req.body.listedAt) : undefined;
    }
    if (req.body.availableQuantity !== undefined) dc.availableQuantity = req.body.availableQuantity;
    if (req.body.deliverableQuantity !== undefined) dc.deliverableQuantity = req.body.deliverableQuantity;
    if (req.body.holdReason !== undefined) dc.holdReason = req.body.holdReason;
    if (req.body.warehouseId !== undefined) dc.warehouseId = req.body.warehouseId;
    if (req.body.warehouseProcessedAt !== undefined) {
      dc.warehouseProcessedAt = req.body.warehouseProcessedAt ? new Date(req.body.warehouseProcessedAt) : undefined;
    }
    if (req.body.completedAt !== undefined) {
      dc.completedAt = req.body.completedAt ? new Date(req.body.completedAt) : undefined;
    }
    // If status is being set to completed, set completedAt if not provided
    if (req.body.status === 'completed' && !dc.completedAt) {
      dc.completedAt = new Date();
    }
    // Update PO photo if provided (for editing submitted PO)
    if (req.body.poPhotoUrl !== undefined) {
      dc.poPhotoUrl = req.body.poPhotoUrl;
    }
    if (req.body.poDocument !== undefined) {
      dc.poDocument = req.body.poDocument;
    }
    if (req.body.deliveryNotes !== undefined) dc.deliveryNotes = req.body.deliveryNotes;
    if (req.body.transport !== undefined) dc.transport = req.body.transport;
    if (req.body.lrNo !== undefined) dc.lrNo = req.body.lrNo;
    if (req.body.lrDate !== undefined) {
      dc.lrDate = req.body.lrDate ? new Date(req.body.lrDate) : undefined;
    }
    if (req.body.lrCost !== undefined) {
      dc.lrCost = req.body.lrCost === null || req.body.lrCost === ''
        ? undefined
        : String(req.body.lrCost);
    }
    if (req.body.boxes !== undefined) dc.boxes = req.body.boxes;
    if (req.body.transportArea !== undefined) dc.transportArea = req.body.transportArea;
    if (req.body.deliveryStatus !== undefined) dc.deliveryStatus = req.body.deliveryStatus;
    
    // Save without validating required fields that might not be present during update
    await dc.save({ validateBeforeSave: false });

    if (req.body.status !== undefined) {
      await syncDcWorkflowFromStatus(dc);
    }

    // Request DC from My Clients: DC stays po_submitted until Super Admin Raise DC.
    // Promote the linked sale into Closed Sales in this same request.
    if (req.body.status === 'po_submitted' && dc.dcOrderId) {
      try {
        await promoteOrderToClosedSalesQueue(dc.dcOrderId, req.user?._id, {
          pod_proof_url: dc.poPhotoUrl,
          dcRequestData: {
            productDetails: dc.productDetails,
            requestedQuantity: dc.requestedQuantity,
            employeeId: req.user?._id,
          },
        });
      } catch (promoteErr) {
        console.warn(
          'Failed to promote DcOrder to Closed Sales after po_submitted:',
          dc._id,
          promoteErr?.message || promoteErr
        );
      }
    }

    const populatedDC = await DC.findById(dc._id)
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('dcOrderId', 'school_name school_code dc_code contact_person contact_mobile email address location zone products due_amount due_percentage')
      .populate('parentDcId', '_id dc_code status requestedQuantity deliverableQuantity fulfillmentStatus dcType')
      .populate('employeeId', 'name email')
      .populate('adminId', 'name email')
      .populate('managerId', 'name email')
      .populate('warehouseId', 'name email');

    res.json(populatedDC);
  } catch (error) {
    console.error('Error updating DC:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export sales visit report to Excel
// @route   GET /api/dc/export-sales-visit
// @access  Private
const exportSalesVisit = async (req, res) => {
  try {
    const { zone, employeeId, schoolName, schoolCode, contactMobile, fromDate, toDate, visitCategory } = req.query;
    const filter = {};

    if (employeeId) filter.employeeId = employeeId;
    if (visitCategory) filter.dcCategory = visitCategory;
    
    if (fromDate || toDate) {
      const dateFilter = {};
      if (fromDate) dateFilter.$gte = new Date(fromDate);
      if (toDate) dateFilter.$lte = new Date(toDate + 'T23:59:59.999Z');
      filter.$or = [
        { dcDate: dateFilter },
        { createdAt: dateFilter }
      ];
    }

    const dcs = await DC.find(filter)
      .populate('saleId', 'customerName product quantity status')
      .populate('dcOrderId', 'school_name school_code school_type contact_person contact_mobile email address location zone products dc_code')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Apply client-side filters
    let filteredDCs = dcs;
    
    if (zone) {
      filteredDCs = filteredDCs.filter(dc => 
        (dc.dcOrderId && dc.dcOrderId.zone && dc.dcOrderId.zone.toLowerCase().includes(zone.toLowerCase())) ||
        (dc.saleId && dc.saleId.zone && dc.saleId.zone.toLowerCase().includes(zone.toLowerCase()))
      );
    }
    
    if (schoolName) {
      filteredDCs = filteredDCs.filter(dc => 
        (dc.dcOrderId && dc.dcOrderId.school_name && dc.dcOrderId.school_name.toLowerCase().includes(schoolName.toLowerCase())) ||
        (dc.customerName && dc.customerName.toLowerCase().includes(schoolName.toLowerCase()))
      );
    }
    
    if (schoolCode) {
      const q = schoolCode.toLowerCase();
      filteredDCs = filteredDCs.filter(dc => {
        if (!dc.dcOrderId) return false;
        const code = (dc.dcOrderId.school_code || dc.dcOrderId.dc_code || '').toLowerCase();
        return code.includes(q);
      });
    }
    
    if (contactMobile) {
      filteredDCs = filteredDCs.filter(dc => 
        (dc.dcOrderId && dc.dcOrderId.contact_mobile && dc.dcOrderId.contact_mobile.includes(contactMobile)) ||
        (dc.customerPhone && dc.customerPhone.includes(contactMobile))
      );
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Visit Report');

    // Define columns
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'School Code', key: 'schoolCode', width: 15 },
      { header: 'School Type', key: 'schoolType', width: 15 },
      { header: 'School Name', key: 'schoolName', width: 30 },
      { header: 'Zone', key: 'zone', width: 15 },
      { header: 'Executive', key: 'executive', width: 25 },
      { header: 'Town', key: 'town', width: 30 },
      { header: 'Visit Category', key: 'visitCategory', width: 20 },
      { header: 'Visit Remarks', key: 'visitRemarks', width: 40 },
      { header: 'Visit Date', key: 'visitDate', width: 20 },
    ];

    // Add data
    filteredDCs.forEach((dc, index) => {
      const schoolName = dc.dcOrderId?.school_name || dc.customerName || '';
      const schoolCode =
        dc.dcOrderId?.school_code || dc.dcOrderId?.dc_code || '';
      const schoolType = dc.dcOrderId?.school_type || (dc.dcOrderId ? 'Existing' : 'New');
      const zone = dc.dcOrderId?.zone || '';
      const executive = dc.employeeId?.name || dc.createdBy?.name || 'Not Assigned';
      const town = dc.dcOrderId?.location || dc.customerAddress || '';
      const visitCategory = dc.dcCategory || '';
      const visitRemarks = dc.dcRemarks || dc.dcNotes || '';
      const visitDate = dc.dcDate || dc.createdAt || new Date();
      
      worksheet.addRow({
        sno: index + 1,
        schoolCode: schoolCode,
        schoolType: schoolType,
        schoolName: schoolName,
        zone: zone,
        executive: executive,
        town: town,
        visitCategory: visitCategory,
        visitRemarks: visitRemarks,
        visitDate: new Date(visitDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Sales_Visit_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload PO document (image or PDF)
// @route   POST /api/dc/upload-po
// @access  Private
const uploadPO = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Save relative URL so it remains valid across host/port changes.
    const fileUrl = `/uploads/po/${req.file.filename}`;

    res.json({
      message: 'PO document uploaded successfully',
      poPhotoUrl: fileUrl,
      url: fileUrl, // Alias for backward compatibility
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    console.error('Error uploading PO document:', error);
    res.status(500).json({ message: error.message || 'Failed to upload PO document' });
  }
};

// @desc    Download a PO file from uploads/po (authenticated; avoids static /uploads 403 in browsers)
// @route   GET /api/dc/po-file?path=po/<filename>
// @access  Private
const servePoUpload = (req, res) => {
  try {
    const rel = req.query.path;
    if (!rel || typeof rel !== 'string') {
      return res.status(400).json({ message: 'Missing path' });
    }
    const m = /^po\/([^/\\]+)$/.exec(rel.trim());
    if (!m) {
      return res.status(400).json({ message: 'Invalid path' });
    }
    const filename = m[1];
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      return res.status(400).json({ message: 'Invalid filename' });
    }
    const abs = path.join(__dirname, '../uploads/po', filename);
    const root = path.resolve(path.join(__dirname, '../uploads/po'));
    const resolved = path.resolve(abs);
    if (!resolved.startsWith(root)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.sendFile(resolved);
  } catch (error) {
    console.error('servePoUpload:', error);
    res.status(500).json({ message: error.message || 'Failed to serve file' });
  }
};

module.exports = {
  getDCs,
  getDC,
  raiseDC,
  requestWarehouse,
  warehouseSubmit,
  deliverySubmit,
  completeDC,
  holdDC,
  getPendingDCs,
  getWarehouseDCs,
  getEmployeeDCs,
  getCompletedDCs,
  getHoldDCs,
  employeeStats,
  submitPO,
  adminReviewPO,
  managerRequestWarehouse,
  warehouseProcess,
  getPOSubmittedDCs,
  getSentToManagerDCs,
  getPendingWarehouseDCs,
  getMyDCs,
  recordShortageDC,
  updateDC,
  submitDCToManager,
  exportSalesVisit,
  uploadPO,
  uploadPOMiddleware: upload.single('poPhoto'),
  servePoUpload,
};
