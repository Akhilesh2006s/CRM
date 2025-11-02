const Service = require('../models/Service');

// @desc    Get all services with filters
// @route   GET /api/services
// @access  Private
const getServices = async (req, res) => {
  try {
    const { status, trainerId, employeeId, zone, schoolCode, schoolName, fromDate, toDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (trainerId) filter.trainerId = trainerId;
    if (employeeId) filter.employeeId = employeeId;
    if (zone) filter.zone = zone;
    if (schoolCode) filter.schoolCode = { $regex: schoolCode, $options: 'i' };
    if (schoolName) filter.schoolName = { $regex: schoolName, $options: 'i' };
    if (fromDate || toDate) {
      filter.serviceDate = {};
      if (fromDate) filter.serviceDate.$gte = new Date(fromDate);
      if (toDate) filter.serviceDate.$lte = new Date(toDate);
    }

    const services = await Service.find(filter)
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ serviceDate: -1 });

    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Private
const getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email');

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create service
// @route   POST /api/services/create
// @access  Private
const createService = async (req, res) => {
  try {
    const service = await Service.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populatedService = await Service.findById(service._id)
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedService);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private
const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email');

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel service
// @route   PUT /api/services/:id/cancel
// @access  Private
const cancelService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled' },
      { new: true }
    )
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email');

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getServices,
  getService,
  createService,
  updateService,
  cancelService,
};




