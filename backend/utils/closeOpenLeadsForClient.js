const Lead = require('../models/Lead');

const OPEN_LEAD_STATUSES = ['Pending', 'Processing', 'pending', 'processing'];

/**
 * When a deal is converted to a client, close matching open Lead docs
 * so they cannot reappear on Follow-up Leads after refresh.
 */
async function closeOpenLeadsForConvertedOrder(order) {
  if (!order || !order._id) return 0;

  const clauses = [{ school_id: order._id }];
  const code = String(order.school_code || '').trim();
  if (code) clauses.push({ school_code: code });

  const name = String(order.school_name || '').trim();
  const mobile = String(order.contact_mobile || '').trim();
  if (name && mobile) {
    clauses.push({ school_name: name, contact_mobile: mobile });
  }

  const result = await Lead.updateMany(
    {
      status: { $in: OPEN_LEAD_STATUSES },
      $or: clauses,
    },
    { $set: { status: 'Closed' } }
  );

  return result.modifiedCount || result.nModified || 0;
}

module.exports = { closeOpenLeadsForConvertedOrder, OPEN_LEAD_STATUSES };
