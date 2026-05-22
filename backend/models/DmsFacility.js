const mongoose = require('mongoose');

const dmsFacilitySchema = new mongoose.Schema(
  {
    facility_id: { type: String, required: true, unique: true },
    dealer_group_id: { type: String },
    branch_id: { type: String },
    oem: { type: String },
    lender_name: { type: String },
    interest_rate_apr: { type: Number },
    interest_method: { type: String }, // SimpleDaily, etc.
    day_count_basis: { type: Number },
    grace_days: { type: Number },
    funding_cap_pct: { type: Number },
    funding_cap_amount_inr: { type: Number },
    start_date: { type: Date },
    end_date: { type: Date },
    is_active: { type: String }, // Y/N
  },
  {
    timestamps: true,
  }
);

dmsFacilitySchema.index({ facility_id: 1 });
dmsFacilitySchema.index({ branch_id: 1 });

module.exports = mongoose.model('DmsFacility', dmsFacilitySchema);

