const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const DcOrder = require('../models/DcOrder');
const StockReturn = require('../models/StockReturn');
const User = require('../models/User');
const connectDB = require('../config/db');

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
        console.log(`Loaded env from ${envPath}`);
        return;
      }
    } catch (_err) {
      // ignore
    }
  }
  dotenv.config();
})();

async function pickUser(role, fallbackLabel) {
  let user = await User.findOne({ role, isActive: true });
  if (!user) user = await User.findOne({ role });
  if (!user) user = await User.findOne();
  if (!user) {
    throw new Error(`No users found for ${fallbackLabel}. Create at least one user first.`);
  }
  return user;
}

async function nextReturnNumber() {
  const last = await StockReturn.findOne({}, { returnNumber: 1 }).sort({ returnNumber: -1 });
  const n = Number(last?.returnNumber || 0);
  return Number.isFinite(n) ? n + 1 : 1;
}

async function run() {
  try {
    await connectDB();

    const executive = await pickUser('Executive', 'Executive');
    const whExecutive = await pickUser('Warehouse Executive', 'Warehouse Executive');
    const whManager = await pickUser('Warehouse Manager', 'Warehouse Manager');

    const stamp = Date.now().toString().slice(-6);
    const dcCode = `DC-DEMO-${stamp}`;
    const productName = 'Abacus Level 1';

    const dc = await DcOrder.create({
      dc_code: dcCode,
      school_name: 'Client Demo School',
      school_code: `CDS-${stamp}`,
      contact_person: 'Demo Principal',
      contact_mobile: '9000000099',
      address: 'Demo City, Demo State',
      zone: 'North',
      school_type: 'CBSE',
      products: [
        {
          product_name: productName,
          quantity: 100,
          unit_price: 1500,
          class: '5',
          term: 'Term 1',
          strength: 100,
          status: 'Warm',
        },
      ],
      strength: 100,
      total_amount: 150000,
      status: 'completed',
      created_by: executive._id,
      assigned_to: executive._id,
      completed_by: executive._id,
      remarks: 'Demo DC closed for return workflow showcase',
      actual_delivery_date: new Date(),
    });

    const returnNumber = await nextReturnNumber();
    const now = new Date();
    const receivedQty = 8;
    const requestedQty = 10;
    const approvedQty = 6;

    const stockReturn = await StockReturn.create({
      returnId: `RET-DEMO-${stamp}`,
      returnNumber,
      returnDate: now,
      sourceType: 'Executive',
      createdBy: executive._id,
      executiveId: executive._id,
      executiveName: executive.name,
      customerName: dc.school_name,
      dcOrderId: dc._id,
      remarks: 'Demo return raised by executive',
      executiveRemarks: 'Two books damaged at school, return initiated for demo',
      lrNumber: `LR-${stamp}`,
      finYear: '2026-27',
      schoolType: dc.school_type || '',
      schoolCode: dc.school_code || '',
      whReturnRemarks: 'Received less than requested for demo comparison',
      products: [
        {
          product: productName,
          soldQty: 100,
          returnQty: requestedQty,
          reason: 'Damaged',
          remarks: 'Damaged during handling',
          receivedQty,
          condition: 'Damaged',
          quantityMismatch: true,
          mismatchRemark: 'Warehouse counted 8, executive submitted 10',
          managerDecision: 'Partial Approve',
          approvedQty,
          stockBucket: 'Damaged',
          managerRemark: 'Approved only physically received usable damaged qty for audit',
          unitPrice: 1500,
          calculationType: 'normal',
          divisorUsed: 1,
          lineTotal: requestedQty * 1500,
        },
      ],
      totalItems: 1,
      totalQuantity: requestedQty,
      totalReceivedQty: receivedQty,
      returnValue: requestedQty * 1500,
      approvedReturnValue: approvedQty * 1500,
      status: 'Stock Updated',
      verifiedBy: whExecutive._id,
      verifiedAt: now,
      submittedToManagerAt: now,
      approvedBy: whManager._id,
      approvedAt: now,
      managerRemarks: 'Partial approved for client demo',
      rejectionReason: '',
      stockUpdatedAt: now,
      stockUpdatedBy: whManager._id,
    });

    console.log('Demo data created successfully');
    console.log(`DC: ${dc.dc_code} (${dc._id})`);
    console.log(`Return: ${stockReturn.returnId} / #${stockReturn.returnNumber} (${stockReturn._id})`);
    console.log(`Executive: ${executive.name}`);
    console.log(`Warehouse Executive: ${whExecutive.name}`);
    console.log(`Warehouse Manager: ${whManager.name}`);

    process.exit(0);
  } catch (error) {
    console.error('Failed to seed demo return flow:', error.message);
    process.exit(1);
  }
}

run();
