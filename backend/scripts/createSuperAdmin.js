const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const User = require('../models/User');

// Load .env from backend or project root
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

async function run() {
  try {
    await connectDB();
    console.log('✅ Connected to database');

    const email = 'amenityforge@gmail.com';
    const password = 'Amenity';
    const name = 'Super Admin';

    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      console.log(`ℹ️ User with email ${email} already exists. Updating role to Super Admin.`);
      user.role = 'Super Admin';
      if (password) {
        user.password = password; // will be hashed by pre-save hook
      }
      await user.save();
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: 'Super Admin',
      });
      console.log(`✅ Super Admin user created: ${email}`);
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating Super Admin:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();

