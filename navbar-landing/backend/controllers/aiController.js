const aiService = require('../services/aiService');
const Lead = require('../models/Lead');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const DC = require('../models/DC');
const DcOrder = require('../models/DcOrder');
const User = require('../models/User');
const Expense = require('../models/Expense');
const ContactQuery = require('../models/ContactQuery');
const Training = require('../models/Training');
const Service = require('../models/Service');

// Helper function to check AI service health
const checkAIServiceHealth = async (res) => {
  const health = await aiService.checkHealth();
  if (!health) {
    res.status(503).json({ 
      error: 'AI Service is not available. Please start the Python AI service on port 5001.',
      details: 'Run: cd ai-service && python app.py',
      help: 'See QUICK_START_AI.md for setup instructions'
    });
    return false;
  }
  return true;
};

// @desc    Get Revenue at Risk
// @route   GET /api/ai/revenue-at-risk
// @access  Private
const getRevenueAtRisk = async (req, res) => {
  try {
    // Check if AI service is available
    if (!(await checkAIServiceHealth(res))) return;

    // Get pending/processing deals
    const leads = await Lead.find({ 
      status: { $in: ['Pending', 'Processing'] } 
    }).lean();
    
    const sales = await Sale.find({ 
      status: { $ne: 'Closed' } 
    }).lean();
    
    const pendingPayments = await Payment.find({ 
      status: 'Pending' 
    }).lean();
    
    const data = {
      invoices: [],
      deals: [...leads, ...sales],
      payments: pendingPayments
    };
    
    const result = await aiService.calculateRevenueAtRisk(data);
    res.json(result);
  } catch (error) {
    console.error('Revenue at Risk Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.message.includes('not running') ? 'Please start the Python AI service: cd ai-service && python app.py' : undefined
    });
  }
};

