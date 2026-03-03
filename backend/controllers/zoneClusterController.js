const ZoneCluster = require('../models/ZoneCluster');

// Get all active zones and clusters
const getZonesAndClusters = async (req, res) => {
  try {
    const items = await ZoneCluster.find({ isActive: true }).sort({ zone: 1, cluster: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create or update a zone/cluster entry
const upsertZoneCluster = async (req, res) => {
  try {
    const { id, zone, cluster, isActive = true } = req.body;

    if (!zone || !zone.trim()) {
      return res.status(400).json({ message: 'Zone is required' });
    }
    if (!cluster || !cluster.trim()) {
      return res.status(400).json({ message: 'Cluster is required' });
    }

    let doc;
    if (id) {
      doc = await ZoneCluster.findByIdAndUpdate(
        id,
        { zone: zone.trim(), cluster: cluster.trim(), isActive },
        { new: true, upsert: false }
      );
    } else {
      doc = await ZoneCluster.create({
        zone: zone.trim(),
        cluster: cluster.trim(),
        isActive,
      });
    }

    res.status(id ? 200 : 201).json(doc);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Zone & Cluster combination already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getZonesAndClusters,
  upsertZoneCluster,
};

