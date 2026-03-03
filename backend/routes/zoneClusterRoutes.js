const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const {
  getZonesAndClusters,
  upsertZoneCluster,
} = require('../controllers/zoneClusterController');

// Get all zones & clusters (any authenticated user)
router.get('/', authMiddleware, getZonesAndClusters);

// Create / update zone & cluster (Admin / Super Admin only)
router.post(
  '/',
  authMiddleware,
  roleMiddleware('Admin', 'Super Admin'),
  upsertZoneCluster
);

module.exports = router;

