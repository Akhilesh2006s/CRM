const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Lead = require('../models/Lead');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const DC = require('../models/DC');
const Expense = require('../models/Expense');
const User = require('../models/User');
const DcOrder = require('../models/DcOrder');

dotenv.config();

// Connect to database
const connectDB = require('../config/db');

const PRODUCTS = [
  'Abacus', 'Vedic Maths', 'EEL', 'IIT', 'Financial Literacy', 
  'Brain Bytes', 'Spelling Bee', 'Skill Pro', 'Maths Lab', 'Codechamp'
];

const ZONES = ['North', 'South', 'East', 'West', 'Central', 'Northeast', 'Northwest'];
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];
const STATES = ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Gujarat'];
const PRIORITIES = ['Hot', 'Warm', 'Cold'];
const STATUSES = {
  lead: ['Pending', 'Processing', 'Saved', 'Closed'],
  sale: ['Pending', 'Confirmed', 'In Progress', 'Closed', 'Completed', 'Cancelled'],
  payment: ['Pending', 'Approved', 'Hold', 'Rejected'],
  dc: ['created', 'po_submitted', 'sent_to_manager', 'pending_dc', 'warehouse_processing', 'completed', 'hold']
};

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================
// ENHANCED TEST CASE FUNCTIONS
// ============================================

// 1. REVENUE AT RISK SCENARIOS
async function seedRevenueAtRiskScenarios() {
  console.log(`\n🔴 Seeding Revenue at Risk Test Cases...`);
  
  const users = await User.find({ role: { $in: ['Executive', 'Manager'] } }).limit(10);
  const leads = await Lead.find().limit(50);
  
  const now = new Date();
  const scenarios = [];
  
  // Scenario 1: Very old pending sales (60+ days) - HIGH RISK
  for (let i = 0; i < 30; i++) {
    const oldDate = new Date(now.getTime() - (60 + randomInt(0, 30)) * 24 * 60 * 60 * 1000);
    scenarios.push({
      leadId: leads.length > 0 ? randomElement(leads)._id : null,
      customerName: `HIGH RISK - Old Pending Customer ${i + 1}`,
      customerEmail: `highrisk${i + 1}@example.com`,
      customerPhone: `9${randomInt(100000000, 999999999)}`,
      product: randomElement(PRODUCTS),
      quantity: randomInt(1, 5),
      unitPrice: randomInt(50000, 200000),
      totalAmount: randomInt(50000, 1000000),
      status: 'Pending',
      paymentStatus: 'Overdue',
      assignedTo: randomElement(users)._id,
      saleDate: oldDate,
      createdBy: randomElement(users)._id,
      createdAt: oldDate,
      updatedAt: oldDate
    });
  }
  
  // Scenario 2: Large deals stuck in "In Progress" - MEDIUM RISK
  for (let i = 0; i < 25; i++) {
    const stuckDate = new Date(now.getTime() - randomInt(30, 45) * 24 * 60 * 60 * 1000);
    scenarios.push({
      leadId: leads.length > 0 ? randomElement(leads)._id : null,
      customerName: `STUCK DEAL - Large Customer ${i + 1}`,
      customerEmail: `stuck${i + 1}@example.com`,
      customerPhone: `9${randomInt(100000000, 999999999)}`,
      product: randomElement(PRODUCTS),
      quantity: randomInt(5, 15),
      unitPrice: randomInt(100000, 300000),
      totalAmount: randomInt(500000, 3000000),
      status: 'In Progress',
      paymentStatus: 'Partial',
      assignedTo: randomElement(users)._id,
      saleDate: stuckDate,
      createdBy: randomElement(users)._id,
      createdAt: stuckDate,
      updatedAt: stuckDate
    });
  }
  
  // Scenario 3: Confirmed sales with overdue payments - HIGH RISK
  for (let i = 0; i < 20; i++) {
    const confirmedDate = new Date(now.getTime() - randomInt(20, 40) * 24 * 60 * 60 * 1000);
    scenarios.push({
      leadId: leads.length > 0 ? randomElement(leads)._id : null,
      customerName: `OVERDUE PAYMENT - Customer ${i + 1}`,
      customerEmail: `overdue${i + 1}@example.com`,
      customerPhone: `9${randomInt(100000000, 999999999)}`,
      product: randomElement(PRODUCTS),
      quantity: randomInt(1, 10),
      unitPrice: randomInt(30000, 150000),
      totalAmount: randomInt(30000, 1500000),
      status: 'Confirmed',
      paymentStatus: 'Overdue',
      assignedTo: randomElement(users)._id,
      saleDate: confirmedDate,
      createdBy: randomElement(users)._id,
      createdAt: confirmedDate,
      updatedAt: confirmedDate
    });
  }
  
  await Sale.insertMany(scenarios);
  console.log(`✅ Created ${scenarios.length} Revenue at Risk scenarios`);
}

