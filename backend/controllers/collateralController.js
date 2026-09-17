const Collateral = require('../models/Collateral');

const listCollateral = async (req, res) => {
  try {
    const filter = {};
    if (req.query.active !== '0') filter.isActive = true;
    if (req.query.type && req.query.type !== 'all') filter.type = req.query.type;
    const items = await Collateral.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const createCollateral = async (req, res) => {
  try {
    const { title, type, url, description, product } = req.body || {};
    if (!title || !url) {
      return res.status(400).json({ message: 'Title and URL are required' });
    }
    const doc = await Collateral.create({
      title: String(title).trim(),
      type: type || 'link',
      url: String(url).trim(),
      description: description || '',
      product: product || '',
      createdBy: req.user?._id,
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

const updateCollateral = async (req, res) => {
  try {
    const doc = await Collateral.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const fields = ['title', 'type', 'url', 'description', 'product', 'isActive'];
    for (const f of fields) {
      if (req.body[f] !== undefined) doc[f] = req.body[f];
    }
    await doc.save();
    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { listCollateral, createCollateral, updateCollateral };
