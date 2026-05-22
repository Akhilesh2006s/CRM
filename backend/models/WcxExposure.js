const mongoose = require('mongoose');

// WCX (Working Capital Exposure) after discounting for each vehicle/VIN
// This is modeled directly from lakshmi_hyundai_pricing_agent_seed_v4(WCX_AfterDiscounting).csv
const wcxExposureSchema = new mongoose.Schema(
  {
    exposure_id: { type: String, required: true, unique: true }, // e.g. WCX-VEH-0001
    run_id: { type: String, required: true },
    as_of_date: { type: Date, required: true },
    calculated_at: { type: Date },
    dealer_group_id: { type: String, required: true },
    oem: { type: String, required: true },
    vehicle_id: { type: String, required: true }, // e.g. VEH-0001
    vin: { type: String, required: true },
    branch_id: { type: String, required: true }, // e.g. BR-HYD-HN
    model: { type: String, required: true }, // e.g. Creta
    variant_id: { type: String, required: true }, // e.g. VAR-CRETA-SX-P
    ageing_bucket: { type: String, required: true }, // <30, 30, 45, 60, 90+, etc.
    risk_tag: { type: String, required: true }, // Low, Medium, High, Critical
    inventory_status: { type: String, required: true }, // In Stock, In Transit, Allocated
    facility_id: { type: String, required: true }, // links to floor-plan facility
    interest_rate_apr: { type: Number, required: true },
    grace_days: { type: Number, required: true },
    day_count_basis: { type: Number, required: true },
    working_capital_locked_inr: { type: Number, required: true },
    principal_used_inr: { type: Number, required: true },
    interest_days: { type: Number, required: true },
    interest_exposure_inr: { type: Number, required: true },
    critical_flag: { type: String }, // Y/N
    mrp_inr: { type: Number, required: true },
    cost_price_inr: { type: Number, required: true },
    min_margin_pct_applied: { type: Number, required: true },
    discount_band_min_pct: { type: Number, required: true },
    discount_band_max_pct: { type: Number, required: true },
    max_discount_allowed_pct: { type: Number, required: true },
    recommended_discount_pct: { type: Number, required: true },
    recommended_discount_inr: { type: Number, required: true },
    recommended_price_inr: { type: Number, required: true },
    margin_pct_after_discount: { type: Number, required: true },
    pricing_approval_required: { type: String }, // Y/N
    pricing_approval_role: { type: String }, // e.g. CFO
    pricing_reason: { type: String },
    pricing_policy_kb_id: { type: String },
    pricing_policy_version: { type: String },
    raw: { type: Object }, // optional: store full raw row for flexibility
  },
  {
    timestamps: true,
  }
);

// Use exposure_id as a natural identifier
wcxExposureSchema.index({ exposure_id: 1 });
wcxExposureSchema.index({ vin: 1 }, { unique: true });
wcxExposureSchema.index({ vehicle_id: 1 });
wcxExposureSchema.index({ branch_id: 1 });
wcxExposureSchema.index({ model: 1 });
wcxExposureSchema.index({ ageing_bucket: 1, risk_tag: 1, inventory_status: 1 });

module.exports = mongoose.model('WcxExposure', wcxExposureSchema);

