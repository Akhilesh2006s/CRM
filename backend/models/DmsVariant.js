const mongoose = require('mongoose');

const dmsVariantSchema = new mongoose.Schema(
  {
    variant_id: { type: String, required: true, unique: true }, // e.g. VAR-CRETA-SX-P
    model: { type: String, required: true },
    variant: { type: String, required: true },
    fuel_type: { type: String },
    transmission: { type: String },
    oem: { type: String },
  },
  {
    timestamps: true,
  }
);

dmsVariantSchema.index({ variant_id: 1 });
dmsVariantSchema.index({ model: 1 });

module.exports = mongoose.model('DmsVariant', dmsVariantSchema);

