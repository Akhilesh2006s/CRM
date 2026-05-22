const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
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

const num = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isNaN(n) ? 0 : n;
};

const parseDate = (value) => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

async function readSheetRows(workbook, sheetName) {
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) {
    throw new Error(`Worksheet "${sheetName}" not found in Excel file`);
  }

  const rows = [];
  let headers = [];

  sheet.eachRow((row, rowNumber) => {
    const values = row.values;
    const cells = Array.isArray(values) ? values.slice(1) : [];

    if (rowNumber === 1) {
      headers = cells.map((h) => String(h || '').trim());
      return;
    }

    if (!headers.length) return;

    const obj = {};
    headers.forEach((h, idx) => {
      if (!h) return;
      obj[h] = cells[idx];
    });

    if (Object.values(obj).some((v) => v !== null && v !== undefined && String(v).trim() !== '')) {
      rows.push(obj);
    }
  });

  return rows;
}

async function run() {
  try {
    await connectDB();
    console.log('✅ Connected to database');

    const rootDir = path.join(__dirname, '..', '..');
    const excelPath = path.join(rootDir, 'lakshmi_hyundai_pricing_agent_seed_v4.xlsx');

    if (!fs.existsSync(excelPath)) {
      throw new Error(`Excel file not found at ${excelPath}`);
    }

    console.log(`📥 Reading WCX data from Excel: ${excelPath}`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);

    const rows = await readSheetRows(workbook, 'WCX_AfterDiscounting');
    if (!rows.length) {
      throw new Error('WCX_AfterDiscounting sheet has no data rows');
    }

    // Clear existing WCX data for this run (use run_id if present; otherwise clear all)
    const runId = rows[0].run_id;
    if (runId) {
      console.log(`🧹 Clearing existing WCX exposures for run_id=${runId}...`);
      await WcxExposure.deleteMany({ run_id: runId });
    } else {
      console.log('🧹 Clearing all existing WCX exposures (no run_id found)...');
      await WcxExposure.deleteMany({});
    }

    const docs = rows.map((r) => ({
      exposure_id: r.exposure_id,
      run_id: r.run_id,
      as_of_date: parseDate(r.as_of_date),
      calculated_at: parseDate(r.calculated_at),
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

    console.log(`📊 Importing ${docs.length} WCX exposure rows from Excel...`);
    await WcxExposure.insertMany(docs, { ordered: false });

    console.log('✅ WCX exposure data imported successfully from Excel');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error importing WCX from Excel:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();

