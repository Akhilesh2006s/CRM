const ProductDeliverable = require('../models/ProductDeliverable');
const Product = require('../models/Product');

// List all deliverables for a product
const listByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const deliverables = await ProductDeliverable.find({ product: productId })
      .populate('product', 'productName')
      .sort({ deliverableName: 1 });
    res.json(deliverables);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Create deliverable and map to product
const create = async (req, res) => {
  try {
    const { deliverableName, productId } = req.body;

    // Validation: deliverable name required
    if (!deliverableName || !String(deliverableName).trim()) {
      return res.status(400).json({ message: 'Deliverable name is required' });
    }

    const trimmedName = String(deliverableName).trim();

    // Validation: product must exist
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validation: prevent duplicate deliverable name for same product
    const existing = await ProductDeliverable.findOne({
      product: productId,
      deliverableName: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });
    if (existing) {
      return res.status(400).json({ message: 'A deliverable with this name already exists for this product' });
    }

    const deliverable = await ProductDeliverable.create({
      deliverableName: trimmedName,
      product: productId,
    });

    const populated = await ProductDeliverable.findById(deliverable._id)
      .populate('product', 'productName');
    res.status(201).json(populated);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ message: 'A deliverable with this name already exists for this product' });
    }
    res.status(500).json({ message: e.message });
  }
};

module.exports = {
  listByProduct,
  create,
};
