const mongoose = require('mongoose');

const clusterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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

clusterSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Cluster', clusterSchema);

