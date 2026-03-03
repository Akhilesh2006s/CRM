#!/usr/bin/env node

/**
 * Direct API Key Generator - Creates API key directly in database
 * This bypasses the API endpoint and creates the key directly
 * 
 * Usage (from backend directory):
 *   node generate-api-key.js
 * 
 * Or with environment variables:
 *   EMAIL=amenityforge@gmail.com node generate-api-key.js
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import the ApiKey model
const ApiKey = require('./models/ApiKey');
const User = require('./models/User');

// Configuration
const API_KEY_NAME = process.env.API_KEY_NAME || 'rnxa.ai Integration';
const EXPIRES_IN_DAYS = process.env.EXPIRES_IN_DAYS || 365;
const PERMISSIONS = process.env.PERMISSIONS ? process.env.PERMISSIONS.split(',') : ['read', 'write', 'webhook'];
const USER_EMAIL = process.env.EMAIL || null;

async function generateApiKeyDirect() {
  try {
    console.log('='.repeat(60));
    console.log('CRM-FORGE Direct API Key Generator');
    console.log('='.repeat(60));

    // Connect to database
    console.log('\n📡 Connecting to database...');
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI environment variable is required in .env file');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // Find user (Admin or Super Admin)
    let user;
    if (USER_EMAIL) {
      user = await User.findOne({ email: USER_EMAIL });
      if (!user) {
        throw new Error(`User with email ${USER_EMAIL} not found`);
      }
      if (user.role !== 'Admin' && user.role !== 'Super Admin') {
        throw new Error(`User ${USER_EMAIL} does not have Admin or Super Admin role`);
      }
    } else {
      // Find first Admin or Super Admin
      user = await User.findOne({ 
        role: { $in: ['Admin', 'Super Admin'] } 
      });
      if (!user) {
        throw new Error('No Admin or Super Admin user found in database');
      }
    }

    console.log(`✅ Found user: ${user.name} (${user.email}) - Role: ${user.role}`);

    // Generate API key
    console.log('\n🔑 Generating API key...');
    const keyPrefix = 'cf_live';
    const randomBytes = crypto.randomBytes(32);
    const key = `${keyPrefix}_${randomBytes.toString('hex')}`;

    // Calculate expiration date
    let expiresAt = null;
    if (EXPIRES_IN_DAYS && EXPIRES_IN_DAYS > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(EXPIRES_IN_DAYS));
    }

    // Create API key document
    const apiKey = await ApiKey.create({
      name: API_KEY_NAME,
      key,
      keyPrefix,
      createdBy: user._id,
      tenantId: user._id.toString(),
      expiresAt,
      permissions: PERMISSIONS
    });

    console.log('✅ API key created in database');

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('✅ API KEY GENERATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📋 API Key Details:');
    console.log(`   ID: ${apiKey._id}`);
    console.log(`   Name: ${apiKey.name}`);
    console.log(`   Key: ${apiKey.key}`);
    console.log(`   Prefix: ${apiKey.keyPrefix}`);
    console.log(`   Permissions: ${apiKey.permissions.join(', ')}`);
    console.log(`   Expires At: ${apiKey.expiresAt || 'Never'}`);
    console.log(`   Created At: ${apiKey.createdAt}`);
    console.log(`   Created By: ${user.name} (${user.email})`);
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  IMPORTANT: Save this API key now!');
    console.log('   You will not be able to see it again.');
    console.log('='.repeat(60));
    console.log('\n📝 Use this API key in your requests:');
    console.log(`   Authorization: Bearer ${apiKey.key}`);
    console.log(`   OR`);
    console.log(`   X-API-Key: ${apiKey.key}`);
    console.log('\n📋 For rnxa.ai connection:');
    console.log(`   Provider Name: CRM-FORGE`);
    console.log(`   Base URL: https://crm-backend-production-fc85.up.railway.app/api`);
    console.log(`   Authentication Type: API Key`);
    console.log(`   API Key: ${apiKey.key}`);
    console.log('\n');

    // Close database connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  generateApiKeyDirect().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { generateApiKeyDirect };
