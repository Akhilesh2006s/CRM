const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env
dotenv.config();

const connectDB = require('../config/db');
const User = require('../models/User');
const DcOrder = require('../models/DcOrder');

async function seedWarehouseDcTestData() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find an existing executive/manager user, or create one
    let user = await User.findOne({
      role: { $in: ['Executive', 'Manager', 'Executive Manager'] },
    });

    if (!user) {
      console.log('ℹ️  No Executive/Manager user found. Creating a test executive...');
      user = await User.create({
        name: 'Warehouse Test Executive',
        email: 'warehouse-test-exec@example.com',
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

    const now = new Date();
    const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    const dcOrders = [
      {
        // Very fresh DC (0–3 days)
        dc_code: 'DC-WH-001',
        school_name: 'Delhi Public School - RK Puram',
        contact_person: 'Rahul Sharma',
        contact_mobile: '9876543210',
        location: 'RK Puram, New Delhi',
        state: 'Delhi',
        city: 'New Delhi',
        zone: 'North',
        school_type: 'CBSE',
        products: [
          {
            product_name: 'Abacus Level 1',
            quantity: 120,
            unit_price: 1500,
          },
        ],
        total_amount: 120 * 1500,
        status: 'pending',
        created_by: user._id,
        assigned_to: user._id,
        createdAt: daysAgo(1),
      },
      {
        // 5 days old DC (4–7 bucket)
        dc_code: 'DC-WH-002',
        school_name: "St. Xavier's High School",
        contact_person: 'Meera Iyer',
        contact_mobile: '9888877777',
        location: 'Andheri East, Mumbai',
        state: 'Maharashtra',
        city: 'Mumbai',
        zone: 'West',
        school_type: 'ICSE',
        products: [
          {
            product_name: 'Vedic Maths Level 1',
            quantity: 80,
            unit_price: 1800,
          },
        ],
        total_amount: 80 * 1800,
        status: 'pending',
        created_by: user._id,
        assigned_to: user._id,
        createdAt: daysAgo(5),
      },
      {
        // 10 days old DC (8–15 bucket)
        dc_code: 'DC-WH-003',
        school_name: 'Modern Public School',
        contact_person: 'Arjun Verma',
        contact_mobile: '9898989898',
        location: 'Madhapur, Hyderabad',
        state: 'Telangana',
        city: 'Hyderabad',
        zone: 'South',
        school_type: 'CBSE',
        products: [
          {
            product_name: 'Skill Pro',
            quantity: 60,
            unit_price: 2000,
          },
        ],
        total_amount: 60 * 2000,
        status: 'pending',
        created_by: user._id,
        assigned_to: user._id,
        createdAt: daysAgo(10),
      },
      {
        // 18 days old DC, explicitly on hold
        dc_code: 'DC-WH-004',
        school_name: 'Springfield International School',
        contact_person: 'Neha Kulkarni',
        contact_mobile: '9765432109',
        location: 'Baner, Pune',
        state: 'Maharashtra',
        city: 'Pune',
        zone: 'West',
        school_type: 'CBSE',
        products: [
          {
            product_name: 'Financial Literacy',
            quantity: 100,
            unit_price: 2200,
          },
        ],
        total_amount: 100 * 2200,
        status: 'hold',
        hold: true,
        remarks: 'On hold due to payment clarification',
        created_by: user._id,
        assigned_to: user._id,
        createdAt: daysAgo(18),
      },
      {
        // 35 days old DC (30+ bucket, critical)
        dc_code: 'DC-WH-005',
        school_name: 'Green Valley High',
        contact_person: 'Sanjay Rao',
        contact_mobile: '9822001100',
        location: 'Whitefield, Bangalore',
        state: 'Karnataka',
        city: 'Bangalore',
        zone: 'South',
        school_type: 'CBSE',
        products: [
          {
            product_name: 'Codechamp',
            quantity: 150,
            unit_price: 2500,
          },
        ],
        total_amount: 150 * 2500,
        status: 'pending',
        remarks: 'Stuck in warehouse for a long time',
        created_by: user._id,
        assigned_to: user._id,
        createdAt: daysAgo(35),
      },
    ];

    const result = await DcOrder.insertMany(dcOrders);
    console.log(`✅ Inserted ${result.length} DcOrders for warehouse DC test data`);

    console.log('\nYou can now call GET /api/warehouse/dc/list and use these in rnxa as dc@Warehouse test cases.');

    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding warehouse DC test data:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

if (require.main === module) {
  seedWarehouseDcTestData();
}

module.exports = { seedWarehouseDcTestData };

