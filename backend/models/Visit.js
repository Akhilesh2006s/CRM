const mongoose = require('mongoose');
const { VISIT_CATEGORIES, VISIT_OUTCOMES } = require('../constants/visitCategories');

/**
 * A field visit to a school.
 *
 * This is the missing link between "a rep is in the field" and "a lead moved
 * forward": it is school-linked, GPS-stamped, and can schedule both the next
 * visit and a training. It is the data source for the Sales Visit report.
 *
 * A visit may point at a Lead (prospect) and/or a DcOrder (existing client);
 * school details are snapshotted so the report stays filterable and fast.
 */
const visitSchema = new mongoose.Schema(
  {
    // --- What was visited (either/both) ---
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      index: true,
    },
    dcOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DcOrder',
      index: true,
    },

    // --- Snapshot of the school (denormalised for reporting/filters) ---
    schoolName: { type: String, required: true, trim: true, index: true },
    schoolCode: { type: String, trim: true, index: true },
    contactMobile: { type: String, trim: true },
    zone: { type: String, trim: true, index: true },
    cluster: { type: String, trim: true },
    town: { type: String, trim: true },
    state: { type: String, trim: true },

    // --- Who visited ---
    executiveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // --- The visit itself ---
    visitDate: { type: Date, required: true, default: Date.now, index: true },
    category: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v) => VISIT_CATEGORIES.includes(v),
        message: (p) => `${p.value} is not a valid visit category`,
      },
    },
    outcome: { type: String, enum: VISIT_OUTCOMES },
    remarks: { type: String, trim: true, default: '' },

    // --- Where (GPS stamp, captured by the mobile app) ---
    latitude: { type: Number },
    longitude: { type: Number },
    locationAccuracy: { type: Number },

    // --- Proof ---
    photo: { type: String }, // URL or data URI

    // --- What it schedules ---
    nextVisitDate: { type: Date, index: true },
    trainingDate: { type: Date },
    trainingRequested: { type: Boolean, default: false },

    // Products discussed on this visit
    products: [{ type: String, trim: true }],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Report/query paths
visitSchema.index({ visitDate: -1 });
visitSchema.index({ executiveId: 1, visitDate: -1 });
visitSchema.index({ zone: 1, visitDate: -1 });

/** True when the rep actually captured coordinates. */
visitSchema.virtual('hasLocation').get(function () {
  return typeof this.latitude === 'number' && typeof this.longitude === 'number';
});

visitSchema.set('toJSON', { virtuals: true });
visitSchema.set('toObject', { virtuals: true });

try {
  require('../utils/changeLogPlugin').attachChangeLog(visitSchema, 'Visit');
} catch (_) {}

module.exports = mongoose.model('Visit', visitSchema);
