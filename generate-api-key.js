#!/usr/bin/env node

/**
 * Script to generate an API key for CRM-FORGE
 * 
 * Usage:
 *   node generate-api-key.js
 * 
 * Or with environment variables:
 *   API_BASE_URL=https://crm-backend-production-fc85.up.railway.app/api \
 *   EMAIL=admin@example.com \
 *   PASSWORD=yourpassword \
 *   node generate-api-key.js
 */

const https = require('https');
const http = require('http');
const readline = require('readline');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://crm-backend-production-fc85.up.railway.app/api';
const API_KEY_NAME = process.env.API_KEY_NAME || 'rnxa.ai Integration';
const EXPIRES_IN_DAYS = process.env.EXPIRES_IN_DAYS || 365;
const PERMISSIONS = process.env.PERMISSIONS ? process.env.PERMISSIONS.split(',') : ['read', 'write', 'webhook'];

// Helper function to make HTTP requests
function makeRequest(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Login function
async function login(email, password) {
  console.log('\n🔐 Logging in...');
  const response = await makeRequest(`${API_BASE_URL}/auth/login`, {
    method: 'POST'
  }, {
    email,
    password
  });

  if (response.status === 200 && response.data.token) {
    console.log('✅ Login successful!');
    return response.data.token;
  } else {
    throw new Error(`Login failed: ${response.data.message || JSON.stringify(response.data)}`);
  }
}

// Generate API key function
async function generateApiKey(token, name, expiresInDays, permissions) {
  console.log('\n🔑 Generating API key...');
  
  // Try the standard endpoint first
  let response = await makeRequest(`${API_BASE_URL}/api-keys`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }, {
    name,
    expiresInDays: parseInt(expiresInDays),
    permissions
  });

  // If 404, the route might not be deployed - check for HTML error page
  if (response.status === 404 || (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>'))) {
    console.log('⚠️  API key endpoint not found on production server.');
    console.log('   This route may not be deployed yet.');
    console.log('\n💡 Solutions:');
    console.log('   1. Deploy the latest backend code to production');
    console.log('   2. Run the backend locally and use: http://localhost:5001/api');
    console.log('   3. Use generate-api-key-direct.js (requires database access)');
    throw new Error('API key endpoint not available on production server. Please deploy the latest code or use an alternative method.');
  }

  if (response.status === 201 && response.data.success) {
    return response.data.apiKey;
  } else if (response.status === 403) {
    throw new Error('Access denied. You need Admin or Super Admin role to generate API keys.');
  } else if (response.status === 401) {
    throw new Error('Authentication failed. Please check your credentials.');
  } else {
    throw new Error(`API key generation failed: ${response.data.message || JSON.stringify(response.data)}`);
  }
}

// Main function
async function main() {
  console.log('='.repeat(60));
  console.log('CRM-FORGE API Key Generator');
  console.log('='.repeat(60));
  console.log(`\nAPI Base URL: ${API_BASE_URL}`);
  console.log(`API Key Name: ${API_KEY_NAME}`);
  console.log(`Expires In: ${EXPIRES_IN_DAYS} days`);
  console.log(`Permissions: ${PERMISSIONS.join(', ')}`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  try {
    // Get credentials
    let email = process.env.EMAIL;
    let password = process.env.PASSWORD;

    if (!email) {
      email = await question('\n📧 Enter your email: ');
    }
    if (!password) {
      password = await question('🔒 Enter your password: ');
      // Hide password input
      process.stdout.write('\x1B[1A\x1B[2K');
      process.stdout.write('🔒 Enter your password: ********\n');
    }

    rl.close();

    // Login
    const token = await login(email, password);

    // Generate API key
    const apiKey = await generateApiKey(token, API_KEY_NAME, EXPIRES_IN_DAYS, PERMISSIONS);

    // Display results
    console.log('\n' + '='.repeat(60));
    console.log('✅ API KEY GENERATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📋 API Key Details:');
    console.log(`   Name: ${apiKey.name}`);
    console.log(`   Key: ${apiKey.key}`);
    console.log(`   Prefix: ${apiKey.keyPrefix}`);
    console.log(`   Permissions: ${apiKey.permissions.join(', ')}`);
    console.log(`   Expires At: ${apiKey.expiresAt || 'Never'}`);
    console.log(`   Created At: ${apiKey.createdAt}`);
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  IMPORTANT: Save this API key now!');
    console.log('   You will not be able to see it again.');
    console.log('='.repeat(60));
    console.log('\n📝 Use this API key in your requests:');
    console.log(`   Authorization: Bearer ${apiKey.key}`);
    console.log(`   OR`);
    console.log(`   X-API-Key: ${apiKey.key}`);
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { login, generateApiKey };
