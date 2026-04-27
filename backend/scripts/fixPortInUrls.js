/**
 * One-time migration: rewrite stored http://localhost:5000 URLs to http://localhost:5001
 * in all MongoDB documents (macOS AirPlay uses 5000; CRM API defaults to 5001).
 *
 * Usage: cd backend && node scripts/fixPortInUrls.js
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL;

if (MONGO_URI) {
  MONGO_URI = MONGO_URI.trim();
  // Common typo breaks mongoose: "mmongodb+srv://..."
  if (MONGO_URI.startsWith("mmongodb")) {
    console.warn("⚠️  Fixing typo in connection string: mmongodb → mongodb");
    MONGO_URI = MONGO_URI.replace(/^mmongodb/, "mongodb");
  }
}

async function fixUrls() {
  if (!MONGO_URI) {
    console.error('Set MONGO_URI, MONGODB_URI, or DATABASE_URL in backend/.env');
    process.exit(1);
  }
  if (!/^mongodb(\+srv)?:\/\//i.test(MONGO_URI)) {
    console.error(
      "Invalid connection string: must start with mongodb:// or mongodb+srv:// (check backend/.env for typos)"
    );
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  let totalFixed = 0;

  for (const { name } of collections) {
    if (name.startsWith('system.')) continue;

    const col = db.collection(name);
    const docs = await col.find({}).toArray();

    for (const doc of docs) {
      const fixed = fixObj(doc);
      if (JSON.stringify(fixed) !== JSON.stringify(doc)) {
        await col.replaceOne({ _id: doc._id }, fixed);
        console.log(`Fixed doc ${doc._id} in ${name}`);
        totalFixed++;
      }
    }
  }

  console.log(`Done. Updated ${totalFixed} document(s).`);
  await mongoose.disconnect();
}

function fixObj(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return obj
      .replace(/http:\/\/localhost:5000/g, 'http://localhost:5001')
      .replace(/http:\/\/127\.0\.0\.1:5000/g, 'http://127.0.0.1:5001');
  }
  if (Buffer.isBuffer(obj)) return obj;
  if (obj instanceof Date) return obj;
  if (obj instanceof mongoose.Types.ObjectId) return obj;
  // Do not recurse BSON types (ObjectId, Long, Decimal128, etc.) — breaks replaceOne _id
  if (typeof obj === 'object' && obj._bsontype) return obj;
  if (Array.isArray(obj)) return obj.map(fixObj);
  if (typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) {
      out[k] = fixObj(obj[k]);
    }
    return out;
  }
  return obj;
}

fixUrls().catch((err) => {
  console.error(err);
  process.exit(1);
});
