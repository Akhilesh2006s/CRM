const mongoose = require('mongoose');

const dmsVehicleSchema = new mongoose.Schema(
  {
    vehicle_id: { type: String, required: true, unique: true }, // VEH-0001
    vin: { type: String, required: true, unique: true },
    stock_no: { type: String },
    oem: { type: String },
    model: { type: String },
    variant_id: { type: String },
    variant: { type: String },
    fuel_type: { type: String },
    transmission: { type: String },
    branch_id: { type: String },
    purchase_date: { type: Date },
    inventory_status: { type: String }, // In Stock / In Transit / Allocated
    cost_price_inr: { type: Number },
    mrp_inr: { type: Number },
    current_asking_price_inr: { type: Number },
  },
  {
    timestamps: true,
  }
);

dmsVehicleSchema.index({ vehicle_id: 1 });
dmsVehicleSchema.index({ vin: 1 });
dmsVehicleSchema.index({ branch_id: 1 });
dmsVehicleSchema.index({ model: 1 });
dmsVehicleSchema.index({ inventory_status: 1 });

module.exports = mongoose.model('DmsVehicle', dmsVehicleSchema);

