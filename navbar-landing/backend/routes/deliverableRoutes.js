const express = require('express');
const router = express.Router();
const deliverableController = require('../controllers/deliverableController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// List deliverables by product - any authenticated user can read (Executives need this for Close Lead)
router.get('/by-product/:productId', authMiddleware, deliverableController.listByProduct);

// Create deliverable (map to product) - Admin only
router.use(authMiddleware);
router.post('/', roleMiddleware('Admin', 'Super Admin'), deliverableController.create);

module.exports = router;