// 2. FRAUD DETECTION SCENARIOS
async function seedFraudDetectionScenarios() {
  console.log(`\n🛡️  Seeding Fraud Detection Test Cases...`);
  
  const users = await User.find().limit(10);
  const sales = await Sale.find().limit(50);
  
  const now = new Date();
  const fraudScenarios = [];
  
  // Scenario 1: Unusually high amounts (3x+ average)
  for (let i = 0; i < 15; i++) {
    const paymentDate = randomDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now);
    // Create after-hours payment (18:00 - 23:59)
    const afterHoursDate = new Date(paymentDate);
    afterHoursDate.setHours(18 + randomInt(0, 5));
    afterHoursDate.setMinutes(randomInt(0, 59));
    
    fraudScenarios.push({
      saleId: sales.length > 0 ? randomElement(sales)._id : null,
      customerName: `SUSPICIOUS - High Amount Customer ${i + 1}`,
      amount: randomInt(500000, 2000000), // Very high amounts
      paymentMethod: randomElement(['Cash', 'UPI', 'Bank Transfer']),
      paymentDate: afterHoursDate,
      status: 'Pending',
      schoolCode: `FRAUD${randomInt(1000, 9999)}`,
      contactName: `Suspicious Contact ${i + 1}`,
      mobileNumber: `9${randomInt(100000000, 999999999)}`,
      location: randomElement(CITIES),
      zone: randomElement(ZONES),
      createdBy: randomElement(users)._id,
      createdAt: afterHoursDate,
      updatedAt: afterHoursDate
    });
  }
  
  // Scenario 2: Round number patterns (potential red flag)
  const roundNumbers = [10000, 50000, 100000, 200000, 500000, 1000000];
  for (let i = 0; i < 20; i++) {
    const paymentDate = randomDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now);
    fraudScenarios.push({
      saleId: sales.length > 0 ? randomElement(sales)._id : null,
      customerName: `ROUND AMOUNT - Customer ${i + 1}`,
      amount: randomElement(roundNumbers),
      paymentMethod: 'Cash',
      paymentDate: paymentDate,
      status: 'Pending',
      schoolCode: `ROUND${randomInt(1000, 9999)}`,
      contactName: `Round Amount Contact ${i + 1}`,
      mobileNumber: `9${randomInt(100000000, 999999999)}`,
      location: randomElement(CITIES),
      zone: randomElement(ZONES),
      createdBy: randomElement(users)._id,
      createdAt: paymentDate,
      updatedAt: paymentDate
    });
  }
  
  // Scenario 3: Rapid sequence of expenses from same user
  const suspiciousUsers = users.slice(0, 3);
  for (const user of suspiciousUsers) {
    for (let i = 0; i < 5; i++) {
      const expenseDate = new Date(now.getTime() - randomInt(1, 7) * 24 * 60 * 60 * 1000);
      fraudScenarios.push({
        title: `RAPID EXPENSE - Expense ${i + 1}`,
        amount: randomInt(10000, 50000),
        category: randomElement(['Travel', 'Food', 'Other']),
        description: `Multiple rapid expenses from same user`,
        date: expenseDate,
        status: 'Pending',
        createdBy: user._id,
        employeeId: user._id,
        createdAt: expenseDate,
        updatedAt: expenseDate
      });
    }
  }
  
  await Payment.insertMany(fraudScenarios.filter(p => p.saleId !== undefined || p.saleId === null));
  await Expense.insertMany(fraudScenarios.filter(e => e.title && e.title.includes('RAPID')));
  console.log(`✅ Created ${fraudScenarios.length} Fraud Detection scenarios`);
}

