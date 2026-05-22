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

// Load .env from backend or project root (same pattern as other seed scripts)
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

function pad(n) {
  return String(n).padStart(3, '0');
}

async function seedVariants(count = 400) {
  console.log('🌱 Seeding extra test DMS variants (no cleanup)...');
  const models = ['Creta', 'Venue', 'i20', 'Verna', 'Alcazar'];
  const fuels = ['Petrol', 'Diesel'];
  const transmissions = ['MT', 'AT', 'DCT'];

  for (let i = 1; i <= count; i++) {
    const id = `VAR-FAKE-${pad(i)}`;
    const model = models[(i - 1) % models.length];
    const fuel_type = fuels[(i - 1) % fuels.length];
    const transmission = transmissions[(i - 1) % transmissions.length];

    await DmsVariant.updateOne(
      { variant_id: id },
      {
        $setOnInsert: {
          variant_id: id,
          model,
          variant: `${model} Fake ${pad(i)}`,
          fuel_type,
          transmission,
          oem: 'Hyundai',
        },
      },
      { upsert: true }
    );
  }
  console.log('✅ Extra test variants upserted (no deletes)');
}

async function seedCustomers(count = 400) {
  console.log('🌱 Seeding extra test DMS customers (no cleanup)...');
  for (let i = 1; i <= count; i++) {
    const id = `CUST-FAKE-${pad(i)}`;
    const phone = `920000${pad(i)}`;

    await DmsCustomer.updateOne(
      { customer_id: id },
      {
        $setOnInsert: {
          customer_id: id,
          full_name: `Fake Customer ${pad(i)}`,
          phone,
          email: `fake${pad(i)}@example.com`,
          city: 'Hyderabad',
          locality: `Fake Locality ${((i - 1) % 10) + 1}`,
        },
      },
      { upsert: true }
    );
  }
  console.log('✅ Extra test customers upserted (no deletes)');
}

async function seedLeads(count = 400) {
  console.log('🌱 Seeding extra test DMS leads (no cleanup)...');
  const statuses = ['New', 'Contacted', 'Qualified', 'Hot'];
  const sources = ['Walk-in', 'Referral', 'WhatsApp', 'Website'];

  for (let i = 1; i <= count; i++) {
    const phone = `930000${pad(i)}`;
    const preferred_variant_id = `VAR-FAKE-${pad(((i - 1) % count) + 1)}`;

    // Keep using your two key branches as references, but DO NOT touch branch collection
    const branch_preference_id = i % 2 === 0 ? 'BR-HYD-HN' : 'BR-HYD-JH';

    await DmsLead.create({
      full_name: `Fake Lead ${pad(i)}`,
      phone,
      preferred_variant_id,
      preferred_mode: i % 2 === 0 ? 'Online' : 'Showroom',
      budget_inr: 800000 + i * 3000,
      branch_preference_id,
      lead_status: statuses[(i - 1) % statuses.length],
      lead_source: sources[(i - 1) % sources.length],
      created_date: new Date(Date.now() - i * 86400000),
      last_contacted_date: new Date(Date.now() - (i - 1) * 86400000),
      next_followup_date: new Date(Date.now() + (i % 7) * 86400000),
    }).catch((err) => {
      // ignore duplicate / validation errors for test seeding
      if (process.env.DEBUG_SEED) {
        console.error('Lead seed error:', err.message);
      }
    });
  }
  console.log('✅ Extra test leads seeded (no deletes, duplicates ignored)');
}

