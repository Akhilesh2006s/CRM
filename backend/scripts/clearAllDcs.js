const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');

const DC = require('../models/DC');
const DcOrder = require('../models/DcOrder');
const Payment = require('../models/Payment');
const StockReturn = require('../models/StockReturn');
const StockMovement = require('../models/StockMovement');
const EmpDC = require('../models/EmpDC');

async function clearAllDcs() {
  try {
    console.log('\n⚠️  WARNING: This will delete ALL DC-related data!');
    console.log('Connecting to database...\n');
    await connectDB();
    console.log('Connected successfully!\n');

    const collectionsToClear = [
      { name: 'dcs', model: DC },
      { name: 'dcorders', model: DcOrder },
      { name: 'payments', model: Payment },
      { name: 'stockreturns', model: StockReturn },
      { name: 'stockmovements', model: StockMovement },
      { name: 'empdcs', model: EmpDC },
    ];

    let totalDeleted = 0;
    for (const c of collectionsToClear) {
      try {
        const count = await c.model.countDocuments();
        if (count === 0) {
          console.log(`- ${c.name} already empty`);
          continue;
        }
        const result = await c.model.deleteMany({});
        totalDeleted += result.deletedCount || 0;
        console.log(`✓ Deleted ${result.deletedCount} documents from ${c.name}`);
      } catch (err) {
        console.log(`⚠️  Error clearing ${c.name}: ${err.message}`);
      }
    }

    console.log('\n✅ DC cleanup completed!');
    console.log(`Total documents deleted: ${totalDeleted}`);
  } catch (err) {
    console.error('\n❌ DC cleanup failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase connection closed.');
  }
}

if (require.main === module) {
  clearAllDcs();
}

module.exports = { clearAllDcs };

