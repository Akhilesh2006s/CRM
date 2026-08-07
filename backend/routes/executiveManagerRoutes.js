const express = require('express');
const router = express.Router();
const {
  createExecutiveManager,
  getExecutiveManagers,
  assignEmployeesToManager,
  assignZoneToEmployee,
  assignAreaToEmployee,
  getManagerEmployees,
  getMyExecutives,
  getManagerDashboard,
  getManagerEmployeeLeaves,
  approveManagerEmployeeLeave,
  updateManagerState,
} = require('../controllers/executiveManagerController');
const { listPoChangeRequests } = require('../controllers/dcOrderController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { checkDbHealth } = require('../middleware/dbHealthMiddleware');
const { isSuperAdminUser } = require('../utils/permissions');

/** Executive, or Super Admin (role or allowlisted email). */
const allowAssignArea = (req, res, next) => {
  if (isSuperAdminUser(req.user)) return next();
  return roleMiddleware('Executive')(req, res, next);
};

// Executive Manager: PO change requests list (static path before /:managerId)
router.get('/po-change-requests', authMiddleware, listPoChangeRequests);

// Admin only routes
router.post('/create', authMiddleware, roleMiddleware('Super Admin', 'Admin'), createExecutiveManager);
router.put('/:managerId/assign-employees', authMiddleware, roleMiddleware('Super Admin', 'Admin'), assignEmployeesToManager);
router.put('/:managerId/state', authMiddleware, roleMiddleware('Super Admin', 'Admin'), updateManagerState);

// Executive Manager routes
router.get('/my/executives', authMiddleware, getMyExecutives);
router.get('/:managerId/employees', authMiddleware, checkDbHealth, getManagerEmployees);
router.get('/:managerId/dashboard', authMiddleware, checkDbHealth, getManagerDashboard);
router.get('/:managerId/leaves', authMiddleware, checkDbHealth, getManagerEmployeeLeaves);
router.put('/assign-zone', authMiddleware, roleMiddleware('Executive Manager', 'Admin', 'Super Admin'), assignZoneToEmployee);
router.put('/leaves/:leaveId/approve', authMiddleware, roleMiddleware('Executive Manager'), approveManagerEmployeeLeave);

// Executive + Super Admin (role or SUPER_ADMIN_EMAILS allowlist)
router.put('/assign-area', authMiddleware, allowAssignArea, assignAreaToEmployee);

// General routes
router.get('/', authMiddleware, getExecutiveManagers);

module.exports = router;

