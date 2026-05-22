const fs = require('fs');
const path = require('path');
const DmsCustomer = require('../models/DmsCustomer');
const DmsLead = require('../models/DmsLead');
const DmsVehicle = require('../models/DmsVehicle');
const DmsBranch = require('../models/DmsBranch');
const DmsVariant = require('../models/DmsVariant');
const DmsFacility = require('../models/DmsFacility');
const DmsVinFinance = require('../models/DmsVinFinance');
const WcxExposure = require('../models/WcxExposure');

// Helpers
function num(value) {
  if (value === null || value === undefined || value === '') return undefined;
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isNaN(n) ? undefined : n;
}

function parseDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

// =========================
// LIST HANDLERS
// =========================

// @route GET /api/dms/branches
exports.listBranches = async (req, res) => {
  try {
    const items = await DmsBranch.find({}).sort({ branch_id: 1 }).lean();
    res.json(items);
  } catch (err) {
    console.error('listBranches error:', err);
    res.status(500).json({ message: 'Failed to load branches', error: err.message });
  }
};

// @route GET /api/dms/variants
exports.listVariants = async (req, res) => {
  try {
    const { model } = req.query;
    const filter = {};
    if (model) filter.model = model;
    const items = await DmsVariant.find(filter).sort({ model: 1, variant_id: 1 }).lean();
    res.json(items);
  } catch (err) {
    console.error('listVariants error:', err);
    res.status(500).json({ message: 'Failed to load variants', error: err.message });
  }
};

// @route GET /api/dms/customers
exports.listCustomers = async (req, res) => {
  try {
    const { city, search } = req.query;
    const filter = {};
    if (city) filter.city = city;
    if (search) {
      filter.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const items = await DmsCustomer.find(filter).sort({ customer_id: 1 }).lean();
    res.json(items);
  } catch (err) {
    console.error('listCustomers error:', err);
    res.status(500).json({ message: 'Failed to load customers', error: err.message });
  }
};

// @route POST /api/dms/customers
exports.createCustomer = async (req, res) => {
  try {
    const payload = {
      customer_id: req.body.customer_id,
      full_name: req.body.full_name,
      phone: req.body.phone,
      email: req.body.email,
      city: req.body.city,
      locality: req.body.locality,
    };

    if (!payload.customer_id || !payload.full_name || !payload.phone) {
      return res
        .status(400)
        .json({ message: 'customer_id, full_name and phone are required' });
    }

    const existing = await DmsCustomer.findOne({ customer_id: payload.customer_id });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'Customer with this ID already exists' });
    }

    const doc = await DmsCustomer.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    console.error('createCustomer error:', err);
    res.status(500).json({ message: 'Failed to create customer', error: err.message });
  }
};

// @route GET /api/dms/leads
exports.listLeads = async (req, res) => {
  try {
    const { branch_preference_id, lead_status } = req.query;
    const filter = {};
    if (branch_preference_id) filter.branch_preference_id = branch_preference_id;
    if (lead_status) filter.lead_status = lead_status;

    const items = await DmsLead.find(filter).sort({ created_date: -1 }).lean();
    res.json(items);
  } catch (err) {
    console.error('listLeads error:', err);
    res.status(500).json({ message: 'Failed to load leads', error: err.message });
  }
};

// @route POST /api/dms/leads
exports.createLead = async (req, res) => {
  try {
    const payload = {
      full_name: req.body.full_name,
      phone: req.body.phone,
      preferred_variant_id: req.body.preferred_variant_id,
      preferred_mode: req.body.preferred_mode,
      budget_inr: num(req.body.budget_inr),
      branch_preference_id: req.body.branch_preference_id,
      lead_status: req.body.lead_status || 'New',
      lead_source: req.body.lead_source,
      created_date: parseDate(req.body.created_date) || new Date(),
      last_contacted_date: parseDate(req.body.last_contacted_date),
      next_followup_date: parseDate(req.body.next_followup_date),
    };

    if (!payload.full_name || !payload.phone) {
      return res
        .status(400)
        .json({ message: 'full_name and phone are required' });
    }

    const doc = await DmsLead.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    console.error('createLead error:', err);
    res.status(500).json({ message: 'Failed to create lead', error: err.message });
  }
};

