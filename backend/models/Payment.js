const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
  },
  customerName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Online Payment', 'Other', 'Cheque'],
    required: true,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'hold/duplicate'],
    default: 'Pending',
  },
  referenceNumber: {
    type: String,
  },
  refNo: {
    type: String,
  },
  description: {
    type: String,
  },
  receipt: {
    type: String,
  },
  // School/Customer information
  schoolCode: {
    type: String,
  },
  contactName: {
    type: String,
  },
  mobileNumber: {
    type: String,
  },
  location: {
    type: String,
  },
  town: {
    type: String,
  },
  zone: {
    type: String,
  },
  cluster: {
    type: String,
  },
  // Payment details
  financialYear: {
    type: String,
  },
  chqDate: {
    type: Date,
  },
  submissionNo: {
    type: String,
  },
  handoverRemarks: {
    type: String,
  },
  txnNo: {
    type: String,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectedAt: {
    type: Date,
  },
  rejectionReason: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Payment', paymentSchema);

