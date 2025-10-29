const express = require('express');
const router = express.Router();
const {
  getExpenses,
  createExpense,
  approveExpense,
} = require('../controllers/expenseController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getExpenses);
router.post('/create', authMiddleware, createExpense);
router.put('/:id/approve', authMiddleware, approveExpense);

module.exports = router;