// @route GET /api/dms/vehicles
exports.listVehicles = async (req, res) => {
  try {
    const { branch_id, model, inventory_status } = req.query;
    const filter = {};
    if (branch_id) filter.branch_id = branch_id;
    if (model) filter.model = model;
    if (inventory_status) filter.inventory_status = inventory_status;

    const items = await DmsVehicle.find(filter).sort({ vehicle_id: 1 }).lean();
    res.json(items);
  } catch (err) {
    console.error('listVehicles error:', err);
    res.status(500).json({ message: 'Failed to load vehicles', error: err.message });
  }
};

// @route POST /api/dms/vehicles
exports.createVehicle = async (req, res) => {
  try {
    const payload = {
      vehicle_id: req.body.vehicle_id,
      vin: req.body.vin,
      stock_no: req.body.stock_no,
      oem: req.body.oem,
      model: req.body.model,
      variant_id: req.body.variant_id,
      variant: req.body.variant,
      fuel_type: req.body.fuel_type,
      transmission: req.body.transmission,
      branch_id: req.body.branch_id,
      purchase_date: parseDate(req.body.purchase_date),
      inventory_status: req.body.inventory_status,
      cost_price_inr: num(req.body.cost_price_inr),
      mrp_inr: num(req.body.mrp_inr),
      current_asking_price_inr: num(req.body.current_asking_price_inr),
    };

    if (!payload.vehicle_id || !payload.vin || !payload.model) {
      return res
        .status(400)
        .json({ message: 'vehicle_id, vin and model are required' });
    }

    const existing = await DmsVehicle.findOne({ vehicle_id: payload.vehicle_id });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'Vehicle with this ID already exists' });
    }

    const doc = await DmsVehicle.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    console.error('createVehicle error:', err);
    res.status(500).json({ message: 'Failed to create vehicle', error: err.message });
  }
};

// @route GET /api/dms/facilities
exports.listFacilities = async (req, res) => {
  try {
    const { branch_id } = req.query;
    const filter = {};
    if (branch_id) filter.branch_id = branch_id;
    const items = await DmsFacility.find(filter).sort({ facility_id: 1 }).lean();
    res.json(items);
  } catch (err) {
    console.error('listFacilities error:', err);
    res.status(500).json({ message: 'Failed to load facilities', error: err.message });
  }
};

// @route GET /api/dms/vin-financing
exports.listVinFinancing = async (req, res) => {
  try {
    const { facility_id } = req.query;
    const filter = {};
    if (facility_id) filter.facility_id = facility_id;
    const items = await DmsVinFinance.find(filter).sort({ drawdown_date: -1 }).lean();
    res.json(items);
  } catch (err) {
    console.error('listVinFinancing error:', err);
    res.status(500).json({ message: 'Failed to load VIN financing', error: err.message });
  }
};

// @route POST /api/dms/branches
exports.createBranch = async (req, res) => {
  try {
    const payload = {
      branch_id: req.body.branch_id,
      branch_name: req.body.branch_name,
      city: req.body.city,
      state: req.body.state,
      oem: req.body.oem,
    };

    if (!payload.branch_id || !payload.branch_name) {
      return res
        .status(400)
        .json({ message: 'branch_id and branch_name are required' });
    }

    const existing = await DmsBranch.findOne({ branch_id: payload.branch_id });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'Branch with this ID already exists' });
    }

    const doc = await DmsBranch.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    console.error('createBranch error:', err);
    res.status(500).json({ message: 'Failed to create branch', error: err.message });
  }
};

