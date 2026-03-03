const PartnerCost = require('../models/VendorCost');
const DcOrder = require('../models/DcOrder');

/**
 * @route   GET /api/franchises/:franchiseEmail/dashboard
 * @access  Private
 * Returns dashboard data for a franchise including assigned schools
 */
const getFranchiseDashboard = async (req, res) => {
  try {
    const { franchiseEmail } = req.params;
    
    if (!franchiseEmail) {
      return res.status(400).json({ message: 'Franchise email is required' });
    }

    // Find all partner cost configurations that have this franchise
    const partnerCosts = await PartnerCost.find({
      'products.franchises.franchiseEmail': franchiseEmail.toLowerCase()
    })
      .populate('partnerId', 'name email')
      .populate('products.productId', 'productName')
      .populate('products.franchises.schools.schoolId', 'school_name school_code zone location contact_person contact_mobile')
      .lean();

    if (!partnerCosts || partnerCosts.length === 0) {
      return res.json({
        franchiseEmail: franchiseEmail.toLowerCase(),
        franchiseName: '',
        assignedSchools: [],
        products: [],
        totalSchools: 0,
        totalZones: 0,
      });
    }

    // Collect all franchises matching this email
    const franchises = [];
    const assignedSchoolIds = new Set();
    const zones = new Set();
    let franchiseName = '';

    partnerCosts.forEach(partnerCost => {
      partnerCost.products?.forEach(product => {
        product.franchises?.forEach(franchise => {
          if (franchise.franchiseEmail?.toLowerCase() === franchiseEmail.toLowerCase()) {
            if (!franchiseName && franchise.franchiseName) {
              franchiseName = franchise.franchiseName;
            }
            
            // Collect zones
            if (franchise.zones && Array.isArray(franchise.zones)) {
              franchise.zones.forEach(zone => zones.add(zone));
            }
            
            // Collect schools
            if (franchise.schools && Array.isArray(franchise.schools)) {
              franchise.schools.forEach(school => {
                if (school.schoolId) {
                  const schoolId = typeof school.schoolId === 'object' ? school.schoolId._id?.toString() : school.schoolId.toString();
                  if (schoolId && !assignedSchoolIds.has(schoolId)) {
                    assignedSchoolIds.add(schoolId);
                    
                    // Get school details
                    const schoolData = typeof school.schoolId === 'object' ? school.schoolId : null;
                    franchises.push({
                      productName: product.productName || '',
                      productId: product.productId?.toString() || '',
                      franchiseName: franchise.franchiseName || '',
                      franchiseCost: franchise.franchiseCost || 0,
                      zones: franchise.zones || [],
                      school: {
                        _id: schoolId,
                        schoolName: school.schoolName || (schoolData?.school_name || ''),
                        schoolCode: school.schoolCode || (schoolData?.school_code || ''),
                        zone: schoolData?.zone || '',
                        location: schoolData?.location || '',
                        contactPerson: schoolData?.contact_person || '',
                        contactMobile: schoolData?.contact_mobile || '',
                      }
                    });
                  }
                }
              });
            }
          }
        });
      });
    });

    // Get unique schools (grouped by school ID)
    const uniqueSchools = new Map();
    franchises.forEach(item => {
      const schoolId = item.school._id;
      if (!uniqueSchools.has(schoolId)) {
        uniqueSchools.set(schoolId, {
          ...item.school,
          products: [],
          franchises: [],
        });
      }
      const school = uniqueSchools.get(schoolId);
      if (!school.products.includes(item.productName)) {
        school.products.push(item.productName);
      }
      if (!school.franchises.some(f => f.name === item.franchiseName)) {
        school.franchises.push({
          name: item.franchiseName,
          cost: item.franchiseCost,
        });
      }
    });

    const assignedSchools = Array.from(uniqueSchools.values());

    // Group by product
    const products = [];
    const productMap = new Map();
    
    partnerCosts.forEach(partnerCost => {
      partnerCost.products?.forEach(product => {
        product.franchises?.forEach(franchise => {
          if (franchise.franchiseEmail?.toLowerCase() === franchiseEmail.toLowerCase()) {
            const productId = product.productId?.toString() || '';
            if (!productMap.has(productId)) {
              productMap.set(productId, {
                productId,
                productName: product.productName || '',
                defaultCost: product.defaultCost || 0,
                franchises: [],
              });
            }
            const prod = productMap.get(productId);
            if (!prod.franchises.some(f => f.name === franchise.franchiseName)) {
              prod.franchises.push({
                franchiseName: franchise.franchiseName,
                franchiseEmail: franchise.franchiseEmail,
                franchiseCost: franchise.franchiseCost || 0,
                zones: franchise.zones || [],
                schoolCount: franchise.schools?.length || 0,
              });
            }
          }
        });
      });
    });

    products.push(...Array.from(productMap.values()));

    res.json({
      franchiseEmail: franchiseEmail.toLowerCase(),
      franchiseName: franchiseName,
      assignedSchools,
      products,
      totalSchools: assignedSchools.length,
      totalZones: zones.size,
      zones: Array.from(zones).sort(),
    });
  } catch (error) {
    console.error('Error fetching franchise dashboard:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFranchiseDashboard,
};
