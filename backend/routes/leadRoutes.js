const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
} = require('../controllers/leadController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getLeads);
router.get('/:id', authMiddleware, getLead);
router.post('/create', authMiddleware, createLead);
router.put('/:id', authMiddleware, updateLead);
router.delete('/:id', authMiddleware, deleteLead);

module.exports = router;

