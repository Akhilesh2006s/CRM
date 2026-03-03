const express = require('express');
const router = express.Router();
const {
  getRevenueAtRisk,
  getExecutiveDashboard,
  getPriorityScores,
  getDealRiskScores,
  getPerformanceRisk,
  getFraudDetection,
  getCashflowAnalysis,
  getDelayCosts,
  getChurnPredictions,
  getNarrativeBI
} = require('../controllers/aiController');
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

// Revenue at Risk
router.get('/revenue-at-risk', getRevenueAtRisk);

// Executive Dashboard
router.get('/executive-dashboard', getExecutiveDashboard);

// Priority Engine
router.get('/priority-engine', getPriorityScores);

// Deal Risk Scoring
router.get('/deal-risk-scoring', getDealRiskScores);

// Performance Risk Index
router.get('/performance-risk', getPerformanceRisk);

// Fraud Detection
router.get('/fraud-detection', getFraudDetection);

// Cashflow Analyzer
router.get('/cashflow-analyzer', getCashflowAnalysis);

// Delay Cost Calculator
router.get('/delay-cost-calculator', getDelayCosts);

// Churn Predictor
router.get('/churn-predictor', getChurnPredictions);

// Narrative BI
router.get('/narrative-bi', getNarrativeBI);

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
