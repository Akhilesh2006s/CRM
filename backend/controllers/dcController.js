const DC = require('../models/DC');
const Sale = require('../models/Sale');
const Warehouse = require('../models/Warehouse');

// @desc    Get all DCs with filtering
// @route   GET /api/dc
// @access  Private
const getDCs = async (req, res) => {
  try {
    const { status, employeeId, saleId, dcOrderId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;
    if (saleId) filter.saleId = saleId;
    if (dcOrderId) filter.dcOrderId = dcOrderId;

    const dcs = await DC.find(filter)
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('dcOrderId', 'school_name contact_person contact_mobile email address location zone products')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email')
      .populate('submittedBy', 'name email')
      .populate('warehouseProcessedBy', 'name email')
      .populate('deliverySubmittedBy', 'name email')
      .populate('completedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(dcs);
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
      .populate('dcOrderId', 'school_name contact_person contact_mobile email address location zone products due_amount due_percentage')
      .populate('employeeId', 'name email')
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
    const { dcOrderId, dcDate, dcRemarks, dcCategory, dcNotes, requestedQuantity } = req.body;

    if (!dcOrderId) {
      return res.status(400).json({ message: 'DC Order ID is required' });
    }

    const DcOrder = require('../models/DcOrder');
    const dcOrder = await DcOrder.findById(dcOrderId)
      .populate('assigned_to', 'name email');

    if (!dcOrder) {
      return res.status(404).json({ message: 'Deal/Lead not found' });
    }

    // Check if DC already exists for this DcOrder
    let dc = await DC.findOne({ dcOrderId });
    
    if (dc) {
      // If DC exists, preserve the PO photo if it has one, or get from DcOrder
      if (!dc.poPhotoUrl && dcOrder.pod_proof_url) {
        dc.poPhotoUrl = dcOrder.pod_proof_url;
        dc.poDocument = dcOrder.pod_proof_url;
      }
    }
    
    if (!dc) {
      // Create DC if it doesn't exist
      let productName = 'Abacus';
      let quantity = 1;
      
      if (dcOrder.products && Array.isArray(dcOrder.products) && dcOrder.products.length > 0) {
        productName = dcOrder.products[0].product_name || 'Abacus';
        quantity = dcOrder.products.reduce((sum, p) => sum + (p.quantity || 1), 0);
      }

      // If assigned_to is not set, try to get it from the request body (for assigning during Raise DC)
      let employeeId = null;
      if (dcOrder.assigned_to) {
        employeeId = typeof dcOrder.assigned_to === 'object' ? dcOrder.assigned_to._id : dcOrder.assigned_to;
      } else if (req.body.employeeId || req.body.assignedTo) {
        // Allow assigning employee during Raise DC if not already assigned
        employeeId = req.body.employeeId || req.body.assignedTo;
      }

      if (!employeeId) {
        return res.status(400).json({ 
          message: 'Deal must be assigned to an employee before raising DC. Please assign an employee first or specify one in the request.' 
        });
      }

      dc = await DC.create({
        dcOrderId: dcOrder._id,
        employeeId: employeeId,
        customerName: dcOrder.school_name,
        customerEmail: dcOrder.email || undefined,
        customerAddress: dcOrder.address || dcOrder.location || 'N/A',
        customerPhone: dcOrder.contact_mobile || dcOrder.contact_person || 'N/A',
        product: productName,
        requestedQuantity: requestedQuantity || quantity,
        deliverableQuantity: 0,
        status: 'created',
        createdBy: req.user._id,
      });

      // Update the DcOrder with the assigned employee if it wasn't set before
      if (!dcOrder.assigned_to && employeeId) {
        await DcOrder.findByIdAndUpdate(dcOrder._id, { assigned_to: employeeId });
      }
      
      // Preserve PO photo from DcOrder if it exists (from employee's PO submission)
      if (dcOrder.pod_proof_url) {
        dc.poPhotoUrl = dcOrder.pod_proof_url;
        dc.poDocument = dcOrder.pod_proof_url; // Legacy field
      }
    }

    // Update DC with provided details
    if (dcDate) dc.deliveryDate = new Date(dcDate);
    if (dcRemarks) dc.deliveryNotes = dcRemarks;
    if (dcNotes) {
      dc.deliveryNotes = dc.deliveryNotes ? `${dc.deliveryNotes}\n${dcNotes}` : dcNotes;
    }
    if (requestedQuantity) dc.requestedQuantity = requestedQuantity;

    await dc.save();

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

// @desc    Submit DC to Manager (from Raise DC modal)
// @route   POST /api/dc/:id/submit-to-manager
// @access  Private (Admin)
const submitDCToManager = async (req, res) => {
  try {
    const { requestedQuantity, remarks } = req.body;

    const dc = await DC.findById(req.params.id);
    if (!dc) {
      return res.status(404).json({ message: 'DC not found' });
    }

    // Update DC details
    if (requestedQuantity) dc.requestedQuantity = requestedQuantity;
    if (remarks) dc.deliveryNotes = remarks;

    // Move to sent_to_manager first, so Manager can review before it goes to warehouse
    // This matches the normal workflow: sent_to_manager -> pending_dc
    dc.status = 'sent_to_manager';
    dc.managerId = req.user._id;
    dc.sentToManagerAt = new Date();
    dc.adminId = req.user._id;
    dc.adminReviewedAt = new Date();
    dc.adminReviewedBy = req.user._id;
    await dc.save();

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
    await dc.save();

    // Update sale status if needed
    if (dc.saleId) {
      const sale = await Sale.findById(dc.saleId);
      if (sale && sale.status !== 'Completed') {
        sale.status = 'Completed';
        await sale.save();
      }
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

    // DC can be put on hold from Employee status (after delivery) or Warehouse status
    if (dc.status !== 'Employee' && dc.status !== 'Warehouse') {
      return res.status(400).json({ message: `DC can only be put on hold from Employee or Warehouse status. Current status: ${dc.status}` });
    }

    dc.status = 'Hold';
    dc.holdReason = holdReason || 'No reason provided';
    await dc.save();

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

// @desc    Get completed DCs (for Manager)
// @route   GET /api/dc/completed
// @access  Private
const getCompletedDCs = async (req, res) => {
  try {
    const dcs = await DC.find({ status: 'Completed' })
      .populate('saleId', 'customerName product quantity status')
      .populate('employeeId', 'name email')
      .populate('completedBy', 'name email')
      .sort({ completedAt: -1 });

    res.json(dcs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get hold DCs (for Manager)
// @route   GET /api/dc/hold
// @access  Private
const getHoldDCs = async (req, res) => {
  try {
    const dcs = await DC.find({ status: 'Hold' })
      .populate('saleId', 'customerName product quantity status')
      .populate('employeeId', 'name email')
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
        await DcOrder.findByIdAndUpdate(dc.dcOrderId, {
          pod_proof_url: poPhotoUrl,
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
    const { requestedQuantity, remarks } = req.body;

    if (!requestedQuantity || requestedQuantity <= 0) {
      return res.status(400).json({ message: 'Valid requested quantity is required' });
    }

    const dc = await DC.findById(req.params.id);
    if (!dc) {
      return res.status(404).json({ message: 'DC not found' });
    }

    // Check if DC is in correct status
    if (dc.status !== 'sent_to_manager') {
      return res.status(400).json({ message: `DC must be in 'sent_to_manager' status. Current status: ${dc.status}` });
    }

    // Update DC with requested quantity and move to pending_dc
    dc.requestedQuantity = requestedQuantity;
    dc.status = 'pending_dc';
    dc.managerId = req.user._id;
    dc.managerRequestedAt = new Date();
    dc.managerRequestedBy = req.user._id;
    if (remarks) {
      dc.deliveryNotes = remarks;
    }
    await dc.save();

    const populatedDC = await DC.findById(dc._id)
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('employeeId', 'name email')
      .populate('managerId', 'name email')
      .populate('managerRequestedBy', 'name email');

    res.json(populatedDC);
  } catch (error) {
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

    // Check if DC is in correct status
    if (dc.status !== 'pending_dc') {
      return res.status(400).json({ message: `DC must be in 'pending_dc' status. Current status: ${dc.status}` });
    }

    // Update quantities
    if (availableQuantity !== undefined) dc.availableQuantity = availableQuantity;
    if (deliverableQuantity !== undefined) {
      if (deliverableQuantity < 0) {
        return res.status(400).json({ message: 'Deliverable quantity cannot be negative' });
      }
      dc.deliverableQuantity = deliverableQuantity;
    }

    // Move to warehouse_processing status
    dc.status = 'warehouse_processing';
    dc.warehouseId = req.user._id;
    dc.warehouseProcessedAt = new Date();
    dc.warehouseProcessedBy = req.user._id;
    if (remarks) {
      dc.deliveryNotes = remarks;
    }
    await dc.save();

    const populatedDC = await DC.findById(dc._id)
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('employeeId', 'name email')
      .populate('warehouseId', 'name email')
      .populate('warehouseProcessedBy', 'name email');

    res.json(populatedDC);
  } catch (error) {
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
    const dcs = await DC.find({ status: 'sent_to_manager' })
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
    const dcs = await DC.find({ status: 'pending_dc' })
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('employeeId', 'name email')
      .populate('managerId', 'name email')
      .populate('managerRequestedBy', 'name email')
      .sort({ managerRequestedAt: -1 });

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
    const employeeId = req.user._id;
    const { status } = req.query;

    const filter = { employeeId };
    if (status) filter.status = status;

    console.log('Getting DCs for employee:', employeeId, 'with filter:', filter);

    const dcs = await DC.find(filter)
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('dcOrderId', 'school_name contact_person contact_mobile email address location zone products')
      .populate('employeeId', 'name email')
      .sort({ createdAt: -1 });

    console.log(`Found ${dcs.length} DCs for employee ${employeeId}`);

    res.json(dcs);
  } catch (error) {
    console.error('Error in getMyDCs:', error);
    res.status(500).json({ message: error.message });
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
    if (req.body.productDetails !== undefined) dc.productDetails = req.body.productDetails;
    if (req.body.requestedQuantity !== undefined) dc.requestedQuantity = req.body.requestedQuantity;
    
    // Save without validating required fields that might not be present during update
    await dc.save({ validateBeforeSave: false });

    const populatedDC = await DC.findById(dc._id)
      .populate('saleId', 'customerName product quantity status poDocument')
      .populate('dcOrderId', 'school_name contact_person contact_mobile email address location zone products due_amount due_percentage')
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
  updateDC,
  submitDCToManager,
};
