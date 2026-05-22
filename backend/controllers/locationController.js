const PincodeMapping = require('../models/PincodeMapping');
const ZoneCluster = require('../models/ZoneCluster');
const { fetchPincodeFromApi } = require('../utils/fetchPincodeFromApi');

// @desc    Get town name from pincode
// @route   GET /api/location/get-town
// @access  Public
const getTownFromPincode = async (req, res) => {
  try {
    const pincode = (req.query.pincode || '').replace(/\D/g, '').slice(0, 6);

    if (pincode.length !== 6) {
      return res.status(400).json({ message: 'Valid 6-digit pincode is required', success: false });
    }

    // DB optional: if Mongo is down, still try India Post API
    try {
      const mapping = await PincodeMapping.findOne({ pincode })
        .populate('zoneId', 'name')
        .populate('clusterId', 'name');

      if (mapping) {
        const town = mapping.city || mapping.district || '';
        return res.json({
          pincode,
          town,
          district: mapping.district,
          state: mapping.state,
          region: mapping.city || mapping.district || '',
          zone: mapping.zoneId?.name || '',
          cluster: mapping.clusterId?.name || '',
          success: true,
          fromMapping: true,
          postOffices: town
            ? [{ Name: town, District: mapping.district || '', State: mapping.state || '' }]
            : [],
        });
      }
    } catch (dbError) {
      console.warn('Pincode mapping DB lookup skipped:', dbError.message);
    }

    try {
      const api = await fetchPincodeFromApi(pincode);
      if (api.success && api.town) {
        return res.json({
          pincode,
          town: api.town,
          district: api.district,
          state: api.state,
          region: api.region,
          postOffices: api.postOffices || [],
          success: true,
        });
      }
      return res.status(404).json({
        pincode,
        message: 'Pincode not found',
        success: false,
      });
    } catch (fetchError) {
      console.error('Pincode API error:', fetchError);
      return res.status(503).json({
        pincode,
        success: false,
        message:
          'Pincode lookup service unavailable. The app may retry from your browser, or enter location manually.',
      });
    }
  } catch (error) {
    console.error('Error getting town from pincode:', error);
    res.status(500).json({ message: error.message, success: false });
  }
};

const resolveLocation = async (req, res) => {
  try {
    const pincode = (req.query.pincode || '').replace(/\D/g, '').slice(0, 6);
    if (pincode.length !== 6) {
      return res.status(400).json({ message: 'Valid 6-digit pincode is required', success: false });
    }

    const mapping = await PincodeMapping.findOne({ pincode })
      .populate('zoneId', 'name')
      .populate('clusterId', 'name');

    if (mapping) {
      return res.json({
        pincode,
        city: mapping.city || '',
        district: mapping.district || '',
        state: mapping.state || '',
        zone: mapping.zoneId?.name || '',
        cluster: mapping.clusterId?.name || '',
        success: true,
        fromMapping: true,
      });
    }

    let city = '';
    let district = '';
    let state = '';

    try {
      const api = await fetchPincodeFromApi(pincode);
      if (api.success) {
        city = api.town || '';
        district = api.district || '';
        state = api.state || '';
      }
    } catch (fetchError) {
      console.error('Pincode API error:', fetchError);
    }

    let zone = '';
    let cluster = '';

    if (district && state) {
      const districtMapping = await PincodeMapping.findOne({
        district: new RegExp(`^${district.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        state: new RegExp(`^${state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      })
        .populate('zoneId', 'name')
        .populate('clusterId', 'name')
        .limit(1);

      if (districtMapping) {
        zone = districtMapping.zoneId?.name || '';
        cluster = districtMapping.clusterId?.name || '';
      }
    }

    if (zone && !cluster) {
      const firstPair = await ZoneCluster.findOne({
        zone: new RegExp(`^${zone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        isActive: true,
      }).sort({ cluster: 1 });
      if (firstPair?.cluster) cluster = firstPair.cluster;
    }

    res.json({
      pincode,
      city,
      district,
      state,
      zone,
      cluster,
      success: !!(city || district || state),
      fromMapping: false,
    });
  } catch (error) {
    console.error('Error resolving location:', error);
    res.status(500).json({ message: error.message, success: false });
  }
};

module.exports = {
  getTownFromPincode,
  resolveLocation,
};

