const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const ContactQuery = require('../models/ContactQuery');

dotenv.config();

const connectDB = require('../config/db');

async function test() {
  try {
    await connectDB();
    console.log('✅ Connected to database\n');
    
    const highRiskSales = await Sale.find({ customerName: /HIGH RISK/i }).limit(5);
    console.log(`📊 High-risk sales found: ${highRiskSales.length}`);
    highRiskSales.forEach(s => {
      const daysAgo = Math.floor((new Date() - new Date(s.saleDate)) / (1000 * 60 * 60 * 24));
      console.log(`  - ${s.customerName} | Last order: ${daysAgo} days ago | Status: ${s.status}`);
    });
    
    const queries = await ContactQuery.find({ school_name: /HIGH RISK/i }).limit(5);
    console.log(`\n📊 High-risk queries found: ${queries.length}`);
    queries.forEach(q => {
      console.log(`  - ${q.school_name} | Status: ${q.status} | Subject: ${q.subject}`);
    });
    
    const payments = await Payment.find({ customerName: /HIGH RISK/i }).limit(5);
    console.log(`\n📊 High-risk payments found: ${payments.length}`);
    payments.forEach(p => {
      console.log(`  - ${p.customerName} | Amount: ₹${p.amount} | Date: ${p.paymentDate}`);
    });
    
    // Check if they match
    console.log('\n🔍 Checking customer matching...');
    if (highRiskSales.length > 0) {
      const sale = highRiskSales[0];
      const matchingQueries = await ContactQuery.find({ 
        school_name: sale.customerName 
      });
      const matchingPayments = await Payment.find({ 
        customerName: sale.customerName 
      });
      console.log(`  Customer: ${sale.customerName}`);
      console.log(`  Matching queries: ${matchingQueries.length}`);
      console.log(`  Matching payments: ${matchingPayments.length}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

test();
