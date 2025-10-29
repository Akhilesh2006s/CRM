const express = require('express');
const router = express.Router();
const {
  getDCs,
  getDC,
  createDC,
  updateDC,
} = require('../controllers/dcController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getDCs);
router.get('/:id', authMiddleware, getDC);
router.post('/create', authMiddleware, createDC);
router.put('/:id', authMiddleware, updateDC);

module.exports = router;

