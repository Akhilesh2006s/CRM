const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('../config/db');
const User = require('../models/User');
const DcOrder = require('../models/DcOrder');

function daysAgo(d) {
  const now = new Date();
  return new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
}

async function seedWarehouseDcMore(count = 45) {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    let user = await User.findOne({
      role: { $in: ['Executive', 'Manager', 'Executive Manager'] },
    });

    if (!user) {
      console.log('ℹ️  No Executive/Manager user found. Creating a test executive...');
      user = await User.create({
        name: 'Warehouse Bulk Exec',
        email: 'warehouse-bulk-exec@example.com',
        password: 'test123',
        role: 'Executive',
        zone: 'North',
        state: 'Delhi',
        city: 'New Delhi',
      });
      console.log(`✅ Created test executive: ${user.name} (${user.email})`);
    } else {
      console.log(`✅ Using existing user: ${user.name} (${user.email}) - Role: ${user.role}`);
    }

    const zones = ['North', 'South', 'East', 'West', 'Central'];
    const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai'];
    const products = [
      'Abacus Level 1',
      'Abacus Level 2',
      'Vedic Maths Level 1',
      'Skill Pro',
      'Financial Literacy',
      'Codechamp',
    ];

    const dcOrders = [];

    for (let i = 1; i <= count; i++) {
      const zone = zones[i % zones.length];
      const city = cities[i % cities.length];
      const product = products[i % products.length];
      const qty = 40 + (i % 80); // 40–119
      const days = 1 + (i % 36); // 1–36 days old

      dcOrders.push({
        dc_code: `DC-WH-BULK-${String(i).padStart(3, '0')}`,
        school_name: `Test School ${i}`,
        contact_person: `Contact ${i}`,
        contact_mobile: `9${Math.floor(100000000 + Math.random() * 899999999)}`,
        location: `${city} Test Area`,
        state: 'Test State',
        city,
        zone,
        school_type: 'CBSE',
        products: [
          {
            product_name: product,
            quantity: qty,
            unit_price: 1500,
          },
        ],
        total_amount: qty * 1500,
        status: i % 10 === 0 ? 'hold' : 'pending', // every 10th DC is hold
        hold: i % 10 === 0,
        remarks: i % 10 === 0 ? 'Auto-generated hold DC for testing' : 'Auto-generated pending DC',
        created_by: user._id,
        assigned_to: user._id,
        createdAt: daysAgo(days),
      });
    }

    const result = await DcOrder.insertMany(dcOrders);
    console.log(`✅ Inserted ${result.length} additional DcOrders for warehouse DC testing`);

    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding additional warehouse DC data:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

if (require.main === module) {
  const countArg = parseInt(process.argv[2], 10);
  const count = Number.isNaN(countArg) ? 45 : countArg;
  seedWarehouseDcMore(count);
}

module.exports = { seedWarehouseDcMore };

