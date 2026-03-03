const express = require('express');
const router = express.Router();
const {
  generateApiKey,
  listApiKeys,
  revokeApiKey,
  getApiKeyDetails
} = require('../controllers/apiKeyController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware('Super Admin', 'Admin'));

// Generate new API key
router.post('/', generateApiKey);

// List all API keys
router.get('/', listApiKeys);

// Get API key details
router.get('/:id', getApiKeyDetails);

// Revoke API key
router.delete('/:id', revokeApiKey);

module.exports = router;
