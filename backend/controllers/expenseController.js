const Expense = require('../models/Expense');
const User = require('../models/User');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const { status, category, startDate, endDate, employeeId, trainerId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (employeeId) filter.employeeId = employeeId;
    if (trainerId) filter.trainerId = trainerId;
    if (startDate || endDate) {
      filter.raisedDate = filter.raisedDate || {};
      if (startDate) filter.raisedDate.$gte = new Date(startDate);
      if (endDate) filter.raisedDate.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter)
      .populate('employeeId', 'name email')
      .populate('trainerId', 'name email')
      .populate('approvedBy', 'name email')
      .populate('createdBy', 'name email')
      .sort({ raisedDate: -1, createdAt: -1 });

    // Format expenses to include employeeName and expType
    const formattedExpenses = expenses.map(expense => ({
      ...expense.toObject(),
      employeeName: expense.employeeName || expense.employeeId?.name || '',
      expType: expense.expType || expense.category || '',
      raisedDate: expense.raisedDate || expense.date || expense.createdAt,
    }));

    res.json(formattedExpenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get manager pending expenses
// @route   GET /api/expenses/manager-pending
// @access  Private
const getManagerPendingExpenses = async (req, res) => {
  try {
    const { employeeId, trainerId } = req.query;
    const filter = { status: 'Pending' };

    if (employeeId) filter.employeeId = employeeId;
    if (trainerId) filter.trainerId = trainerId;

    const expenses = await Expense.find(filter)
      .populate('employeeId', 'name email')
      .populate('trainerId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ raisedDate: -1, createdAt: -1 });

    // Format expenses and calculate pending months
    const formattedExpenses = expenses.map(expense => {
      const raisedDate = expense.raisedDate || expense.date || expense.createdAt;
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = monthNames[new Date(raisedDate).getMonth()];

      return {
        ...expense.toObject(),
        employeeName: expense.employeeName || expense.employeeId?.name || '',
        expType: expense.expType || expense.category || '',
        raisedDate: raisedDate,
        pendingMonths: expense.pendingMonths || monthName,
      };
    });

    res.json(formattedExpenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get finance pending expenses (manager approved, finance pending)
// @route   GET /api/expenses/finance-pending
// @access  Private
const getFinancePendingExpenses = async (req, res) => {
  try {
    const { employeeId, trainerId } = req.query;
    const filter = { status: 'Finance Pending' };

    if (employeeId) filter.employeeId = employeeId;
    if (trainerId) filter.trainerId = trainerId;

    const expenses = await Expense.find(filter)
      .populate('employeeId', 'name email')
      .populate('trainerId', 'name email')
      .populate('approvedBy', 'name email')
      .populate('createdBy', 'name email')
      .sort({ raisedDate: -1, createdAt: -1 });

    // Format expenses and calculate pending months
    const formattedExpenses = expenses.map(expense => {
      const raisedDate = expense.raisedDate || expense.date || expense.createdAt;
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = monthNames[new Date(raisedDate).getMonth()];

      return {
        ...expense.toObject(),
        employeeName: expense.employeeName || expense.employeeId?.name || '',
        expType: expense.expType || expense.category || '',
        raisedDate: raisedDate,
        pendingMonths: expense.pendingMonths || monthName,
        approvedManager: expense.approvedManager || expense.approvedBy?.name || '',
        empAmount: expense.amount || 0,
        approvedAmount: expense.approvalAmount || expense.amount || 0,
      };
    });

    res.json(formattedExpenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create expense
// @route   POST /api/expenses/create
// @access  Private
const createExpense = async (req, res) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single expense by ID
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('employeeId', 'name email')
      .populate('trainerId', 'name email')
      .populate('approvedBy', 'name email')
      .populate('createdBy', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update expense (for manager to update approval amount and remarks, or finance to update finance fields)
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
  try {
    const { approvalAmount, managerRemarks, financeRemarks, status } = req.body;

    const updateData = {};
    if (approvalAmount !== undefined) updateData.approvalAmount = approvalAmount;
    if (managerRemarks !== undefined) updateData.managerRemarks = managerRemarks;
    if (financeRemarks !== undefined) updateData.financeRemarks = financeRemarks;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'Approved') {
        // Check if this is a finance pending expense being fully approved
        const currentExpense = await Expense.findById(req.params.id);
        if (currentExpense && currentExpense.status === 'Finance Pending') {
          updateData.financeApprovedBy = req.user._id;
          updateData.financeApprovedAt = new Date();
        } else {
          // Manager approval
          updateData.approvedBy = req.user._id;
          updateData.approvedAt = new Date();
        }
      } else if (status === 'Finance Pending') {
        // Manager approving expense, moving it to finance pending
        const currentExpense = await Expense.findById(req.params.id);
        if (currentExpense && currentExpense.status === 'Pending') {
          updateData.approvedBy = req.user._id;
          updateData.approvedAt = new Date();
          // Store manager name for quick access
          const manager = await User.findById(req.user._id).select('name');
          if (manager) {
            updateData.approvedManager = manager.name;
          }
        }
      }
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('employeeId', 'name email')
      .populate('trainerId', 'name email')
      .populate('approvedBy', 'name email')
      .populate('createdBy', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve expense
// @route   PUT /api/expenses/:id/approve
// @access  Private
const approveExpense = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    const updateData = {
      status,
    };

    if (status === 'Approved') {
      updateData.approvedBy = req.user._id;
      updateData.approvedAt = new Date();
    } else if (status === 'Rejected') {
      updateData.rejectionReason = rejectionReason;
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('employeeId', 'name email')
      .populate('approvedBy', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getExpenses,
  getManagerPendingExpenses,
  getFinancePendingExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  approveExpense,
};

