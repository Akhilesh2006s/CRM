const mongoose = require('mongoose');

const changeLogSchema = new mongoose.Schema(
  {
    entityType: { type: String, required: true, index: true, trim: true },
    entityId: { type: mongoose.Schema.Types.Mixed, index: true },
    action: {
      type: String,
      enum: ['create', 'update', 'delete'],
      default: 'update',
      index: true,
    },
    summary: { type: String, trim: true, default: '' },
    fields: { type: [String], default: [] },
    actorName: { type: String, trim: true, default: '' },
    actorEmail: { type: String, trim: true, default: '' },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

changeLogSchema.index({ createdAt: -1 });
changeLogSchema.index({ entityType: 1, createdAt: -1 });

module.exports = mongoose.model('ChangeLog', changeLogSchema);
