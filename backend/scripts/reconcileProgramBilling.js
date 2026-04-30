const mongoose = require('mongoose');
const connectDB = require('../config/db');
const ProgramBilling = require('../models/ProgramBilling');
const { recomputeProgramPayable } = require('../services/programBillingService');

const reconcile = async () => {
  await connectDB();
  const programs = await ProgramBilling.find({ status: 'active' }).select('_id');
  let success = 0;
  let failed = 0;

  for (const program of programs) {
    try {
      await recomputeProgramPayable(program._id);
      success += 1;
    } catch (error) {
      failed += 1;
      console.error(`Failed to reconcile program ${program._id}: ${error.message}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        totalPrograms: programs.length,
        reconciled: success,
        failed,
      },
      null,
      2
    )
  );
};

reconcile()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Program billing reconciliation failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  });