// 3. CHURN PREDICTOR SCENARIOS
async function seedChurnScenarios() {
  console.log(`\n👥 Seeding Churn Predictor Test Cases...`);
  
  const users = await User.find({ role: { $in: ['Executive', 'Manager'] } }).limit(10);
  const leads = await Lead.find().limit(50);
  
  const now = new Date();
  const churnScenarios = [];
  
  // Scenario 1: Customers with no activity for 90+ days
  for (let i = 0; i < 30; i++) {
    const inactiveDate = new Date(now.getTime() - (90 + randomInt(0, 60)) * 24 * 60 * 60 * 1000);
    churnScenarios.push({
      leadId: leads.length > 0 ? randomElement(leads)._id : null,
      customerName: `INACTIVE - Customer ${i + 1}`,
      customerEmail: `inactive${i + 1}@example.com`,
      customerPhone: `9${randomInt(100000000, 999999999)}`,
      product: randomElement(PRODUCTS),
      quantity: randomInt(1, 5),
      unitPrice: randomInt(20000, 100000),
      totalAmount: randomInt(20000, 500000),
      status: 'Closed',
      paymentStatus: 'Paid',
      assignedTo: randomElement(users)._id,
      saleDate: inactiveDate,
      createdBy: randomElement(users)._id,
      createdAt: inactiveDate,
      updatedAt: inactiveDate
    });
  }
  
  // Scenario 2: Customers with declining order frequency
  for (let i = 0; i < 25; i++) {
    const oldSale = new Date(now.getTime() - randomInt(60, 120) * 24 * 60 * 60 * 1000);
    churnScenarios.push({
      leadId: leads.length > 0 ? randomElement(leads)._id : null,
      customerName: `DECLINING - Customer ${i + 1}`,
      customerEmail: `declining${i + 1}@example.com`,
      customerPhone: `9${randomInt(100000000, 999999999)}`,
      product: randomElement(PRODUCTS),
      quantity: randomInt(1, 3), // Lower quantity
      unitPrice: randomInt(15000, 80000),
      totalAmount: randomInt(15000, 240000),
      status: 'Closed',
      paymentStatus: 'Partial',
      assignedTo: randomElement(users)._id,
      saleDate: oldSale,
      createdBy: randomElement(users)._id,
      createdAt: oldSale,
      updatedAt: oldSale
    });
  }
  
  await Sale.insertMany(churnScenarios);
  console.log(`✅ Created ${churnScenarios.length} Churn Predictor scenarios`);
}

