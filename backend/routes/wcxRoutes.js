const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  listExposures,
  getExposure,
  updateExposure,
  deleteExposure,
  importFromCsv,
} = require('../controllers/wcxController');

// All WCX routes are protected
router.get('/', authMiddleware, listExposures);
router.get('/:exposure_id', authMiddleware, getExposure);
router.put('/:exposure_id', authMiddleware, updateExposure);
router.delete('/:exposure_id', authMiddleware, deleteExposure);
router.post('/import/csv', authMiddleware, importFromCsv);

module.exports = router;

