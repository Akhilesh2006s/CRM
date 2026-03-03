const ApiKey = require('../models/ApiKey');

/**
 * API Key Authentication Middleware
 * Supports both Bearer token and X-API-Key header
 */
const apiKeyAuth = async (req, res, next) => {
  try {
    // Try to get API key from different sources
    let apiKey = null;

    // 1. Check Authorization header (Bearer token)
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.replace('Bearer ', '');
    }

    // 2. Check X-API-Key header
    if (!apiKey) {
      apiKey = req.header('X-API-Key') || req.header('x-api-key');
    }

    // 3. Check query parameter (less secure, but supported)
    if (!apiKey) {
      apiKey = req.query.api_key;
    }

    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key required',
        message: 'Please provide an API key using one of these methods:',
        methods: [
          'Authorization: Bearer <your-api-key>',
          'X-API-Key: <your-api-key>',
          'Query parameter: ?api_key=<your-api-key>'
        ]
      });
    }

    // Find and validate API key
    const keyDoc = await ApiKey.findActive(apiKey);

    if (!keyDoc) {
      return res.status(401).json({ 
        error: 'Invalid API key',
        message: 'The provided API key is invalid, expired, or inactive'
      });
    }

    // Update last used timestamp (non-blocking)
    keyDoc.updateLastUsed().catch(err => console.error('Error updating last used:', err));

    // Attach API key info to request
    req.apiKey = keyDoc;
    req.tenantId = keyDoc.tenantId;
    req.apiKeyPermissions = keyDoc.permissions;

    // Check permissions if required
    if (req.requiredPermission && !keyDoc.permissions.includes(req.requiredPermission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This endpoint requires '${req.requiredPermission}' permission`,
        yourPermissions: keyDoc.permissions
      });
    }

    next();
  } catch (error) {
    console.error('API Key Auth Error:', error);
    res.status(500).json({ 
      error: 'Authentication error',
      message: error.message 
    });
  }
};

/**
 * Optional API Key Auth - allows both API key and JWT token
 */
const optionalApiKeyAuth = async (req, res, next) => {
  try {
    // Try API key first
    const apiKey = req.header('Authorization')?.replace('Bearer ', '') || 
                   req.header('X-API-Key') || 
                   req.query.api_key;

    if (apiKey) {
      const keyDoc = await ApiKey.findActive(apiKey);
      if (keyDoc) {
        req.apiKey = keyDoc;
        req.tenantId = keyDoc.tenantId;
        req.apiKeyPermissions = keyDoc.permissions;
        keyDoc.updateLastUsed().catch(err => console.error('Error updating last used:', err));
      }
    }

    next();
  } catch (error) {
    // If API key fails, continue (might use JWT instead)
    next();
  }
};

module.exports = { apiKeyAuth, optionalApiKeyAuth };
