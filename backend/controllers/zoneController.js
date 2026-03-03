const Zone = require('../models/Zone');

// Get all active zones
const getZones = async (req, res) => {
  try {
    const zones = await Zone.find({ isActive: true }).sort({ name: 1 });
    res.json(zones);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create or update a zone
const upsertZone = async (req, res) => {
  try {
    const { id, name, isActive = true } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Zone name is required' });
    }

    let zone;
    if (id) {
      zone = await Zone.findByIdAndUpdate(
        id,
        { name: name.trim(), isActive },
        { new: true, upsert: false }
      );
    } else {
      zone = await Zone.create({
        name: name.trim(),
        isActive,
      });
    }

    res.status(id ? 200 : 201).json(zone);
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

