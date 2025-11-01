const express = require('express');
const router = express.Router();
const {
  getExpenses,
  getManagerPendingExpenses,
  getFinancePendingExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  approveExpense,
} = require('../controllers/expenseController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getExpenses);
router.get('/manager-pending', authMiddleware, getManagerPendingExpenses);
router.get('/finance-pending', authMiddleware, getFinancePendingExpenses);
router.get('/:id', authMiddleware, getExpenseById);
router.post('/create', authMiddleware, createExpense);
router.put('/:id', authMiddleware, updateExpense);
router.put('/:id/approve', authMiddleware, approveExpense);

module.exports = router;

