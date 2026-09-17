const mongoose = require('mongoose');

/**
 * A single GPS sample from a field employee's device.
 *
 * The mobile app posts these on an interval while the rep is on duty. They are
 * the data source for:
 *   - the Employee Tracking report (started / last used / last location)
 *   - day route replay on a map
 *   - the GPS distance figure shown next to travel expense claims
 *
 * High-volume collection: kept deliberately small, and expired automatically.
 */
const locationPingSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number },
    speed: { type: Number },
    batteryLevel: { type: Number },
    /** Device-reported timestamp (may lag the server when queued offline). */
    recordedAt: { type: Date, required: true, default: Date.now, index: true },
    /** Set when the ping was queued offline and flushed later. */
    isOffline: { type: Boolean, default: false },
    source: { type: String, enum: ['background', 'foreground', 'manual'], default: 'background' },
  },
  { timestamps: true }
);

// Primary query: one employee's pings for a day, in order.
locationPingSchema.index({ employeeId: 1, recordedAt: -1 });

/**
 * Retention: drop pings after 180 days so the collection cannot grow forever.
 * Adjust to match the client's data-retention policy.
 */
locationPingSchema.index({ recordedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

module.exports = mongoose.model('LocationPing', locationPingSchema);
