const Report = require('../models/Report');
const Sale = require('../models/Sale');
const Lead = require('../models/Lead');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const DC = require('../models/DC');
const DcOrder = require('../models/DcOrder');
const Warehouse = require('../models/Warehouse');
const StockReturn = require('../models/StockReturn');
const ChangeLog = require('../models/ChangeLog');
const Training = require('../models/Training');
const Service = require('../models/Service');
const Product = require('../models/Product');
const User = require('../models/User');
const ExcelJS = require('exceljs');

function lineTotal(p) {
  const total = Number(p?.total);
  if (Number.isFinite(total) && total > 0) return total;
  return (Number(p?.quantity) || 0) * (Number(p?.price ?? p?.unit_price) || 0);
}

function dcRevenue(dc) {
  const lines = Array.isArray(dc?.productDetails) ? dc.productDetails : [];
  const fromLines = lines.reduce((sum, p) => sum + lineTotal(p), 0);
  if (fromLines > 0) return fromLines;
  return Number(dc?.dcOrderId?.total_amount) || 0;
}

async function sendWorkbook(res, workbook, filename) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  await workbook.xlsx.write(res);
  res.end();
}

function dateRange(fromDate, toDate, field = 'createdAt') {
  if (!fromDate && !toDate) return null;
  const range = {};
  if (fromDate) range.$gte = new Date(fromDate);
  if (toDate) range.$lte = new Date(`${toDate}T23:59:59.999Z`);
  return { [field]: range };
}

function actorOf(doc, users) {
  const id = doc.createdBy || doc.employeeId || doc.managed_by;
  const user = id ? users.get(String(id)) : null;
  return {
    actorName: user?.name || '',
    actorEmail: user?.email || '',
  };
}

const FIELD_LABELS = {
  Lead: [
    ['school_name', 'School Name'],
    ['school_code', 'School Code'],
    ['contact_person', 'Contact Person'],
    ['contact_mobile', 'Contact Mobile'],
    ['zone', 'Zone'],
    ['status', 'Status'],
    ['location', 'Location'],
    ['priority', 'Priority'],
  ],
  DC: [
    ['customerName', 'School / Customer'],
    ['status', 'Status'],
    ['dcCategory', 'Category'],
    ['dcRemarks', 'Remarks'],
  ],
  DcOrder: [
    ['school_name', 'School Name'],
    ['school_code', 'School Code'],
    ['zone', 'Zone'],
    ['contact_person', 'Contact Person'],
    ['contact_mobile', 'Contact Mobile'],
    ['status', 'Status'],
    ['workflowStage', 'Stage'],
  ],
  Expense: [
    ['title', 'Title'],
    ['category', 'Category'],
    ['amount', 'Amount'],
    ['status', 'Status'],
  ],
  Product: [
    ['productName', 'Product Name'],
  ],
  Training: [
    ['schoolName', 'School Name'],
    ['subject', 'Subject'],
    ['status', 'Status'],
    ['zone', 'Zone'],
  ],
  Service: [
    ['schoolName', 'School Name'],
    ['subject', 'Subject'],
    ['status', 'Status'],
    ['zone', 'Zone'],
  ],
};

function hasFieldValue(value) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function fieldsForDoc(entityType, doc) {
  return (FIELD_LABELS[entityType] || [])
    .filter(([key]) => hasFieldValue(doc[key]))
    .map(([, label]) => label);
}

function appendHistory(rows, { entityType, doc, label, users }) {
  const actor = actorOf(doc, users);
  const fields = fieldsForDoc(entityType, doc);
  const createdAt = doc.createdAt ? new Date(doc.createdAt) : null;
  if (createdAt && !Number.isNaN(createdAt.getTime())) {
    rows.push({
      _id: `${entityType}-${doc._id}-create`,
      entityType,
      entityId: doc._id,
      action: 'create',
      summary: `${entityType} created — ${label}`,
      fields,
      ...actor,
      createdAt,
    });
  }
  if (doc.updatedAt) {
    const updatedAt = new Date(doc.updatedAt);
    if (!Number.isNaN(updatedAt.getTime()) && (!createdAt || updatedAt.getTime() - createdAt.getTime() > 60 * 1000)) {
      rows.push({
        _id: `${entityType}-${doc._id}-update`,
        entityType,
        entityId: doc._id,
        action: 'update',
        summary: `${entityType} updated — ${label}`,
        fields,
        ...actor,
        createdAt: updatedAt,
      });
    }
  }
}

