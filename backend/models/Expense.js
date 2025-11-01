const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
    enum: ['Office Supplies', 'Travel', 'Marketing', 'Utilities', 'Salary', 'Rent', 'Food', 'Other', 'Others'],
    required: true,
  },
  expType: {
    type: String,
    // For backward compatibility, can be same as category
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  raisedDate: {
    type: Date,
    default: Date.now,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Other'],
  },
  receipt: {
    type: String,
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  employeeName: {
    type: String,
    // Store employee name for quick access
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  pendingMonths: {
    type: String,
    // Store month name like "October"
  },
  department: {
    type: String,
  },
  // Additional expense detail fields (filled by employee)
  expItemId: {
    type: String,
    // Expense Item ID - unique identifier for the expense item
  },
  gpsDistance: {
    type: String,
    // GPS Distance in kilometers
  },
  expenseDescription: {
    type: String,
    // Detailed description filled by employee
  },
  dateOfExpense: {
    type: Date,
    // The actual date when expense was incurred (not when raised)
  },
  employeeRemarks: {
    type: String,
    // Additional remarks/notes from employee
  },
  // Manager editable fields
  approvalAmount: {
    type: Number,
    // Amount approved by manager (can be different from requested amount)
  },
  managerRemarks: {
    type: String,
    // Manager's comments/remarks on the expense
  },
  billImage: {
    type: String,
    // URL or path to the bill/receipt image uploaded by employee
  },
  status: {
    type: String,
    enum: ['Pending', 'Finance Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  approvedManager: {
    type: String,
    // Store manager name who approved this expense
  },
  financeApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  financeApprovedAt: {
    type: Date,
  },
  financeRemarks: {
    type: String,
    // Finance team's comments/remarks on the expense
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Expense', expenseSchema);

