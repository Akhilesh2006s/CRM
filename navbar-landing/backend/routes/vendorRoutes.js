const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware('Admin', 'Super Admin'));

router.get('/', vendorController.list);
router.get('/:id', vendorController.getOne);
router.post('/', vendorController.create);

module.exports = router;
