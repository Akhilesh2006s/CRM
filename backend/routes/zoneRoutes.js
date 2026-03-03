const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { getZones, upsertZone, deleteZone } = require('../controllers/zoneController');

// Get all zones
router.get('/', authMiddleware, getZones);

// Create / update zone (Admin / Super Admin)
router.post('/', authMiddleware, roleMiddleware('Admin', 'Super Admin'), upsertZone);

// Delete zone (Admin / Super Admin)
router.delete('/:id', authMiddleware, roleMiddleware('Admin', 'Super Admin'), deleteZone);

module.exports = router;