// @desc    Get Executive Dashboard Data
// @route   GET /api/ai/executive-dashboard
// @access  Private
const getExecutiveDashboard = async (req, res) => {
  try {
    // Check if AI service is available
    if (!(await checkAIServiceHealth(res))) return;
    const { days = 90 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get daily metrics
    const sales = await Sale.find({ 
      saleDate: { $gte: startDate } 
    }).lean();
    
    const payments = await Payment.find({ 
      paymentDate: { $gte: startDate } 
    }).lean();
    
    // Aggregate daily metrics
    const dailyMetrics = {};
    sales.forEach(sale => {
      const date = sale.saleDate.toISOString().split('T')[0];
      if (!dailyMetrics[date]) {
        dailyMetrics[date] = { revenue: 0, deals: 0, payments: 0 };
      }
      dailyMetrics[date].revenue += sale.totalAmount || 0;
      dailyMetrics[date].deals += 1;
    });
    
    payments.forEach(payment => {
      const date = payment.paymentDate.toISOString().split('T')[0];
      if (!dailyMetrics[date]) {
        dailyMetrics[date] = { revenue: 0, deals: 0, payments: 0 };
      }
      dailyMetrics[date].revenue += payment.amount || 0;
      dailyMetrics[date].payments += 1;
    });
    
    const dailyMetricsArray = Object.entries(dailyMetrics).map(([date, metrics]) => ({
      date,
      ...metrics
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    // Get deals with risk scores
    const leads = await Lead.find({ 
      status: { $in: ['Pending', 'Processing'] } 
    }).lean();
    
    const data = {
      daily_metrics: dailyMetricsArray,
      revenue_data: dailyMetricsArray,
      deals_data: leads
    };
    
    const result = await aiService.getExecutiveDashboard(data);
    res.json(result);
  } catch (error) {
    console.error('Executive Dashboard Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get Priority Scores
// @route   GET /api/ai/priority-engine
// @access  Private
const getPriorityScores = async (req, res) => {
  try {
    if (!(await checkAIServiceHealth(res))) return;
    const tasks = [];
    
    // Get leads as tasks
    const leads = await Lead.find({ 
      status: { $in: ['Pending', 'Processing'] } 
    }).lean();
    leads.forEach(lead => {
      tasks.push({
        id: lead._id.toString(),
        type: 'lead',
        name: lead.school_name,
        due_date: lead.follow_up_date,
        amount: lead.products?.reduce((sum, p) => sum + (p.unit_price * p.quantity), 0) || 0,
        status: lead.status,
        priority: lead.priority
      });
    });
    
    // Get pending payments
    const payments = await Payment.find({ status: 'Pending' }).lean();
    payments.forEach(payment => {
      tasks.push({
        id: payment._id.toString(),
        type: 'payment',
        name: payment.customerName,
        due_date: payment.paymentDate,
        amount: payment.amount,
        status: payment.status
      });
    });
    
    // Get pending DCs
    const dcs = await DC.find({ 
      status: { $in: ['pending_dc', 'warehouse_processing'] } 
    }).lean();
    dcs.forEach(dc => {
      const total = dc.productDetails?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
      tasks.push({
        id: dc._id.toString(),
        type: 'dc',
        name: dc.customerName,
        due_date: dc.deliveryDate,
        amount: total,
        status: dc.status
      });
    });
    
    const result = await aiService.calculatePriorityScores({ tasks });
    res.json(result);
  } catch (error) {
    console.error('Priority Engine Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get Deal Risk Scores
// @route   GET /api/ai/deal-risk-scoring
// @access  Private
const getDealRiskScores = async (req, res) => {
  try {
    if (!(await checkAIServiceHealth(res))) return;
    const leads = await Lead.find({ 
      status: { $in: ['Pending', 'Processing', 'Saved'] } 
    }).lean();
    
    const sales = await Sale.find({ 
      status: { $ne: 'Closed' } 
    }).lean();
    
    const deals = [...leads, ...sales].map(deal => ({
      ...deal,
      total_amount: deal.totalAmount || deal.products?.reduce((sum, p) => sum + (p.unit_price * p.quantity), 0) || 0
    }));
    
    const result = await aiService.scoreDealRisk({ deals });
    res.json(result);
  } catch (error) {
    console.error('Deal Risk Scoring Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get Performance Risk Index
// @route   GET /api/ai/performance-risk
// @access  Private
const getPerformanceRisk = async (req, res) => {
  try {
    if (!(await checkAIServiceHealth(res))) return;
    const managers = await User.find({ 
      role: { $in: ['Manager', 'Executive Manager', 'Senior Coordinator'] } 
    }).lean();
    
    const performanceData = await Promise.all(
      managers.map(async (manager) => {
        // Get manager's metrics
        const leads = await Lead.find({ 
          managed_by: manager._id 
        }).lean();
        
        const sales = await Sale.find({ 
          assignedTo: manager._id 
        }).lean();
        
        const payments = await Payment.find({ 
          createdBy: manager._id 
        }).lean();
        
        const closedDeals = sales.filter(s => s.status === 'Closed').length;
        const conversionRate = leads.length > 0 ? closedDeals / leads.length : 0;
        const avgDealSize = sales.length > 0 
          ? sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0) / sales.length 
          : 0;
        
        // Calculate payment delay
        const approvedPayments = payments.filter(p => p.status === 'Approved');
        const paymentDelays = approvedPayments.map(p => {
          if (p.paymentDate && p.approvedAt) {
            return (new Date(p.approvedAt) - new Date(p.paymentDate)) / (1000 * 60 * 60 * 24);
          }
          return 0;
        });
        const avgPaymentDelay = paymentDelays.length > 0 
          ? paymentDelays.reduce((a, b) => a + b, 0) / paymentDelays.length 
          : 0;
        
        // DC completion rate
        const dcs = await DC.find({ 
          createdBy: manager._id 
        }).lean();
        const completedDCs = dcs.filter(dc => dc.status === 'completed').length;
        const dcCompletionRate = dcs.length > 0 ? completedDCs / dcs.length : 0;
        
        return {
          id: manager._id.toString(),
          name: manager.name,
          zone: manager.zone || '',
          metrics: {
            conversion_rate: conversionRate,
            avg_deal_size: avgDealSize,
            avg_payment_delay: avgPaymentDelay,
            dc_completion_rate: dcCompletionRate,
            lead_count: leads.length,
            closed_deals: closedDeals
          }
        };
      })
    );
    
    const result = await aiService.detectPerformanceAnomalies({ performance_data: performanceData });
    res.json(result);
  } catch (error) {
    console.error('Performance Risk Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get Fraud Detection Alerts
// @route   GET /api/ai/fraud-detection
// @access  Private
const getFraudDetection = async (req, res) => {
  try {
    if (!(await checkAIServiceHealth(res))) return;
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const expenses = await Expense.find({ 
      createdAt: { $gte: startDate } 
    }).lean();
    
    const payments = await Payment.find({ 
      paymentDate: { $gte: startDate } 
    }).lean();
    
    const transactions = [
      ...expenses.map(e => ({
        id: e._id.toString(),
        type: 'expense',
        amount: e.amount || 0,
        date: e.createdAt,
        category: e.category || '',
        user_id: e.createdBy?.toString()
      })),
      ...payments.map(p => ({
        id: p._id.toString(),
        type: 'payment',
        amount: p.amount || 0,
        date: p.paymentDate || p.createdAt,
        category: p.paymentMethod || '',
        user_id: p.createdBy?.toString()
      }))
    ];
    
    const result = await aiService.detectFraudAnomalies({ transactions });
    res.json(result);
  } catch (error) {
    console.error('Fraud Detection Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get Cashflow Analysis
// @route   GET /api/ai/cashflow-analyzer
// @access  Private
const getCashflowAnalysis = async (req, res) => {
  try {
    if (!(await checkAIServiceHealth(res))) return;
    const payments = await Payment.find({}).lean();
    
    const paymentData = payments.map(p => ({
      id: p._id.toString(),
      amount: p.amount || 0,
      paymentDate: p.paymentDate,
      status: p.status,
      expectedDate: p.paymentDate // Can be enhanced with expected dates
    }));
    
    const result = await aiService.analyzeCashflowBlockages({ payments: paymentData });
    res.json(result);
  } catch (error) {
    console.error('Cashflow Analyzer Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get Delay Cost Calculator
// @route   GET /api/ai/delay-cost-calculator
// @access  Private
const getDelayCosts = async (req, res) => {
  try {
    if (!(await checkAIServiceHealth(res))) return;
    const dcs = await DC.find({}).lean();
    
    const operationalEvents = dcs.map(dc => {
      const total = dc.productDetails?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
      return {
        id: dc._id.toString(),
        type: 'dc',
        created_at: dc.createdAt,
        completed_at: dc.completedAt,
        expected_completion: dc.deliveryDate,
        amount: total,
        status: dc.status
      };
    });
    
    const result = await aiService.calculateDelayCosts({ operational_events: operationalEvents });
    res.json(result);
  } catch (error) {
    console.error('Delay Cost Calculator Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get Churn Predictions
// @route   GET /api/ai/churn-predictor
// @access  Private
const getChurnPredictions = async (req, res) => {
  try {
    if (!(await checkAIServiceHealth(res))) return;
    
    // Get comprehensive customer data
    const leads = await Lead.find({ 
      status: { $in: ['Saved', 'Closed'] } 
    }).lean();
    
    const sales = await Sale.find({}).lean();
    const payments = await Payment.find({}).lean();
    const contactQueries = await ContactQuery.find({}).lean();
    const trainings = await Training.find({}).lean();
    const services = await Service.find({}).lean();
    
    // Aggregate customer data with enhanced metrics
    const customerMap = new Map();
    const now = new Date();
    
    // Process leads
    leads.forEach(lead => {
      const key = lead.school_name || lead.contact_mobile;
      const schoolCode = lead.school_code;
      if (!customerMap.has(key)) {
        const createdAt = new Date(lead.createdAt);
        const customerAgeDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
        
        customerMap.set(key, {
          id: lead._id.toString(),
          name: lead.school_name,
          school_code: schoolCode,
          total_orders: 0,
          total_revenue: 0,
          last_order_date: lead.updatedAt,
          first_order_date: lead.createdAt,
          customer_age_days: customerAgeDays,
          avg_payment_delay: 0,
          complaint_count: 0,
          renewal_count: 0,
          training_count: 0,
          service_count: 0,
          interaction_count: 0,
          unresolved_queries: 0,
          recent_orders_3m: 0,
          previous_orders_3m: 0
        });
      }
      const customer = customerMap.get(key);
      customer.total_orders += 1;
      customer.renewal_count += lead.status === 'Saved' ? 1 : 0;
      
      // Track recent vs previous orders
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      const leadDate = new Date(lead.updatedAt);
      
      if (leadDate >= threeMonthsAgo) {
        customer.recent_orders_3m += 1;
      } else if (leadDate >= sixMonthsAgo) {
        customer.previous_orders_3m += 1;
      }
    });
    
    // Process sales
    sales.forEach(sale => {
      const key = sale.customerName || sale.customerPhone;
      if (!customerMap.has(key)) {
        const saleDate = new Date(sale.saleDate);
        const customerAgeDays = Math.floor((now - saleDate) / (1000 * 60 * 60 * 24));
        
        customerMap.set(key, {
          id: sale._id.toString(),
          name: sale.customerName,
          total_orders: 0,
          total_revenue: 0,
          last_order_date: sale.saleDate,
          first_order_date: sale.saleDate,
          customer_age_days: customerAgeDays,
          avg_payment_delay: 0,
          complaint_count: 0,
          renewal_count: 0,
          training_count: 0,
          service_count: 0,
          interaction_count: 0,
          unresolved_queries: 0,
          recent_orders_3m: 0,
          previous_orders_3m: 0
        });
      }
      const customer = customerMap.get(key);
      customer.total_orders += 1;
      customer.total_revenue += sale.totalAmount || 0;
      
      const saleDate = new Date(sale.saleDate);
      if (saleDate > new Date(customer.last_order_date)) {
        customer.last_order_date = sale.saleDate;
      }
      
      // Track recent vs previous orders
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      
      if (saleDate >= threeMonthsAgo) {
        customer.recent_orders_3m += 1;
      } else if (saleDate >= sixMonthsAgo) {
        customer.previous_orders_3m += 1;
      }
    });
    
    // Process payments with better delay calculation
    const paymentDelays = [];
    payments.forEach(payment => {
      const key = payment.customerName || payment.mobileNumber;
      if (customerMap.has(key)) {
        const customer = customerMap.get(key);
        if (payment.paymentDate) {
          const paymentDate = new Date(payment.paymentDate);
          const approvedDate = payment.approvedAt ? new Date(payment.approvedAt) : now;
          const delay = Math.floor((approvedDate - paymentDate) / (1000 * 60 * 60 * 24));
          
          if (delay > 0) {
            paymentDelays.push({ key, delay });
          }
        }
      }
    });
    
    // Calculate average payment delays
    const delayMap = new Map();
    paymentDelays.forEach(({ key, delay }) => {
      if (!delayMap.has(key)) {
        delayMap.set(key, []);
      }
      delayMap.get(key).push(delay);
    });
    
    delayMap.forEach((delays, key) => {
      if (customerMap.has(key)) {
        const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
        customerMap.get(key).avg_payment_delay = avgDelay;
      }
    });
    
    // Process contact queries (interactions and complaints)
    contactQueries.forEach(query => {
      const key = query.school_name || query.contact_mobile;
      if (customerMap.has(key)) {
        const customer = customerMap.get(key);
        customer.interaction_count += 1;
        
        if (query.status === 'Pending' || query.status === 'In Progress') {
          customer.unresolved_queries += 1;
        }
        
        // Check if it's a complaint (negative sentiment keywords)
        const complaintKeywords = ['complaint', 'issue', 'problem', 'dissatisfied', 'unhappy', 'poor'];
        const description = (query.description || '').toLowerCase();
        if (complaintKeywords.some(keyword => description.includes(keyword))) {
          customer.complaint_count += 1;
        }
      }
    });
    
    // Process training engagements
    trainings.forEach(training => {
      const schoolName = training.schoolName;
      const schoolCode = training.schoolCode;
      
      // Match by school code first (most reliable), then by name
      let matched = false;
      for (const [key, customer] of customerMap.entries()) {
        if (schoolCode && customer.school_code === schoolCode) {
          customer.training_count += 1;
          matched = true;
          break;
        }
      }
      
      // Fallback to name matching if code didn't match
      if (!matched && schoolName) {
        for (const [key, customer] of customerMap.entries()) {
          if (customer.name === schoolName || 
              (customer.name && schoolName && (
                customer.name.toLowerCase().includes(schoolName.toLowerCase()) || 
                schoolName.toLowerCase().includes(customer.name.toLowerCase())
              ))) {
            customer.training_count += 1;
            break;
          }
        }
      }
    });
    
    // Process service engagements
    services.forEach(service => {
      const schoolName = service.schoolName;
      const schoolCode = service.schoolCode;
      
      // Match by school code first (most reliable), then by name
      let matched = false;
      for (const [key, customer] of customerMap.entries()) {
        if (schoolCode && customer.school_code === schoolCode) {
          customer.service_count += 1;
          matched = true;
          break;
        }
      }
      
      // Fallback to name matching if code didn't match
      if (!matched && schoolName) {
        for (const [key, customer] of customerMap.entries()) {
          if (customer.name === schoolName || 
              (customer.name && schoolName && (
                customer.name.toLowerCase().includes(schoolName.toLowerCase()) || 
                schoolName.toLowerCase().includes(customer.name.toLowerCase())
              ))) {
            customer.service_count += 1;
            break;
          }
        }
      }
    });
    
    const customers = Array.from(customerMap.values());
    
    const result = await aiService.predictChurn({ customers });
    res.json(result);
  } catch (error) {
    console.error('Churn Predictor Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get Narrative BI
// @route   GET /api/ai/narrative-bi
// @access  Private
const getNarrativeBI = async (req, res) => {
  try {
    // Check if AI service is available
    if (!(await checkAIServiceHealth(res))) return;

    // Get all relevant data
    let revenueAtRisk, dealRisks, performanceRisks, cashflow;
    
    try {
      revenueAtRisk = await aiService.calculateRevenueAtRisk({
        invoices: [],
        deals: await Lead.find({ status: { $in: ['Pending', 'Processing'] } }).lean(),
        payments: await Payment.find({ status: 'Pending' }).lean()
      });
    } catch (err) {
      console.error('Revenue at Risk sub-error:', err);
      revenueAtRisk = { total_revenue_at_risk: 0, high_risk_items: [] };
    }
    
    try {
      dealRisks = await aiService.scoreDealRisk({
        deals: await Lead.find({ status: { $in: ['Pending', 'Processing'] } }).lean()
      });
    } catch (err) {
      console.error('Deal Risk sub-error:', err);
      dealRisks = { deal_risks: [] };
    }
    
    try {
      performanceRisks = await aiService.detectPerformanceAnomalies({
        performance_data: [] // Will be populated if needed
      });
    } catch (err) {
      console.error('Performance Risk sub-error:', err);
      performanceRisks = { performance_risks: [] };
    }
    
    try {
      cashflow = await aiService.analyzeCashflowBlockages({
        payments: await Payment.find({}).lean()
      });
    } catch (err) {
      console.error('Cashflow sub-error:', err);
      cashflow = { bottlenecks: [] };
    }
    
    // Calculate revenue trend
    const sales = await Sale.find({ 
      saleDate: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } 
    }).lean();
    
    const recentRevenue = sales
      .filter(s => s.saleDate >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    
    const previousRevenue = sales
      .filter(s => {
        const date = s.saleDate;
        return date >= new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) && 
               date < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      })
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    
    const revenueChange = previousRevenue > 0 
      ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;
    
    const dataSummary = {
      revenue_trend: revenueChange > 5 ? 'increasing' : revenueChange < -5 ? 'decreasing' : 'stable',
      revenue_change: revenueChange,
      revenue_at_risk: revenueAtRisk.total_revenue_at_risk || 0,
      high_risk_deals: dealRisks.deal_risks?.filter(d => d.risk_level === 'High') || [],
      high_risk_managers: performanceRisks.performance_risks?.filter(p => p.risk_level === 'High') || [],
      pending_approvals: await Lead.countDocuments({ status: 'Pending' }),
      cashflow_issues: cashflow.bottlenecks || [],
      fraud_alerts: [],
      churn_risks: [],
      total_delay_cost: 0
    };
    
    try {
      const result = await aiService.generateNarrativeBI(dataSummary);
      res.json(result);
    } catch (err) {
      console.error('Narrative BI generation error:', err);
      // Return a basic narrative even if AI service fails
      res.json({
        summary: 'Business operations are running. Some AI insights are temporarily unavailable.',
        overall_assessment: 'System is operational. AI service connection issues detected.',
        key_insights: ['AI service needs to be started for detailed insights'],
        recommended_actions: ['Start the Python AI service: cd ai-service && python app.py'],
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Narrative BI Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.message.includes('not running') ? 'Please start the Python AI service: cd ai-service && python app.py' : undefined
    });
  }
};

module.exports = {
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
};