// 4. PRIORITY ENGINE SCENARIOS
async function seedPriorityScenarios() {
  console.log(`\n⚡ Seeding Priority Engine Test Cases...`);
  
  const users = await User.find({ role: { $in: ['Executive', 'Manager', 'Sales BDE'] } }).limit(10);
  
  const now = new Date();
  const priorityLeads = [];
  const priorityPayments = [];
  
  // Scenario 1: Overdue follow-up leads (HIGH PRIORITY)
  for (let i = 0; i < 40; i++) {
    const createdDate = new Date(now.getTime() - randomInt(10, 30) * 24 * 60 * 60 * 1000);
    const overdueFollowUp = new Date(now.getTime() - randomInt(1, 10) * 24 * 60 * 60 * 1000); // Past due
    
    const productCount = randomInt(1, 3);
    const products = [];
    for (let j = 0; j < productCount; j++) {
      products.push({
        product_name: randomElement(PRODUCTS),
        quantity: randomInt(1, 5),
        unit_price: randomInt(30000, 200000) // High value
      });
    }
    
    priorityLeads.push({
      school_name: `URGENT - Overdue Follow-up ${i + 1}`,
      contact_person: `Urgent Contact ${i + 1}`,
      contact_mobile: `9${randomInt(100000000, 999999999)}`,
      products: products,
      location: randomElement(CITIES),
      pincode: randomInt(100000, 999999).toString(),
      state: randomElement(STATES),
      city: randomElement(CITIES),
      zone: randomElement(ZONES),
      priority: 'Hot',
      status: 'Pending',
      follow_up_date: overdueFollowUp,
      strength: randomInt(500, 2000),
      createdBy: randomElement(users)._id,
      managed_by: randomElement(users)._id,
      createdAt: createdDate,
      updatedAt: createdDate
    });
  }
  
  // Scenario 2: High-value deals needing approval
  const sales = await Sale.find({ status: 'Pending' }).limit(30);
  for (const sale of sales) {
    priorityPayments.push({
      saleId: sale._id,
      customerName: sale.customerName,
      amount: sale.totalAmount * 0.5, // Partial payment
      paymentMethod: 'Bank Transfer',
      paymentDate: new Date(now.getTime() - randomInt(5, 15) * 24 * 60 * 60 * 1000),
      status: 'Pending',
      schoolCode: `PRIORITY${randomInt(1000, 9999)}`,
      contactName: sale.customerName,
      mobileNumber: sale.customerPhone,
      location: randomElement(CITIES),
      zone: randomElement(ZONES),
      createdBy: randomElement(users)._id,
      createdAt: new Date(now.getTime() - randomInt(5, 15) * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    });
  }
  
  await Lead.insertMany(priorityLeads);
  await Payment.insertMany(priorityPayments);
  console.log(`✅ Created ${priorityLeads.length} Priority Leads and ${priorityPayments.length} Priority Payments`);
}

// 5. PERFORMANCE RISK SCENARIOS
async function seedPerformanceScenarios() {
  console.log(`\n📊 Seeding Performance Risk Test Cases...`);
  
  // Create managers with poor performance metrics
  const poorPerformers = [];
  
  for (let i = 0; i < 10; i++) {
    const existing = await User.findOne({ email: `poorperformer${i + 1}@example.com` });
    if (!existing) {
      const manager = await User.create({
        name: `Poor Performer Manager ${i + 1}`,
        email: `poorperformer${i + 1}@example.com`,
        password: 'test123',
        role: 'Manager',
        zone: randomElement(ZONES),
        state: randomElement(STATES),
        city: randomElement(CITIES),
        isActive: true
      });
      poorPerformers.push(manager);
    } else {
      poorPerformers.push(existing);
    }
  }
  
  // Create sales with low conversion rates for these managers
  const users = await User.find().limit(10);
  const leads = await Lead.find().limit(100);
  const lowPerformanceSales = [];
  
  for (const manager of poorPerformers) {
    // Create many pending/cancelled sales (low conversion)
    for (let i = 0; i < 15; i++) {
      const saleDate = new Date(Date.now() - randomInt(30, 90) * 24 * 60 * 60 * 1000);
      lowPerformanceSales.push({
        leadId: leads.length > 0 ? randomElement(leads)._id : null,
        customerName: `Low Conversion Customer ${i + 1}`,
        customerEmail: `lowconv${i + 1}@example.com`,
        customerPhone: `9${randomInt(100000000, 999999999)}`,
        product: randomElement(PRODUCTS),
        quantity: randomInt(1, 3),
        unitPrice: randomInt(10000, 50000),
        totalAmount: randomInt(10000, 150000),
        status: randomElement(['Pending', 'Cancelled']), // Low conversion
        paymentStatus: 'Pending',
        assignedTo: manager._id,
        saleDate: saleDate,
        createdBy: manager._id,
        createdAt: saleDate,
        updatedAt: saleDate
      });
    }
  }
  
  await Sale.insertMany(lowPerformanceSales);
  console.log(`✅ Created ${lowPerformanceSales.length} Low Performance scenarios`);
}

// 6. DELAY COST SCENARIOS
async function seedDelayScenarios() {
  console.log(`\n⏰ Seeding Delay Cost Test Cases...`);
  
  const users = await User.find({ role: { $in: ['Executive', 'Warehouse Executive'] } }).limit(10);
  const sales = await Sale.find().limit(50);
  const dcOrders = await DcOrder.find().limit(50);
  
  const now = new Date();
  const delayedDCs = [];
  
  // Scenario 1: DCs with significant delays (30+ days)
  for (let i = 0; i < 30; i++) {
    const createdDate = new Date(now.getTime() - (30 + randomInt(0, 30)) * 24 * 60 * 60 * 1000);
    const expectedCompletion = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Expected in 7 days
    const actualCompletion = new Date(expectedCompletion.getTime() + randomInt(20, 40) * 24 * 60 * 60 * 1000);
    
    const productCount = randomInt(1, 3);
    const productDetails = [];
    let totalAmount = 0;
    
    for (let j = 0; j < productCount; j++) {
      const quantity = randomInt(50, 200);
      const price = randomInt(1000, 5000);
      const total = quantity * price;
      totalAmount += total;
      
      productDetails.push({
        product: randomElement(PRODUCTS),
        class: `Class ${randomInt(1, 12)}`,
        category: 'Regular',
        quantity: quantity,
        strength: randomInt(100, 500),
        price: price,
        total: total,
        level: 'L2',
        specs: 'Regular',
        term: randomElement(['Term 1', 'Term 2', 'Both'])
      });
    }
    
    let saleId = null;
    let dcOrderId = null;
    
    if (sales.length > 0 && Math.random() > 0.5) {
      saleId = randomElement(sales)._id;
    } else if (dcOrders.length > 0) {
      dcOrderId = randomElement(dcOrders)._id;
    }
    
    if (saleId || dcOrderId) {
      delayedDCs.push({
        saleId: saleId,
        dcOrderId: dcOrderId,
        employeeId: randomElement(users)._id,
        customerName: `DELAYED - Customer ${i + 1}`,
        customerPhone: `9${randomInt(100000000, 999999999)}`,
        product: randomElement(PRODUCTS),
        requestedQuantity: randomInt(100, 500),
        availableQuantity: randomInt(100, 500),
        deliverableQuantity: randomInt(100, 500),
        deliveryDate: actualCompletion,
        status: 'completed',
        productDetails: productDetails,
        createdBy: randomElement(users)._id,
        createdAt: createdDate,
        completedAt: actualCompletion,
        completedBy: randomElement(users)._id,
        updatedAt: actualCompletion
      });
    }
  }
  
  if (delayedDCs.length > 0) {
    await DC.insertMany(delayedDCs);
    console.log(`✅ Created ${delayedDCs.length} Delay Cost scenarios`);
  }
}

// 7. CASHFLOW BLOCKAGE SCENARIOS
async function seedCashflowScenarios() {
  console.log(`\n💰 Seeding Cashflow Blockage Test Cases...`);
  
  const users = await User.find().limit(10);
  const sales = await Sale.find().limit(50);
  
  const now = new Date();
  const blockedPayments = [];
  
  // Scenario 1: Payments stuck in "Hold" for extended periods
  for (let i = 0; i < 25; i++) {
    const holdDate = new Date(now.getTime() - randomInt(20, 60) * 24 * 60 * 60 * 1000);
    blockedPayments.push({
      saleId: sales.length > 0 ? randomElement(sales)._id : null,
      customerName: `BLOCKED - Customer ${i + 1}`,
      amount: randomInt(50000, 500000),
      paymentMethod: randomElement(['NEFT/RTGS', 'Cheque', 'Bank Transfer']),
      paymentDate: holdDate,
      status: 'Hold',
      schoolCode: `BLOCK${randomInt(1000, 9999)}`,
      contactName: `Blocked Contact ${i + 1}`,
      mobileNumber: `9${randomInt(100000000, 999999999)}`,
      location: randomElement(CITIES),
      zone: randomElement(ZONES),
      createdBy: randomElement(users)._id,
      createdAt: holdDate,
      updatedAt: holdDate
    });
  }
  
  // Scenario 2: Large pending payments
  for (let i = 0; i < 20; i++) {
    const pendingDate = new Date(now.getTime() - randomInt(15, 45) * 24 * 60 * 60 * 1000);
    blockedPayments.push({
      saleId: sales.length > 0 ? randomElement(sales)._id : null,
      customerName: `LARGE PENDING - Customer ${i + 1}`,
      amount: randomInt(200000, 1000000), // Large amounts
      paymentMethod: randomElement(['UPI', 'Bank Transfer', 'Online Payment']),
      paymentDate: pendingDate,
      status: 'Pending',
      schoolCode: `LARGE${randomInt(1000, 9999)}`,
      contactName: `Large Pending Contact ${i + 1}`,
      mobileNumber: `9${randomInt(100000000, 999999999)}`,
      location: randomElement(CITIES),
      zone: randomElement(ZONES),
      createdBy: randomElement(users)._id,
      createdAt: pendingDate,
      updatedAt: pendingDate
    });
  }
  
  await Payment.insertMany(blockedPayments);
  console.log(`✅ Created ${blockedPayments.length} Cashflow Blockage scenarios`);
}

// ============================================
// ORIGINAL SEED FUNCTIONS (Enhanced)
// ============================================

async function seedLeads(count = 500) {
  console.log(`\n🌱 Seeding ${count} Leads...`);
  
  const users = await User.find({ role: { $in: ['Executive', 'Manager', 'Sales BDE'] } }).limit(10);
  if (users.length === 0) {
    console.log('⚠️  No users found. Creating a test user...');
    const testUser = await User.create({
      name: 'Test Executive',
      email: 'test@example.com',
      password: 'test123',
      role: 'Executive',
      zone: 'North'
    });
    users.push(testUser);
  }

  const leads = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < count; i++) {
    const createdDate = randomDate(sixMonthsAgo, now);
    const followUpDate = randomDate(createdDate, new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000));
    
    const productCount = randomInt(1, 3);
    const products = [];
    for (let j = 0; j < productCount; j++) {
      products.push({
        product_name: randomElement(PRODUCTS),
        quantity: randomInt(1, 5),
        unit_price: randomInt(5000, 50000)
      });
    }

    const totalAmount = products.reduce((sum, p) => sum + (p.unit_price * p.quantity), 0);
    const status = randomElement(STATUSES.lead);
    
    leads.push({
      school_name: `Test School ${i + 1}`,
      contact_person: `Contact Person ${i + 1}`,
      contact_mobile: `9${randomInt(100000000, 999999999)}`,
      products: products,
      location: `Location ${i + 1}`,
      pincode: randomInt(100000, 999999).toString(),
      state: randomElement(STATES),
      city: randomElement(CITIES),
      zone: randomElement(ZONES),
      priority: randomElement(PRIORITIES),
      status: status,
      follow_up_date: followUpDate,
      strength: randomInt(100, 2000),
      createdBy: randomElement(users)._id,
      managed_by: randomElement(users)._id,
      createdAt: createdDate,
      updatedAt: randomDate(createdDate, now)
    });
  }

  await Lead.insertMany(leads);
  console.log(`✅ Created ${count} leads`);
}

