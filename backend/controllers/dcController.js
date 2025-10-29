const DC = require('../models/DC');

// @desc    Get all DC records
// @route   GET /api/dc
// @access  Private
const getDCs = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;

    const dcs = await DC.find(filter)
      .populate('saleId')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email')
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
      .populate('saleId')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email');

    if (!dc) {
      return res.status(404).json({ message: 'DC record not found' });
    }

    res.json(dc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create DC
// @route   POST /api/dc/create
// @access  Private
const createDC = async (req, res) => {
  try {
    const dc = await DC.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populatedDC = await DC.findById(dc._id)
      .populate('saleId')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedDC);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update DC status
// @route   PUT /api/dc/:id
// @access  Private
const updateDC = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (req.body.status === 'Delivered') {
      updateData.deliveredAt = new Date();
    }

    const dc = await DC.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('saleId')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email');

    if (!dc) {
      return res.status(404).json({ message: 'DC record not found' });
    }

    res.json(dc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDCs,
  getDC,
  createDC,
  updateDC,
};

