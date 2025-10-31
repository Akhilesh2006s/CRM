const Payment = require('../models/Payment');
const ExcelJS = require('exceljs');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  try {
    const { 
      status, 
      startDate, 
      endDate, 
      paymentMode,
      schoolCode,
      schoolName,
      mobileNo,
      employee,
      zone,
      paymentMethod,
    } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (paymentMode || paymentMethod) filter.paymentMethod = paymentMode || paymentMethod;
    if (schoolCode) filter.schoolCode = { $regex: schoolCode, $options: 'i' };
    if (schoolName) filter.customerName = { $regex: schoolName, $options: 'i' };
    if (mobileNo) filter.mobileNumber = { $regex: mobileNo, $options: 'i' };
    if (zone) filter.zone = { $regex: zone, $options: 'i' };
    if (employee) {
      // Assuming employee is name or email - need to lookup user first
      filter.createdBy = employee; // This would need proper user lookup in production
    }
    
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) filter.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate('saleId')
      .populate('approvedBy', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create payment
// @route   POST /api/payments/create
// @access  Private
const createPayment = async (req, res) => {
  try {
    const payment = await Payment.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate('saleId')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('saleId')
      .populate('approvedBy', 'name email')
      .populate('createdBy', 'name email')
      .populate('rejectedBy', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
const updatePayment = async (req, res) => {
  try {
    const { status, referenceNumber, refNo, description } = req.body;
    const updateData = {};

    if (status) {
      updateData.status = status;
      if (status === 'Approved') {
        updateData.approvedBy = req.user._id;
        updateData.approvedAt = new Date();
      } else if (status === 'Rejected') {
        updateData.rejectedBy = req.user._id;
        updateData.rejectedAt = new Date();
      }
    }
    if (referenceNumber !== undefined) updateData.referenceNumber = referenceNumber;
    if (refNo !== undefined) updateData.refNo = refNo;
    if (referenceNumber !== undefined && !refNo) updateData.refNo = referenceNumber;
    if (description !== undefined) updateData.description = description;

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('saleId')
      .populate('approvedBy', 'name email')
      .populate('createdBy', 'name email')
      .populate('rejectedBy', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve payment
// @route   PUT /api/payments/:id/approve
// @access  Private
const approvePayment = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    const updateData = {
      status,
    };

    if (status === 'Approved') {
      updateData.approvedBy = req.user._id;
      updateData.approvedAt = new Date();
    } else if (status === 'Rejected') {
      updateData.rejectedBy = req.user._id;
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = rejectionReason;
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('saleId')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export payments to Excel
// @route   GET /api/payments/export
// @access  Private
const exportPayments = async (req, res) => {
  try {
    const { 
      status, 
      startDate, 
      endDate, 
      paymentMode,
      schoolCode,
      schoolName,
      mobileNo,
      employee,
      zone,
    } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (paymentMode) filter.paymentMethod = paymentMode;
    if (schoolCode) filter.schoolCode = { $regex: schoolCode, $options: 'i' };
    if (schoolName) filter.customerName = { $regex: schoolName, $options: 'i' };
    if (mobileNo) filter.mobileNumber = { $regex: mobileNo, $options: 'i' };
    if (zone) filter.zone = { $regex: zone, $options: 'i' };
    
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) filter.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate('saleId')
      .populate('approvedBy', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payments');

    // Define columns
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 10 },
      { header: 'School Code', key: 'schoolCode', width: 15 },
      { header: 'School Name', key: 'customerName', width: 30 },
      { header: 'Contact Name', key: 'contactName', width: 20 },
      { header: 'Mobile', key: 'mobileNumber', width: 15 },
      { header: 'Location', key: 'location', width: 30 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Ref No', key: 'refNo', width: 15 },
      { header: 'Payment Mode', key: 'paymentMethod', width: 15 },
      { header: 'Payment Fin Year', key: 'financialYear', width: 15 },
      { header: 'Date', key: 'paymentDate', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    // Add data
    payments.forEach((payment, index) => {
      worksheet.addRow({
        sno: index + 1,
        schoolCode: payment.schoolCode || '',
        customerName: payment.customerName || '',
        contactName: payment.contactName || '',
        mobileNumber: payment.mobileNumber || '',
        location: payment.location || '',
        amount: payment.amount || 0,
        refNo: payment.refNo || payment.referenceNumber || '',
        paymentMethod: payment.paymentMethod || '',
        financialYear: payment.financialYear || '',
        paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '',
        status: payment.status || '',
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
    res.setHeader('Content-Disposition', `attachment; filename=Payments_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  approvePayment,
  exportPayments,
};

