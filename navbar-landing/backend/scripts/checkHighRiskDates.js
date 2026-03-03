const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Sale = require('../models/Sale');

dotenv.config();
const connectDB = require('../config/db');

(async () => {
  try {
    await connectDB();
    const sales = await Sale.find({ customerName: /HIGH RISK - (Delhi|DAV|Ryan|Kendriya|DPS)/i }).limit(10);
    console.log('New high-risk customers:');
    const now = new Date();
    sales.forEach(s => {
      const daysAgo = Math.floor((now - new Date(s.saleDate)) / (1000 * 60 * 60 * 24));
      console.log(`  ${s.customerName}: ${daysAgo} days ago (${s.saleDate.toISOString().split('T')[0]})`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
