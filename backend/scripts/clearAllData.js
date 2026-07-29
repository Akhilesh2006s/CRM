const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const User = require('../models/User');
const Lead = require('../models/Lead');
const Product = require('../models/Product');
const DcOrder = require('../models/DcOrder');
const DC = require('../models/DC');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Sale = require('../models/Sale');
const Training = require('../models/Training');
const Service = require('../models/Service');
const Warehouse = require('../models/Warehouse');
const StockReturn = require('../models/StockReturn');
const StockMovement = require('../models/StockMovement');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const ContactQuery = require('../models/ContactQuery');
const Report = require('../models/Report');
const SampleRequest = require('../models/SampleRequest');
const ProductDeliverable = require('../models/ProductDeliverable');
const EmpDC = require('../models/EmpDC');
const PartnerCost = require('../models/VendorCost');

// Connect to MongoDB using the same method as the app
const connectDB = require('../config/db');

// Clear all data except Super Admin users
const clearAllData = async () => {
  try {
    console.log('\n⚠️  WARNING: This will delete ALL data except Super Admin users!');
    console.log('Connecting to database...\n');
    await connectDB();
    console.log('Connected successfully!\n');

    const db = mongoose.connection.db;
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections\n`);

    // Step 1: Keep exactly one Super Admin login
    const primaryEmail = (
      process.env.SUPER_ADMIN_EMAILS || 'amenityforge@gmail.com'
    )
      .split(',')[0]
      .trim()
      .toLowerCase();

    console.log('Step 1: Keeping only Super Admin login...');
    console.log(`Primary Super Admin email: ${primaryEmail}`);

    let superAdmin = await User.findOne({ email: primaryEmail });
    if (!superAdmin) {
      superAdmin = await User.findOne({ role: 'Super Admin' });
    }

    const deleteNonSuper = await User.deleteMany({ role: { $ne: 'Super Admin' } });
    console.log(`Deleted ${deleteNonSuper.deletedCount} non–Super Admin users`);

    if (superAdmin) {
      superAdmin.role = 'Super Admin';
      await superAdmin.save();
      const dupes = await User.deleteMany({
        _id: { $ne: superAdmin._id },
      });
      console.log(`Removed ${dupes.deletedCount} extra user account(s)\n`);
    } else {
      const wipeAll = await User.deleteMany({});
      console.log(`No Super Admin found; removed ${wipeAll.deletedCount} user(s)`);
      console.log('Run: node scripts/createSuperAdmin.js to create the login.\n');
    }

    // Step 2: Delete all other data collections
    console.log('Step 2: Deleting all other data...\n');

    const collectionsToClear = [
      { name: 'leads', model: Lead },
      { name: 'products', model: Product },
      { name: 'dcorders', model: DcOrder },
      { name: 'dcs', model: DC },
      { name: 'payments', model: Payment },
      { name: 'expenses', model: Expense },
      { name: 'sales', model: Sale },
      { name: 'trainings', model: Training },
      { name: 'services', model: Service },
      { name: 'warehouses', model: Warehouse },
      { name: 'stockreturns', model: StockReturn },
      { name: 'stockmovements', model: StockMovement },
      { name: 'attendances', model: Attendance },
      { name: 'leaves', model: Leave },
      { name: 'contactqueries', model: ContactQuery },
      { name: 'reports', model: Report },
      { name: 'samplerequests', model: SampleRequest },
      { name: 'productdeliverables', model: ProductDeliverable },
      { name: 'empdcs', model: EmpDC },
      { name: 'partnercosts', model: PartnerCost },
    ];

    let totalDeleted = 0;

    for (const collection of collectionsToClear) {
      try {
        const count = await collection.model.countDocuments();
        if (count > 0) {
          const result = await collection.model.deleteMany({});
          console.log(`✓ Deleted ${result.deletedCount} documents from ${collection.name}`);
          totalDeleted += result.deletedCount;
        } else {
          console.log(`- ${collection.name} is already empty`);
        }
      } catch (error) {
        console.log(`⚠️  Error clearing ${collection.name}: ${error.message}`);
      }
    }

    // Step 3: Clear any other collections that might exist
    console.log('\nStep 3: Checking for other collections...');
    const allCollections = await db.listCollections().toArray();
    const collectionNames = allCollections.map(c => c.name);
    
    // Collections to keep (system collections and users)
    const keepCollections = ['users', 'system.indexes', 'system.profile'];
    
    for (const collectionName of collectionNames) {
      if (!keepCollections.includes(collectionName.toLowerCase())) {
        try {
          const collection = db.collection(collectionName);
          const count = await collection.countDocuments();
          if (count > 0) {
            const result = await collection.deleteMany({});
            console.log(`✓ Deleted ${result.deletedCount} documents from ${collectionName}`);
            totalDeleted += result.deletedCount;
          }
        } catch (error) {
          console.log(`⚠️  Error clearing ${collectionName}: ${error.message}`);
        }
      }
    }

    // Step 4: Verify Super Admin users still exist
    console.log('\nStep 4: Verifying Super Admin users...');
    const remainingUsers = await User.find({});
    console.log(`Remaining users: ${remainingUsers.length}`);
    remainingUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    console.log('\n✅ Data cleanup completed!');
    console.log(`Total documents deleted: ${totalDeleted}`);
    const preserved = await User.countDocuments({ role: 'Super Admin' });
    console.log(`Super Admin login(s) remaining: ${preserved}`);
    console.log('\n⚠️  IMPORTANT: Make sure you have at least one Super Admin user with valid credentials!');

  } catch (error) {
    console.error('Error during data cleanup:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase connection closed.');
  }
};

// Run the script
if (require.main === module) {
  clearAllData()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { clearAllData };