async function seedSales(count = 500) {
  console.log(`\n🌱 Seeding ${count} Sales...`);
  
  const users = await User.find({ role: { $in: ['Executive', 'Manager'] } }).limit(10);
  const leads = await Lead.find().limit(100);
  
  const sales = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < count; i++) {
    const saleDate = randomDate(sixMonthsAgo, now);
    const unitPrice = randomInt(10000, 100000);
    const quantity = randomInt(1, 10);
    const totalAmount = unitPrice * quantity;
    const status = randomElement(STATUSES.sale);
    
    sales.push({
      leadId: leads.length > 0 ? randomElement(leads)._id : null,
      customerName: `Customer ${i + 1}`,
      customerEmail: `customer${i + 1}@example.com`,
      customerPhone: `9${randomInt(100000000, 999999999)}`,
      product: randomElement(PRODUCTS),
      quantity: quantity,
      unitPrice: unitPrice,
      totalAmount: totalAmount,
      status: status,
      paymentStatus: status === 'Closed' ? 'Paid' : randomElement(['Pending', 'Partial', 'Paid', 'Overdue']),
      assignedTo: randomElement(users)._id,
      saleDate: saleDate,
      createdBy: randomElement(users)._id,
      createdAt: saleDate,
      updatedAt: randomDate(saleDate, now)
    });
  }

  await Sale.insertMany(sales);
  console.log(`✅ Created ${count} sales`);
}

