const User = require('../models/User');
const Product = require('../models/Product');

// List all vendors
const list = async (req, res) => {
  try {
    const vendors = await User.find({ role: 'Vendor' })
      .select('-password')
      .populate('vendorAssignedProducts', 'productName')
      .sort({ createdAt: -1 });
    res.json(vendors);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Create vendor
const create = async (req, res) => {
  try {
    const { name, email, password, assignedProducts } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Vendor name is required' });
    }
    if (!email || !String(email).trim()) {
      return res.status(400).json({ message: 'Vendor email is required' });
    }
    if (!password || !String(password).trim()) {
      return res.status(400).json({ message: 'Vendor password is required' });
    }

    // Password security: min 6 characters
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // At least 1 product required
    const productIds = Array.isArray(assignedProducts) ? assignedProducts.filter(Boolean) : [];
    if (productIds.length === 0) {
      return res.status(400).json({ message: 'At least one product must be assigned to the vendor' });
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

    const vendor = await User.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      password: String(password),
      role: 'Vendor',
      vendorAssignedProducts: productIds,
      isActive: true,
    });

    const populated = await User.findById(vendor._id)
      .select('-password')
      .populate('vendorAssignedProducts', 'productName');
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

// Get single vendor
const getOne = async (req, res) => {
  try {
    const vendor = await User.findOne({ _id: req.params.id, role: 'Vendor' })
      .select('-password')
      .populate('vendorAssignedProducts', 'productName');
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = {
  list,
  create,
  getOne,
};
