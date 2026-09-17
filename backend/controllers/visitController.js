const Visit = require('../models/Visit');
const Lead = require('../models/Lead');
const DcOrder = require('../models/DcOrder');
const ExcelJS = require('exceljs');
const { VISIT_CATEGORIES, VISIT_OUTCOMES } = require('../constants/visitCategories');

/** Roles that may see every visit; everyone else is scoped to their own. */
const OVERSIGHT_ROLES = new Set([
  'Super Admin',
  'Admin',
  'Manager',
  'Executive Manager',
  'Coordinator',
  'Senior Coordinator',
  'Finance Manager',
]);

const canSeeAll = (user) => OVERSIGHT_ROLES.has(String(user?.role || '').trim());

/** Build the visit filter shared by the list and the report. */
const buildVisitFilter = (req) => {
  const {
    zone,
    executiveId,
    employeeId,
    schoolName,
    schoolCode,
    category,
    fromDate,
    toDate,
    contactMobile,
  } = req.query;

  const filter = {};
  // UI historically sent employeeId; Visit model uses executiveId.
  const execFilter = executiveId || employeeId;

  if (!canSeeAll(req.user)) {
    filter.executiveId = req.user._id;
  } else if (execFilter && execFilter !== 'all') {
    filter.executiveId = execFilter;
  }

  if (zone && zone !== 'all') filter.zone = zone;
  if (category && category !== 'all') filter.category = category;
  if (schoolCode) filter.schoolCode = new RegExp(String(schoolCode).trim(), 'i');
  if (schoolName) filter.schoolName = new RegExp(String(schoolName).trim(), 'i');
  if (contactMobile) filter.contactMobile = new RegExp(String(contactMobile).trim(), 'i');

  if (fromDate || toDate) {
    filter.visitDate = {};
    if (fromDate) filter.visitDate.$gte = new Date(fromDate);
    if (toDate) filter.visitDate.$lte = new Date(`${toDate}T23:59:59.999Z`);
  }

  return filter;
};