async function seedPayments(count = 500) {
  console.log(`\n🌱 Seeding ${count} Payments...`);
  
  const users = await User.find().limit(10);
  const sales = await Sale.find().limit(100);
  
  const payments = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const paymentMethods = ['Cash', 'UPI', 'NEFT/RTGS', 'Cheque', 'Bank Transfer', 'Online Payment'];

  for (let i = 0; i < count; i++) {
    const paymentDate = randomDate(sixMonthsAgo, now);
    const amount = randomInt(5000, 200000);
    const status = randomElement(STATUSES.payment);
    const isApproved = status === 'Approved';
    
    payments.push({
      saleId: sales.length > 0 ? randomElement(sales)._id : null,
      customerName: `Customer ${i + 1}`,
      amount: amount,
      paymentMethod: randomElement(paymentMethods),
      paymentDate: paymentDate,
      status: status,
      schoolCode: `SCH${randomInt(1000, 9999)}`,
      contactName: `Contact ${i + 1}`,
      mobileNumber: `9${randomInt(100000000, 999999999)}`,
      location: randomElement(CITIES),
      zone: randomElement(ZONES),
      createdBy: randomElement(users)._id,
      approvedBy: isApproved ? randomElement(users)._id : null,
      approvedAt: isApproved ? randomDate(paymentDate, now) : null,
      createdAt: paymentDate,
      updatedAt: randomDate(paymentDate, now)
    });
  }

  await Payment.insertMany(payments);
  console.log(`✅ Created ${count} payments`);
}

