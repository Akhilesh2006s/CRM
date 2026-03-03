const PartnerCost = require('../models/VendorCost'); // TODO: Rename file to PartnerCost.js
const DcOrder = require('../models/DcOrder');
const Product = require('../models/Product');

// @desc    Get partner cost configuration
// @route   GET /api/partner-costs/:partnerId
// @access  Private (Admin)
const getPartnerCost = async (req, res) => {
  try {
    const { partnerId } = req.params;
    
    let partnerCost = await PartnerCost.findOne({ partnerId })
      .populate('partnerId', 'name email')
      .populate('products.productId', 'productName')
      .populate('products.franchises.schools.schoolId', 'school_name school_code zone location');
    
    if (!partnerCost) {
      // Return default structure if not found
      return res.json({
        partnerId,
        products: [],
      });
    }
    
    res.json(partnerCost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update partner cost configuration
// @route   PUT /api/partner-costs/:partnerId
// @access  Private (Admin)
const updatePartnerCost = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { products } = req.body;
    
    // Validate partner exists
    const User = require('../models/User');
    const partner = await User.findById(partnerId);
    if (!partner || partner.role !== 'Partner') {
      return res.status(404).json({ message: 'Partner not found' });
    }
    
    // Validate products structure
    if (products && Array.isArray(products)) {
      for (const product of products) {
        if (!product.productId) {
          return res.status(400).json({ message: 'Product ID is required for each product' });
        }
        if (!product.productName) {
          return res.status(400).json({ message: 'Product name is required for each product' });
        }
        if (product.defaultCost === undefined || product.defaultCost < 0) {
          return res.status(400).json({ message: 'Default cost must be a non-negative number' });
        }
        
        // Validate product exists
        const productExists = await Product.findById(product.productId);
        if (!productExists) {
          return res.status(400).json({ message: `Product with ID ${product.productId} not found` });
        }
        
        // Validate franchises
        if (product.franchises && Array.isArray(product.franchises)) {
          for (const franchise of product.franchises) {
            if (!franchise.franchiseName || franchise.franchiseName.trim() === '') {
              return res.status(400).json({ message: 'Franchise name is required' });
            }
            if (!franchise.franchiseEmail || franchise.franchiseEmail.trim() === '') {
              return res.status(400).json({ message: 'Franchise email is required' });
            }
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(franchise.franchiseEmail.trim())) {
              return res.status(400).json({ message: 'Franchise email must be a valid email address' });
            }
            if (franchise.franchiseCost === undefined || franchise.franchiseCost < 0) {
              return res.status(400).json({ message: 'Franchise cost must be a non-negative number' });
            }
            
            // Validate zones
            if (franchise.zones && Array.isArray(franchise.zones)) {
              for (const zone of franchise.zones) {
                if (!zone || typeof zone !== 'string' || zone.trim() === '') {
                  return res.status(400).json({ message: 'Zone must be a non-empty string' });
                }
              }
            }
            
            // Validate schools
            if (franchise.schools && Array.isArray(franchise.schools)) {
              for (const school of franchise.schools) {
                if (!school.schoolId) {
                  return res.status(400).json({ message: 'School ID is required' });
                }
                // Validate school exists
                const schoolExists = await DcOrder.findById(school.schoolId);
                if (!schoolExists) {
                  return res.status(400).json({ message: `School with ID ${school.schoolId} not found` });
                }
              }
            }
          }
        }
      }
    }
    
    // Create or update partner cost
    const partnerCost = await PartnerCost.findOneAndUpdate(
      { partnerId },
      {
        partnerId,
        products: products || [],
      },
      { upsert: true, new: true, runValidators: true }
    )
      .populate('partnerId', 'name email')
      .populate('products.productId', 'productName')
      .populate('products.franchises.schools.schoolId', 'school_name school_code zone location');
    
    res.json(partnerCost);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message).join('. ');
      return res.status(400).json({ message: messages });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all schools
// @route   GET /api/partner-costs/schools
// @access  Private (Admin)
const getAllSchools = async (req, res) => {
  try {
    const schools = await DcOrder.find({})
      .select('_id school_name school_code zone location contact_mobile')
      .sort({ school_name: 1 })
      .limit(5000); // Limit to prevent performance issues
    
    res.json(schools);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get schools by zone
// @route   GET /api/partner-costs/schools/zone/:zone
// @access  Private (Admin)
const getSchoolsByZone = async (req, res) => {
  try {
    const { zone } = req.params;
    
    const schools = await DcOrder.find({ zone })
      .select('_id school_name school_code zone location contact_mobile')
      .sort({ school_name: 1 })
      .limit(1000); // Limit to prevent performance issues
    
    res.json(schools);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all zones
// @route   GET /api/partner-costs/zones
// @access  Private (Admin)
const getZones = async (req, res) => {
  try {
    const zones = await DcOrder.distinct('zone');
    const filteredZones = zones.filter(z => z && z.trim() !== '');
    res.json(filteredZones.sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPartnerCost,
  updatePartnerCost,
  getAllSchools,
  getSchoolsByZone,
  getZones,
};
