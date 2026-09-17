const express = require('express');
const router = express.Router();
const {
  createVisit,
  getVisits,
  getMyVisits,
  getVisitCategories,
  getVisit,
  updateVisit,
  getVisitStats,
  exportVisits,
} = require('../controllers/visitController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Static paths first so they are not captured by /:id
router.get('/categories', authMiddleware, getVisitCategories);
router.get('/stats', authMiddleware, getVisitStats);
router.get('/my', authMiddleware, getMyVisits);
router.get('/export', authMiddleware, exportVisits);

router.get('/', authMiddleware, getVisits);
router.post('/', authMiddleware, createVisit);
router.get('/:id', authMiddleware, getVisit);
router.put('/:id', authMiddleware, updateVisit);

module.exports = router;
