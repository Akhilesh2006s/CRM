const User = require('../models/User');
const Lead = require('../models/Lead');

// Enum values for Lead, DcOrder, DC - must match backend models (Lead.js, DcOrder.js, DC.js)
const ENUMS = {
  lead: {
    status: ['Pending', 'Processing', 'Saved', 'Closed'],
    priority: ['Hot', 'Warm', 'Cold'],
    term: ['Term 1', 'Term 2', 'Both'],
  },
  dcOrder: {
    status: ['saved', 'pending', 'in_transit', 'completed', 'hold', 'dc_requested', 'dc_accepted', 'dc_approved', 'dc_sent_to_senior'],
    priority: ['Hot', 'Warm', 'Cold', 'Visit Again', 'Not Met Management', 'Not Interested'],
    lead_status: ['Hot', 'Warm', 'Cold'],
    schoolCategory: ['Hot', 'Warm', 'Visit Again', 'Not Met Management', 'Not Interested'],
  },
  dc: {
    status: ['created', 'po_submitted', 'sent_to_manager', 'pending_dc', 'warehouse_processing', 'completed', 'hold', 'scheduled_for_later'],
  },
};

// @desc    Get enum values for status, priority, etc. (Lead, DcOrder, DC)
// @route   GET /api/metadata/enums
// @access  Private
const getEnums = async (req, res) => {
  try {
    res.json(ENUMS);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

async function vendorNamesFromMaster() {
  const users = await User.find({ role: { $in: ['Partner', 'Vendor'] } })
    .select('name')
    .sort({ name: 1 })
    .lean();
  const names = [];
  const seen = new Set();
  for (const user of users) {
    const name = String(user?.name || '').trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  names.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  return names;
}

// @desc    Get inventory metadata options
// @route   GET /api/metadata/inventory-options
// @access  Private
const getInventoryOptions = async (req, res) => {
  try {
    const vendors = await vendorNamesFromMaster();
    const options = {
      products: [
        'Abacus',
        'Vedic Maths',
        'EEL',
        'IIT',
        'Financial literacy',
        'Brain bytes',
        'Spelling bee',
        'Skill pro',
        'Maths lab',
        'Codechamp',
      ],
      uoms: ['Pieces (pcs)', 'boxes'],
      vendors,
    };

    res.json(options);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unique states from users and leads
// @route   GET /api/metadata/states
// @access  Private
const getStates = async (req, res) => {
  try {
    // Get unique states from users
    const userStates = await User.distinct('state', { state: { $exists: true, $ne: null, $ne: '' } });
    
    // Get unique states from leads
    const leadStates = await Lead.distinct('state', { state: { $exists: true, $ne: null, $ne: '' } });
    
    // Combine and get unique states, sorted alphabetically
    const allStates = [...new Set([...userStates, ...leadStates])]
      .filter(state => state && state.trim() !== '')
      .sort();
    
    res.json(allStates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unique cities from users and leads (optionally filtered by state)
// @route   GET /api/metadata/cities?state=StateName
// @access  Private
const getCities = async (req, res) => {
  try {
    const { state } = req.query;
    
    // Build filter for state if provided
    const stateFilter = state ? { state: state } : {};
    
    // Get unique cities from users
    const userFilter = { city: { $exists: true, $ne: null, $ne: '' }, ...stateFilter };
    const userCities = await User.distinct('city', userFilter);
    
    // Get unique cities from leads
    const leadFilter = { city: { $exists: true, $ne: null, $ne: '' }, ...stateFilter };
    const leadCities = await Lead.distinct('city', leadFilter);
    
    // Get unique assigned cities from users (these might not have state, so only if no state filter)
    let assignedCities = [];
    if (!state) {
      assignedCities = await User.distinct('assignedCity', { assignedCity: { $exists: true, $ne: null, $ne: '' } });
    }
    
    // Combine and get unique cities, sorted alphabetically
    const allCities = [...new Set([...userCities, ...leadCities, ...assignedCities])]
      .filter(city => city && city.trim() !== '')
      .sort();
    
    res.json(allCities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEnums,
  getInventoryOptions,
  getStates,
  getCities,
};