async function seedVehicles(count = 400) {
  console.log('🌱 Seeding extra test DMS vehicles (no cleanup)...');
  const models = ['Creta', 'Venue', 'i20', 'Verna', 'Alcazar'];
  const statuses = ['In Stock', 'In Transit', 'Allocated'];

  for (let i = 1; i <= count; i++) {
    const vehicle_id = `VEH-FAKE-${pad(i)}`;
    const vin = `FAKEVIN${String(i).padStart(10, '0')}`;
    const model = models[(i - 1) % models.length];
    const branch_id = i % 2 === 0 ? 'BR-HYD-HN' : 'BR-HYD-JH';
    const variant_id = `VAR-FAKE-${pad(((i - 1) % count) + 1)}`;

    await DmsVehicle.updateOne(
      { vehicle_id },
      {
        $setOnInsert: {
          vehicle_id,
          vin,
          stock_no: `STK-FAKE-${pad(i)}`,
          oem: 'Hyundai',
          model,
          variant_id,
          variant: `${model} Fake ${pad(i)}`,
          fuel_type: i % 2 === 0 ? 'Petrol' : 'Diesel',
          transmission: i % 3 === 0 ? 'AT' : 'MT',
          branch_id,
          purchase_date: new Date(Date.now() - i * 86400000),
          inventory_status: statuses[(i - 1) % statuses.length],
          cost_price_inr: 900000 + i * 4000,
          mrp_inr: 1000000 + i * 4000,
          current_asking_price_inr: 980000 + i * 3500,
        },
      },
      { upsert: true }
    );
  }
  console.log('✅ Extra test vehicles upserted (no deletes)');
}

async function seedFacilities(count = 400) {
  console.log('🌱 Seeding extra test DMS facilities (no cleanup)...');
  const lenders = ['HDFC', 'ICICI', 'Axis', 'Kotak'];

  for (let i = 1; i <= count; i++) {
    const facility_id = `FAC-FAKE-${pad(i)}`;
    const branch_id = i % 2 === 0 ? 'BR-HYD-HN' : 'BR-HYD-JH';
    const lender_name = lenders[(i - 1) % lenders.length];

    await DmsFacility.updateOne(
      { facility_id },
      {
        $setOnInsert: {
          facility_id,
          dealer_group_id: 'DG-FAKE-001',
          branch_id,
          oem: 'Hyundai',
          lender_name,
          interest_rate_apr: 9.5 + (i % 5) * 0.1,
          interest_method: 'SimpleDaily',
          day_count_basis: 365,
          grace_days: 15,
          funding_cap_pct: 80,
          funding_cap_amount_inr: 50000000 + i * 75000,
          start_date: new Date(Date.now() - 90 * 86400000),
          end_date: new Date(Date.now() + 365 * 86400000),
          is_active: 'Y',
        },
      },
      { upsert: true }
    );
  }
  console.log('✅ Extra test facilities upserted (no deletes)');
}

async function seedVinFinancing(count = 400) {
  console.log('🌱 Seeding extra test DMS VIN financing (no cleanup)...');

  for (let i = 1; i <= count; i++) {
    const vin = `FAKEVIN${String(i).padStart(10, '0')}`;
    const facility_id = `FAC-FAKE-${pad(((i - 1) % count) + 1)}`;

    await DmsVinFinance.updateOne(
      { vin },
      {
        $setOnInsert: {
          vin,
          facility_id,
          drawdown_date: new Date(Date.now() - (i % 60) * 86400000),
          financed_principal_inr: 900000 + i * 4000,
          outstanding_principal_inr: 800000 + i * 3200,
          last_curtailment_date: new Date(Date.now() - (i % 30) * 86400000),
          status: i % 5 === 0 ? 'Overdue' : 'Active',
        },
      },
      { upsert: true }
    );
  }
  console.log('✅ Extra test VIN financing upserted (no deletes)');
}

async function run() {
  try {
    await connectDB();
    console.log('✅ Connected to database');

    const rawCount = process.argv[2] || process.env.DMS_TEST_COUNT || '400';
    const count = Number.parseInt(rawCount, 10) || 400;
    console.log(`ℹ️  Using extra fake count per entity (no branch changes): ${count}`);

    // Do NOT touch branches here
    await seedVariants(count);
    await seedCustomers(count);
    await seedLeads(count);
    await seedVehicles(count);
    await seedFacilities(count);
    await seedVinFinancing(count);

    console.log('🎉 Extra DMS fake data seeding complete (branches untouched, no cleanup)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding extra DMS fake data:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();

