const express = require('express');
const router = express.Router();
const {
  getPartnerDashboard,
  getPartnerStocks,
  getPartnerDCs,
  ensurePartner,
} = require('../controllers/vendorUserController'); // TODO: Rename file to partnerUserController.js
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.use(ensurePartner);

router.get('/dashboard', getPartnerDashboard);
router.get('/stocks', getPartnerStocks);
router.get('/dcs', getPartnerDCs);

module.exports = router;
