const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  getEmployeeLeaves,
} = require('../controllers/employeeController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getEmployees);
router.get('/:id', authMiddleware, getEmployee);
router.get('/:id/leaves', authMiddleware, getEmployeeLeaves);
router.post('/create', authMiddleware, createEmployee);
router.put('/:id', authMiddleware, updateEmployee);

module.exports = router;

