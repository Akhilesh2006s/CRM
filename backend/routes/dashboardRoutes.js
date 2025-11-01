const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getLeadsByZone,
  getRevenueTrends,
  getLeadsVolume,
  getRecentActivities,
  getAlerts,
  getZoneWiseLeads,
  getExecutiveWiseLeads,
  getZoneWiseClosedLeads,
  getExecutiveWiseClosedLeads
} = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/stats', authMiddleware, getDashboardStats);
router.get('/leads-by-zone', authMiddleware, getLeadsByZone);
router.get('/revenue-trends', authMiddleware, getRevenueTrends);
router.get('/leads-volume', authMiddleware, getLeadsVolume);
router.get('/recent-activities', authMiddleware, getRecentActivities);
router.get('/alerts', authMiddleware, getAlerts);
router.get('/leads-analytics/zone-wise', authMiddleware, getZoneWiseLeads);
router.get('/leads-analytics/executive-wise', authMiddleware, getExecutiveWiseLeads);
router.get('/leads-analytics/zone-wise-closed', authMiddleware, getZoneWiseClosedLeads);
router.get('/leads-analytics/executive-wise-closed', authMiddleware, getExecutiveWiseClosedLeads);

module.exports = router;