// @desc    Create a school visit (field action)
// @route   POST /api/visits
// @access  Private
const createVisit = async (req, res) => {
  try {
    const {
      leadId,
      dcOrderId,
      schoolName,
      schoolCode,
      contactMobile,
      zone,
      cluster,
      town,
      state,
      visitDate,
      category,
      outcome,
      remarks,
      latitude,
      longitude,
      locationAccuracy,
      photo,
      nextVisitDate,
      trainingDate,
      products,
    } = req.body;

    if (!category) {
      return res.status(400).json({ message: 'Visit category is required' });
    }
    if (!VISIT_CATEGORIES.includes(category)) {
      return res
        .status(400)
        .json({ message: `Invalid visit category. Allowed: ${VISIT_CATEGORIES.join(', ')}` });
    }
    if (outcome && !VISIT_OUTCOMES.includes(outcome)) {
      return res
        .status(400)
        .json({ message: `Invalid outcome. Allowed: ${VISIT_OUTCOMES.join(', ')}` });
    }
    if (!leadId && !dcOrderId && !schoolName) {
      return res
        .status(400)
        .json({ message: 'A visit must reference a lead, a client, or at least a school name' });
    }

    // Snapshot school details from the linked record when not supplied.
    const snapshot = {
      schoolName,
      schoolCode,
      contactMobile,
      zone,
      cluster,
      town,
      state,
    };

    if (leadId) {
      const lead = await Lead.findById(leadId).lean();
      if (!lead) return res.status(404).json({ message: 'Lead not found' });
      snapshot.schoolName = snapshot.schoolName || lead.school_name;
      snapshot.schoolCode = snapshot.schoolCode || lead.school_code;
      snapshot.contactMobile = snapshot.contactMobile || lead.contact_mobile;
      snapshot.zone = snapshot.zone || lead.zone;
      snapshot.cluster = snapshot.cluster || lead.cluster;
      snapshot.town = snapshot.town || lead.city || lead.location;
      snapshot.state = snapshot.state || lead.state;
    } else if (dcOrderId) {
      const order = await DcOrder.findById(dcOrderId).lean();
      if (!order) return res.status(404).json({ message: 'Client (DC order) not found' });
      snapshot.schoolName = snapshot.schoolName || order.school_name;
      snapshot.schoolCode = snapshot.schoolCode || order.school_code;
      snapshot.contactMobile = snapshot.contactMobile || order.contact_mobile;
      snapshot.zone = snapshot.zone || order.zone;
    }

    if (!snapshot.schoolName) {
      return res.status(400).json({ message: 'School name could not be determined' });
    }

    const visit = await Visit.create({
      leadId: leadId || undefined,
      dcOrderId: dcOrderId || undefined,
      ...snapshot,
      executiveId: req.user._id,
      visitDate: visitDate ? new Date(visitDate) : new Date(),
      category,
      outcome,
      remarks,
      latitude,
      longitude,
      locationAccuracy,
      photo,
      nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : undefined,
      trainingDate: trainingDate ? new Date(trainingDate) : undefined,
      trainingRequested: Boolean(trainingDate),
      products: Array.isArray(products) ? products : [],
      createdBy: req.user._id,
    });

    // A visit moves the lead forward: push the follow-up date and priority.
    if (leadId) {
      const leadUpdate = {};
      if (nextVisitDate) leadUpdate.follow_up_date = new Date(nextVisitDate);
      if (outcome && ['Hot', 'Warm', 'Cold'].includes(outcome)) leadUpdate.priority = outcome;
      if (Object.keys(leadUpdate).length) {
        leadUpdate.$push = {
          updateHistory: {
            follow_up_date: nextVisitDate ? new Date(nextVisitDate) : undefined,
            remarks: remarks || `Visit logged (${category})`,
            priority: outcome,
            updatedBy: req.user._id,
            updatedAt: new Date(),
          },
        };
        await Lead.findByIdAndUpdate(leadId, leadUpdate).catch((err) =>
          console.warn('Visit created but lead follow-up not updated:', err?.message)
        );
      }
    }

    const populated = await Visit.findById(visit._id).populate('executiveId', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    List visits (Sales Visit report). Non-oversight roles see only their own.
// @route   GET /api/visits
// @access  Private
const getVisits = async (req, res) => {
  try {
    const filter = buildVisitFilter(req);
    const limit = Math.min(parseInt(req.query.limit, 10) || 500, 2000);

    const visits = await Visit.find(filter)
      .populate('executiveId', 'name email')
      .sort({ visitDate: -1 })
      .limit(limit);

    res.json(visits);
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Visits logged by the signed-in user
// @route   GET /api/visits/my
// @access  Private
const getMyVisits = async (req, res) => {
  try {
    const visits = await Visit.find({ executiveId: req.user._id })
      .sort({ visitDate: -1 })
      .limit(200);
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Visit categories + outcomes (for dropdowns)
// @route   GET /api/visits/categories
// @access  Private
const getVisitCategories = async (_req, res) => {
  res.json({ categories: VISIT_CATEGORIES, outcomes: VISIT_OUTCOMES });
};

// @desc    Single visit
// @route   GET /api/visits/:id
// @access  Private
const getVisit = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('executiveId', 'name email')
      .populate('leadId', 'school_name school_code')
      .populate('dcOrderId', 'school_name school_code');

    if (!visit) return res.status(404).json({ message: 'Visit not found' });

    if (!canSeeAll(req.user) && String(visit.executiveId?._id || visit.executiveId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(visit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a visit (own visit, or oversight role)
// @route   PUT /api/visits/:id
// @access  Private
const updateVisit = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) return res.status(404).json({ message: 'Visit not found' });

    if (!canSeeAll(req.user) && String(visit.executiveId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only edit your own visits' });
    }

    const { category, outcome } = req.body;
    if (category && !VISIT_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid visit category' });
    }
    if (outcome && !VISIT_OUTCOMES.includes(outcome)) {
      return res.status(400).json({ message: 'Invalid outcome' });
    }

    const editable = [
      'category',
      'outcome',
      'remarks',
      'nextVisitDate',
      'trainingDate',
      'products',
      'photo',
    ];
    editable.forEach((key) => {
      if (req.body[key] !== undefined) visit[key] = req.body[key];
    });
    if (req.body.trainingDate !== undefined) {
      visit.trainingRequested = Boolean(req.body.trainingDate);
    }

    await visit.save();
    res.json(visit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Visit summary stats (per executive / per category)
// @route   GET /api/visits/stats
// @access  Private
const getVisitStats = async (req, res) => {
  try {
    const filter = buildVisitFilter(req);

    const [byCategory, byExecutive, total] = await Promise.all([
      Visit.aggregate([{ $match: filter }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
      Visit.aggregate([
        { $match: filter },
        { $group: { _id: '$executiveId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 50 },
      ]),
      Visit.countDocuments(filter),
    ]);

    res.json({ total, byCategory, byExecutive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export sales visit report to Excel
// @route   GET /api/visits/export
// @access  Private
const exportVisits = async (req, res) => {
  try {
    const filter = buildVisitFilter(req);
    const visits = await Visit.find(filter)
      .populate('executiveId', 'name email')
      .sort({ visitDate: -1 })
      .limit(5000);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Visit Report');

    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'School Code', key: 'schoolCode', width: 15 },
      { header: 'School Name', key: 'schoolName', width: 30 },
      { header: 'Zone', key: 'zone', width: 15 },
      { header: 'Executive', key: 'executive', width: 25 },
      { header: 'Town', key: 'town', width: 30 },
      { header: 'Visit Category', key: 'visitCategory', width: 20 },
      { header: 'Visit Remarks', key: 'visitRemarks', width: 40 },
      { header: 'Visit Date', key: 'visitDate', width: 20 },
    ];

    visits.forEach((visit, index) => {
      worksheet.addRow({
        sno: index + 1,
        schoolCode: visit.schoolCode || '',
        schoolName: visit.schoolName || '',
        zone: visit.zone || '',
        executive: visit.executiveId?.name || 'Not Assigned',
        town: visit.town || '',
        visitCategory: visit.category || '',
        visitRemarks: visit.remarks || '',
        visitDate: visit.visitDate
          ? new Date(visit.visitDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          : '',
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Sales_Visit_Report_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting visits:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createVisit,
  getVisits,
  getMyVisits,
  getVisitCategories,
  getVisit,
  updateVisit,
  getVisitStats,
  exportVisits,
};
