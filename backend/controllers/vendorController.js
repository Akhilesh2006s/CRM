const User = require('../models/User');
const Product = require('../models/Product');

// List all partners
const list = async (req, res) => {
  try {
    const partners = await User.find({ role: 'Partner' })
      .select('-password')
      .populate('partnerAssignedProducts', 'productName')
      .sort({ createdAt: -1 });
    res.json(partners);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Create partner
const create = async (req, res) => {
  try {
    const { name, email, password, assignedProducts } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Partner name is required' });
    }
    if (!email || !String(email).trim()) {
      return res.status(400).json({ message: 'Partner email is required' });
    }
    if (!password || !String(password).trim()) {
      return res.status(400).json({ message: 'Partner password is required' });
    }

    // Password security: min 6 characters
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // At least 1 product required
    const productIds = Array.isArray(assignedProducts) ? assignedProducts.filter(Boolean) : [];
    if (productIds.length === 0) {
      return res.status(400).json({ message: 'At least one product must be assigned to the partner' });
    }

    // Validate products exist
    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== productIds.length) {
      return res.status(400).json({ message: 'One or more selected products are invalid' });
    }

    const userExists = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'Email already exists. Please use a different email.' });
    }

    const partner = await User.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      password: String(password),
      role: 'Partner',
      partnerAssignedProducts: productIds,
      isActive: true,
    });

    const populated = await User.findById(partner._id)
      .select('-password')
      .populate('partnerAssignedProducts', 'productName');
    res.status(201).json(populated);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ message: 'Email already exists. Please use a different email.' });
    }
    if (e.name === 'ValidationError') {
      const messages = Object.values(e.errors).map(err => err.message).join('. ');
      return res.status(400).json({ message: messages });
    }
    res.status(500).json({ message: e.message });
  }
};

// Get single partner
const getOne = async (req, res) => {
  try {
    const partner = await User.findOne({ _id: req.params.id, role: 'Partner' })
      .select('-password')
      .populate('partnerAssignedProducts', 'productName');
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    res.json(partner);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Update partner products
const updateProducts = async (req, res) => {
  try {
    const { assignedProducts } = req.body;
    const partnerId = req.params.id;

    // Validate partner exists
    const partner = await User.findOne({ _id: partnerId, role: 'Partner' });
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    // Validate products if provided
    if (assignedProducts !== undefined) {
      const productIds = Array.isArray(assignedProducts) ? assignedProducts.filter(Boolean) : [];
      
      // Validate products exist
      if (productIds.length > 0) {
        const products = await Product.find({ _id: { $in: productIds } });
        if (products.length !== productIds.length) {
          return res.status(400).json({ message: 'One or more selected products are invalid' });
        }
      }

      // Update partner with new products
      partner.partnerAssignedProducts = productIds;
      await partner.save();
    }

    // Return updated partner
    const updated = await User.findById(partnerId)
      .select('-password')
      .populate('partnerAssignedProducts', 'productName');
    res.json(updated);
  } catch (e) {
    if (e.name === 'ValidationError') {
      const messages = Object.values(e.errors).map(err => err.message).join('. ');
      return res.status(400).json({ message: messages });
    }
    res.status(500).json({ message: e.message });
  }
};

module.exports = {
  list,
  create,
  getOne,
  updateProducts,
};
