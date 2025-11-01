const express = require('express');
const router = express.Router();
const {
  getServices,
  getService,
  createService,
  updateService,
  cancelService,
} = require('../controllers/serviceController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getServices);
router.get('/:id', authMiddleware, getService);
router.post('/create', authMiddleware, createService);
router.put('/:id', authMiddleware, updateService);
router.put('/:id/cancel', authMiddleware, cancelService);

module.exports = router;



