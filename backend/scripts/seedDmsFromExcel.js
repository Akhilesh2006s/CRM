const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const DmsCustomer = require('../models/DmsCustomer');
const DmsLead = require('../models/DmsLead');
const DmsVehicle = require('../models/DmsVehicle');
const DmsBranch = require('../models/DmsBranch');
const DmsVariant = require('../models/DmsVariant');
const DmsFacility = require('../models/DmsFacility');
const DmsVinFinance = require('../models/DmsVinFinance');

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
      // ignore and try next
    }
  }
  dotenv.config();
})();

const connectDB = require('../config/db');

const num = (v) => {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isNaN(n) ? undefined : n;
};

const parseDate = (v) => {
  if (!v) return undefined;
  // ExcelJS can give Date objects directly; keep them as-is
  if (v instanceof Date) return v;
  const d = new Date(v);
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
    // ExcelJS row.values is 1-indexed array
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
    // Skip completely empty rows
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

    console.log(`📥 Reading DMS data from: ${excelPath}`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);

    // Customers sheet
    try {
      const customerRows = await readSheetRows(workbook, 'Customer');
      await DmsCustomer.deleteMany({});
      const customerDocs = customerRows.map((r) => ({
        customer_id: r.customer_id,
        full_name: r.full_name,
        phone: r.phone,
        email: r.email,
        city: r.city,
        locality: r.locality,
      }));
      await DmsCustomer.insertMany(customerDocs, { ordered: false });
      console.log(`✅ Imported ${customerDocs.length} DMS customers from Excel`);
    } catch (err) {
      console.error('⚠️  Skipped customers import from Excel:', err.message);
    }

    // Lead sheet
    try {
      const leadRows = await readSheetRows(workbook, 'Lead');
      await DmsLead.deleteMany({});
      const leadDocs = leadRows.map((r) => ({
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
      await DmsLead.insertMany(leadDocs, { ordered: false });
      console.log(`✅ Imported ${leadDocs.length} DMS leads from Excel`);
    } catch (err) {
      console.error('⚠️  Skipped leads import from Excel:', err.message);
    }

    // Vehicle sheet
    try {
      const vehicleRows = await readSheetRows(workbook, 'Vehicle');
      await DmsVehicle.deleteMany({});
      const vehicleDocs = vehicleRows.map((r) => ({
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
      await DmsVehicle.insertMany(vehicleDocs, { ordered: false });
      console.log(`✅ Imported ${vehicleDocs.length} DMS vehicles from Excel`);

      // Derive Variant master from vehicle rows (unique combinations)
      try {
        await DmsVariant.deleteMany({});
        const seen = new Map();
        for (const r of vehicleRows) {
          if (!r.variant_id || !r.model || !r.variant) continue;
          const key = String(r.variant_id);
          if (seen.has(key)) continue;
          seen.set(key, {
            variant_id: r.variant_id,
            model: r.model,
            variant: r.variant,
            fuel_type: r.fuel_type,
            transmission: r.transmission,
            oem: r.oem,
          });
        }
        const variantDocs = Array.from(seen.values());
        if (variantDocs.length > 0) {
          await DmsVariant.insertMany(variantDocs, { ordered: false });
        }
        console.log(`✅ Imported ${variantDocs.length} DMS variants from Excel`);
      } catch (variantErr) {
        console.error('⚠️  Skipped variants import from Excel (derived from Vehicle):', variantErr.message);
      }
    } catch (err) {
      console.error('⚠️  Skipped vehicles import from Excel:', err.message);
    }

    // Branch sheet
    try {
      const branchRows = await readSheetRows(workbook, 'Branch');
      await DmsBranch.deleteMany({});
      const branchDocs = branchRows.map((r) => ({
        branch_id: r.branch_id,
        branch_name: r.branch_name,
        city: r.city,
        state: r.state,
        oem: r.oem,
      }));
      await DmsBranch.insertMany(branchDocs, { ordered: false });
      console.log(`✅ Imported ${branchDocs.length} DMS branches from Excel`);
    } catch (err) {
      console.error('⚠️  Skipped branches import from Excel:', err.message);
    }

    // FloorPlan Facility sheet
    try {
      const facilityRows = await readSheetRows(workbook, 'FloorPlan_Facility');
      await DmsFacility.deleteMany({});
      const facilityDocs = facilityRows.map((r) => ({
        facility_id: r.facility_id,
        dealer_group_id: r.dealer_group_id,
        branch_id: r.branch_id,
        oem: r.oem,
        lender_name: r.lender_name,
        interest_rate_apr: num(r.interest_rate_apr),
        interest_method: r.interest_method,
        day_count_basis: num(r.day_count_basis),
        grace_days: num(r.grace_days),
        funding_cap_pct: num(r.funding_cap_pct),
        funding_cap_amount_inr: num(r.funding_cap_amount_inr),
        start_date: parseDate(r.start_date),
        end_date: parseDate(r.end_date),
        is_active: r.is_active,
      }));
      await DmsFacility.insertMany(facilityDocs, { ordered: false });
      console.log(`✅ Imported ${facilityDocs.length} DMS facilities from Excel`);
    } catch (err) {
      console.error('⚠️  Skipped facilities import from Excel:', err.message);
    }

    // VIN Financing sheet
    try {
      const vinRows = await readSheetRows(workbook, 'VIN_Financing');
      await DmsVinFinance.deleteMany({});
      const vinDocs = vinRows.map((r) => ({
        vin: r.vin,
        facility_id: r.facility_id,
        drawdown_date: parseDate(r.drawdown_date),
        financed_principal_inr: num(r.financed_principal_inr),
        outstanding_principal_inr: num(r.outstanding_principal_inr),
        last_curtailment_date: parseDate(r.last_curtailment_date),
        status: r.status,
      }));
      await DmsVinFinance.insertMany(vinDocs, { ordered: false });
      console.log(`✅ Imported ${vinDocs.length} DMS VIN financing rows from Excel`);
    } catch (err) {
      console.error('⚠️  Skipped VIN financing import from Excel:', err.message);
    }

    console.log('🎉 DMS Excel import complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding DMS data from Excel:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();

