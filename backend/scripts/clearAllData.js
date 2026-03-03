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

    // Step 1: Keep only Super Admin users
    console.log('Step 1: Keeping only Super Admin users...');
    const superAdminUsers = await User.find({ role: 'Super Admin' });
    console.log(`Found ${superAdminUsers.length} Super Admin user(s)`);
    
    if (superAdminUsers.length === 0) {
      console.log('⚠️  WARNING: No Super Admin users found!');
      console.log('This script will delete ALL users including potential admins.');
      console.log('Are you sure you want to continue?');
    }

    // Delete all non-Super Admin users
    const deleteResult = await User.deleteMany({ role: { $ne: 'Super Admin' } });
    console.log(`Deleted ${deleteResult.deletedCount} non-Super Admin users\n`);

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
    console.log(`Super Admin users preserved: ${superAdminUsers.length}`);
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
