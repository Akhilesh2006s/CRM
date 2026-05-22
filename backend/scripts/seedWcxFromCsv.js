const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const WcxExposure = require('../models/WcxExposure');

// Load .env from backend or project root
(() => {
  const envPaths = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
    path.join(process.cwd(), '.env'),
  ];

  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        console.log(`📄 Loaded environment from: ${envPath}`);
        return;
      }
    } catch {
      // ignore
    }
  }

  dotenv.config();
})();

const connectDB = require('../config/db');

async function run() {
  try {
    await connectDB();
    console.log('✅ Connected to database');

    const rootDir = path.join(__dirname, '..', '..');
    const fileName = 'lakshmi_hyundai_pricing_agent_seed_v4(WCX_AfterDiscounting).csv';
    const filePath = path.join(rootDir, fileName);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Seed file not found at: ${filePath}`);
      process.exit(1);
    }

    console.log(`📥 Reading WCX CSV from: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) {
      console.error('❌ CSV file has no data rows');
      process.exit(1);
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < headers.length - 1) continue;
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = parts[idx] !== undefined ? parts[idx] : '';
      });
      rows.push(row);
    }

    if (!rows.length) {
      console.error('❌ No valid data rows found in CSV');
      process.exit(1);
    }

    const num = (value) => {
      if (value === null || value === undefined || value === '') return 0;
      return Number(value);
    };

    const runId = rows[0].run_id;
    if (runId) {
      console.log(`🧹 Clearing existing WCX exposures for run_id=${runId}...`);
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

    console.log(`📊 Importing ${docs.length} WCX exposure rows...`);
    await WcxExposure.insertMany(docs, { ordered: false });

    console.log('✅ WCX exposure data imported successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error importing WCX CSV:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();

