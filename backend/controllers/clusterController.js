const Cluster = require('../models/Cluster');

// Get all active clusters
const getClusters = async (req, res) => {
  try {
    const clusters = await Cluster.find({ isActive: true }).sort({ name: 1 });
    res.json(clusters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create or update a cluster
const upsertCluster = async (req, res) => {
  try {
    const { id, name, isActive = true } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Cluster name is required' });
    }

    let cluster;
    if (id) {
      cluster = await Cluster.findByIdAndUpdate(
        id,
        { name: name.trim(), isActive },
        { new: true, upsert: false }
      );
    } else {
      cluster = await Cluster.create({
        name: name.trim(),
        isActive,
      });
    }

    res.status(id ? 200 : 201).json(cluster);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Cluster already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Delete a cluster
const deleteCluster = async (req, res) => {
  try {
    const cluster = await Cluster.findByIdAndDelete(req.params.id);
    if (!cluster) {
      return res.status(404).json({ message: 'Cluster not found' });
    }
    res.json({ message: 'Cluster deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getClusters,
  upsertCluster,
  deleteCluster,
};

