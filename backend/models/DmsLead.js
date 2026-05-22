const mongoose = require('mongoose');

const dmsLeadSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    phone: { type: String, required: true },
    preferred_variant_id: { type: String },
    preferred_mode: { type: String }, // e.g. Creta / Venue / etc.
    budget_inr: { type: Number },
    branch_preference_id: { type: String },
    lead_status: { type: String }, // Contacted / Qualified / New / etc.
    lead_source: { type: String }, // WhatsApp / Referral / etc.
    created_date: { type: Date },
    last_contacted_date: { type: Date },
    next_followup_date: { type: Date },
  },
  {
    timestamps: true,
  }
);

dmsLeadSchema.index({ phone: 1 });
dmsLeadSchema.index({ lead_status: 1 });
dmsLeadSchema.index({ branch_preference_id: 1 });

module.exports = mongoose.model('DmsLead', dmsLeadSchema);