async function seedDCs(count = 100) {
  console.log(`\n🌱 Seeding ${count} DCs...`);
  
  const users = await User.find({ role: { $in: ['Executive', 'Warehouse Executive'] } }).limit(10);
  const sales = await Sale.find().limit(100);
  const dcOrders = await DcOrder.find().limit(100);
  
  if (sales.length === 0 && dcOrders.length === 0) {
    console.log('⚠️  No sales or DC orders found. Creating DCs with dcOrderId only...');
    if (dcOrders.length === 0) {
      await seedDcOrders(50);
      const newDcOrders = await DcOrder.find().limit(50);
      dcOrders.push(...newDcOrders);
    }
  }
  
  const dcs = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < count; i++) {
    const createdDate = randomDate(sixMonthsAgo, now);
    const status = randomElement(STATUSES.dc);
    const isCompleted = status === 'completed';
    const deliveryDate = randomDate(createdDate, new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000));
    
    const productCount = randomInt(1, 3);
    const productDetails = [];
    let totalAmount = 0;
    
    for (let j = 0; j < productCount; j++) {
      const quantity = randomInt(10, 100);
      const price = randomInt(500, 5000);
      const total = quantity * price;
      totalAmount += total;
      
      productDetails.push({
        product: randomElement(PRODUCTS),
        class: `Class ${randomInt(1, 12)}`,
        category: 'Regular',
        quantity: quantity,
        strength: randomInt(50, 500),
        price: price,
        total: total,
        level: 'L2',
        specs: 'Regular',
        term: randomElement(['Term 1', 'Term 2', 'Both'])
      });
    }
    
    let saleId = null;
    let dcOrderId = null;
    
    if (sales.length > 0 && dcOrders.length > 0) {
      if (Math.random() > 0.5) {
        saleId = randomElement(sales)._id;
      } else {
        dcOrderId = randomElement(dcOrders)._id;
      }
    } else if (sales.length > 0) {
      saleId = randomElement(sales)._id;
    } else if (dcOrders.length > 0) {
      dcOrderId = randomElement(dcOrders)._id;
    } else {
      console.log(`⚠️  Skipping DC ${i + 1} - no sales or DC orders available`);
      continue;
    }
    
    dcs.push({
      saleId: saleId,
      dcOrderId: dcOrderId,
      employeeId: randomElement(users)._id,
      customerName: `Customer ${i + 1}`,
      customerPhone: `9${randomInt(100000000, 999999999)}`,
      product: randomElement(PRODUCTS),
      requestedQuantity: randomInt(50, 500),
      availableQuantity: randomInt(50, 500),
      deliverableQuantity: randomInt(50, 500),
      deliveryDate: deliveryDate,
      status: status,
      productDetails: productDetails,
      createdBy: randomElement(users)._id,
      createdAt: createdDate,
      completedAt: isCompleted ? randomDate(createdDate, now) : null,
      completedBy: isCompleted ? randomElement(users)._id : null,
      updatedAt: randomDate(createdDate, now)
    });
  }

  if (dcs.length > 0) {
    await DC.insertMany(dcs);
    console.log(`✅ Created ${dcs.length} DCs`);
  } else {
    console.log('⚠️  No DCs created - no sales or DC orders available');
  }
}

async function seedExpenses(count = 500) {
  console.log(`\n🌱 Seeding ${count} Expenses...`);
  
  const users = await User.find().limit(10);
  
  const expenses = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const categories = ['Travel', 'Food', 'Accommodation', 'Office Supplies', 'Marketing', 'Other'];
  const expenseStatuses = ['Pending', 'Executive Manager Approved', 'Manager Approved', 'Approved', 'Rejected'];

  for (let i = 0; i < count; i++) {
    const expenseDate = randomDate(sixMonthsAgo, now);
    const amount = randomInt(500, 50000);
    const status = randomElement(expenseStatuses);
    const isApproved = status === 'Approved' || status === 'Manager Approved' || status === 'Executive Manager Approved';
    
    expenses.push({
      title: `Expense ${i + 1}`,
      amount: amount,
      category: randomElement(categories),
      description: `Description for expense ${i + 1}`,
      date: expenseDate,
      status: status,
      createdBy: randomElement(users)._id,
      employeeId: randomElement(users)._id,
      approvedBy: isApproved ? randomElement(users)._id : null,
      approvedAt: isApproved ? randomDate(expenseDate, now) : null,
      createdAt: expenseDate,
      updatedAt: randomDate(expenseDate, now)
    });
  }

  await Expense.insertMany(expenses);
  console.log(`✅ Created ${count} expenses`);
}

