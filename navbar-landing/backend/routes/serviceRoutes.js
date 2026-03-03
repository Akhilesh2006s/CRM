const express = require('express');
const router = express.Router();
const {
  getServices,
  getService,
  createService,
  updateService,
  cancelService,
  getServiceStats,
  getMyServices,
  getMyCompletedServices,
  markServiceAttendance,
  completeService,
  uploadServiceFeedback,
  uploadFeedbackMiddleware,
} = require('../controllers/serviceController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware, getServiceStats);
router.get('/trainer/my', authMiddleware, getMyServices);
router.get('/trainer/completed', authMiddleware, getMyCompletedServices);
router.post('/:id/mark-attendance', authMiddleware, markServiceAttendance);
router.post('/:id/complete', authMiddleware, completeService);
router.post('/:id/upload-feedback', authMiddleware, uploadFeedbackMiddleware, uploadServiceFeedback);
router.get('/', authMiddleware, getServices);
router.get('/:id', authMiddleware, getService);
router.post('/create', authMiddleware, createService);
router.put('/:id', authMiddleware, updateService);
router.put('/:id/cancel', authMiddleware, cancelService);

module.exports = router;




