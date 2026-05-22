const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  listBranches,
  listCustomers,
  listLeads,
  listVehicles,
  listFacilities,
  listVinFinancing,
  createBranch,
  createCustomer,
  createLead,
  createVehicle,
  createFacility,
  createVinFinance,
  updateBranch,
  updateCustomer,
  updateLead,
  updateVehicle,
  updateFacility,
  updateVinFinance,
  deleteBranch,
  deleteCustomer,
  deleteLead,
  deleteVehicle,
  deleteFacility,
  deleteVinFinance,
  importCustomers,
  importLeads,
  importVehicles,
  importBranches,
  importVariants,
} = require('../controllers/dmsController');
const {
  listVariants,
  createVariant,
  updateVariant,
  deleteVariant,
} = require('../controllers/dmsVariantController');

// List APIs
router.get('/branches', authMiddleware, listBranches);
router.get('/variants', authMiddleware, listVariants);
router.get('/customers', authMiddleware, listCustomers);
router.get('/leads', authMiddleware, listLeads);
router.get('/vehicles', authMiddleware, listVehicles);
router.get('/facilities', authMiddleware, listFacilities);
router.get('/vin-financing', authMiddleware, listVinFinancing);
router.get(
  '/analytics/working-capital',
  authMiddleware,
  require('../controllers/dmsController').getWorkingCapitalSummary
);

// Create APIs
router.post('/branches', authMiddleware, createBranch);
router.post('/variants', authMiddleware, createVariant);
router.post('/customers', authMiddleware, createCustomer);
router.post('/leads', authMiddleware, createLead);
router.post('/vehicles', authMiddleware, createVehicle);
router.post('/facilities', authMiddleware, createFacility);
router.post('/vin-financing', authMiddleware, createVinFinance);

// Update APIs
router.put('/branches/:branch_id', authMiddleware, updateBranch);
router.put('/variants/:variant_id', authMiddleware, updateVariant);
router.put('/customers/:customer_id', authMiddleware, updateCustomer);
router.put('/leads/:lead_id', authMiddleware, updateLead);
router.put('/vehicles/:vehicle_id', authMiddleware, updateVehicle);
router.put('/facilities/:facility_id', authMiddleware, updateFacility);
router.put('/vin-financing/:vin', authMiddleware, updateVinFinance);

// Delete APIs
router.delete('/branches/:branch_id', authMiddleware, deleteBranch);
router.delete('/variants/:variant_id', authMiddleware, deleteVariant);
router.delete('/customers/:customer_id', authMiddleware, deleteCustomer);
router.delete('/leads/:lead_id', authMiddleware, deleteLead);
router.delete('/vehicles/:vehicle_id', authMiddleware, deleteVehicle);
router.delete('/facilities/:facility_id', authMiddleware, deleteFacility);
router.delete('/vin-financing/:vin', authMiddleware, deleteVinFinance);

// Import CSV (ideally Admin / Super Admin, but reuse authMiddleware for now)
router.post('/import/customers', authMiddleware, importCustomers);
router.post('/import/leads', authMiddleware, importLeads);
router.post('/import/vehicles', authMiddleware, importVehicles);
router.post('/import/branches', authMiddleware, importBranches);
router.post('/import/variants', authMiddleware, importVariants);

module.exports = router;

