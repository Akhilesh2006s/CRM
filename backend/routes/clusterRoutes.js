const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { getClusters, upsertCluster, deleteCluster } = require('../controllers/clusterController');

// Get all clusters
router.get('/', authMiddleware, getClusters);

// Create / update cluster (Admin / Super Admin)
router.post('/', authMiddleware, roleMiddleware('Admin', 'Super Admin'), upsertCluster);

// Delete cluster (Admin / Super Admin)
router.delete('/:id', authMiddleware, roleMiddleware('Admin', 'Super Admin'), deleteCluster);

module.exports = router;

