/**
 * Migration Script: Vendor to Partner
 * 
 * This script migrates existing vendor data to partner data:
 * 1. Updates User documents: role 'Vendor' -> 'Partner', vendorAssignedProducts -> partnerAssignedProducts
 * 2. Updates VendorCost documents: vendorId -> partnerId, enterprises -> franchises
 * 
 * Run this script once to migrate existing data:
 * node backend/scripts/migrateVendorToPartner.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const PartnerCost = require('../models/VendorCost'); // Model name changed but file still VendorCost.js

const connectDB = require('../config/db');

async function migrateVendorToPartner() {
  try {
    console.log('🔄 Starting Vendor to Partner migration...\n');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database\n');

    // Step 1: Migrate User documents
    console.log('📝 Step 1: Migrating User documents...');
    const usersToMigrate = await User.find({ role: 'Vendor' });
    console.log(`   Found ${usersToMigrate.length} vendor user(s) to migrate`);

    let usersUpdated = 0;
    for (const user of usersToMigrate) {
      const updateData = {
        role: 'Partner'
      };

      // Migrate vendorAssignedProducts to partnerAssignedProducts if it exists
      if (user.vendorAssignedProducts && user.vendorAssignedProducts.length > 0) {
        updateData.partnerAssignedProducts = user.vendorAssignedProducts;
        // Keep old field for now (can remove later)
        // updateData.$unset = { vendorAssignedProducts: '' };
      }

      await User.updateOne(
        { _id: user._id },
        { $set: updateData }
      );
      usersUpdated++;
      console.log(`   ✓ Migrated user: ${user.name} (${user.email})`);
    }
    console.log(`✅ Migrated ${usersUpdated} user(s)\n`);

    // Step 2: Migrate VendorCost documents
    console.log('📝 Step 2: Migrating VendorCost documents...');
    
    // Note: MongoDB collection name might still be 'vendorcosts' even though model is 'PartnerCost'
    // We need to access the collection directly to find old data
    const db = mongoose.connection.db;
    const vendorCostsCollection = db.collection('vendorcosts');
    const partnerCostsCollection = db.collection('partnercosts');
    
    // Check if vendorcosts collection exists and has data
    const vendorCostsCount = await vendorCostsCollection.countDocuments();
    console.log(`   Found ${vendorCostsCount} document(s) in vendorcosts collection`);

    if (vendorCostsCount > 0) {
      const vendorCosts = await vendorCostsCollection.find({}).toArray();
      let costsMigrated = 0;

      for (const vendorCost of vendorCosts) {
        const migratedDoc = {
          partnerId: vendorCost.vendorId, // vendorId -> partnerId
          products: vendorCost.products ? vendorCost.products.map(product => {
            // Migrate enterprises to franchises
            const migratedProduct = {
              productId: product.productId,
              productName: product.productName,
              defaultCost: product.defaultCost || 0,
              franchises: product.enterprises ? product.enterprises.map(enterprise => ({
                franchiseName: enterprise.enterpriseName,
                franchiseCost: enterprise.enterpriseCost,
                zones: [], // New field - will be empty initially
                schools: enterprise.schools || []
              })) : []
            };
            return migratedProduct;
          }) : [],
          createdAt: vendorCost.createdAt,
          updatedAt: vendorCost.updatedAt || new Date()
        };

        // Insert into partnercosts collection (or update if exists)
        await partnerCostsCollection.updateOne(
          { partnerId: migratedDoc.partnerId },
          { $set: migratedDoc },
          { upsert: true }
        );
        costsMigrated++;
        console.log(`   ✓ Migrated cost config for partnerId: ${migratedDoc.partnerId}`);
      }
      console.log(`✅ Migrated ${costsMigrated} cost configuration(s)\n`);
    } else {
      console.log('   ℹ No vendor cost documents found to migrate\n');
    }

    // Step 3: Summary
    console.log('📊 Migration Summary:');
    console.log(`   - Users migrated: ${usersUpdated}`);
    console.log(`   - Cost configs migrated: ${vendorCostsCount > 0 ? vendorCostsCount : 0}`);
    console.log('\n✅ Migration completed successfully!');
    console.log('\n⚠️  Note: Old fields (vendorAssignedProducts, vendorId, enterprises) are still in the database.');
    console.log('   You can remove them later if needed, but keeping them allows for rollback if needed.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run migration
if (require.main === module) {
  migrateVendorToPartner()
    .then(() => {
      console.log('✨ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateVendorToPartner;
