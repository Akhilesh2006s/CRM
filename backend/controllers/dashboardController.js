const Lead = require('../models/Lead');
const Sale = require('../models/Sale');
const Training = require('../models/Training');
const Service = require('../models/Service');
const Expense = require('../models/Expense');
const mongoose = require('mongoose');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    // Check if database is available
    if (mongoose.connection.readyState !== 1) {
      // Fallback to mock data if DB not connected
      const mockDataService = require('../services/mockDataService');
      const stats = await mockDataService.getDashboardStats();
      return res.json(stats);
    }

    // Get active leads (Hot or Warm status)
    const activeLeads = await Lead.countDocuments({
      priority: { $in: ['Hot', 'Warm'] },
      status: { $in: ['Pending', 'Processing', 'Saved'] }
    });

    // Get total sales amount
    const salesResult = await Sale.aggregate([
      {
        $match: { status: { $in: ['Confirmed', 'Completed'] } }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    const totalSales = salesResult.length > 0 ? salesResult[0].total : 0;

    // Get existing schools (count of leads/orders)
    const existingSchools = await Lead.countDocuments({});

    // Get pending trainings
    const pendingTrainings = await Training.countDocuments({ status: 'Scheduled' });

    // Get completed trainings
    const completedTrainings = await Training.countDocuments({ status: 'Completed' });

    // Get pending services
    const pendingServices = await Service.countDocuments({ status: 'Scheduled' });

    // Get completed services
    const completedServices = await Service.countDocuments({ status: 'Completed' });

    res.json({
      activeLeads,
      totalSales,
      existingSchools,
      pendingTrainings,
      completedTrainings,
      pendingServices,
      completedServices
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get leads by zone
// @route   GET /api/dashboard/leads-by-zone
// @access  Private
const getLeadsByZone = async (req, res) => {
  try {
    // Check if database is available
    if (mongoose.connection.readyState !== 1) {
      const mockDataService = require('../services/mockDataService');
      const zoneData = await mockDataService.getLeadsByZone();
      return res.json(zoneData);
    }

    // Aggregate leads by zone with status breakdown
    const zoneData = await Lead.aggregate([
      {
        $group: {
          _id: '$zone',
          total: { $sum: 1 },
          hot: {
            $sum: { $cond: [{ $eq: ['$priority', 'Hot'] }, 1, 0] }
          },
          warm: {
            $sum: { $cond: [{ $eq: ['$priority', 'Warm'] }, 1, 0] }
          },
          cold: {
            $sum: { $cond: [{ $eq: ['$priority', 'Cold'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          zone: '$_id',
          total: 1,
          hot: 1,
          warm: 1,
          cold: 1,
          _id: 0
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Format to match frontend expectation
    const formattedData = zoneData
      .filter(item => item.zone) // Filter out null/empty zones
      .map(item => ({
        zone: item.zone,
        total: item.total || 0,
        hot: item.hot || 0,
        warm: item.warm || 0,
        cold: item.cold || 0
      }));

    res.json(formattedData);
  } catch (error) {
    console.error('Leads by zone error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get revenue trends (weekly data)
// @route   GET /api/dashboard/revenue-trends
// @access  Private
const getRevenueTrends = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Return mock data if DB not connected
      return res.json([
        { name: 'Mon', leads: 22, sales: 5, revenue: 48000 },
        { name: 'Tue', leads: 28, sales: 8, revenue: 62000 },
        { name: 'Wed', leads: 31, sales: 10, revenue: 75000 },
        { name: 'Thu', leads: 24, sales: 6, revenue: 41000 },
        { name: 'Fri', leads: 35, sales: 11, revenue: 92000 },
        { name: 'Sat', leads: 29, sales: 7, revenue: 56000 },
        { name: 'Sun', leads: 18, sales: 3, revenue: 23000 },
      ]);
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const last7Days = [];

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      last7Days.push(date);
    }

    const trends = [];

    for (const date of last7Days) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayName = dayNames[date.getDay()];

      // Get leads created on this day
      const leadsCount = await Lead.countDocuments({
        createdAt: { $gte: date, $lt: nextDay }
      });

      // Get sales completed on this day
      const salesData = await Sale.aggregate([
        {
          $match: {
            saleDate: { $gte: date, $lt: nextDay },
            status: { $in: ['Confirmed', 'Completed'] }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$totalAmount' }
          }
        }
      ]);

      trends.push({
        name: dayName,
        leads: leadsCount,
        sales: salesData[0]?.count || 0,
        revenue: salesData[0]?.revenue || 0
      });
    }

    res.json(trends);
  } catch (error) {
    console.error('Revenue trends error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get leads volume by hour (last 24 hours)
// @route   GET /api/dashboard/leads-volume
// @access  Private
const getLeadsVolume = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Return mock data if DB not connected
      const mockVolume = [];
      for (let h = 1; h <= 24; h++) {
        mockVolume.push({
          hour: `${String(h).padStart(2, '0')}:00`,
          value: Math.floor(Math.random() * 100) + 30
        });
      }
      return res.json(mockVolume);
    }

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get leads created in last 24 hours grouped by hour
    const volumeData = await Lead.aggregate([
      {
        $match: {
          createdAt: { $gte: last24Hours }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%H:00', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Format to match frontend expectation (all 24 hours)
    const hourMap = {};
    volumeData.forEach(item => {
      hourMap[item._id] = item.count;
    });

    const formattedVolume = [];
    for (let h = 1; h <= 24; h++) {
      const hour = `${String(h).padStart(2, '0')}:00`;
      formattedVolume.push({
        hour,
        value: hourMap[hour] || 0
      });
    }

    res.json(formattedVolume);
  } catch (error) {
    console.error('Leads volume error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recent activities
// @route   GET /api/dashboard/recent-activities
// @access  Private
const getRecentActivities = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Return mock data if DB not connected
      return res.json([
        {
          id: '1',
          type: 'lead_created',
          message: 'New lead created',
          timestamp: new Date(),
          user: 'System'
        }
      ]);
    }

    const activities = [];

    // Recent leads (last 5)
    const recentLeads = await Lead.find({})
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(3)
      .select('school_name createdAt createdBy');

    recentLeads.forEach(lead => {
      activities.push({
        id: lead._id.toString(),
        type: 'lead_created',
        message: `Created new lead: ${lead.school_name}`,
        timestamp: lead.createdAt,
        user: lead.createdBy?.name || 'Unknown'
      });
    });

    // Recent sales (last 5)
    const recentSales = await Sale.find({
      status: { $in: ['Confirmed', 'Completed'] }
    })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(2)
      .select('customerName totalAmount createdAt createdBy');

    recentSales.forEach(sale => {
      activities.push({
        id: sale._id.toString(),
        type: 'sale_made',
        message: `Sale completed: ₹${sale.totalAmount.toLocaleString('en-IN')} - ${sale.customerName}`,
        timestamp: sale.createdAt,
        user: sale.createdBy?.name || 'Unknown'
      });
    });

    // Recent completed trainings
    const recentTrainings = await Training.find({ status: 'Completed' })
      .populate('createdBy', 'name')
      .sort({ trainingDate: -1 })
      .limit(2)
      .select('schoolName trainingDate createdBy');

    recentTrainings.forEach(training => {
      activities.push({
        id: training._id.toString(),
        type: 'training_completed',
        message: `Training completed: ${training.schoolName}`,
        timestamp: training.trainingDate || training.createdAt,
        user: training.createdBy?.name || 'Unknown'
      });
    });

    // Sort by timestamp and return most recent
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(activities.slice(0, 10)); // Return top 10 most recent
  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get alerts
// @route   GET /api/dashboard/alerts
// @access  Private
const getAlerts = async (req, res) => {
  try {
    const alerts = [];

    if (mongoose.connection.readyState === 1) {
      // Get hot leads that need follow-up today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const hotLeadsCount = await Lead.countDocuments({
        priority: 'Hot',
        follow_up_date: { $gte: today, $lt: tomorrow }
      });

      if (hotLeadsCount > 0) {
        alerts.push({
          level: 'warning',
          text: `Follow-up pending for ${hotLeadsCount} hot lead${hotLeadsCount > 1 ? 's' : ''} today`
        });
      }

      // Get trainings scheduled this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const trainingsThisWeek = await Training.countDocuments({
        status: 'Scheduled',
        trainingDate: { $gte: weekStart, $lt: weekEnd }
      });

      if (trainingsThisWeek > 0) {
        alerts.push({
          level: 'info',
          text: `${trainingsThisWeek} training${trainingsThisWeek > 1 ? 's' : ''} scheduled this week`
        });
      }

      // Get pending expenses
      const pendingExpensesCount = await Expense.countDocuments({ status: 'Pending' });
      if (pendingExpensesCount > 0) {
        alerts.push({
          level: 'warning',
          text: `${pendingExpensesCount} expense${pendingExpensesCount > 1 ? 's' : ''} pending manager approval`
        });
      }

      // Get finance pending expenses
      const financePendingCount = await Expense.countDocuments({ status: 'Finance Pending' });
      if (financePendingCount > 0) {
        alerts.push({
          level: 'info',
          text: `${financePendingCount} expense${financePendingCount > 1 ? 's' : ''} pending finance approval`
        });
      }
    } else {
      // Fallback alerts
      alerts.push({
        level: 'warning',
        text: 'Follow-up pending for 7 hot leads today'
      });
      alerts.push({
        level: 'info',
        text: '3 trainings scheduled this week'
      });
    }

    res.json(alerts);
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get zone wise leads analytics
// @route   GET /api/dashboard/leads-analytics/zone-wise
// @access  Private
const getZoneWiseLeads = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }

    const { fromDate, toDate } = req.query;
    const filter = {};

    // Add date filter if provided
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = from;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    const zoneData = await Lead.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$zone',
          total: { $sum: 1 },
          hot: { $sum: { $cond: [{ $eq: ['$priority', 'Hot'] }, 1, 0] } },
          warm: { $sum: { $cond: [{ $eq: ['$priority', 'Warm'] }, 1, 0] } },
          cold: { $sum: { $cond: [{ $eq: ['$priority', 'Cold'] }, 1, 0] } }
        }
      },
      {
        $project: {
          zone: { $ifNull: ['$_id', 'Unassigned'] },
          total: 1,
          hot: 1,
          warm: 1,
          cold: 1,
          _id: 0
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json(zoneData);
  } catch (error) {
    console.error('Zone wise leads error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get executive wise leads analytics
// @route   GET /api/dashboard/leads-analytics/executive-wise
// @access  Private
const getExecutiveWiseLeads = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }

    const { fromDate, toDate } = req.query;
    const filter = {};

    // Add date filter if provided
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = from;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = to;
      }
    }

    const executiveData = await Lead.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            zone: '$zone',
            executiveId: '$managed_by'
          },
          total: { $sum: 1 },
          hot: { $sum: { $cond: [{ $eq: ['$priority', 'Hot'] }, 1, 0] } },
          warm: { $sum: { $cond: [{ $eq: ['$priority', 'Warm'] }, 1, 0] } },
          cold: { $sum: { $cond: [{ $eq: ['$priority', 'Cold'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.executiveId',
          foreignField: '_id',
          as: 'executive'
        }
      },
      {
        $unwind: {
          path: '$executive',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          zone: { $ifNull: ['$_id.zone', 'Unassigned'] },
          executiveName: { $ifNull: ['$executive.name', 'Unassigned'] },
          total: 1,
          hot: 1,
          warm: 1,
          cold: 1,
          _id: 0
        }
      },
      { $sort: { zone: 1, total: -1 } }
    ]);

    res.json(executiveData);
  } catch (error) {
    console.error('Executive wise leads error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get zone wise closed leads
// @route   GET /api/dashboard/leads-analytics/zone-wise-closed
// @access  Private
const getZoneWiseClosedLeads = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }

    const { fromDate, toDate } = req.query;
    const filter = { status: 'Closed' };

    // Add date filter if provided
    if (fromDate || toDate) {
      filter.updatedAt = {};
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        filter.updatedAt.$gte = from;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        filter.updatedAt.$lte = to;
      }
    }

    const zoneData = await Lead.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$zone',
          totalClosed: { $sum: 1 }
        }
      },
      {
        $project: {
          zone: { $ifNull: ['$_id', 'Unassigned'] },
          totalClosed: 1,
          _id: 0
        }
      },
      { $sort: { totalClosed: -1 } }
    ]);

    res.json(zoneData);
  } catch (error) {
    console.error('Zone wise closed leads error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get executive wise closed leads
// @route   GET /api/dashboard/leads-analytics/executive-wise-closed
// @access  Private
const getExecutiveWiseClosedLeads = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }

    const { fromDate, toDate } = req.query;
    const filter = { status: 'Closed' };

    // Add date filter if provided
    if (fromDate || toDate) {
      filter.updatedAt = {};
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        filter.updatedAt.$gte = from;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        filter.updatedAt.$lte = to;
      }
    }

    const executiveData = await Lead.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            zone: '$zone',
            executiveId: '$managed_by'
          },
          totalClosed: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.executiveId',
          foreignField: '_id',
          as: 'executive'
        }
      },
      {
        $unwind: {
          path: '$executive',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          zone: { $ifNull: ['$_id.zone', 'Unassigned'] },
          executiveName: { $ifNull: ['$executive.name', 'Unassigned'] },
          totalClosed: 1,
          _id: 0
        }
      },
      { $sort: { zone: 1, totalClosed: -1 } }
    ]);

    res.json(executiveData);
  } catch (error) {
    console.error('Executive wise closed leads error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getLeadsByZone,
  getRevenueTrends,
  getLeadsVolume,
  getRecentActivities,
  getAlerts,
  getZoneWiseLeads,
  getExecutiveWiseLeads,
  getZoneWiseClosedLeads,
  getExecutiveWiseClosedLeads
};
