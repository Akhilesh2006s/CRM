const express = require('express');
const router = express.Router();
const {
  getPayments,
  createPayment,
  approvePayment,
} = require('../controllers/paymentController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getPayments);
router.post('/create', authMiddleware, createPayment);
router.put('/:id/approve', authMiddleware, roleMiddleware('Finance Manager', 'Admin', 'Super Admin'), approvePayment);

module.exports = router;