// @route POST /api/dms/facilities
exports.createFacility = async (req, res) => {
  try {
    const payload = {
      facility_id: req.body.facility_id,
      dealer_group_id: req.body.dealer_group_id,
      branch_id: req.body.branch_id,
      oem: req.body.oem,
      lender_name: req.body.lender_name,
      interest_rate_apr: num(req.body.interest_rate_apr),
      interest_method: req.body.interest_method,
      day_count_basis: num(req.body.day_count_basis),
      grace_days: num(req.body.grace_days),
      funding_cap_pct: num(req.body.funding_cap_pct),
      funding_cap_amount_inr: num(req.body.funding_cap_amount_inr),
      start_date: parseDate(req.body.start_date),
      end_date: parseDate(req.body.end_date),
      is_active: req.body.is_active,
    };

    if (!payload.facility_id || !payload.branch_id || !payload.lender_name) {
      return res
        .status(400)
        .json({ message: 'facility_id, branch_id and lender_name are required' });
    }

    const existing = await DmsFacility.findOne({ facility_id: payload.facility_id });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'Facility with this ID already exists' });
    }

    const doc = await DmsFacility.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    console.error('createFacility error:', err);
    res.status(500).json({ message: 'Failed to create facility', error: err.message });
  }
};

// @route POST /api/dms/vin-financing
exports.createVinFinance = async (req, res) => {
  try {
    const payload = {
      vin: req.body.vin,
      facility_id: req.body.facility_id,
      drawdown_date: parseDate(req.body.drawdown_date),
      financed_principal_inr: num(req.body.financed_principal_inr),
      outstanding_principal_inr: num(req.body.outstanding_principal_inr),
      last_curtailment_date: parseDate(req.body.last_curtailment_date),
      status: req.body.status,
    };

    if (!payload.vin || !payload.facility_id) {
      return res
        .status(400)
        .json({ message: 'vin and facility_id are required' });
    }

    const existing = await DmsVinFinance.findOne({ vin: payload.vin });
    if (existing) {
      return res
        .status(409)
        .json({ message: 'Financing record for this VIN already exists' });
    }

    const doc = await DmsVinFinance.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    console.error('createVinFinance error:', err);
    res.status(500).json({ message: 'Failed to create VIN financing row', error: err.message });
  }
};

// =========================
// UPDATE + DELETE HANDLERS
// =========================

// @route PUT /api/dms/branches/:branch_id
exports.updateBranch = async (req, res) => {
  try {
    const { branch_id } = req.params;
    const payload = {
      branch_name: req.body.branch_name,
      city: req.body.city,
      state: req.body.state,
      oem: req.body.oem,
    };

    if (!payload.branch_name) {
      return res.status(400).json({ message: 'branch_name is required' });
    }

    const updated = await DmsBranch.findOneAndUpdate({ branch_id }, payload, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Branch not found' });
    res.json(updated);
  } catch (err) {
    console.error('updateBranch error:', err);
    res.status(500).json({ message: 'Failed to update branch', error: err.message });
  }
};

// @route DELETE /api/dms/branches/:branch_id
exports.deleteBranch = async (req, res) => {
  try {
    const { branch_id } = req.params;
    const deleted = await DmsBranch.findOneAndDelete({ branch_id });
    if (!deleted) return res.status(404).json({ message: 'Branch not found' });
    res.json({ message: 'Branch deleted successfully' });
  } catch (err) {
    console.error('deleteBranch error:', err);
    res.status(500).json({ message: 'Failed to delete branch', error: err.message });
  }
};

// @route PUT /api/dms/customers/:customer_id
exports.updateCustomer = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const payload = {
      full_name: req.body.full_name,
      phone: req.body.phone,
      email: req.body.email,
      city: req.body.city,
      locality: req.body.locality,
    };

    if (!payload.full_name || !payload.phone) {
      return res.status(400).json({ message: 'full_name and phone are required' });
    }

    const updated = await DmsCustomer.findOneAndUpdate({ customer_id }, payload, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Customer not found' });
    res.json(updated);
  } catch (err) {
    console.error('updateCustomer error:', err);
    res.status(500).json({ message: 'Failed to update customer', error: err.message });
  }
};

