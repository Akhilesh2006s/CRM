const mongoose = require('mongoose');

const franchiseSchoolSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DcOrder',
    required: true,
  },
  schoolName: {
    type: String,
    required: true,
  },
  schoolCode: {
    type: String,
    default: '',
  },
}, { _id: true });

const franchiseSchema = new mongoose.Schema({
  franchiseName: {
    type: String,
    required: true,
  },
  franchiseEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  franchiseCost: {
    type: Number,
    required: true,
    min: 0,
  },
  zones: [{
    type: String,
    required: true,
  }],
  schools: [franchiseSchoolSchema],
}, { _id: true });

const productCostSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  defaultCost: {
    type: Number,
    required: true,
    min: 0,
  },
  franchises: [franchiseSchema],
}, { _id: true });

const partnerCostSchema = new mongoose.Schema({
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  products: [productCostSchema],
}, {
  timestamps: true,
});

// Ensure one cost record per partner
partnerCostSchema.index({ partnerId: 1 }, { unique: true });

module.exports = mongoose.model('PartnerCost', partnerCostSchema);
