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
const { authMiddleware } = require('../middleware/authMiddleware');

// All AI routes require authentication
router.use(authMiddleware);

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

module.exports = router;
