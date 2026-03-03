const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Lead = require('../models/Lead');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');

// Connect to MongoDB
const connectDB = async () => {
  const mongoURI =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    'mongodb://127.0.0.1:27017/crm_system';

  try {
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

// Remove all test data
const removeTestData = async () => {
  try {
    console.log('\nRemoving test data...\n');

    // Count before deletion
    const leadsCount = await Lead.countDocuments();
    const salesCount = await Sale.countDocuments();
    const paymentsCount = await Payment.countDocuments();

    console.log(`Found ${leadsCount} Leads, ${salesCount} Sales, ${paymentsCount} Payments`);

    // Delete all Leads
    console.log('\nDeleting Leads...');
    const leadsResult = await Lead.deleteMany({});
    console.log(`✓ Deleted ${leadsResult.deletedCount} Leads`);

    // Delete all Sales
    console.log('Deleting Sales...');
    const salesResult = await Sale.deleteMany({});
    console.log(`✓ Deleted ${salesResult.deletedCount} Sales`);

    // Delete all Payments
    console.log('Deleting Payments...');
    const paymentsResult = await Payment.deleteMany({});
    console.log(`✓ Deleted ${paymentsResult.deletedCount} Payments`);

    console.log('\n✅ Test data removal complete!');
    console.log(`\nSummary:`);
    console.log(`- Leads deleted: ${leadsResult.deletedCount}`);
    console.log(`- Sales deleted: ${salesResult.deletedCount}`);
    console.log(`- Payments deleted: ${paymentsResult.deletedCount}`);
    console.log(`\nTotal records removed: ${leadsResult.deletedCount + salesResult.deletedCount + paymentsResult.deletedCount}`);
    
  } catch (error) {
    console.error('Error removing test data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run the script
connectDB().then((connected) => {
  if (connected) {
    removeTestData();
  } else {
    process.exit(1);
  }
});
