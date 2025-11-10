// @desc    Get inventory metadata options
// @route   GET /api/metadata/inventory-options
// @access  Private
const getInventoryOptions = async (req, res) => {
  try {
    // These could be stored in a database, but for now returning defaults
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
      itemTypes: ['Books', 'Question Paper', 'Instruments'],
      vendors: [
        'Vendor 1',
        'Vendor 2',
        'Vendor 3',
      ],
    };

    res.json(options);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInventoryOptions,
};

