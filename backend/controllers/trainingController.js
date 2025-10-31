const Training = require('../models/Training');

// @desc    Get all trainings with filters
// @route   GET /api/training
// @access  Private
const getTrainings = async (req, res) => {
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
      filter.trainingDate = {};
      if (fromDate) filter.trainingDate.$gte = new Date(fromDate);
      if (toDate) filter.trainingDate.$lte = new Date(toDate);
    }

    const trainings = await Training.find(filter)
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ trainingDate: -1 });

    res.json(trainings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single training
// @route   GET /api/training/:id
// @access  Private
const getTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id)
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email');

    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    res.json(training);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create training
// @route   POST /api/training/create
// @access  Private
const createTraining = async (req, res) => {
  try {
    const training = await Training.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populatedTraining = await Training.findById(training._id)
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedTraining);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update training
// @route   PUT /api/training/:id
// @access  Private
const updateTraining = async (req, res) => {
  try {
    const training = await Training.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email')
      .populate('createdBy', 'name email');

    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    res.json(training);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel training
// @route   PUT /api/training/:id/cancel
// @access  Private
const cancelTraining = async (req, res) => {
  try {
    const training = await Training.findByIdAndUpdate(
      req.params.id,
      { status: 'Cancelled' },
      { new: true }
    )
      .populate('trainerId', 'name mobile')
      .populate('employeeId', 'name email');

    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    res.json(training);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTrainings,
  getTraining,
  createTraining,
  updateTraining,
  cancelTraining,
};

