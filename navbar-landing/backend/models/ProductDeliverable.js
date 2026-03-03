const mongoose = require('mongoose');

const productDeliverableSchema = new mongoose.Schema(
  {
    deliverableName: {
      type: String,
      required: true,
      trim: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: no duplicate deliverable names per product
productDeliverableSchema.index({ product: 1, deliverableName: 1 }, { unique: true });

module.exports = mongoose.model('ProductDeliverable', productDeliverableSchema);
