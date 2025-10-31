const DcOrder = require('../models/DcOrder');

const list = async (req, res) => {
  try {
    const { status, q, zone, assigned_to, lead_status, from, to } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (zone) filter.zone = zone;
    if (assigned_to) filter.assigned_to = assigned_to;
    if (lead_status) filter.lead_status = lead_status;
    if (from || to) {
      filter.createdAt = {}
      if (from) filter.createdAt.$gte = new Date(from)
      if (to) filter.createdAt.$lte = new Date(to)
    }
    if (q) {
      filter.$or = [
        { dc_code: new RegExp(q, 'i') },
        { school_name: new RegExp(q, 'i') },
        { contact_person: new RegExp(q, 'i') },
        { contact_mobile: new RegExp(q, 'i') },
        { zone: new RegExp(q, 'i') },
        { location: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
      ];
    }
    const items = await DcOrder.find(filter)
      .populate('created_by', 'name email')
      .populate('assigned_to', 'name email')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const getOne = async (req, res) => {
  try {
    const item = await DcOrder.findById(req.params.id)
      .populate('created_by', 'name email')
      .populate('assigned_to', 'name email');
    if (!item) return res.status(404).json({ message: 'DC not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const create = async (req, res) => {
  try {
    const payload = { ...req.body, created_by: req.user._id };
    const item = await DcOrder.create(payload);
    const populated = await DcOrder.findById(item._id)
      .populate('created_by', 'name email')
      .populate('assigned_to', 'name email');
    res.status(201).json(populated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const update = async (req, res) => {
  try {
    const item = await DcOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('created_by', 'name email')
      .populate('assigned_to', 'name email');
    if (!item) return res.status(404).json({ message: 'DC not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const submit = async (req, res) => {
  try {
    const item = await DcOrder.findByIdAndUpdate(
      req.params.id,
      { status: 'pending' },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'DC not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const markInTransit = async (req, res) => {
  try {
    const item = await DcOrder.findByIdAndUpdate(
      req.params.id,
      { status: 'in_transit' },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'DC not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const complete = async (req, res) => {
  try {
    const item = await DcOrder.findByIdAndUpdate(
      req.params.id,
      {
        status: 'completed',
        actual_delivery_date: req.body.actual_delivery_date || new Date(),
        pod_proof_url: req.body.pod_proof_url,
        completed_by: req.user?._id,
      },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'DC not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const hold = async (req, res) => {
  try {
    const item = await DcOrder.findByIdAndUpdate(
      req.params.id,
      { status: 'hold', remarks: req.body.hold_notes || req.body.remarks },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'DC not found' });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { list, getOne, create, update, submit, markInTransit, complete, hold };


