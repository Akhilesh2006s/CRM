const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const DmsBranch = require('../models/DmsBranch');
const DmsVehicle = require('../models/DmsVehicle');
const DmsFacility = require('../models/DmsFacility');
const DmsLead = require('../models/DmsLead');
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
      // ignore and try next
    }
  }
  dotenv.config();
})();

const connectDB = require('../config/db');

const ALLOWED_BRANCHES = ['BR-HYD-HN', 'BR-HYD-JH'];

async function run() {
  try {
    await connectDB();
    console.log('✅ Connected to database');

    console.log('🧹 Cleaning DMS data to only keep branches BR-HYD-HN and BR-HYD-JH...');

    // 1) Branch master: keep only the two real branches
    const branchResult = await DmsBranch.deleteMany({ branch_id: { $nin: ALLOWED_BRANCHES } });
    console.log(`🗑️  Deleted ${branchResult.deletedCount} branches not in ${ALLOWED_BRANCHES.join(', ')}`);

    // 2) Vehicles: remove any linked to other branches
    const vehicleResult = await DmsVehicle.deleteMany({ branch_id: { $nin: ALLOWED_BRANCHES } });
    console.log(`🗑️  Deleted ${vehicleResult.deletedCount} vehicles with other branch_ids`);

    // 3) Facilities: remove any linked to other branches
    const facilityResult = await DmsFacility.deleteMany({ branch_id: { $nin: ALLOWED_BRANCHES } });
    console.log(`🗑️  Deleted ${facilityResult.deletedCount} facilities with other branch_ids`);

    // 4) Leads: remove any whose branch_preference_id is other branches
    const leadResult = await DmsLead.deleteMany({
      branch_preference_id: { $nin: [...ALLOWED_BRANCHES, null, undefined, ''] },
    });
    console.log(`🗑️  Deleted ${leadResult.deletedCount} leads with other branch_preference_ids`);

    // 5) WCX exposure: keep only these branches
    const wcxResult = await WcxExposure.deleteMany({ branch_id: { $nin: ALLOWED_BRANCHES } });
    console.log(`🗑️  Deleted ${wcxResult.deletedCount} WCX rows with other branch_ids`);

    console.log('🎉 Cleanup complete. Only BR-HYD-HN and BR-HYD-JH remain in branch-linked data.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during cleanup:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();

