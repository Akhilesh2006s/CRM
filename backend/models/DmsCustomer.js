const mongoose = require('mongoose');

const dmsCustomerSchema = new mongoose.Schema(
  {
    customer_id: { type: String, required: true, unique: true }, // CUST-0001
    full_name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    city: { type: String },
    locality: { type: String },
  },
  {
    timestamps: true,
  }
);

dmsCustomerSchema.index({ customer_id: 1 });
dmsCustomerSchema.index({ phone: 1 });
dmsCustomerSchema.index({ city: 1 });

module.exports = mongoose.model('DmsCustomer', dmsCustomerSchema);

