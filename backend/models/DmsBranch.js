const mongoose = require('mongoose');

const dmsBranchSchema = new mongoose.Schema(
  {
    branch_id: { type: String, required: true, unique: true }, // BR-HYD-HN
    branch_name: { type: String, required: true },
    city: { type: String },
    state: { type: String },
    oem: { type: String },
  },
  {
    timestamps: true,
  }
);

dmsBranchSchema.index({ branch_id: 1 });
dmsBranchSchema.index({ city: 1 });

module.exports = mongoose.model('DmsBranch', dmsBranchSchema);

