const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const connectDB = require('../config/db');
const User = require('../models/User');
const DcOrder = require('../models/DcOrder');
const StockReturn = require('../models/StockReturn');

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

const DEMO_PASSWORD = 'Demo@123';

async function upsertDemoUser({ name, email, role, empCode }) {
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({
      name,
      email,
      password: DEMO_PASSWORD,
      role,
      empCode,
      isActive: true,
    });
  } else {
    user.name = name;
    user.role = role;
    user.empCode = empCode;
    user.isActive = true;
    user.password = DEMO_PASSWORD;
  }
  await user.save();
  return user;
}

async function nextReturnNumber() {
  const last = await StockReturn.findOne({}, { returnNumber: 1 }).sort({ returnNumber: -1 });
  return Number(last?.returnNumber || 0) + 1;
}

function lineBase() {
  return {
    product: 'Abacus Level 1',
    soldQty: 120,
    returnQty: 12,
    reason: 'Damaged',
    remarks: 'Client demo return',
    unitPrice: 1500,
    calculationType: 'normal',
    divisorUsed: 1,
    lineTotal: 18000,
  };
}

async function run() {
  try {
    await connectDB();

    const executive = await upsertDemoUser({
      name: 'Demo Executive',
      email: 'demo.executive@forge.local',
      role: 'Executive',
      empCode: 'DEMO-EXE-01',
    });

    const warehouseExecutive = await upsertDemoUser({
      name: 'Demo Warehouse Executive',
      email: 'demo.warehouse.executive@forge.local',
      role: 'Warehouse Executive',
      empCode: 'DEMO-WHE-01',
    });

    const warehouseManager = await upsertDemoUser({
      name: 'Demo Warehouse Manager',
      email: 'demo.warehouse.manager@forge.local',
      role: 'Warehouse Manager',
      empCode: 'DEMO-WHM-01',
    });

    const stamp = Date.now().toString().slice(-6);
    const dc = await DcOrder.create({
      dc_code: `DC-RET-DEMO-${stamp}`,
      school_name: 'Returns Demo School',
      school_code: `RDS-${stamp}`,
      contact_person: 'Demo Principal',
      contact_mobile: '9000000100',
      address: 'Demo Address',
      zone: 'North',
      school_type: 'CBSE',
      transport_name: 'Demo Transport Co',
      products: [
        {
          product_name: 'Abacus Level 1',
          quantity: 120,
          unit_price: 1500,
          class: '5',
          term: 'Term 1',
          strength: 120,
          status: 'Warm',
        },
      ],
      strength: 120,
      total_amount: 180000,
      status: 'completed',
      created_by: executive._id,
      assigned_to: executive._id,
      completed_by: executive._id,
      remarks: 'Closed DC for returns workflow demo',
      actual_delivery_date: new Date(),
    });

    const n1 = await nextReturnNumber();
    const now = new Date();

    const pendingManager = await StockReturn.create({
      returnId: `RET-PENDING-${stamp}`,
      returnNumber: n1,
      returnDate: now,
      sourceType: 'Executive',
      createdBy: executive._id,
      executiveId: executive._id,
      executiveName: executive.name,
      customerName: dc.school_name,
      dcOrderId: dc._id,
      remarks: 'Pending manager approval demo',
      executiveRemarks: 'Executive entered return qty 12',
      lrNumber: `LR-P-${stamp}`,
      finYear: '2026-27',
      schoolType: 'CBSE',
      schoolCode: dc.school_code,
      whReturnRemarks: 'Warehouse counted 10 and submitted to manager',
      products: [
        {
          ...lineBase(),
          receivedQty: 10,
          condition: 'Damaged',
          quantityMismatch: true,
          mismatchRemark: 'Requested 12, received 10',
        },
      ],
      totalItems: 1,
      totalQuantity: 12,
      totalReceivedQty: 10,
      returnValue: 18000,
      approvedReturnValue: 0,
      status: 'Pending Manager Approval',
      verifiedBy: warehouseExecutive._id,
      verifiedAt: now,
      submittedToManagerAt: now,
    });

    const n2 = n1 + 1;
    const rejected = await StockReturn.create({
      returnId: `RET-REJECT-${stamp}`,
      returnNumber: n2,
      returnDate: now,
      sourceType: 'Executive',
      createdBy: executive._id,
      executiveId: executive._id,
      executiveName: executive.name,
      customerName: dc.school_name,
      dcOrderId: dc._id,
      remarks: 'Rejected return demo',
      executiveRemarks: 'Return requested due to damaged items',
      lrNumber: `LR-R-${stamp}`,
      finYear: '2026-27',
      schoolType: 'CBSE',
      schoolCode: dc.school_code,
      whReturnRemarks: 'Condition not matching policy',
      products: [
        {
          ...lineBase(),
          receivedQty: 12,
          condition: 'Sellable',
          quantityMismatch: false,
          managerDecision: 'Reject',
          approvedQty: 0,
          stockBucket: undefined,
          managerRemark: 'Item found sellable during review',
        },
      ],
      totalItems: 1,
      totalQuantity: 12,
      totalReceivedQty: 12,
      returnValue: 18000,
      approvedReturnValue: 0,
      status: 'Rejected',
      verifiedBy: warehouseExecutive._id,
      verifiedAt: now,
      submittedToManagerAt: now,
      approvedBy: warehouseManager._id,
      approvedAt: now,
      managerRemarks: 'Rejected as per quality verification',
      rejectionReason: 'Items are sellable; return request not valid',
    });

    const n3 = n2 + 1;
    const approvedPartial = await StockReturn.create({
      returnId: `RET-APPROVE-${stamp}`,
      returnNumber: n3,
      returnDate: now,
      sourceType: 'Executive',
      createdBy: executive._id,
      executiveId: executive._id,
      executiveName: executive.name,
      customerName: dc.school_name,
      dcOrderId: dc._id,
      remarks: 'Partial approval demo',
      executiveRemarks: 'Mixed condition at school',
      lrNumber: `LR-A-${stamp}`,
      finYear: '2026-27',
      schoolType: 'CBSE',
      schoolCode: dc.school_code,
      transport: 'Demo Transport Co',
      whReturnRemarks: 'Warehouse received 11 against 12',
      products: [
        {
          ...lineBase(),
          level: 'L1',
          receivedQty: 11,
          condition: 'Damaged',
          quantityMismatch: true,
          mismatchRemark: 'One item short received',
          managerDecision: 'Partial Approve',
          approvedQty: 9,
          stockBucket: 'Damaged',
          managerRemark: 'Approved physically verified damaged quantity',
        },
      ],
      totalItems: 1,
      totalQuantity: 12,
      totalReceivedQty: 11,
      returnValue: 18000,
      approvedReturnValue: 13500,
      status: 'Stock Updated',
      verifiedBy: warehouseExecutive._id,
      verifiedAt: now,
      submittedToManagerAt: now,
      approvedBy: warehouseManager._id,
      approvedAt: now,
      managerRemarks: 'Partial approved for verified quantity',
      stockUpdatedAt: now,
      stockUpdatedBy: warehouseManager._id,
    });

    console.log('\n=== RETURNS DEMO READY ===');
    console.log(`Executive login: ${executive.email} / ${DEMO_PASSWORD}`);
    console.log(`Warehouse Executive login: ${warehouseExecutive.email} / ${DEMO_PASSWORD}`);
    console.log(`Warehouse Manager login: ${warehouseManager.email} / ${DEMO_PASSWORD}`);
    console.log(`\nDC created: ${dc.dc_code}`);
    console.log(`Pending Manager return: ${pendingManager.returnId} (status: ${pendingManager.status})`);
    console.log(`Rejected return: ${rejected.returnId} (status: ${rejected.status})`);
    console.log(`Approved return: ${approvedPartial.returnId} (status: ${approvedPartial.status})`);
    console.log('\nUse Warehouse Executive dashboard for verify step and Warehouse Manager dashboard for decision step.');

    process.exit(0);
  } catch (error) {
    console.error('Failed to setup returns demo:', error);
    process.exit(1);
  }
}

run();
