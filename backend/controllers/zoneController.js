const Zone = require('../models/Zone');
const { normalizeName, normalizeNameLower, escapeRegex } = require('../utils/normalizeName');

async function findExistingZoneByName(name) {
  const normalized = normalizeName(name);
  if (!normalized) return null;
  const lower = normalizeNameLower(normalized);
  return Zone.findOne({
    $or: [
      { nameLower: lower },
      { name: { $regex: `^${escapeRegex(normalized)}$`, $options: 'i' } },
    ],
  });
}

// Get all active zones
const getZones = async (req, res) => {
  try {
    const zones = await Zone.find({ isActive: true }).sort({ name: 1 });
    const seen = new Set();
    const deduped = [];
    for (const zone of zones) {
      const key = normalizeNameLower(zone.nameLower || zone.name);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(zone);
    }
    res.json(deduped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create or update a zone
const upsertZone = async (req, res) => {
  try {
    const { id, name: rawName, isActive = true } = req.body;
    const name = normalizeName(rawName);

    if (!name) {
      return res.status(400).json({ message: 'Zone name is required' });
    }

    const nameLower = normalizeNameLower(name);

    if (id) {
      const duplicate = await Zone.findOne({
        _id: { $ne: id },
        $or: [
          { nameLower },
          { name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } },
        ],
      });
      if (duplicate) {
        return res.status(400).json({ message: 'Zone already exists' });
      }

      const zone = await Zone.findByIdAndUpdate(
        id,
        { name, nameLower, isActive },
        { new: true, upsert: false }
      );
      return res.status(200).json(zone);
    }

    const existing = await findExistingZoneByName(name);
    if (existing) {
      return res.status(400).json({ message: 'Zone already exists' });
    }

    const zone = await Zone.create({
      name,
      nameLower,
      isActive,
    });

    res.status(201).json(zone);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Zone already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Delete a zone
const deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) {
      return res.status(404).json({ message: 'Zone not found' });
    }
    res.json({ message: 'Zone deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getZones,
  upsertZone,
  deleteZone,
};
