const mongoose = require('mongoose');

/**
 * Lightweight sales collateral (demo videos, PPTs, brochures) for field reps.
 */
const collateralSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['video', 'ppt', 'brochure', 'link', 'other'],
      default: 'link',
    },
    url: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    product: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Collateral', collateralSchema);