// @route DELETE /api/dms/customers/:customer_id
exports.deleteCustomer = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const deleted = await DmsCustomer.findOneAndDelete({ customer_id });
    if (!deleted) return res.status(404).json({ message: 'Customer not found' });
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error('deleteCustomer error:', err);
    res.status(500).json({ message: 'Failed to delete customer', error: err.message });
  }
};

// @route PUT /api/dms/leads/:lead_id
exports.updateLead = async (req, res) => {
  try {
    const { lead_id } = req.params;
    const payload = {
      full_name: req.body.full_name,
      phone: req.body.phone,
      preferred_variant_id: req.body.preferred_variant_id,
      preferred_mode: req.body.preferred_mode,
      budget_inr: num(req.body.budget_inr),
      branch_preference_id: req.body.branch_preference_id,
      lead_status: req.body.lead_status,
      lead_source: req.body.lead_source,
      created_date: parseDate(req.body.created_date),
      last_contacted_date: parseDate(req.body.last_contacted_date),
      next_followup_date: parseDate(req.body.next_followup_date),
    };

    if (!payload.full_name || !payload.phone) {
      return res.status(400).json({ message: 'full_name and phone are required' });
    }

    const updated = await DmsLead.findByIdAndUpdate(lead_id, payload, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Lead not found' });
    res.json(updated);
  } catch (err) {
    console.error('updateLead error:', err);
    res.status(500).json({ message: 'Failed to update lead', error: err.message });
  }
};

// @route DELETE /api/dms/leads/:lead_id
exports.deleteLead = async (req, res) => {
  try {
    const { lead_id } = req.params;
    const deleted = await DmsLead.findByIdAndDelete(lead_id);
    if (!deleted) return res.status(404).json({ message: 'Lead not found' });
    res.json({ message: 'Lead deleted successfully' });
  } catch (err) {
    console.error('deleteLead error:', err);
    res.status(500).json({ message: 'Failed to delete lead', error: err.message });
  }
};

// @route PUT /api/dms/vehicles/:vehicle_id
exports.updateVehicle = async (req, res) => {
  try {
    const { vehicle_id } = req.params;
    const payload = {
      stock_no: req.body.stock_no,
      oem: req.body.oem,
      model: req.body.model,
      variant_id: req.body.variant_id,
      variant: req.body.variant,
      fuel_type: req.body.fuel_type,
      transmission: req.body.transmission,
      branch_id: req.body.branch_id,
      purchase_date: parseDate(req.body.purchase_date),
      inventory_status: req.body.inventory_status,
      cost_price_inr: num(req.body.cost_price_inr),
      mrp_inr: num(req.body.mrp_inr),
      current_asking_price_inr: num(req.body.current_asking_price_inr),
    };

    if (!payload.model) {
      return res.status(400).json({ message: 'model is required' });
    }

    const updated = await DmsVehicle.findOneAndUpdate({ vehicle_id }, payload, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(updated);
  } catch (err) {
    console.error('updateVehicle error:', err);
    res.status(500).json({ message: 'Failed to update vehicle', error: err.message });
  }
};

// @route DELETE /api/dms/vehicles/:vehicle_id
exports.deleteVehicle = async (req, res) => {
  try {
    const { vehicle_id } = req.params;
    const deleted = await DmsVehicle.findOneAndDelete({ vehicle_id });
    if (!deleted) return res.status(404).json({ message: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    console.error('deleteVehicle error:', err);
    res.status(500).json({ message: 'Failed to delete vehicle', error: err.message });
  }
};

// @route PUT /api/dms/facilities/:facility_id
exports.updateFacility = async (req, res) => {
  try {
    const { facility_id } = req.params;
    const payload = {
      dealer_group_id: req.body.dealer_group_id,
      branch_id: req.body.branch_id,
      oem: req.body.oem,
      lender_name: req.body.lender_name,
      interest_rate_apr: num(req.body.interest_rate_apr),
      interest_method: req.body.interest_method,
      day_count_basis: num(req.body.day_count_basis),
      grace_days: num(req.body.grace_days),
      funding_cap_pct: num(req.body.funding_cap_pct),
      funding_cap_amount_inr: num(req.body.funding_cap_amount_inr),
      start_date: parseDate(req.body.start_date),
      end_date: parseDate(req.body.end_date),
      is_active: req.body.is_active,
    };

    if (!payload.branch_id || !payload.lender_name) {
      return res.status(400).json({ message: 'branch_id and lender_name are required' });
    }

    const updated = await DmsFacility.findOneAndUpdate({ facility_id }, payload, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'Facility not found' });
    res.json(updated);
  } catch (err) {
    console.error('updateFacility error:', err);
    res.status(500).json({ message: 'Failed to update facility', error: err.message });
  }
};

// @route DELETE /api/dms/facilities/:facility_id
exports.deleteFacility = async (req, res) => {
  try {
    const { facility_id } = req.params;
    const deleted = await DmsFacility.findOneAndDelete({ facility_id });
    if (!deleted) return res.status(404).json({ message: 'Facility not found' });
    res.json({ message: 'Facility deleted successfully' });
  } catch (err) {
    console.error('deleteFacility error:', err);
    res.status(500).json({ message: 'Failed to delete facility', error: err.message });
  }
};

// @route PUT /api/dms/vin-financing/:vin
exports.updateVinFinance = async (req, res) => {
  try {
    const { vin } = req.params;
    const payload = {
      facility_id: req.body.facility_id,
      drawdown_date: parseDate(req.body.drawdown_date),
      financed_principal_inr: num(req.body.financed_principal_inr),
      outstanding_principal_inr: num(req.body.outstanding_principal_inr),
      last_curtailment_date: parseDate(req.body.last_curtailment_date),
      status: req.body.status,
    };

    if (!payload.facility_id) {
      return res.status(400).json({ message: 'facility_id is required' });
    }

    const updated = await DmsVinFinance.findOneAndUpdate({ vin }, payload, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: 'VIN financing record not found' });
    res.json(updated);
  } catch (err) {
    console.error('updateVinFinance error:', err);
    res.status(500).json({ message: 'Failed to update VIN financing row', error: err.message });
  }
};

// @route DELETE /api/dms/vin-financing/:vin
exports.deleteVinFinance = async (req, res) => {
  try {
    const { vin } = req.params;
    const deleted = await DmsVinFinance.findOneAndDelete({ vin });
    if (!deleted) return res.status(404).json({ message: 'VIN financing record not found' });
    res.json({ message: 'VIN financing record deleted successfully' });
  } catch (err) {
    console.error('deleteVinFinance error:', err);
    res.status(500).json({ message: 'Failed to delete VIN financing row', error: err.message });
  }
};

// =========================
// ANALYTICS / DECISION LAYER
// =========================

// @route GET /api/dms/analytics/working-capital
// @desc  Branch-level working capital and risk summary
exports.getWorkingCapitalSummary = async (req, res) => {
  try {
    // Load core DMS entities
    const [branches, vehicles, wcxRows] = await Promise.all([
      DmsBranch.find({}).lean(),
      DmsVehicle.find({}).lean(),
      WcxExposure.find({}).lean(),
    ]);

    // Group helpers
    const vehiclesByBranch = new Map();
    vehicles.forEach((v) => {
      if (!v.branch_id) return;
      const key = v.branch_id;
      if (!vehiclesByBranch.has(key)) vehiclesByBranch.set(key, []);
      vehiclesByBranch.get(key).push(v);
    });

    const wcxByBranch = new Map();
    wcxRows.forEach((row) => {
      if (!row.branch_id) return;
      const key = row.branch_id;
      if (!wcxByBranch.has(key)) wcxByBranch.set(key, []);
      wcxByBranch.get(key).push(row);
    });

    const branchSummaries = [];

    let totalVehicles = 0;
    let totalWcxVehicles = 0;
    let totalWorkingCapital = 0;
    let totalInterestExposure = 0;
    let totalHighRisk = 0;
    let totalCritical = 0;

    branches.forEach((b) => {
      const branchId = b.branch_id;
      const branchVehicles = vehiclesByBranch.get(branchId) || [];
      const branchWcx = wcxByBranch.get(branchId) || [];

      const workingCapital = branchWcx.reduce(
        (sum, r) => sum + (r.working_capital_locked_inr || 0),
        0
      );
      const interestExposure = branchWcx.reduce(
        (sum, r) => sum + (r.interest_exposure_inr || 0),
        0
      );

      const highRiskCount = branchWcx.filter((r) => r.risk_tag === 'High').length;
      const criticalCount = branchWcx.filter((r) => r.risk_tag === 'Critical').length;

      totalVehicles += branchVehicles.length;
      totalWcxVehicles += branchWcx.length;
      totalWorkingCapital += workingCapital;
      totalInterestExposure += interestExposure;
      totalHighRisk += highRiskCount;
      totalCritical += criticalCount;

      branchSummaries.push({
        branch_id: branchId,
        branch_name: b.branch_name,
        city: b.city,
        state: b.state,
        oem: b.oem,
        total_vehicles: branchVehicles.length,
        wcx_vehicle_count: branchWcx.length,
        working_capital_locked_inr: workingCapital,
        interest_exposure_inr: interestExposure,
        high_risk_count: highRiskCount,
        critical_count: criticalCount,
      });
    });

    res.json({
      branches: branchSummaries,
      totals: {
        branches: branches.length,
        vehicles: totalVehicles,
        wcx_vehicles: totalWcxVehicles,
        working_capital_locked_inr: totalWorkingCapital,
        interest_exposure_inr: totalInterestExposure,
        high_risk_count: totalHighRisk,
        critical_count: totalCritical,
      },
    });
  } catch (err) {
    console.error('getWorkingCapitalSummary error:', err);
    res
      .status(500)
      .json({ message: 'Failed to compute working capital summary', error: err.message });
  }
};

// =========================
// IMPORT FROM CSV
// =========================

function readCsvRows(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found at ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length <= 1) {
    throw new Error('CSV file has no data rows');
  }
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 1) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = parts[idx] !== undefined ? parts[idx] : '';
    });
    rows.push(row);
  }
  return rows;
}

