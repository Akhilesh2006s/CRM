const express = require('express');
const router = express.Router();
const {
  getSales,
  getSale,
  createSale,
  updateSale,
} = require('../controllers/salesController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getSales);
router.get('/:id', authMiddleware, getSale);
router.post('/create', authMiddleware, createSale);
router.put('/:id', authMiddleware, updateSale);

module.exports = router;

