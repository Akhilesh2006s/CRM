const Training = require('../models/Training');

// @desc    Get all trainings
// @route   GET /api/training
// @access  Private
const getTrainings = async (req, res) => {
  try {
    const { status, trainerId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (trainerId) filter.trainerId = trainerId;

    const trainings = await Training.find(filter)
      .populate('trainerId', 'name email')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

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
      .populate('trainerId', 'name email')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('completionStatus.employeeId', 'name email');

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
      .populate('trainerId', 'name email')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedTraining);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign training
// @route   POST /api/training/assign
// @access  Private
const assignTraining = async (req, res) => {
  try {
    const { trainingId, employeeIds } = req.body;

    const training = await Training.findByIdAndUpdate(
      trainingId,
      { $addToSet: { assignedTo: { $each: employeeIds } } },
      { new: true }
    )
      .populate('trainerId', 'name email')
      .populate('assignedTo', 'name email');

    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    res.json(training);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark training as complete
// @route   PUT /api/training/:id/complete
// @access  Private
const completeTraining = async (req, res) => {
  try {
    const { employeeId, score } = req.body;

    const training = await Training.findById(req.params.id);

    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    const completionIndex = training.completionStatus.findIndex(
      (c) => c.employeeId.toString() === employeeId
    );

    if (completionIndex >= 0) {
      training.completionStatus[completionIndex].status = 'Completed';
      training.completionStatus[completionIndex].completedAt = new Date();
      if (score) training.completionStatus[completionIndex].score = score;
    } else {
      training.completionStatus.push({
        employeeId,
        status: 'Completed',
        completedAt: new Date(),
        score,
      });
    }

    await training.save();

    const populatedTraining = await Training.findById(training._id)
      .populate('trainerId', 'name email')
      .populate('assignedTo', 'name email')
      .populate('completionStatus.employeeId', 'name email');

    res.json(populatedTraining);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTrainings,
  getTraining,
  createTraining,
  assignTraining,
  completeTraining,
};

