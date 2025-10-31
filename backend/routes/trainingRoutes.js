const express = require('express');
const router = express.Router();
const {
  getTrainings,
  getTraining,
  createTraining,
  updateTraining,
  cancelTraining,
} = require('../controllers/trainingController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getTrainings);
router.get('/:id', authMiddleware, getTraining);
router.post('/create', authMiddleware, createTraining);
router.put('/:id', authMiddleware, updateTraining);
router.put('/:id/cancel', authMiddleware, cancelTraining);

module.exports = router;

