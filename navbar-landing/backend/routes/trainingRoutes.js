const express = require('express');
const router = express.Router();
const {
  getTrainings,
  getTraining,
  createTraining,
  updateTraining,
  cancelTraining,
  getTrainingStats,
  getMyTrainings,
  getMyCompletedTrainings,
  markTrainingAttendance,
  completeTraining,
  uploadTrainingFeedback,
  uploadFeedbackMiddleware,
} = require('../controllers/trainingController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware, getTrainingStats);
router.get('/trainer/my', authMiddleware, getMyTrainings);
router.get('/trainer/completed', authMiddleware, getMyCompletedTrainings);
router.post('/:id/mark-attendance', authMiddleware, markTrainingAttendance);
router.post('/:id/complete', authMiddleware, completeTraining);
router.post('/:id/upload-feedback', authMiddleware, uploadFeedbackMiddleware, uploadTrainingFeedback);
router.get('/', authMiddleware, getTrainings);
router.get('/:id', authMiddleware, getTraining);
router.post('/create', authMiddleware, createTraining);
router.put('/:id', authMiddleware, updateTraining);
router.put('/:id/cancel', authMiddleware, cancelTraining);

module.exports = router;

