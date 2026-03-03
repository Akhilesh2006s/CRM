const ApiKey = require('../models/ApiKey');
const crypto = require('crypto');

// @desc    Generate new API key
// @route   POST /api/api-keys
// @access  Private (Admin/Super Admin)
const generateApiKey = async (req, res) => {
  try {
    const { name, tenantId, expiresInDays, permissions } = req.body;
    const createdBy = req.user._id;

    // Generate API key
    const keyPrefix = 'cf_live';
    const randomBytes = crypto.randomBytes(32);
    const key = `${keyPrefix}_${randomBytes.toString('hex')}`;

    // Calculate expiration date
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Create API key document
    const apiKey = await ApiKey.create({
      name: name || 'API Key',
      key,
      keyPrefix,
      createdBy,
      tenantId: tenantId || req.user._id.toString(),
      expiresAt,
      permissions: permissions || ['read', 'write']
    });

    // Return the key only once (for security)
    res.status(201).json({
      success: true,
      message: 'API key generated successfully',
      apiKey: {
        id: apiKey._id,
        name: apiKey.name,
        key: key, // Only shown once
        keyPrefix: apiKey.keyPrefix,
        tenantId: apiKey.tenantId,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt
      },
      warning: '⚠️ Save this API key now. You will not be able to see it again!'
    });
  } catch (error) {
    console.error('Generate API Key Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate API key',
      message: error.message 
    });
  }
};

// @desc    List all API keys
// @route   GET /api/api-keys
// @access  Private (Admin/Super Admin)
const listApiKeys = async (req, res) => {
  try {
    const query = {};
    
    // Super Admin can see all, others see only their own
    if (req.user.role !== 'Super Admin') {
      query.createdBy = req.user._id;
    }

    const apiKeys = await ApiKey.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .select('-key'); // Don't return the actual key

    res.json({
      success: true,
      count: apiKeys.length,
      apiKeys: apiKeys.map(key => ({
        id: key._id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        keyPreview: `${key.keyPrefix}_${'*'.repeat(20)}...`,
        tenantId: key.tenantId,
        isActive: key.isActive,
        permissions: key.permissions,
        lastUsed: key.lastUsed,
        expiresAt: key.expiresAt,
        createdAt: key.createdAt,
        createdBy: key.createdBy
      }))
    });
  } catch (error) {
    console.error('List API Keys Error:', error);
    res.status(500).json({ 
      error: 'Failed to list API keys',
      message: error.message 
    });
  }
};

// @desc    Revoke API key
// @route   DELETE /api/api-keys/:id
// @access  Private (Admin/Super Admin)
const revokeApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    
    const apiKey = await ApiKey.findById(id);
    
    if (!apiKey) {
      return res.status(404).json({ 
        error: 'API key not found' 
      });
    }

    // Check permissions
    if (req.user.role !== 'Super Admin' && apiKey.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'You can only revoke your own API keys' 
      });
    }

    apiKey.isActive = false;
    await apiKey.save();

    res.json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    console.error('Revoke API Key Error:', error);
    res.status(500).json({ 
      error: 'Failed to revoke API key',
      message: error.message 
    });
  }
};

// @desc    Get API key details
// @route   GET /api/api-keys/:id
// @access  Private (Admin/Super Admin)
const getApiKeyDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const apiKey = await ApiKey.findById(id)
      .populate('createdBy', 'name email')
      .select('-key'); // Don't return the actual key

    if (!apiKey) {
      return res.status(404).json({ 
        error: 'API key not found' 
      });
    }

    // Check permissions
    if (req.user.role !== 'Super Admin' && apiKey.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    res.json({
      success: true,
      apiKey: {
        id: apiKey._id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        keyPreview: `${apiKey.keyPrefix}_${'*'.repeat(20)}...`,
        tenantId: apiKey.tenantId,
        isActive: apiKey.isActive,
        permissions: apiKey.permissions,
        lastUsed: apiKey.lastUsed,
        expiresAt: apiKey.expiresAt,
        rateLimit: apiKey.rateLimit,
        metadata: Object.fromEntries(apiKey.metadata || new Map()),
        createdAt: apiKey.createdAt,
        createdBy: apiKey.createdBy
      }
    });
  } catch (error) {
    console.error('Get API Key Details Error:', error);
    res.status(500).json({ 
      error: 'Failed to get API key details',
      message: error.message 
    });
  }
};

module.exports = {
  generateApiKey,
  listApiKeys,
  revokeApiKey,
  getApiKeyDetails
};
