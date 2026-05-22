const mongoose = require('mongoose');
const { resolveMongoConnectionString } = require('./resolveMongoUri');

const connectDB = async (retryCount = 0, maxRetries = 3) => {
  const rawUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL;

  if (!rawUri) {
    console.error('❌ MongoDB connection string not found!');
    console.error('   Please set MONGO_URI, MONGODB_URI, or DATABASE_URL in your .env file');
    console.error(
      '   Or set MONGO_URI_STANDARD to the non-SRV string from Atlas → Connect → Drivers',
    );
    process.exit(1);
  }

  try {
    if (retryCount > 0) {
      console.log(`Attempting to connect to MongoDB... (Retry ${retryCount}/${maxRetries})`);
    } else {
      console.log('Attempting to connect to MongoDB...');
    }

    let mongoURI = await resolveMongoConnectionString(rawUri);

    // Block accidental IP literals in SRV strings
    if (mongoURI.includes('mongodb+srv://') && /\d+\.\d+\.\d+\.\d+/.test(mongoURI)) {
      throw new Error('Connection string contains IP addresses. Use SRV or standard Atlas hostnames only.');
    }

    console.log('Connection string:', mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

    if (mongoose.connection.readyState !== 0) {
      console.log('Disconnecting existing MongoDB connection...');
      await mongoose.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const connectionOptions = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true,
    };

    const conn = await mongoose.connect(mongoURI, connectionOptions);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);

    if (/querySrv|ETIMEOUT|ENOTFOUND|timed out/i.test(error.message)) {
      console.error('\n📝 DNS / SRV timeout (Atlas is OK — your PC DNS is the issue):');
      console.error('   1. Run: nslookup -type=SRV _mongodb._tcp.cluster0.eiramxt.mongodb.net');
      console.error('      If that works but Node fails, use a standard URI (see below).');
      console.error('   2. Atlas → Connect → Drivers → copy "Standard connection string"');
      console.error('   3. Paste into .env as MONGO_URI_STANDARD=mongodb://...');
      console.error('   4. Or set Windows DNS to 8.8.8.8 / 1.1.1.1 and retry npm start');
      console.error('   5. Disable VPN / antivirus blocking Node DNS');
    }

    if (/whitelist|access|IP/i.test(error.message)) {
      console.error('\n📝 Atlas Network Access: add your IP (you already have 0.0.0.0/0 — check user/password).');
    }

    if (/authentication|auth failed|bad auth/i.test(error.message)) {
      console.error('\n📝 Check username/password in MONGO_URI (Atlas → Database Access).');
    }

    if (
      /timeout|querySrv|ETIMEOUT/i.test(error.message) &&
      retryCount < maxRetries
    ) {
      const retryDelay = (retryCount + 1) * 2000;
      console.log(`\n🔄 Retrying connection in ${retryDelay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      return connectDB(retryCount + 1, maxRetries);
    }

    if (retryCount >= maxRetries) {
      console.error(`\n❌ Failed to connect after ${maxRetries} retries. Exiting...`);
    }
    process.exit(1);
  }
};

module.exports = connectDB;
