const express = require('express');
const router = express.Router();
const {
  createProgram,
  getProgram,
  upsertLevelDelivery,
  triggerRecompute,
  getProgramLedger,
} = require('../controllers/programBillingController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.post(
  '/',
  authMiddleware,
  roleMiddleware('Finance Manager', 'Admin', 'Super Admin', 'Manager'),
  createProgram
);
router.get('/:id', authMiddleware, getProgram);
router.put(
  '/:id/level-delivery',
  authMiddleware,
  roleMiddleware('Finance Manager', 'Admin', 'Super Admin', 'Manager'),
  upsertLevelDelivery
);
router.post(
  '/:id/recompute',
  authMiddleware,
  roleMiddleware('Finance Manager', 'Admin', 'Super Admin', 'Manager'),
  triggerRecompute
);
router.get('/:id/ledger', authMiddleware, getProgramLedger);

module.exports = router;
