const mongoose = require('mongoose');
const connectDB = require('../config/db');
const DC = require('../models/DC');
const DcOrder = require('../models/DcOrder');
const ProgramBilling = require('../models/ProgramBilling');
const { recordLevelDelivery, recomputeProgramPayable, roundToTwo } = require('../services/programBillingService');

const getLevelNumber = (dc) => {
  if (Number.isFinite(Number(dc.levelNumber)) && Number(dc.levelNumber) > 0) return Number(dc.levelNumber);
  const terms = (dc.productDetails || []).map((row) => String(row.term || '').trim().toLowerCase());
  if (terms.includes('term 2')) return 2;
  if (terms.includes('term 3')) return 3;
  return 1;
};

const getDeliveredStudents = (dc) =>
  (dc.productDetails || []).reduce((sum, row) => {
    const delivered = Number(row.deliveredQuantity);
    return Number.isFinite(delivered) && delivered >= 0 ? sum + delivered : sum;
  }, 0);

const getUnitPrice = async (dcOrderId, dc) => {
  const detailPrice = (dc.productDetails || [])
    .map((row) => Number(row.price))
    .find((value) => Number.isFinite(value) && value >= 0);
  if (detailPrice !== undefined) return detailPrice;
  const order = await DcOrder.findById(dcOrderId).select('products').lean();
  return Number(order?.products?.[0]?.unit_price) || 0;
};

const getTotalLevels = (dcs) => {
  const levels = new Set();
  dcs.forEach((dc) => levels.add(getLevelNumber(dc)));
  return Math.max(1, levels.size);
};

const run = async () => {
  await connectDB();

  const completedAbacus = await DC.find({
    status: 'completed',
    product: /abacus/i,
    dcOrderId: { $exists: true, $ne: null },
  }).lean();

  const groupedByOrder = new Map();
  completedAbacus.forEach((dc) => {
    const key = String(dc.dcOrderId);
    if (!groupedByOrder.has(key)) groupedByOrder.set(key, []);
    groupedByOrder.get(key).push(dc);
  });

  for (const [dcOrderId, dcs] of groupedByOrder.entries()) {
    const sampleDc = dcs[0];
    const totalLevels = getTotalLevels(dcs);
    const unitPrice = await getUnitPrice(dcOrderId, sampleDc);
    let program = await ProgramBilling.findOne({ dcOrderId, product: sampleDc.product });
    if (!program) {
      program = await ProgramBilling.create({
        dcOrderId,
        product: sampleDc.product,
        totalLevels,
        unitPrice: roundToTwo(unitPrice),
        currency: 'INR',
      });
    }

    for (const dc of dcs) {
      await recordLevelDelivery({
        programId: program._id,
        levelNumber: getLevelNumber(dc),
        studentsCount: getDeliveredStudents(dc),
        dcId: dc._id,
        deliveredAt: dc.completedAt || dc.updatedAt || new Date(),
      });
      await recomputeProgramPayable(program._id, { sourceDcId: dc._id });
    }
  }
};

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Program billing backfill failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  });
