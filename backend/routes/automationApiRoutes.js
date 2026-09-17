const express = require('express');
const router = express.Router();
const { apiKeyAuth, optionalApiKeyAuth } = require('../middleware/apiKeyAuth');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * Automation API Routes
 * These routes support both API Key and JWT token authentication
 * Use apiKeyAuth for API key only, or optionalApiKeyAuth for both
 */

// Use optional auth - supports both API key and JWT token
router.use(optionalApiKeyAuth);

// If no API key, fall back to JWT token
router.use((req, res, next) => {
  if (!req.apiKey && !req.user) {
    return authMiddleware(req, res, next);
  }
  next();
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'C-FORGIA Automation API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
