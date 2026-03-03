const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const ContactQuery = require('../models/ContactQuery');
const User = require('../models/User');
const Lead = require('../models/Lead');

dotenv.config();

// Connect to database
const connectDB = require('../config/db');

const PRODUCTS = [
  'Abacus', 'Vedic Maths', 'EEL', 'IIT', 'Financial Literacy', 
  'Brain Bytes', 'Spelling Bee', 'Skill Pro', 'Maths Lab', 'Codechamp'
];

const ZONES = ['North', 'South', 'East', 'West', 'Central', 'Northeast', 'Northwest'];
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedHighRiskChurnCustomers() {
  console.log(`\n🔴 Seeding HIGH-RISK Churn Customers for Client Demo...`);
  
  const users = await User.find({ role: { $in: ['Executive', 'Manager'] } }).limit(10);
  const leads = await Lead.find().limit(50);
  const now = new Date();
  
  if (users.length === 0) {
    console.log('❌ No users found. Please seed managers first.');
    process.exit(1);
  }
  
  const highRiskSales = [];
  const highRiskPayments = [];
  const highRiskQueries = [];
  
  // Create 20 HIGH-RISK customers with all risk factors
  for (let i = 0; i < 20; i++) {
    // Last order 180-250 days ago (HIGH RISK)
    const lastOrderDate = new Date(now.getTime() - (180 + randomInt(0, 70)) * 24 * 60 * 60 * 1000);
    // First order was 12-18 months ago
    const firstOrderDate = new Date(lastOrderDate.getTime() - randomInt(180, 365) * 24 * 60 * 60 * 1000);
    
    // High-value customer (to show significant revenue at risk)
    const totalAmount = randomInt(300000, 1500000);
    const unitPrice = totalAmount / randomInt(2, 5);
    
    // Create sale with old date
    const sale = {
      leadId: leads.length > 0 ? randomElement(leads)._id : null,
      customerName: `HIGH RISK - ${randomElement(['Delhi Public School', 'Kendriya Vidyalaya', 'DPS', 'DAV Public School', 'Ryan International'])} ${i + 1}`,
      customerEmail: `highrisk${i + 1}@school.com`,
      customerPhone: `9${randomInt(100000000, 999999999)}`,
      product: randomElement(PRODUCTS),
      quantity: randomInt(2, 5),
      unitPrice: unitPrice,
      totalAmount: totalAmount,
      status: 'Closed', // Had orders before
      paymentStatus: 'Overdue', // Payment issues
      assignedTo: randomElement(users)._id,
      saleDate: lastOrderDate,
      createdBy: randomElement(users)._id,
      createdAt: firstOrderDate, // First order was long ago
      updatedAt: lastOrderDate
    };
    
    highRiskSales.push(sale);
    
    // Create payment with 45-60 day delay (HIGH RISK factor)
    const paymentDueDate = new Date(lastOrderDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const paymentDate = new Date(paymentDueDate.getTime() + (45 + randomInt(0, 15)) * 24 * 60 * 60 * 1000);
    
    highRiskPayments.push({
      saleId: null, // Will link after sale is created
      customerName: sale.customerName,
      amount: totalAmount * 0.6, // Partial payment
      paymentMethod: randomElement(['Cheque', 'NEFT/RTGS', 'Bank Transfer']),
      paymentDate: paymentDate,
      status: 'Approved',
      schoolCode: `SCH${randomInt(1000, 9999)}`,
      contactName: `Principal ${i + 1}`,
      mobileNumber: sale.customerPhone,
      location: randomElement(CITIES),
      zone: randomElement(ZONES),
      createdBy: randomElement(users)._id,
      approvedBy: randomElement(users)._id,
      approvedAt: paymentDate,
      createdAt: paymentDate,
      updatedAt: paymentDate
    });
    
    // Create 3-5 unresolved complaints/queries (HIGH RISK factor)
    const complaintCount = randomInt(3, 5);
    for (let j = 0; j < complaintCount; j++) {
      const complaintDate = new Date(lastOrderDate.getTime() + randomInt(1, 30) * 24 * 60 * 60 * 1000);
      highRiskQueries.push({
        school_code: `SCH${randomInt(1000, 9999)}`,
        school_type: 'Existing',
        school_name: sale.customerName,
        zone: randomElement(ZONES),
        executive: randomElement(users)._id,
        town: randomElement(CITIES),
        subject: randomElement([
          'Product Quality Issues',
          'Payment Dispute',
          'Service Not Satisfactory',
          'Delivery Delays',
          'Billing Error',
          'Training Not Provided'
        ]),
        description: randomElement([
          'Products received were damaged',
          'Payment already made but not reflected',
          'Service quality is poor',
          'Delivery was delayed by 2 months',
          'Invoice amount is incorrect',
          'Training was promised but not provided'
        ]),
        contact_mobile: sale.customerPhone,
        enquiry_date: complaintDate,
        status: 'Pending', // UNRESOLVED - HIGH RISK
        createdBy: randomElement(users)._id,
        createdAt: complaintDate,
        updatedAt: complaintDate
      });
    }
  }
  
  // Insert sales first
  const insertedSales = await Sale.insertMany(highRiskSales);
  console.log(`✅ Created ${insertedSales.length} HIGH-RISK sales`);
  
  // Link payments to sales
  for (let i = 0; i < highRiskPayments.length; i++) {
    highRiskPayments[i].saleId = insertedSales[i]._id;
  }
  
  await Payment.insertMany(highRiskPayments);
  console.log(`✅ Created ${highRiskPayments.length} HIGH-RISK payments with delays`);
  
  await ContactQuery.insertMany(highRiskQueries);
  console.log(`✅ Created ${highRiskQueries.length} unresolved complaints/queries`);
  
  console.log(`\n🎯 HIGH-RISK Churn Customers Summary:`);
  console.log(`   - ${insertedSales.length} customers with 180+ days since last order`);
  console.log(`   - All have 45-60 day payment delays`);
  console.log(`   - All have 3-5 unresolved complaints`);
  console.log(`   - High-value customers (₹3L - ₹15L revenue)`);
  console.log(`   - These will show as HIGH RISK in Churn Predictor!`);
  console.log(`\n✅ High-risk customers added successfully!`);
}

async function run() {
  try {
    await connectDB();
    console.log('✅ Connected to database');
    await seedHighRiskChurnCustomers();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding high-risk customers:', error);
    process.exit(1);
  }
}

run();
