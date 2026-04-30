const mongoose = require('mongoose');
const ProgramBilling = require('../models/ProgramBilling');
const ProgramLevelDelivery = require('../models/ProgramLevelDelivery');
const ProgramBillingLedger = require('../models/ProgramBillingLedger');
const Payment = require('../models/Payment');
const DcOrder = require('../models/DcOrder');

const roundToTwo = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const computeCumulativePayable = ({ deliveredStudents, unitPrice, totalLevels }) =>
  roundToTwo((Number(deliveredStudents || 0) * Number(unitPrice || 0)) / Math.max(1, Number(totalLevels || 1)));

const sumDeliveredStudents = async (programId) => {
  const rows = await ProgramLevelDelivery.find({ programId }).select('studentsCount').lean();
  return rows.reduce((sum, row) => sum + (Number(row.studentsCount) || 0), 0);
};

const upsertPendingProgramPayable = async ({
  program,
  nextPayable,
  sourceDcId,
  session,
}) => {
  const dcOrder = await DcOrder.findById(program.dcOrderId).lean();
  const customerName = dcOrder?.school_name || 'Unknown Customer';
  const schoolCode = dcOrder?.school_code || dcOrder?.dc_code || '';
  const contactName = dcOrder?.contact_person || '';
  const mobileNumber = dcOrder?.contact_mobile || '';
  const location = dcOrder?.location || dcOrder?.area || '';
  const zone = dcOrder?.zone || '';

  const pendingFilter = {
    programId: program._id,
    autoCreated: true,
    adjustmentType: 'none',
    status: 'Pending',
  };

  const existingPending = await Payment.findOne(pendingFilter).session(session);

  if (existingPending) {
    existingPending.amount = nextPayable;
    existingPending.paymentDate = new Date();
    existingPending.description = `Program billing recomputed for ${program.product}`;
    existingPending.dcId = sourceDcId || existingPending.dcId;
    await existingPending.save({ session });
    return existingPending;
  }

  const created = await Payment.create(
    [
      {
        programId: program._id,
        dcId: sourceDcId || undefined,
        customerName,
        schoolCode,
        contactName,
        mobileNumber,
        location,
        zone,
        amount: nextPayable,
        paymentMethod: 'Other',
        paymentDate: new Date(),
        status: 'Pending',
        description: `Auto-generated payable for program ${program.product}`,
        autoCreated: true,
        adjustmentType: 'none',
        createdBy: dcOrder?.created_by || undefined,
      },
    ],
    { session }
  );

  return created[0];
};

const createCreditNote = async ({
  program,
  previousPayable,
  newPayable,
  sourceDcId,
  session,
}) => {
  const diff = roundToTwo(previousPayable - newPayable);
  if (diff <= 0) return null;

  const dcOrder = await DcOrder.findById(program.dcOrderId).lean();
  const customerName = dcOrder?.school_name || 'Unknown Customer';
  const schoolCode = dcOrder?.school_code || dcOrder?.dc_code || '';
  const contactName = dcOrder?.contact_person || '';
  const mobileNumber = dcOrder?.contact_mobile || '';
  const location = dcOrder?.location || dcOrder?.area || '';
  const zone = dcOrder?.zone || '';

  const latestNormalPayment = await Payment.findOne({
    programId: program._id,
    autoCreated: true,
    adjustmentType: 'none',
  })
    .sort({ createdAt: -1 })
    .session(session);

  const note = await Payment.create(
    [
      {
        programId: program._id,
        dcId: sourceDcId || undefined,
        customerName,
        schoolCode,
        contactName,
        mobileNumber,
        location,
        zone,
        amount: diff,
        paymentMethod: 'Other',
        paymentDate: new Date(),
        status: 'Pending',
        description: `Credit note: cumulative program recalculation reduced payable by ${diff.toFixed(2)}`,
        autoCreated: true,
        adjustmentType: 'credit_note',
        adjustmentForPaymentId: latestNormalPayment?._id,
        adjustmentReason: 'Program cumulative payable reduced after level delivery update',
        createdBy: dcOrder?.created_by || undefined,
      },
    ],
    { session }
  );

  return note[0];
};

const recordLevelDelivery = async ({
  programId,
  levelNumber,
  studentsCount,
  dcId,
  deliveredAt,
  session,
}) => {
  const payload = {
    studentsCount: Math.max(0, Number(studentsCount) || 0),
    dcId,
    deliveredAt: deliveredAt ? new Date(deliveredAt) : new Date(),
  };

  return ProgramLevelDelivery.findOneAndUpdate(
    { programId, levelNumber },
    { $set: payload, $setOnInsert: { programId, levelNumber } },
    {
      new: true,
      upsert: true,
      session,
      runValidators: true,
    }
  );
};

const recomputeProgramPayable = async (programId, options = {}) => {
  const sourceDcId = options.sourceDcId || null;
  const externalSession = options.session || null;
  const ownsSession = !externalSession;
  const session = externalSession || (await mongoose.startSession());

  const execute = async () => {
    const program = await ProgramBilling.findById(programId).session(session);
    if (!program) {
      throw new Error('ProgramBilling not found');
    }

    const previousPayable = roundToTwo(program.lastComputedPayable || 0);
    const deliveredStudents = await sumDeliveredStudents(program._id);
    const recomputed = computeCumulativePayable({
      deliveredStudents,
      unitPrice: program.unitPrice,
      totalLevels: program.totalLevels,
    });

    const paymentDoc = await upsertPendingProgramPayable({
      program,
      nextPayable: recomputed,
      sourceDcId,
      session,
    });

    let creditNote = null;
    if (recomputed < previousPayable) {
      creditNote = await createCreditNote({
        program,
        previousPayable,
        newPayable: recomputed,
        sourceDcId,
        session,
      });
    }

    program.lastComputedPayable = recomputed;
    program.lastComputedAt = new Date();
    await program.save({ session });

    await ProgramBillingLedger.create(
      [
        {
          programId: program._id,
          sourceDcId: sourceDcId || undefined,
          eventType: 'RECOMPUTE',
          previousPayable,
          newPayable: recomputed,
          delta: roundToTwo(recomputed - previousPayable),
          metadata: {
            deliveredStudents,
            totalLevels: program.totalLevels,
            unitPrice: program.unitPrice,
            paymentId: paymentDoc?._id,
          },
        },
        {
          programId: program._id,
          sourceDcId: sourceDcId || undefined,
          eventType: recomputed < previousPayable ? 'CREDIT_NOTE' : 'PAYABLE_UPSERT',
          previousPayable,
          newPayable: recomputed,
          delta: roundToTwo(recomputed - previousPayable),
          metadata: {
            paymentId: paymentDoc?._id,
            creditNoteId: creditNote?._id,
          },
        },
      ],
      { session }
    );

    return {
      programId: String(program._id),
      previousPayable,
      newPayable: recomputed,
      deliveredStudents,
      totalLevels: program.totalLevels,
      paymentId: paymentDoc?._id ? String(paymentDoc._id) : null,
      creditNoteId: creditNote?._id ? String(creditNote._id) : null,
    };
  };

  try {
    if (ownsSession) {
      let result;
      await session.withTransaction(async () => {
        result = await execute();
      });
      return result;
    }
    return execute();
  } finally {
    if (ownsSession) {
      session.endSession();
    }
  }
};

module.exports = {
  roundToTwo,
  computeCumulativePayable,
  recordLevelDelivery,
  recomputeProgramPayable,
};
