const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nameLower: {
      type: String,
      trim: true,
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

zoneSchema.index({ nameLower: 1 }, { unique: true, sparse: true });
zoneSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Zone', zoneSchema);

