const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Lead = require('../models/Lead');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const User = require('../models/User');

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
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure MongoDB is running locally, OR');
    console.error('   2. Set MONGO_URI, MONGODB_URI, or DATABASE_URL in your .env file');
    console.error('   3. For local MongoDB, start it with: mongod');
    console.error('   4. For MongoDB Atlas, use: mongodb+srv://username:password@cluster.mongodb.net/dbname');
    return false;
  }
};

// Generate random school names
const schoolNames = [
  'Delhi Public School', 'Kendriya Vidyalaya', 'D.A.V. Public School', 'St. Xavier\'s School',
  'Modern School', 'Lotus Valley International', 'Amity International', 'The Heritage School',
  'Ryan International', 'GD Goenka', 'Manav Rachna', 'Shiv Nadar School',
  'The Shri Ram School', 'Vasant Valley School', 'Pathways World School', 'Step by Step School',
  'Blue Bells School', 'Tagore International', 'Sanskriti School', 'The British School',
  'Mount Carmel School', 'Springdales School', 'Loreto Convent', 'St. Mary\'s School',
  'Don Bosco School', 'St. Joseph\'s School', 'Convent of Jesus', 'Carmel Convent',
  'Sacred Heart School', 'St. Columba\'s School', 'Jesus and Mary School', 'St. Thomas School'
];

const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];
const states = ['Delhi', 'Maharashtra', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Gujarat'];
const zones = ['North', 'South', 'East', 'West', 'Central'];
const priorities = ['Hot', 'Warm', 'Cold'];
const statuses = ['Pending', 'Processing'];
const paymentMethods = ['Cash', 'UPI', 'NEFT/RTGS', 'Cheque', 'Bank Transfer'];

// Helper functions
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;
const randomDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
};

// Generate massive test data
const generateTestData = async () => {
  try {
    // Get a Super Admin user for createdBy
    const adminUser = await User.findOne({ role: 'Super Admin' });
    if (!adminUser) {
      console.error('No Super Admin user found. Please create one first.');
      process.exit(1);
    }

    console.log('Generating massive test data for Revenue at Risk...\n');

    // Generate Leads (500 leads with various risk levels)
    console.log('Generating Leads...');
    const leads = [];
    for (let i = 0; i < 500; i++) {
      const daysOld = randomInt(1, 120); // Some very old leads
      const totalAmount = randomInt(50000, 5000000); // ₹50K to ₹50L
      const status = randomElement(statuses);
      const priority = randomElement(priorities);
      
      leads.push({
        school_name: `${randomElement(schoolNames)} ${i + 1}`,
        contact_person: `Contact Person ${i + 1}`,
        contact_mobile: `9${randomInt(100000000, 999999999)}`,
        products: [{
          product_name: `Product ${randomInt(1, 10)}`,
          quantity: randomInt(1, 50),
          unit_price: randomInt(1000, 50000),
        }],
        location: `${randomElement(cities)}, ${randomElement(states)}`,
        city: randomElement(cities),
        state: randomElement(states),
        zone: randomElement(zones),
        status: status,
        priority: priority,
        strength: randomInt(100, 5000),
        follow_up_date: randomDate(randomInt(0, 60)), // Some overdue
        createdAt: randomDate(daysOld),
        createdBy: adminUser._id,
      });
    }
    
    await Lead.insertMany(leads);
    console.log(`✓ Created ${leads.length} Leads`);

    // Generate Sales (300 sales with various statuses)
    console.log('Generating Sales...');
    const sales = [];
    for (let i = 0; i < 300; i++) {
      const daysOld = randomInt(1, 100);
      const totalAmount = randomInt(100000, 10000000); // ₹1L to ₹1Cr
      const status = randomElement(['Pending', 'Confirmed', 'In Progress']);
      
      sales.push({
        customerName: `${randomElement(schoolNames)} ${i + 1}`,
        customerEmail: `customer${i + 1}@school.com`,
        customerPhone: `9${randomInt(100000000, 999999999)}`,
        product: `Product ${randomInt(1, 10)}`,
        quantity: randomInt(1, 100),
        unitPrice: randomInt(5000, 100000),
        totalAmount: totalAmount,
        status: status,
        paymentStatus: randomElement(['Pending', 'Partial', 'Overdue']),
        saleDate: randomDate(daysOld),
        assignedTo: adminUser._id,
        createdBy: adminUser._id,
      });
    }
    
    await Sale.insertMany(sales);
    console.log(`✓ Created ${sales.length} Sales`);

    // Generate Payments (400 pending payments with various delays)
    console.log('Generating Payments...');
    const payments = [];
    for (let i = 0; i < 400; i++) {
      const daysDelayed = randomInt(0, 90); // Some very delayed
      const amount = randomInt(50000, 5000000); // ₹50K to ₹50L
      
      payments.push({
        customerName: `${randomElement(schoolNames)} ${i + 1}`,
        amount: amount,
        paymentMethod: randomElement(paymentMethods),
        paymentDate: randomDate(daysDelayed + 30), // Payment date in past
        status: 'Pending',
        referenceNumber: `REF${randomInt(100000, 999999)}`,
        schoolCode: `SCH${randomInt(1000, 9999)}`,
        location: `${randomElement(cities)}, ${randomElement(states)}`,
        zone: randomElement(zones),
        createdBy: adminUser._id,
      });
    }
    
    await Payment.insertMany(payments);
    console.log(`✓ Created ${payments.length} Payments`);

    console.log('\n✅ Test data generation complete!');
    console.log(`\nSummary:`);
    console.log(`- Leads: ${leads.length}`);
    console.log(`- Sales: ${sales.length}`);
    console.log(`- Payments: ${payments.length}`);
    console.log(`\nTotal records: ${leads.length + sales.length + payments.length}`);
    console.log('\nNow refresh the Revenue at Risk dashboard to see the data!');
    
  } catch (error) {
    console.error('Error generating test data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
};

// Run the script
connectDB().then((connected) => {
  if (connected) {
    generateTestData();
  } else {
    process.exit(1);
  }
});