function matchesLogFilters(row, { entityType, action, fromDate, toDate, search }) {
  if (entityType && entityType !== 'all' && row.entityType !== entityType) return false;
  if (action && action !== 'all' && row.action !== action) return false;
  if (fromDate || toDate) {
    const when = row.createdAt ? new Date(row.createdAt).getTime() : 0;
    if (fromDate && when < new Date(fromDate).getTime()) return false;
    if (toDate && when > new Date(`${toDate}T23:59:59.999Z`).getTime()) return false;
  }
  if (search) {
    const q = String(search).toLowerCase();
    const hay = `${row.summary || ''} ${row.actorName || ''} ${row.actorEmail || ''} ${row.entityType || ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

async function collectChangeLogRows(query = {}) {
  const want = (type) => !query.entityType || query.entityType === 'all' || query.entityType === type;
  const users = new Map(
    (await User.find().select('name email').lean()).map((u) => [String(u._id), u])
  );
  const rows = [];

  const jobs = [];
  if (want('Lead')) {
    jobs.push(
      Lead.find().select('school_name school_code contact_person contact_mobile zone status location priority createdBy createdAt updatedAt').lean().then((docs) => {
        docs.forEach((doc) =>
          appendHistory(rows, {
            entityType: 'Lead',
            doc,
            label: doc.school_name || doc.school_code || String(doc._id),
            users,
          })
        );
      })
    );
  }
  if (want('DC')) {
    jobs.push(
      DC.find().select('customerName status dcCategory dcRemarks createdBy employeeId createdAt updatedAt').lean().then((docs) => {
        docs.forEach((doc) =>
          appendHistory(rows, {
            entityType: 'DC',
            doc,
            label: doc.customerName || String(doc._id),
            users,
          })
        );
      })
    );
  }
  if (want('DcOrder')) {
    jobs.push(
      DcOrder.find().select('school_name school_code zone contact_person contact_mobile status workflowStage createdBy createdAt updatedAt').lean().then((docs) => {
        docs.forEach((doc) =>
          appendHistory(rows, {
            entityType: 'DcOrder',
            doc,
            label: doc.school_name || doc.school_code || String(doc._id),
            users,
          })
        );
      })
    );
  }
  if (want('Expense')) {
    jobs.push(
      Expense.find().select('title category amount status createdBy createdAt updatedAt').lean().then((docs) => {
        docs.forEach((doc) =>
          appendHistory(rows, {
            entityType: 'Expense',
            doc,
            label: doc.title || doc.category || String(doc._id),
            users,
          })
        );
      })
    );
  }
  if (want('Product')) {
    jobs.push(
      Product.find().select('productName createdBy createdAt updatedAt').lean().then((docs) => {
        docs.forEach((doc) =>
          appendHistory(rows, {
            entityType: 'Product',
            doc,
            label: doc.productName || String(doc._id),
            users,
          })
        );
      })
    );
  }
  if (want('Training')) {
    jobs.push(
      Training.find().select('schoolName subject status zone createdBy createdAt updatedAt').lean().then((docs) => {
        docs.forEach((doc) =>
          appendHistory(rows, {
            entityType: 'Training',
            doc,
            label: `${doc.schoolName || 'School'}${doc.subject ? ` (${doc.subject})` : ''}`,
            users,
          })
        );
      })
    );
  }
  if (want('Service')) {
    jobs.push(
      Service.find().select('schoolName subject status zone createdBy createdAt updatedAt').lean().then((docs) => {
        docs.forEach((doc) =>
          appendHistory(rows, {
            entityType: 'Service',
            doc,
            label: `${doc.schoolName || 'School'}${doc.subject ? ` (${doc.subject})` : ''}`,
            users,
          })
        );
      })
    );
  }

  await Promise.all(jobs);

  try {
    const persisted = await ChangeLog.find().lean();
    persisted.forEach((row) => {
      rows.push({
        _id: String(row._id),
        entityType: row.entityType,
        entityId: row.entityId,
        action: row.action,
        summary: row.summary,
        fields: row.fields || [],
        actorName: row.actorName,
        actorEmail: row.actorEmail,
        createdAt: row.createdAt,
      });
    });
  } catch (_) {
    /* Atlas may block creating/using a dedicated changelogs collection */
  }

  return rows
    .filter((row) => matchesLogFilters(row, query))
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
}

// @desc    Get all reports
// @route   GET /api/reports/all
// @access  Private
const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('generatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sales analytics from DC pipeline (not legacy Sale)
// @route   GET /api/reports/sales
// @access  Private
const getSalesReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    const range = dateRange(startDate, endDate, 'createdAt');
    if (range) Object.assign(filter, range);

    const dcs = await DC.find(filter)
      .select('status productDetails dcOrderId createdAt')
      .populate('dcOrderId', 'total_amount')
      .lean()
      .maxTimeMS(20000);

    const totalSales = dcs.length;
    const totalRevenue = dcs.reduce((sum, dc) => sum + dcRevenue(dc), 0);
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

    const salesByStatus = dcs.reduce((acc, dc) => {
      const key = dc.status || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalSales,
      totalRevenue,
      averageSale,
      salesByStatus,
      sales: [],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate custom report
// @route   POST /api/reports/generate
// @access  Private
const generateReport = async (req, res) => {
  try {
    const { reportType, title, dateRange, filters } = req.body;

    let data = {};

    switch (reportType) {
      case 'Sales':
        const salesFilter = {};
        if (dateRange?.startDate) salesFilter.saleDate = { $gte: new Date(dateRange.startDate) };
        if (dateRange?.endDate) {
          salesFilter.saleDate = {
            ...salesFilter.saleDate,
            $lte: new Date(dateRange.endDate),
          };
        }
        data.sales = await Sale.find(salesFilter);
        break;

      case 'Leads': {
        const allowed = {};
        const src = filters && typeof filters === 'object' ? filters : {};
        if (src.status) allowed.status = src.status;
        if (src.zone) allowed.zone = src.zone;
        data.leads = await Lead.find(allowed).limit(2000);
        break;
      }

      case 'Payments':
        const paymentFilter = {};
        if (dateRange?.startDate) paymentFilter.paymentDate = { $gte: new Date(dateRange.startDate) };
        if (dateRange?.endDate) {
          paymentFilter.paymentDate = {
            ...paymentFilter.paymentDate,
            $lte: new Date(dateRange.endDate),
          };
        }
        data.payments = await Payment.find(paymentFilter);
        break;

      case 'Expenses':
        const expenseFilter = {};
        if (dateRange?.startDate) expenseFilter.date = { $gte: new Date(dateRange.startDate) };
        if (dateRange?.endDate) {
          expenseFilter.date = {
            ...expenseFilter.date,
            $lte: new Date(dateRange.endDate),
          };
        }
        data.expenses = await Expense.find(expenseFilter);
        break;

      default:
        break;
    }

    const report = await Report.create({
      reportType,
      title,
      dateRange,
      filters,
      data,
      generatedBy: req.user._id,
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listChangeLogs = async (req, res) => {
  try {
    const { entityType, action, fromDate, toDate, search, page = 1, limit = 50 } = req.query;
    const rows = await collectChangeLogRows({ entityType, action, fromDate, toDate, search });
    const take = Math.min(200, parseInt(limit, 10) || 50);
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const skip = (currentPage - 1) * take;
    res.json({
      data: rows.slice(skip, skip + take),
      total: rows.length,
      page: currentPage,
      limit: take,
      stats: (() => {
        let creates = 0;
        let updates = 0;
        let deletes = 0;
        const counts = {};
        rows.forEach((row) => {
          const act = String(row.action || '').toLowerCase();
          if (act === 'create') creates += 1;
          else if (act === 'update') updates += 1;
          else if (act === 'delete') deletes += 1;
          const type = row.entityType || 'Unknown';
          counts[type] = (counts[type] || 0) + 1;
        });
        const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const topEntity = ranked.length >= 2
          ? `${ranked[0][0]} & ${ranked[1][0]}`
          : (ranked[0]?.[0] || '—');
        return { creates, updates, deletes, topEntity };
      })(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportChangeLogs = async (req, res) => {
  try {
    const { entityType, action, fromDate, toDate, search } = req.query;
    const rows = (await collectChangeLogRows({ entityType, action, fromDate, toDate, search })).slice(0, 5000);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Change Logs');
    sheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'When', key: 'when', width: 22 },
      { header: 'Entity', key: 'entityType', width: 16 },
      { header: 'Action', key: 'action', width: 12 },
      { header: 'Summary', key: 'summary', width: 40 },
      { header: 'Fields', key: 'fields', width: 30 },
      { header: 'User', key: 'user', width: 24 },
    ];
    rows.forEach((row, i) => {
      sheet.addRow({
        sno: i + 1,
        when: row.createdAt ? new Date(row.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
        entityType: row.entityType || '',
        action: row.action || '',
        summary: row.summary || '',
        fields: (row.fields || []).join(', '),
        user: row.actorName || row.actorEmail || '',
      });
    });
    sheet.getRow(1).font = { bold: true };
    await sendWorkbook(res, workbook, `Change_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportStockReport = async (req, res) => {
  try {
    const items = await Warehouse.find().sort({ productName: 1 }).lean();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Stock');
    sheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Product', key: 'productName', width: 28 },
      { header: 'Code', key: 'productCode', width: 14 },
      { header: 'Category', key: 'category', width: 16 },
      { header: 'Current Stock', key: 'currentStock', width: 14 },
      { header: 'Min Stock', key: 'minStock', width: 12 },
      { header: 'Unit Price', key: 'unitPrice', width: 12 },
      { header: 'Location', key: 'location', width: 18 },
      { header: 'Supplier', key: 'supplier', width: 18 },
      { header: 'Status', key: 'status', width: 14 },
    ];
    items.forEach((item, i) => {
      sheet.addRow({
        sno: i + 1,
        productName: item.productName || '',
        productCode: item.productCode || '',
        category: item.category || '',
        currentStock: item.currentStock || 0,
        minStock: item.minStock || 0,
        unitPrice: item.unitPrice || 0,
        location: item.location || '',
        supplier: item.supplier || item.vendor || '',
        status: item.status || '',
      });
    });
    sheet.getRow(1).font = { bold: true };
    await sendWorkbook(res, workbook, `Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportDcReport = async (req, res) => {
  try {
    const { status, fromDate, toDate } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    const range = dateRange(fromDate, toDate, 'createdAt');
    if (range) {
      filter.$or = [{ dcDate: range.createdAt }, { createdAt: range.createdAt }];
    }
    const dcs = await DC.find(filter)
      .populate('dcOrderId', 'school_name school_code zone contact_person contact_mobile dc_code')
      .populate('employeeId', 'name')
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('DC Report');
    sheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'DC Code', key: 'dcCode', width: 16 },
      { header: 'School', key: 'school', width: 28 },
      { header: 'School Code', key: 'schoolCode', width: 14 },
      { header: 'Zone', key: 'zone', width: 14 },
      { header: 'Executive', key: 'executive', width: 20 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'DC Date', key: 'dcDate', width: 14 },
      { header: 'Amount', key: 'amount', width: 12 },
    ];
    dcs.forEach((dc, i) => {
      sheet.addRow({
        sno: i + 1,
        dcCode: dc.dc_code || dc.dcOrderId?.dc_code || '',
        school: dc.dcOrderId?.school_name || dc.customerName || '',
        schoolCode: dc.dcOrderId?.school_code || '',
        zone: dc.dcOrderId?.zone || '',
        executive: dc.employeeId?.name || '',
        status: dc.status || '',
        dcDate: dc.dcDate
          ? new Date(dc.dcDate).toLocaleDateString('en-IN')
          : dc.createdAt
            ? new Date(dc.createdAt).toLocaleDateString('en-IN')
            : '',
        amount: dcRevenue(dc),
      });
    });
    sheet.getRow(1).font = { bold: true };
    await sendWorkbook(res, workbook, `DC_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportReturnsReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const dateFilter = dateRange(fromDate, toDate, 'createdAt') || {};
    const [executive, warehouse] = await Promise.all([
      StockReturn.find({ sourceType: 'Executive', ...dateFilter })
        .populate('createdBy', 'name')
        .populate('leadId', 'school_name')
        .sort({ createdAt: -1 })
        .lean(),
      StockReturn.find({ sourceType: { $ne: 'Executive' }, ...dateFilter })
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .lean(),
    ]);
    const workbook = new ExcelJS.Workbook();
    const addSheet = (name, rows, isExec) => {
      const sheet = workbook.addWorksheet(name);
      sheet.columns = [
        { header: 'S.No', key: 'sno', width: 8 },
        { header: 'Return #', key: 'returnNumber', width: 12 },
        { header: 'Created By', key: 'createdBy', width: 20 },
        ...(isExec ? [{ header: 'School', key: 'school', width: 24 }] : []),
        { header: 'LR No', key: 'lrNumber', width: 14 },
        { header: 'Fin Year', key: 'finYear', width: 12 },
        { header: 'Return Date', key: 'returnDate', width: 14 },
        { header: 'Remarks', key: 'remarks', width: 30 },
      ];
      rows.forEach((row, i) => {
        sheet.addRow({
          sno: i + 1,
          returnNumber: row.returnNumber || '',
          createdBy: row.createdBy?.name || '',
          school: row.leadId?.school_name || '',
          lrNumber: row.lrNumber || '',
          finYear: row.finYear || '',
          returnDate: row.returnDate ? new Date(row.returnDate).toLocaleDateString('en-IN') : '',
          remarks: row.remarks || '',
        });
      });
      sheet.getRow(1).font = { bold: true };
    };
    addSheet('Executive Returns', executive, true);
    addSheet('Warehouse Returns', warehouse, false);
    await sendWorkbook(res, workbook, `Returns_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportTrainingReport = async (req, res) => {
  try {
    const { fromDate, toDate, zone } = req.query;
    const trainingFilter = {};
    const serviceFilter = {};
    if (zone) {
      trainingFilter.zone = zone;
      serviceFilter.zone = zone;
    }
    const tRange = dateRange(fromDate, toDate, 'trainingDate');
    const sRange = dateRange(fromDate, toDate, 'serviceDate');
    if (tRange) Object.assign(trainingFilter, tRange);
    if (sRange) Object.assign(serviceFilter, sRange);

    const [trainings, services] = await Promise.all([
      Training.find(trainingFilter).populate('trainerId', 'name').sort({ trainingDate: -1 }).limit(3000).lean(),
      Service.find(serviceFilter).populate('trainerId', 'name').sort({ serviceDate: -1 }).limit(3000).lean(),
    ]);

    const workbook = new ExcelJS.Workbook();
    const addSheet = (name, rows, dateKey) => {
      const sheet = workbook.addWorksheet(name);
      sheet.columns = [
        { header: 'S.No', key: 'sno', width: 8 },
        { header: 'School', key: 'school', width: 28 },
        { header: 'Zone', key: 'zone', width: 14 },
        { header: 'Subject', key: 'subject', width: 18 },
        { header: 'Trainer', key: 'trainer', width: 20 },
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Status', key: 'status', width: 14 },
      ];
      rows.forEach((row, i) => {
        const when = row[dateKey] || row.createdAt;
        sheet.addRow({
          sno: i + 1,
          school: row.schoolName || '',
          zone: row.zone || '',
          subject: row.subject || '',
          trainer: row.trainerId?.name || '',
          date: when ? new Date(when).toLocaleDateString('en-IN') : '',
          status: row.status || '',
        });
      });
      sheet.getRow(1).font = { bold: true };
    };
    addSheet('Trainings', trainings, 'trainingDate');
    addSheet('Services', services, 'serviceDate');
    await sendWorkbook(res, workbook, `Training_Service_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllReports,
  getSalesReports,
  generateReport,
  listChangeLogs,
  exportChangeLogs,
  exportStockReport,
  exportDcReport,
  exportReturnsReport,
  exportTrainingReport,
};