// @route POST /api/dms/import/customers
exports.importCustomers = async (req, res) => {
  try {
    const rootDir = path.join(__dirname, '..', '..');
    const fileName = 'lakshmi_hyundai_pricing_agent_seed_v4(Customer).csv';
    const filePath = path.join(rootDir, fileName);

    const rows = readCsvRows(filePath);
    await DmsCustomer.deleteMany({});

    const docs = rows.map((r) => ({
      customer_id: r.customer_id,
      full_name: r.full_name,
      phone: r.phone,
      email: r.email,
      city: r.city,
      locality: r.locality,
    }));

    await DmsCustomer.insertMany(docs, { ordered: false });
    res.json({ message: 'DMS customers imported', count: docs.length });
  } catch (err) {
    console.error('importCustomers error:', err);
    res.status(500).json({ message: 'Failed to import customers CSV', error: err.message });
  }
};

// @route POST /api/dms/import/leads
exports.importLeads = async (req, res) => {
  try {
    const rootDir = path.join(__dirname, '..', '..');
    const fileName = 'lakshmi_hyundai_pricing_agent_seed_v4(Lead).csv';
    const filePath = path.join(rootDir, fileName);

    const rows = readCsvRows(filePath);
    await DmsLead.deleteMany({});

    const docs = rows.map((r) => ({
      full_name: r.full_name,
      phone: r.phone,
      preferred_variant_id: r.preferred_variant_id,
      preferred_mode: r.preferred_mode,
      budget_inr: num(r.budget_inr),
      branch_preference_id: r.branch_preference_id,
      lead_status: r.lead_status,
      lead_source: r.lead_source,
      created_date: parseDate(r.created_date),
      last_contacted_date: parseDate(r.last_contacted_date),
      next_followup_date: parseDate(r.next_followup_date),
    }));

    await DmsLead.insertMany(docs, { ordered: false });
    res.json({ message: 'DMS leads imported', count: docs.length });
  } catch (err) {
    console.error('importLeads error:', err);
    res.status(500).json({ message: 'Failed to import leads CSV', error: err.message });
  }
};

