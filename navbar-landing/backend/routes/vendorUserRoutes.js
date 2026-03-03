const express = require('express');
const router = express.Router();
const {
  getVendorDashboard,
  getVendorStocks,
  ensureVendor,
} = require('../controllers/vendorUserController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.use(ensureVendor);

router.get('/dashboard', getVendorDashboard);
router.get('/stocks', getVendorStocks);

module.exports = router;
