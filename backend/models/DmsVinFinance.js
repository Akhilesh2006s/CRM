const mongoose = require('mongoose');

const dmsVinFinanceSchema = new mongoose.Schema(
  {
    vin: { type: String, required: true, unique: true },
    facility_id: { type: String },
    drawdown_date: { type: Date },
    financed_principal_inr: { type: Number },
    outstanding_principal_inr: { type: Number },
    last_curtailment_date: { type: Date },
    status: { type: String },
  },
  {
    timestamps: true,
  }
);

dmsVinFinanceSchema.index({ vin: 1 });
dmsVinFinanceSchema.index({ facility_id: 1 });

module.exports = mongoose.model('DmsVinFinance', dmsVinFinanceSchema);

