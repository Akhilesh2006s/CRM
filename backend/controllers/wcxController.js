const fs = require('fs');
const path = require('path');
const WcxExposure = require('../models/WcxExposure');

// Build a flexible query from request query params
function buildFilter(query) {
  const filter = {};

  const simpleStringFields = [
    'dealer_group_id',
    'oem',
    'vehicle_id',
    'vin',
    'branch_id',
    'model',
    'variant_id',
    'ageing_bucket',
    'risk_tag',
    'inventory_status',
    'facility_id',
    'critical_flag',
    'pricing_approval_required',
  ];

  for (const field of simpleStringFields) {
    if (query[field]) {
      filter[field] = query[field];
    }
  }

  // Boolean-like flags
  if (query.critical_only === 'true') {
    filter.critical_flag = 'Y';
  }

  // Min/max ranges for numeric fields
  const numericRangeFields = [
    'mrp_inr',
    'cost_price_inr',
    'working_capital_locked_inr',
    'interest_exposure_inr',
    'recommended_discount_pct',
    'recommended_price_inr',
    'margin_pct_after_discount',
  ];

  for (const field of numericRangeFields) {
    const minKey = `${field}_min`;
    const maxKey = `${field}_max`;
    if (query[minKey] || query[maxKey]) {
      filter[field] = {};
      if (query[minKey]) filter[field].$gte = Number(query[minKey]);
      if (query[maxKey]) filter[field].$lte = Number(query[maxKey]);
    }
  }

  return filter;
}

// @route   GET /api/wcx
// @desc    List WCX exposures with optional filters
// @access  Private (same auth middleware as other analytics routes)
exports.listExposures = async (req, res) => {
  try {
    const filter = buildFilter(req.query);
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const sort = req.query.sort || '-as_of_date';

    const items = await WcxExposure.find(filter).sort(sort).limit(limit).lean();
    res.json(items);
  } catch (err) {
    console.error('Error listing WCX exposures:', err);
    res.status(500).json({ message: 'Failed to load WCX exposures', error: err.message });
  }
};

// @route   GET /api/wcx/:exposure_id
// @desc    Get single exposure by ID
// @access  Private
exports.getExposure = async (req, res) => {
  try {
    const { exposure_id } = req.params;
    const item = await WcxExposure.findOne({ exposure_id }).lean();
    if (!item) {
      return res.status(404).json({ message: 'Exposure not found' });
    }
    res.json(item);
  } catch (err) {
    console.error('Error fetching WCX exposure:', err);
    res.status(500).json({ message: 'Failed to load WCX exposure', error: err.message });
  }
};

// @route   PUT /api/wcx/:exposure_id
// @desc    Update one exposure row
// @access  Private
exports.updateExposure = async (req, res) => {
  try {
    const { exposure_id } = req.params;
    const payload = { ...req.body };
    delete payload.exposure_id;
    delete payload.vin;
    delete payload.vehicle_id;

    const updated = await WcxExposure.findOneAndUpdate({ exposure_id }, payload, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ message: 'Exposure not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Error updating WCX exposure:', err);
    res.status(500).json({ message: 'Failed to update WCX exposure', error: err.message });
  }
};

// @route   DELETE /api/wcx/:exposure_id
// @desc    Delete one exposure row
// @access  Private
exports.deleteExposure = async (req, res) => {
  try {
    const { exposure_id } = req.params;
    const deleted = await WcxExposure.findOneAndDelete({ exposure_id });
    if (!deleted) {
      return res.status(404).json({ message: 'Exposure not found' });
    }
    res.json({ message: 'WCX exposure deleted successfully' });
  } catch (err) {
    console.error('Error deleting WCX exposure:', err);
    res.status(500).json({ message: 'Failed to delete WCX exposure', error: err.message });
  }
};

// @route   POST /api/wcx/import
// @desc    Import WCX exposures from the Lakshmi Hyundai CSV seed file
// @access  Private (Admin only ideal; here we check for Admin / Super Admin)
exports.importFromCsv = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !['Admin', 'Super Admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Only Admins can import pricing data' });
    }

    const rootDir = path.join(__dirname, '..', '..');
    const fileName = 'lakshmi_hyundai_pricing_agent_seed_v4(WCX_AfterDiscounting).csv';
    const filePath = path.join(rootDir, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: `Seed file not found at ${filePath}` });
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) {
      return res.status(400).json({ message: 'CSV file has no data rows' });
    }

    const headerLine = lines[0];
    const headers = headerLine.split(',').map((h) => h.trim());

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < headers.length - 1) {
        // Skip incomplete lines
        continue;
      }
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = parts[idx] !== undefined ? parts[idx] : '';
      });
      rows.push(row);
    }

    if (!rows.length) {
      return res.status(400).json({ message: 'No valid data rows found in CSV' });
    }

    // Helper to parse numbers safely
    const num = (value) => {
      if (value === null || value === undefined || value === '') return 0;
      return Number(value);
    };

    // Clear existing data for this run (optional but keeps DB clean)
    const runId = rows[0].run_id;
    if (runId) {
      await WcxExposure.deleteMany({ run_id: runId });
    }

    const docs = rows.map((r) => ({
      exposure_id: r.exposure_id,
      run_id: r.run_id,
      as_of_date: new Date(r.as_of_date),
      calculated_at: r.calculated_at ? new Date(r.calculated_at) : null,
      dealer_group_id: r.dealer_group_id,
      oem: r.oem,
      vehicle_id: r.vehicle_id,
      vin: r.vin,
      branch_id: r.branch_id,
      model: r.model,
      variant_id: r.variant_id,
      ageing_bucket: r.ageing_bucket,
      risk_tag: r.risk_tag,
      inventory_status: r.inventory_status,
      facility_id: r.facility_id,
      interest_rate_apr: num(r.interest_rate_apr),
      grace_days: num(r.grace_days),
      day_count_basis: num(r.day_count_basis),
      working_capital_locked_inr: num(r.working_capital_locked_inr),
      principal_used_inr: num(r.principal_used_inr),
      interest_days: num(r.interest_days),
      interest_exposure_inr: num(r.interest_exposure_inr),
      critical_flag: r.critical_flag,
      mrp_inr: num(r.mrp_inr),
      cost_price_inr: num(r.cost_price_inr),
      min_margin_pct_applied: num(r.min_margin_pct_applied),
      discount_band_min_pct: num(r.discount_band_min_pct),
      discount_band_max_pct: num(r.discount_band_max_pct),
      max_discount_allowed_pct: num(r.max_discount_allowed_pct),
      recommended_discount_pct: num(r.recommended_discount_pct),
      recommended_discount_inr: num(r.recommended_discount_inr),
      recommended_price_inr: num(r.recommended_price_inr),
      margin_pct_after_discount: num(r.margin_pct_after_discount),
      pricing_approval_required: r.pricing_approval_required,
      pricing_approval_role: r.pricing_approval_role,
      pricing_reason: r.pricing_reason,
      pricing_policy_kb_id: r.pricing_policy_kb_id,
      pricing_policy_version: r.pricing_policy_version,
      raw: r,
    }));

    await WcxExposure.insertMany(docs, { ordered: false });

    res.json({
      message: 'WCX exposure data imported successfully',
      count: docs.length,
      run_id: runId,
    });
  } catch (err) {
    console.error('Error importing WCX exposure CSV:', err);
    res.status(500).json({ message: 'Failed to import WCX CSV', error: err.message });
  }
};

