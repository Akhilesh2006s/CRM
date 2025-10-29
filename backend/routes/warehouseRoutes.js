const express = require('express');
const router = express.Router();
const {
  getWarehouse,
  updateStock,
  getWarehouseReports,
} = require('../controllers/warehouseController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getWarehouse);
router.post('/stock', authMiddleware, updateStock);
router.get('/reports', authMiddleware, getWarehouseReports);

module.exports = router;

