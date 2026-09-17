const express = require('express');
const router = express.Router();
const {
  recordPing,
  getLatestPositions,
  getEmployeeRoute,
  getEmployeeDistance,
} = require('../controllers/trackingController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/ping', authMiddleware, recordPing);
router.get('/latest', authMiddleware, getLatestPositions);
router.get('/:employeeId/route', authMiddleware, getEmployeeRoute);
router.get('/:employeeId/distance', authMiddleware, getEmployeeDistance);

module.exports = router;
