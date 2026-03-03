const express = require('express');
const router = express.Router();
const partnerCostController = require('../controllers/vendorCostController'); // TODO: Rename file to partnerCostController.js
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware('Admin', 'Super Admin'));

router.get('/zones', partnerCostController.getZones);
router.get('/schools', partnerCostController.getAllSchools);
router.get('/schools/zone/:zone', partnerCostController.getSchoolsByZone);
router.get('/:partnerId', partnerCostController.getPartnerCost);
router.put('/:partnerId', partnerCostController.updatePartnerCost);

module.exports = router;
