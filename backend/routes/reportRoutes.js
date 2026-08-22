const express = require('express');
const router = express.Router();
const {
  getAllReports,
  getSalesReports,
  generateReport,
  listChangeLogs,
  exportChangeLogs,
  exportStockReport,
  exportDcReport,
  exportReturnsReport,
  exportTrainingReport,
} = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/permissionMiddleware');

router.get('/all', authMiddleware, getAllReports);
router.get('/sales', authMiddleware, getSalesReports);
router.post('/generate', authMiddleware, generateReport);

router.get('/change-logs/export', authMiddleware, requirePermission('reports.change_logs.page.view'), exportChangeLogs);
router.get('/change-logs', authMiddleware, requirePermission('reports.change_logs.page.view'), listChangeLogs);
router.get('/stock/export', authMiddleware, requirePermission('reports.stock.page.view'), exportStockReport);
router.get('/dc/export', authMiddleware, requirePermission('reports.dc.page.view'), exportDcReport);
router.get('/returns/export', authMiddleware, requirePermission('reports.returns.page.view'), exportReturnsReport);
router.get('/training/export', authMiddleware, requirePermission('reports.training_service.page.view', 'reports.leads.page.view'), exportTrainingReport);

module.exports = router;
