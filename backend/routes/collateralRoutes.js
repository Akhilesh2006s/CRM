const express = require('express');
const router = express.Router();
const { listCollateral, createCollateral, updateCollateral } = require('../controllers/collateralController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, listCollateral);
router.post('/', authMiddleware, createCollateral);
router.put('/:id', authMiddleware, updateCollateral);

module.exports = router;