async function seedDcOrders(count = 500) {
  console.log(`\n🌱 Seeding ${count} DC Orders...`);
  
  const users = await User.find().limit(10);
  
  const dcOrders = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const dcOrderStatuses = ['saved', 'pending', 'in_transit', 'completed', 'hold', 'dc_requested', 'dc_accepted', 'dc_approved'];

  for (let i = 0; i < count; i++) {
    const createdDate = randomDate(sixMonthsAgo, now);
    const productCount = randomInt(1, 3);
    const products = [];
    let totalAmount = 0;
    
    for (let j = 0; j < productCount; j++) {
      const unitPrice = randomInt(500, 5000);
      const quantity = randomInt(10, 100);
      products.push({
        product_name: randomElement(PRODUCTS),
        quantity: quantity,
        unit_price: unitPrice
      });
      totalAmount += unitPrice * quantity;
    }
    
    dcOrders.push({
      school_name: `School ${i + 1}`,
      contact_person: `Contact ${i + 1}`,
      contact_mobile: `9${randomInt(100000000, 999999999)}`,
      location: randomElement(CITIES),
      zone: randomElement(ZONES),
      state: randomElement(STATES),
      city: randomElement(CITIES),
      products: products,
      total_amount: totalAmount,
      priority: randomElement(PRIORITIES),
      status: randomElement(dcOrderStatuses),
      created_by: randomElement(users)._id,
      assigned_to: randomElement(users)._id,
      createdAt: createdDate,
      updatedAt: randomDate(createdDate, now)
    });
  }

  await DcOrder.insertMany(dcOrders);
  console.log(`✅ Created ${count} DC Orders`);
}

async function seedManagers(count = 20) {
  console.log(`\n🌱 Seeding ${count} Managers...`);
  
  const managers = [];
  
  for (let i = 0; i < count; i++) {
    managers.push({
      name: `Manager ${i + 1}`,
      email: `manager${i + 1}@example.com`,
      password: 'test123',
      role: Math.random() > 0.5 ? 'Manager' : 'Executive Manager',
      zone: randomElement(ZONES),
      state: randomElement(STATES),
      city: randomElement(CITIES),
      isActive: true
    });
  }

  for (const manager of managers) {
    const existing = await User.findOne({ email: manager.email });
    if (!existing) {
      await User.create(manager);
    }
  }
  
  console.log(`✅ Created/Verified ${count} managers`);
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function seedAll() {
  try {
    await connectDB();
    console.log('✅ Connected to database');
    
    console.log('\n🚀 Starting Comprehensive AI Test Data Seeding...');
    console.log('This will create base data + targeted test cases for all AI tools.\n');
    
    // Step 1: Seed managers first (needed for other data)
    await seedManagers(20);
    
    // Step 2: Seed base data
    console.log('\n📦 Seeding Base Data...');
    await seedLeads(500);
    await seedSales(500);
    await seedPayments(500);
    await seedDcOrders(500);
    await seedDCs(100);
    await seedExpenses(500);
    
    // Step 3: Seed targeted AI test cases
    console.log('\n🎯 Seeding Targeted AI Test Cases...');
    await seedRevenueAtRiskScenarios();
    await seedFraudDetectionScenarios();
    await seedChurnScenarios();
    await seedPriorityScenarios();
    await seedPerformanceScenarios();
    await seedDelayScenarios();
    await seedCashflowScenarios();
    
    console.log('\n✅ All AI test data seeded successfully!');
    console.log('\n📊 Final Summary:');
    console.log('  Base Data:');
    console.log('    - 500 Leads');
    console.log('    - 500 Sales');
    console.log('    - 500 Payments');
    console.log('    - 100 DCs');
    console.log('    - 500 Expenses');
    console.log('    - 500 DC Orders');
    console.log('    - 20 Managers/Executives');
    console.log('\n  AI Test Cases:');
    console.log('    - 75 Revenue at Risk scenarios');
    console.log('    - 40 Fraud Detection scenarios');
    console.log('    - 55 Churn Predictor scenarios');
    console.log('    - 70 Priority Engine scenarios');
    console.log('    - 150 Performance Risk scenarios');
    console.log('    - 30 Delay Cost scenarios');
    console.log('    - 45 Cashflow Blockage scenarios');
    console.log('\n🎉 Total: ~2,500+ records ready for AI testing!');
    console.log('\n💡 Your AI models will now have comprehensive test data to validate predictions!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedAll();
