const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const DmsVariant = require('../models/DmsVariant');
const DmsCustomer = require('../models/DmsCustomer');
const DmsLead = require('../models/DmsLead');
const DmsVehicle = require('../models/DmsVehicle');
const DmsFacility = require('../models/DmsFacility');
const DmsVinFinance = require('../models/DmsVinFinance');

// Load .env from backend or project root (same pattern as other seed/cleanup scripts)
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

async function cleanupVariants() {
  console.log('🧹 Cleaning fake DMS variants...');
  const res = await DmsVariant.deleteMany({
    $or: [
      { variant_id: { $regex: /^VAR-TEST-/ } },
      { variant_id: { $regex: /^VAR-FAKE-/ } },
    ],
  });
  console.log(`   ➜ Deleted ${res.deletedCount} fake variants`);
}

async function cleanupCustomers() {
  console.log('🧹 Cleaning fake DMS customers...');
  const res = await DmsCustomer.deleteMany({
    $or: [
      { customer_id: { $regex: /^CUST-TEST-/ } },
      { customer_id: { $regex: /^CUST-FAKE-/ } },
      { email: { $regex: /^test\d+@example\.com$/i } },
      { email: { $regex: /^fake\d+@example\.com$/i } },
    ],
  });
  console.log(`   ➜ Deleted ${res.deletedCount} fake customers`);
}

async function cleanupLeads() {
  console.log('🧹 Cleaning fake DMS leads...');
  const res = await DmsLead.deleteMany({
    $or: [
      { full_name: { $regex: /^Test Lead / } },
      { full_name: { $regex: /^Fake Lead / } },
      { phone: { $regex: /^910000/ } },
      { phone: { $regex: /^920000/ } },
      { phone: { $regex: /^930000/ } },
    ],
  });
  console.log(`   ➜ Deleted ${res.deletedCount} fake leads`);
}

async function cleanupVehicles() {
  console.log('🧹 Cleaning fake DMS vehicles...');
  const res = await DmsVehicle.deleteMany({
    $or: [
      { vehicle_id: { $regex: /^VEH-TEST-/ } },
      { vehicle_id: { $regex: /^VEH-FAKE-/ } },
      { vin: { $regex: /^TESTVIN/ } },
      { vin: { $regex: /^FAKEVIN/ } },
      { stock_no: { $regex: /^STK-TEST-/ } },
      { stock_no: { $regex: /^STK-FAKE-/ } },
    ],
  });
  console.log(`   ➜ Deleted ${res.deletedCount} fake vehicles`);
}

async function cleanupFacilities() {
  console.log('🧹 Cleaning fake DMS facilities...');
  const res = await DmsFacility.deleteMany({
    $or: [
      { facility_id: { $regex: /^FAC-TEST-/ } },
      { facility_id: { $regex: /^FAC-FAKE-/ } },
      { dealer_group_id: 'DG-TEST-001' },
      { dealer_group_id: 'DG-FAKE-001' },
    ],
  });
  console.log(`   ➜ Deleted ${res.deletedCount} fake facilities`);
}

async function cleanupVinFinancing() {
  console.log('🧹 Cleaning fake DMS VIN financing...');
  const res = await DmsVinFinance.deleteMany({
    $or: [
      { vin: { $regex: /^TESTVIN/ } },
      { vin: { $regex: /^FAKEVIN/ } },
      { facility_id: { $regex: /^FAC-TEST-/ } },
      { facility_id: { $regex: /^FAC-FAKE-/ } },
    ],
  });
  console.log(`   ➜ Deleted ${res.deletedCount} fake VIN financing records`);
}

async function run() {
  try {
    await connectDB();
    console.log('✅ Connected to database');

    await cleanupVariants();
    await cleanupCustomers();
    await cleanupLeads();
    await cleanupVehicles();
    await cleanupFacilities();
    await cleanupVinFinancing();

    console.log('🎉 Fake DMS data cleanup complete (real Excel/manual data kept)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during fake DMS data cleanup:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();

