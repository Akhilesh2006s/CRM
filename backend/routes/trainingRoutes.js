const express = require('express');
const router = express.Router();
const {
  getTrainings,
  getTraining,
  createTraining,
  assignTraining,
  completeTraining,
} = require('../controllers/trainingController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getTrainings);
router.get('/:id', authMiddleware, getTraining);
router.post('/create', authMiddleware, createTraining);
router.post('/assign', authMiddleware, assignTraining);
router.put('/:id/complete', authMiddleware, completeTraining);

module.exports = router;

