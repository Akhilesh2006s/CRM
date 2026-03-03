const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const Lead = require('../models/Lead');
const User = require('../models/User');
const connectDB = require('../config/db');

// Load .env (same strategy as main seed script)
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
      // Ignore and try next path
    }
  }

  dotenv.config();
})();

const PRODUCTS = [
  'Abacus',
  'Vedic Maths',
  'EEL',
  'IIT',
  'Financial Literacy',
  'Brain Bytes',
  'Spelling Bee',
  'Skill Pro',
  'Maths Lab',
  'Codechamp',
];

const ZONES = ['North', 'South', 'East', 'West', 'Central', 'Northeast', 'Northwest'];
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];
const STATES = ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Tamil Nadu', 'West Bengal', 'Gujarat'];
const PRIORITIES = ['Hot', 'Warm', 'Cold'];

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedFollowupLeadsForVenkat(count = 10) {
  console.log(`\n📞 Seeding ${count} follow-up leads for Venkat...`);

  const venkatEmail = 'venkat@edutech.com';

  // Ensure Venkat user exists (Executive role)
  let venkat = await User.findOne({ email: venkatEmail.toLowerCase() });
  if (!venkat) {
    console.log(`ℹ️  No user found with email ${venkatEmail}. Creating one...`);
    venkat = await User.create({
      name: 'Venkat',
      email: venkatEmail.toLowerCase(),
      password: 'test123', // demo password
      role: 'Executive',
      zone: randomElement(ZONES),
      state: randomElement(STATES),
      city: randomElement(CITIES),
      isActive: true,
    });
    console.log(`✅ Created Executive user Venkat with email ${venkatEmail}`);
  } else {
    console.log(`✅ Found existing user for Venkat (${venkatEmail})`);
  }

  const now = new Date();
  const leads = [];

  for (let i = 0; i < count; i++) {
    const createdDate = randomDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), now);
    // Follow-up dates: some overdue, some upcoming
    const followUpOffsetDays = randomInt(-5, 5); // -5 means 5 days overdue, +5 means in 5 days
    const followUpDate = new Date(now.getTime() + followUpOffsetDays * 24 * 60 * 60 * 1000);

    const products = [
      {
        product_name: randomElement(PRODUCTS),
        quantity: randomInt(1, 5),
        unit_price: randomInt(10000, 50000),
      },
    ];

    leads.push({
      school_name: `Venkat Follow-up School ${i + 1}`,
      contact_person: `Venkat Contact ${i + 1}`,
      contact_mobile: `9${randomInt(100000000, 999999999)}`,
      products,
      location: randomElement(CITIES),
      pincode: randomInt(100000, 999999).toString(),
      state: randomElement(STATES),
      city: randomElement(CITIES),
      zone: venkat.zone || randomElement(ZONES),
      priority: randomElement(PRIORITIES),
      status: 'Pending',
      follow_up_date: followUpDate,
      strength: randomInt(100, 1000),
      createdBy: venkat._id,
      managed_by: venkat._id,
      createdAt: createdDate,
      updatedAt: createdDate,
      remarks: 'Auto-generated follow-up lead for Venkat testing',
    });
  }

  await Lead.insertMany(leads);
  console.log(`✅ Created ${leads.length} follow-up leads for Venkat (${venkatEmail})`);
}

async function run() {
  try {
    await connectDB();
    console.log('✅ Connected to database');
    await seedFollowupLeadsForVenkat(10);
    console.log('🎉 Done seeding Venkat follow-up leads');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding Venkat follow-up leads:', err);
    process.exit(1);
  }
}

run();

