const Payment = require('../models/Payment');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
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

module.exports = {
  getPayments,
  createPayment,
  approvePayment,
};