// @route POST /api/dms/import/vehicles
exports.importVehicles = async (req, res) => {
  try {
    const rootDir = path.join(__dirname, '..', '..');
    const fileName = 'lakshmi_hyundai_pricing_agent_seed_v4(Vehicle).csv';
    const filePath = path.join(rootDir, fileName);

    const rows = readCsvRows(filePath);
    await DmsVehicle.deleteMany({});

    const docs = rows.map((r) => ({
      vehicle_id: r.vehicle_id,
      vin: r.vin,
      stock_no: r.stock_no,
      oem: r.oem,
      model: r.model,
      variant_id: r.variant_id,
      variant: r.variant,
      fuel_type: r.fuel_type,
      transmission: r.transmission,
      branch_id: r.branch_id,
      purchase_date: parseDate(r.purchase_date),
      inventory_status: r.inventory_status,
      cost_price_inr: num(r.cost_price_inr),
      mrp_inr: num(r.mrp_inr),
      current_asking_price_inr: num(r.current_asking_price_inr),
    }));

    await DmsVehicle.insertMany(docs, { ordered: false });
    res.json({ message: 'DMS vehicles imported', count: docs.length });
  } catch (err) {
    console.error('importVehicles error:', err);
    res.status(500).json({ message: 'Failed to import vehicles CSV', error: err.message });
  }
};

