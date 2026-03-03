const mongoose = require('mongoose');

const zoneClusterSchema = new mongoose.Schema(
  {
    zone: {
      type: String,
      required: true,
      trim: true,
    },
    cluster: {
      type: String,
      required: false,
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

// Unique index so we don't get duplicate zone / cluster pairs
zoneClusterSchema.index({ zone: 1, cluster: 1 }, { unique: true });

module.exports = mongoose.model('ZoneCluster', zoneClusterSchema);

