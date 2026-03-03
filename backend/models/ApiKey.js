const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Default API Key'
  },
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  keyPrefix: {
    type: String,
    required: true,
    default: 'cf_live'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: null // null means never expires
  },
  permissions: {
    type: [String],
    default: ['read', 'write'], // read, write, webhook
    enum: ['read', 'write', 'webhook', 'admin']
  },
  rateLimit: {
    requests: {
      type: Number,
      default: 1000 // requests per hour
    },
    window: {
      type: Number,
      default: 3600000 // 1 hour in milliseconds
    }
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Generate API key
apiKeySchema.statics.generate = function(prefix = 'cf_live') {
  const randomBytes = crypto.randomBytes(32);
  const key = `${prefix}_${randomBytes.toString('hex')}`;
  return key;
};

// Find active key
apiKeySchema.statics.findActive = function(key) {
  return this.findOne({ 
    key, 
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Update last used timestamp
apiKeySchema.methods.updateLastUsed = function() {
  this.lastUsed = new Date();
  return this.save();
};

module.exports = mongoose.model('ApiKey', apiKeySchema);
