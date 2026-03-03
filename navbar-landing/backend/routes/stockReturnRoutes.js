const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');
const {
  createExecutiveReturn,
  updateExecutiveReturn,
  getExecutiveReturnById,
  listExecutiveReturns,
  listMyExecutiveReturns,
  listWarehouseExecutiveQueue,
  getReturnForWarehouseExecutive,
  listWarehouseManagerQueue,
  getReturnForWarehouseManager,
  createWarehouseReturn,
  listWarehouseReturns,
  warehouseVerifyReturn,
  managerAction,
  uploadReturnPhoto,
  uploadReturnPhotoMiddleware,
} = require('../controllers/stockReturnController');

router.post('/executive', authMiddleware, createExecutiveReturn);
router.get('/executive/list', authMiddleware, listExecutiveReturns);
router.get('/executive', authMiddleware, listExecutiveReturns); // Keep for backward compatibility
router.get('/executive/mine', authMiddleware, listMyExecutiveReturns);

router.get('/warehouse-executive/queue', authMiddleware, listWarehouseExecutiveQueue);
router.get('/warehouse-executive/:id', authMiddleware, getReturnForWarehouseExecutive);

router.get('/warehouse-manager/queue', authMiddleware, listWarehouseManagerQueue);
router.get('/warehouse-manager/:id', authMiddleware, getReturnForWarehouseManager);

router.get('/:id', authMiddleware, getExecutiveReturnById);
router.put('/:id', authMiddleware, updateExecutiveReturn);

router.post('/warehouse', authMiddleware, createWarehouseReturn);
router.get('/warehouse', authMiddleware, listWarehouseReturns);

// Photo upload - must be before /:id routes
router.post('/upload-photo', authMiddleware, (req, res, next) => {
  uploadReturnPhotoMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size exceeds 5MB limit' });
        }
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: err.message || 'File upload error' });
    }
    next();
  });
}, uploadReturnPhoto);

// Warehouse Executive verification endpoint
router.put('/:id/warehouse-verify', authMiddleware, warehouseVerifyReturn);

// Warehouse Manager action endpoint
router.put('/:id/manager-action', authMiddleware, managerAction);

module.exports = router;


