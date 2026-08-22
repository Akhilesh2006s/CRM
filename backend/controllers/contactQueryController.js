const mongoose = require('mongoose');
const ContactQuery = require('../models/ContactQuery');
const Lead = require('../models/Lead');
require('../models/User');
const ExcelJS = require('exceljs');

function dateRange(fromDate, toDate) {
  if (!fromDate && !toDate) return null;
  const range = {};
  if (fromDate) range.$gte = new Date(fromDate);
  if (toDate) range.$lte = new Date(`${toDate}T23:59:59.999Z`);
  return range;
}

function mapLeadToEnquiry(lead) {
  const products = (lead.products || [])
    .map((p) => p && p.product_name)
    .filter(Boolean)
    .join(', ');
  const executiveDoc = lead.managed_by || lead.createdBy || null;
  const executive =
    executiveDoc && typeof executiveDoc === 'object'
      ? {
          _id: executiveDoc._id,
          name: executiveDoc.name,
          email: executiveDoc.email,
        }
      : executiveDoc;

  return {
    _id: lead._id,
    school_code: lead.school_code || '',
    school_type: lead.lead_type === 'renewal' ? 'Existing' : 'New',
    school_name: lead.school_name || '',
    zone: lead.zone || '',
    executive,
    town: lead.location || lead.city || lead.area || '',
    subject: products || 'School enquiry',
    description:
      lead.remarks ||
      lead.recommendations ||
      (lead.contact_person ? `Contact: ${lead.contact_person}` : ''),
    contact_mobile: lead.contact_mobile || '',
    contact_person: lead.contact_person || '',
    enquiry_date: lead.createdAt,
    status: lead.status || 'Pending',
    source: 'lead',
    createdBy: lead.createdBy,
  };
}

async function listEnquiries(query = {}) {
  const { zone, employee, schoolName, schoolCode, contactMobile, fromDate, toDate } = query;
  const cqFilter = {};
  const leadFilter = {};

  if (zone) {
    const zoneFilter = { $regex: zone, $options: 'i' };
    cqFilter.zone = zoneFilter;
    leadFilter.zone = zoneFilter;
  }
  if (schoolName) {
    const nameFilter = { $regex: schoolName, $options: 'i' };
    cqFilter.school_name = nameFilter;
    leadFilter.school_name = nameFilter;
  }
  if (schoolCode) {
    const codeFilter = { $regex: schoolCode, $options: 'i' };
    cqFilter.school_code = codeFilter;
    leadFilter.school_code = codeFilter;
  }
  if (contactMobile) {
    const mobileFilter = { $regex: contactMobile, $options: 'i' };
    cqFilter.contact_mobile = mobileFilter;
    leadFilter.contact_mobile = mobileFilter;
  }

  const employeeId =
    employee && mongoose.Types.ObjectId.isValid(employee) ? employee : '';
  if (employeeId) {
    cqFilter.executive = employeeId;
    leadFilter.$or = [{ managed_by: employeeId }, { createdBy: employeeId }];
  }

  const range = dateRange(fromDate, toDate);
  if (range) {
    cqFilter.enquiry_date = range;
    leadFilter.createdAt = range;
  }

  const [queries, leads] = await Promise.all([
    ContactQuery.find(cqFilter)
      .populate('executive', 'name email')
      .populate('createdBy', 'name email')
      .populate('resolved_by', 'name email')
      .lean(),
    Lead.find(leadFilter)
      .populate('createdBy', 'name email')
      .populate('managed_by', 'name email')
      .lean(),
  ]);

  const queryRows = (queries || []).map((row) => ({
    ...row,
    source: 'query',
    enquiry_date: row.enquiry_date || row.createdAt,
    contact_person: row.contact_person || '',
  }));
  const leadRows = (leads || []).map(mapLeadToEnquiry);

  return [...queryRows, ...leadRows].sort((a, b) => {
    const aTime = a.enquiry_date ? new Date(a.enquiry_date).getTime() : 0;
    const bTime = b.enquiry_date ? new Date(b.enquiry_date).getTime() : 0;
    return bTime - aTime;
  });
}

// @desc    Get all contact queries (plus school contact records from leads)
// @route   GET /api/contact-queries
// @access  Private
const getContactQueries = async (req, res) => {
  try {
    const rows = await listEnquiries(req.query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single contact query
// @route   GET /api/contact-queries/:id
// @access  Private
const getContactQuery = async (req, res) => {
  try {
    const query = await ContactQuery.findById(req.params.id)
      .populate('executive', 'name email')
      .populate('createdBy', 'name email')
      .populate('resolved_by', 'name email');

    if (query) {
      return res.json(query);
    }

    const lead = await Lead.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('managed_by', 'name email');

    if (!lead) {
      return res.status(404).json({ message: 'Contact query not found' });
    }

    res.json(mapLeadToEnquiry(lead.toObject ? lead.toObject() : lead));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create contact query
// @route   POST /api/contact-queries/create
// @access  Private
const createContactQuery = async (req, res) => {
  try {
    const query = await ContactQuery.create({
      ...req.body,
      createdBy: req.user._id,
    });

    const populatedQuery = await ContactQuery.findById(query._id)
      .populate('executive', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedQuery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update contact query
// @route   PUT /api/contact-queries/:id
// @access  Private
const updateContactQuery = async (req, res) => {
  try {
    const query = await ContactQuery.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('executive', 'name email')
      .populate('createdBy', 'name email')
      .populate('resolved_by', 'name email');

    if (!query) {
      return res.status(404).json({ message: 'Contact query not found' });
    }

    res.json(query);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete contact query
// @route   DELETE /api/contact-queries/:id
// @access  Private
const deleteContactQuery = async (req, res) => {
  try {
    const query = await ContactQuery.findByIdAndDelete(req.params.id);

    if (!query) {
      return res.status(404).json({ message: 'Contact query not found' });
    }

    res.json({ message: 'Contact query deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export contact queries to Excel
// @route   GET /api/contact-queries/export
// @access  Private
const exportContactQueries = async (req, res) => {
  try {
    const queries = await listEnquiries(req.query);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contact Enquiries');

    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'School Code', key: 'schoolCode', width: 15 },
      { header: 'School Type', key: 'schoolType', width: 15 },
      { header: 'School Name', key: 'schoolName', width: 30 },
      { header: 'Zone', key: 'zone', width: 15 },
      { header: 'Executive', key: 'executive', width: 25 },
      { header: 'Town', key: 'town', width: 30 },
      { header: 'Contact Person', key: 'contactPerson', width: 22 },
      { header: 'Contact Mobile', key: 'contactMobile', width: 18 },
      { header: 'Subject', key: 'subject', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Date of Enquiry', key: 'enquiryDate', width: 22 },
    ];

    queries.forEach((query, index) => {
      worksheet.addRow({
        sno: index + 1,
        schoolCode: query.school_code || '',
        schoolType: query.school_type || 'Existing',
        schoolName: query.school_name || '',
        zone: query.zone || '',
        executive: query.executive?.name || 'Not Assigned',
        town: query.town || '',
        contactPerson: query.contact_person || '',
        contactMobile: query.contact_mobile || '',
        subject: query.subject || '',
        description: query.description || '',
        status: query.status || '',
        enquiryDate: query.enquiry_date
          ? new Date(query.enquiry_date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          : '',
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Contact_Enquiries_Report_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getContactQueries,
  getContactQuery,
  createContactQuery,
  updateContactQuery,
  deleteContactQuery,
  exportContactQueries,
};
