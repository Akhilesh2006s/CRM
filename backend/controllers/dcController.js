const Lead = require('../models/Lead');

// @desc    List Deal Conversion leads (optionally by status/employee)
// @route   GET /api/dc
// @access  Private
const getDCs = async (req, res) => {
  try {
    const { status, employeeId, q } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (employeeId) filter.managed_by = employeeId;
    if (q) {
      filter.$or = [
        { school_name: new RegExp(q, 'i') },
        { contact_person: new RegExp(q, 'i') },
        { contact_mobile: new RegExp(q, 'i') },
        { products: new RegExp(q, 'i') },
        { location: new RegExp(q, 'i') },
        { school_code: new RegExp(q, 'i') },
      ];
    }

    const leads = await Lead.find(filter)
      .populate('createdBy', 'name email')
      .populate('assigned_by', 'name email')
      .populate('managed_by', 'name email')
      .sort({ createdAt: -1 });

    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single lead in DC module
// @route   GET /api/dc/:id
// @access  Private
const getDC = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assigned_by', 'name email')
      .populate('managed_by', 'name email');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new deal (lead) in DC
// @route   POST /api/dc/create
// @access  Private
const createDC = async (req, res) => {
  try {
    const {
      school_name,
      contact_person,
      contact_mobile,
      products,
      location,
      assigned_by,
      managed_by,
      status,
      priority,
      zone,
      strength,
      remarks,
      follow_up_date,
    } = req.body;

    if (!school_name || !contact_person || !contact_mobile) {
      return res.status(400).json({ message: 'school_name, contact_person, contact_mobile are required' });
    }

    const lead = await Lead.create({
      school_name,
      contact_person,
      contact_mobile,
      products,
      location,
      assigned_by: assigned_by || req.user?._id,
      managed_by: managed_by || req.user?._id,
      status: status || 'Pending',
      priority,
      zone,
      strength,
      remarks,
      follow_up_date,
      createdBy: req.user._id,
    });

    const populated = await Lead.findById(lead._id)
      .populate('createdBy', 'name email')
      .populate('assigned_by', 'name email')
      .populate('managed_by', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a deal/lead (status transitions, PO, assignments)
// @route   PUT /api/dc/:id
// @access  Private
const updateDC = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Normalize allowed status values
    const allowedStatuses = ['Pending', 'Processing', 'Saved', 'Closed'];
    if (updateData.status && !allowedStatuses.includes(updateData.status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email')
      .populate('assigned_by', 'name email')
      .populate('managed_by', 'name email');

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Employee stats for DC (counts per status)
// @route   GET /api/dc/stats/employee
// @access  Private
const employeeStats = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const match = {};
    if (employeeId) match.managed_by = employeeId;

    const agg = await Lead.aggregate([
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
      { total: 0, byStatus: { Pending: 0, Processing: 0, Saved: 0, Closed: 0 } }
    );

    res.json(totals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDCs,
  getDC,
  createDC,
  updateDC,
  employeeStats,
};

