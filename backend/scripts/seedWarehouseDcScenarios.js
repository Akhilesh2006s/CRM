const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const DcOrder = require('../models/DcOrder');
const User = require('../models/User');

// Load .env similarly to seedAITestData
(() => {
  const envPaths = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
    path.join(process.cwd(), '.env'),
  ];

  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        console.log(`📄 Loaded environment from: ${envPath}`);
        return;
      }
    } catch {
      // ignore
    }
  }

  dotenv.config();
})();

const connectDB = require('../config/db');

async function seedWarehouseDcScenarios() {
  try {
    await connectDB();

    // Pick any existing user to own the DC orders
    let user = await User.findOne();
    if (!user) {
      throw new Error('No user found in database. Please create at least one user first.');
    }

    console.log(`Using user ${user.name} (${user.email}) for created_by/assigned_to`);

    const baseDate = new Date();

    const docs = [
      {
        dc_code: 'DC-TEST-001',
        school_name: 'Test School Fresh',
        contact_person: 'Fresh Contact',
        contact_mobile: '9000000001',
        address: 'Test City 1',
        zone: 'North',
        school_type: 'CBSE',
        products: [
          {
            product_name: 'Abacus Level 1',
            quantity: 120,
            unit_price: 1500,
          },
        ],
        status: 'pending',
        hold: false,
        created_by: user._id,
        assigned_to: user._id,
        createdAt: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        dc_code: 'DC-TEST-002',
        school_name: 'Test School Week Old',
        contact_person: 'Week Contact',
        contact_mobile: '9000000002',
        address: 'Test City 2',
        zone: 'West',
        school_type: 'CBSE',
        products: [
          {
            product_name: 'Vedic Maths Level 1',
            quantity: 80,
            unit_price: 1800,
          },
        ],
        status: 'pending',
        hold: false,
        created_by: user._id,
        assigned_to: user._id,
        createdAt: new Date(baseDate.getTime() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      },
      {
        dc_code: 'DC-TEST-003',
        school_name: 'Test School Fifteen Days',
        contact_person: 'Fifteen Contact',
        contact_mobile: '9000000003',
        address: 'Test City 3',
        zone: 'South',
        school_type: 'CBSE',
        products: [
          {
            product_name: 'Skill Pro',
            quantity: 60,
            unit_price: 2000,
          },
        ],
        status: 'pending',
        hold: false,
        created_by: user._id,
        assigned_to: user._id,
        createdAt: new Date(baseDate.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      },
      {
        dc_code: 'DC-TEST-004',
        school_name: 'Test School On Hold',
        contact_person: 'Hold Contact',
        contact_mobile: '9000000004',
        address: 'Test City 4',
        zone: 'West',
        school_type: 'CBSE',
        products: [
          {
            product_name: 'Financial Literacy',
            quantity: 100,
            unit_price: 2200,
          },
        ],
        status: 'hold',
        hold: true,
        holdReason: 'Payment clarification pending',
        created_by: user._id,
        assigned_to: user._id,
        createdAt: new Date(baseDate.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      },
      {
        dc_code: 'DC-TEST-005',
        school_name: 'Test School Long Pending',
        contact_person: 'Long Pending Contact',
        contact_mobile: '9000000005',
        address: 'Test City 5',
        zone: 'South',
        school_type: 'CBSE',
        products: [
          {
            product_name: 'Codechamp',
            quantity: 150,
            unit_price: 2500,
          },
        ],
        status: 'pending',
        hold: false,
        created_by: user._id,
        assigned_to: user._id,
        createdAt: new Date(baseDate.getTime() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
      },
    ];

    console.log('Inserting DC warehouse test scenarios...');
    await DcOrder.insertMany(docs);
    console.log(`✅ Inserted ${docs.length} DcOrder documents for warehouse DC test cases.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding warehouse DC scenarios:', err.message);
    process.exit(1);
  }
}

seedWarehouseDcScenarios();

