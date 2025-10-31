const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    product_name: { type: String, required: true },
    quantity: { type: Number, default: 1, min: 0 },
    unit_price: { type: Number, default: 0, min: 0 },
    expiry_date: { type: Date },
  },
  { _id: false }
);

const dcOrderSchema = new mongoose.Schema(
  {
    dc_code: { type: String, index: true },
    school_name: { type: String, required: true },
    contact_person: { type: String },
    contact_mobile: { type: String },
    contact_person2: { type: String },
    contact_mobile2: { type: String },
    email: { type: String },
    address: { type: String },
    school_type: { type: String },
    branches: { type: Number, default: 0, min: 0 },
    zone: { type: String },
    location: { type: String },
    products: { type: [productSchema], default: [] },
    priority: { type: String, enum: ['Hot', 'Warm', 'Cold'], default: 'Cold' },
    lead_status: { type: String, enum: ['Hot', 'Warm', 'Cold'], default: 'Cold', index: true },
    status: {
      type: String,
      enum: ['saved', 'pending', 'in_transit', 'completed', 'hold'],
      default: 'pending',
      index: true,
    },
    hold: {
      type: Boolean,
      default: false,
    },
    estimated_delivery_date: { type: Date },
    actual_delivery_date: { type: Date },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    follow_up_date: { type: Date },
    remarks: { type: String },
    total_amount: { type: Number, default: 0 },
    pod_proof_url: { type: String },
    completed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

dcOrderSchema.pre('save', function (next) {
  if (!this.dc_code) {
    this.dc_code = `DC-${Date.now().toString().slice(-6)}`;
  }
  next();
});

module.exports = mongoose.model('DcOrder', dcOrderSchema);