// @route POST /api/dms/import/branches
exports.importBranches = async (req, res) => {
  try {
    const rootDir = path.join(__dirname, '..', '..');
    const fileName = 'lakshmi_hyundai_pricing_agent_seed_v4(Branch).csv';
    const filePath = path.join(rootDir, fileName);

    const rows = readCsvRows(filePath);
    await DmsBranch.deleteMany({});

    const docs = rows.map((r) => ({
      branch_id: r.branch_id,
      branch_name: r.branch_name,
      city: r.city,
      state: r.state,
      oem: r.oem,
    }));

    await DmsBranch.insertMany(docs, { ordered: false });
    res.json({ message: 'DMS branches imported', count: docs.length });
  } catch (err) {
    console.error('importBranches error:', err);
    res.status(500).json({ message: 'Failed to import branches CSV', error: err.message });
  }
};

// @route POST /api/dms/import/variants
exports.importVariants = async (req, res) => {
  try {
    const rootDir = path.join(__dirname, '..', '..');
    const fileName = 'lakshmi_hyundai_pricing_agent_seed_v4(Variant).csv';
    const filePath = path.join(rootDir, fileName);

    const rows = readCsvRows(filePath);
    await DmsVariant.deleteMany({});

    const docs = rows.map((r) => ({
      variant_id: r.variant_id,
      model: r.model,
      variant: r.variant,
      fuel_type: r.fuel_type,
      transmission: r.transmission,
      oem: r.oem,
    }));

    await DmsVariant.insertMany(docs, { ordered: false });
    res.json({ message: 'DMS variants imported', count: docs.length });
  } catch (err) {
    console.error('importVariants error:', err);
    res.status(500).json({ message: 'Failed to import variants CSV', error: err.message });
  }
};
