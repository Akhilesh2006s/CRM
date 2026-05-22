const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const DmsCustomer = require('../models/DmsCustomer');
const DmsLead = require('../models/DmsLead');
const DmsVehicle = require('../models/DmsVehicle');

// Load .env
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

const num = (v) => {
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isNaN(n) ? undefined : n;
};

const parseDate = (v) => {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

async function run() {
  try {
    await connectDB();
    console.log('✅ Connected to database');

    const rootDir = path.join(__dirname, '..', '..');

    // Customers
    try {
      const customerPath = path.join(rootDir, 'lakshmi_hyundai_pricing_agent_seed_v4(Customer).csv');
      const customerRows = readCsvRows(customerPath);
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
      console.log(`✅ Imported ${customerDocs.length} DMS customers`);
    } catch (err) {
      console.error('⚠️  Skipped customers import:', err.message);
    }

    // Leads
    try {
      const leadPath = path.join(rootDir, 'lakshmi_hyundai_pricing_agent_seed_v4(Lead).csv');
      const leadRows = readCsvRows(leadPath);
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
      console.log(`✅ Imported ${leadDocs.length} DMS leads`);
    } catch (err) {
      console.error('⚠️  Skipped leads import:', err.message);
    }

    // Vehicles
    try {
      const vehiclePath = path.join(rootDir, 'lakshmi_hyundai_pricing_agent_seed_v4(Vehicle).csv');
      const vehicleRows = readCsvRows(vehiclePath);
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
      console.log(`✅ Imported ${vehicleDocs.length} DMS vehicles`);
    } catch (err) {
      console.error('⚠️  Skipped vehicles import:', err.message);
    }

    console.log('🎉 DMS base data import complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding DMS data:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();

