const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

class AIService {
  constructor() {
    this.baseURL = AI_SERVICE_URL;
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async makeRequest(endpoint, data) {
    try {
      const response = await axios.post(`${this.baseURL}${endpoint}`, data, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`AI Service Error (${endpoint}):`, error.message);
      
      // Check if it's a connection error
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('connect')) {
        throw new Error(`AI Service is not running. Please start the Python AI service on ${this.baseURL}`);
      }
      
      // Check if it's a 404 (endpoint not found)
      if (error.response && error.response.status === 404) {
        throw new Error(`AI Service endpoint not found: ${endpoint}`);
      }
      
      // Check if it's a 500 (server error)
      if (error.response && error.response.status === 500) {
        const errorMsg = error.response.data?.error || error.message;
        throw new Error(`AI Service error: ${errorMsg}`);
      }
      
      throw new Error(`AI Service Error: ${error.message}`);
    }
  }

  async calculateRevenueAtRisk(data) {
    return this.makeRequest('/api/revenue-at-risk', data);
  }

  async getExecutiveDashboard(data) {
    return this.makeRequest('/api/executive-dashboard', data);
  }

  async calculatePriorityScores(data) {
    return this.makeRequest('/api/priority-engine', data);
  }

  async scoreDealRisk(data) {
    return this.makeRequest('/api/deal-risk-scoring', data);
  }

  async detectPerformanceAnomalies(data) {
    return this.makeRequest('/api/performance-risk', data);
  }

  async detectFraudAnomalies(data) {
    return this.makeRequest('/api/fraud-detection', data);
  }

  async analyzeCashflowBlockages(data) {
    return this.makeRequest('/api/cashflow-analyzer', data);
  }

  async calculateDelayCosts(data) {
    return this.makeRequest('/api/delay-cost-calculator', data);
  }

  async predictChurn(data) {
    return this.makeRequest('/api/churn-predictor', data);
  }

  async generateNarrativeBI(data) {
    return this.makeRequest('/api/narrative-bi', data);
  }
}

module.exports = new AIService();
