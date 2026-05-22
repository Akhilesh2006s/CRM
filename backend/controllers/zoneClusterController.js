const ZoneCluster = require('../models/ZoneCluster');
const Zone = require('../models/Zone');
const Cluster = require('../models/Cluster');

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
    const { id, zone, cluster, zoneId, clusterId, isActive = true } = req.body;

    let zoneName = (zone || '').trim();
    let clusterName = (cluster || '').trim();

    if (!zoneName && zoneId) {
      const z = await Zone.findById(zoneId);
      if (!z) return res.status(400).json({ message: 'Invalid zone' });
      zoneName = z.name;
    }
    if (!clusterName && clusterId) {
      const c = await Cluster.findById(clusterId);
      if (!c) return res.status(400).json({ message: 'Invalid cluster' });
      clusterName = c.name;
    }

    if (!zoneName) {
      return res.status(400).json({ message: 'Zone is required' });
    }
    if (!clusterName) {
      return res.status(400).json({ message: 'Cluster is required' });
    }

    let doc;
    if (id) {
      doc = await ZoneCluster.findByIdAndUpdate(
        id,
        { zone: zoneName, cluster: clusterName, isActive },
        { new: true, upsert: false }
      );
    } else {
      doc = await ZoneCluster.create({
        zone: zoneName,
        cluster: clusterName,
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

const deleteZoneCluster = async (req, res) => {
  try {
    const doc = await ZoneCluster.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Zone–cluster link not found' });
    res.json({ message: 'Link removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getZonesAndClusters,
  upsertZoneCluster,
  deleteZoneCluster,
};

