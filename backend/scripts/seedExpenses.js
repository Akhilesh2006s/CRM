require('dotenv').config();
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const User = require('../models/User');
const connectDB = require('../config/db');

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// Sample expense data based on the image
const sampleExpenses = [
  {
    employeeName: 'Swarna Kumar',
    amount: 417.60,
    expType: 'Travel',
    category: 'Travel',
    raisedDate: new Date('2025-10-31T18:01:40'),
    pendingMonths: 'October',
    status: 'Pending',
    title: 'Travel Expense - Swarna Kumar',
    description: 'Travel expense for Swarna Kumar',
    expItemId: '94758',
    gpsDistance: '174 Kms',
    expenseDescription: '174 Kms Dwaraka tirumala+14 to Konthamuru By Bike',
    dateOfExpense: new Date('2025-10-16'),
    employeeRemarks: 'Petrol',
    billImage: 'https://via.placeholder.com/300x400?text=Bill+Receipt+94758',
  },
  {
    employeeName: 'Mokesh',
    amount: 196.80,
    expType: 'Travel',
    category: 'Travel',
    raisedDate: new Date('2025-10-31T17:45:46'),
    pendingMonths: 'October',
    status: 'Pending',
    title: 'Travel Expense - Mokesh',
    description: 'Travel expense for Mokesh',
    expItemId: '94759',
    gpsDistance: '',
    expenseDescription: 'Annapurna hotel,',
    dateOfExpense: new Date('2025-10-17'),
    employeeRemarks: 'Breakfast and lunch',
    billImage: 'https://via.placeholder.com/300x400?text=Bill+Receipt+94759',
  },
  {
    employeeName: 'Yerri swamy',
    amount: 48.00,
    expType: 'Travel',
    category: 'Travel',
    raisedDate: new Date('2025-10-31T16:26:29'),
    pendingMonths: 'October',
    status: 'Pending',
    title: 'Travel Expense - Yerri swamy',
    description: 'Travel expense for Yerri swamy',
    expItemId: '94764',
    gpsDistance: '170 Kms',
    expenseDescription: '170 Kms Dwarakatirumala+14 to Meerjapuram Teo branches By Bike',
    dateOfExpense: new Date('2025-10-16'),
    employeeRemarks: 'Distance between two branches 10kms',
    billImage: 'https://via.placeholder.com/300x400?text=Bill+Receipt+94764',
  },
  {
    employeeName: 'P shiva kumar',
    amount: 55.20,
    expType: 'Travel',
    category: 'Travel',
    raisedDate: new Date('2025-10-31T07:53:26'),
    pendingMonths: 'October',
    status: 'Pending',
    title: 'Travel Expense - P shiva kumar',
    description: 'Travel expense for P shiva kumar',
    expItemId: '94765',
    gpsDistance: '120 Kms',
    expenseDescription: 'Travel from office to client location and back',
    dateOfExpense: new Date('2025-10-18'),
    employeeRemarks: 'Petrol and toll charges',
    billImage: 'https://via.placeholder.com/300x400?text=Bill+Receipt+94765',
  },
  {
    employeeName: 'B SRAVANTHI',
    amount: 20.00,
    expType: 'Others',
    category: 'Others',
    raisedDate: new Date('2025-10-30T20:08:01'),
    pendingMonths: 'October',
    status: 'Pending',
    title: 'Other Expense - B SRAVANTHI',
    description: 'Other expense for B SRAVANTHI',
    expItemId: '94766',
    gpsDistance: '',
    expenseDescription: 'Miscellaneous office supplies',
    dateOfExpense: new Date('2025-10-17'),
    employeeRemarks: 'Stationery items',
    billImage: 'https://via.placeholder.com/300x400?text=Bill+Receipt+94766',
  },
  // Add more sample expenses
  {
    employeeName: 'Rajesh Kumar',
    amount: 125.50,
    expType: 'Travel',
    category: 'Travel',
    raisedDate: new Date('2025-10-29T14:30:00'),
    pendingMonths: 'October',
    status: 'Pending',
    title: 'Travel Expense - Rajesh Kumar',
    description: 'Travel expense for Rajesh Kumar',
    expItemId: '94767',
    gpsDistance: '95 Kms',
    expenseDescription: 'Client visit to multiple locations',
    dateOfExpense: new Date('2025-10-19'),
    employeeRemarks: 'Fuel charges',
    billImage: 'https://via.placeholder.com/300x400?text=Bill+Receipt+94767',
  },
  {
    employeeName: 'Priya Sharma',
    amount: 89.75,
    expType: 'Office Supplies',
    category: 'Office Supplies',
    raisedDate: new Date('2025-10-28T10:15:00'),
    pendingMonths: 'October',
    status: 'Pending',
    title: 'Office Supplies - Priya Sharma',
    description: 'Office supplies expense for Priya Sharma',
    expItemId: '94768',
    gpsDistance: '',
    expenseDescription: 'Printer paper and toner cartridges',
    dateOfExpense: new Date('2025-10-20'),
    employeeRemarks: 'Office stationery',
    billImage: 'https://via.placeholder.com/300x400?text=Bill+Receipt+94768',
  },
  {
    employeeName: 'Anil Reddy',
    amount: 234.90,
    expType: 'Travel',
    category: 'Travel',
    raisedDate: new Date('2025-10-27T16:45:00'),
    pendingMonths: 'October',
    status: 'Pending',
    title: 'Travel Expense - Anil Reddy',
    description: 'Travel expense for Anil Reddy',
    expItemId: '94769',
    gpsDistance: '210 Kms',
    expenseDescription: 'Field visit to schools in different zones',
    dateOfExpense: new Date('2025-10-21'),
    employeeRemarks: 'Petrol and parking',
    billImage: 'https://via.placeholder.com/300x400?text=Bill+Receipt+94769',
  },
  {
    employeeName: 'Sneha Patel',
    amount: 156.40,
    expType: 'Marketing',
    category: 'Marketing',
    raisedDate: new Date('2025-10-26T11:20:00'),
    pendingMonths: 'October',
    status: 'Pending',
    title: 'Marketing Expense - Sneha Patel',
    description: 'Marketing expense for Sneha Patel',
    expItemId: '94770',
    gpsDistance: '',
    expenseDescription: 'Marketing materials and promotional items',
    dateOfExpense: new Date('2025-10-22'),
    employeeRemarks: 'Marketing collateral',
    billImage: 'https://via.placeholder.com/300x400?text=Bill+Receipt+94770',
  },
  {
    employeeName: 'Vikram Singh',
    amount: 312.60,
    expType: 'Travel',
    category: 'Travel',
    raisedDate: new Date('2025-10-25T09:30:00'),
    pendingMonths: 'October',
    status: 'Pending',
    title: 'Travel Expense - Vikram Singh',
    description: 'Travel expense for Vikram Singh',
    expItemId: '94771',
    gpsDistance: '280 Kms',
    expenseDescription: 'Long distance client meeting',
    dateOfExpense: new Date('2025-10-23'),
    employeeRemarks: 'Fuel and toll',
    billImage: 'https://via.placeholder.com/300x400?text=Bill+Receipt+94771',
  },
];

async function seedExpenses() {
  try {
    // Connect to database
    await connectDB();

    // Wait a bit for connection to establish
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if we have any users to use as createdBy
    let adminUser = await User.findOne({ role: { $in: ['Super Admin', 'Admin'] } });
    
    if (!adminUser) {
      // Create a default admin user if none exists
      console.log('No admin user found, creating one...');
      adminUser = await User.create({
        name: 'System Admin',
        email: 'admin@viswamedutech.com',
        password: 'Admin@123',
        role: 'Super Admin',
        isActive: true,
      });
      console.log('Created admin user:', adminUser.email);
    }

    // Try to find employees by name, or create placeholder users
    const employeeMap = new Map();
    
    for (const expenseData of sampleExpenses) {
      let employee = null;
      
      // Try to find employee by name
      employee = await User.findOne({ 
        name: { $regex: new RegExp(expenseData.employeeName.split(' ')[0], 'i') },
        role: 'Employee'
      });

      if (!employee) {
        // Create a placeholder employee user if not found
        const email = `${expenseData.employeeName.toLowerCase().replace(/\s+/g, '.')}@viswamedutech.com`;
        employee = await User.findOne({ email }) || await User.create({
          name: expenseData.employeeName,
          email: email,
          password: 'Employee@123',
          role: 'Employee',
          isActive: true,
        });
        console.log(`Created/found employee: ${employee.name}`);
      }

      if (!employeeMap.has(expenseData.employeeName)) {
        employeeMap.set(expenseData.employeeName, employee._id);
      }
    }

    // Clear existing expenses (optional - comment out if you want to keep existing)
    const deleteResultPending = await Expense.deleteMany({ status: 'Pending' });
    const deleteResultFinance = await Expense.deleteMany({ status: 'Finance Pending' });
    console.log(`Cleared ${deleteResultPending.deletedCount} pending expenses and ${deleteResultFinance.deletedCount} finance pending expenses`);

    // Create manager users for approval
    const managerNames = ['Janardhan', 'Pramod', 'Srikanth Mgr', 'Jagadish'];
    const managerMap = new Map();
    
    for (const managerName of managerNames) {
      const email = `${managerName.toLowerCase().replace(/\s+/g, '.')}@viswamedutech.com`;
      let manager = await User.findOne({ email }) || await User.create({
        name: managerName,
        email: email,
        password: 'Manager@123',
        role: 'Admin',
        isActive: true,
      });
      managerMap.set(managerName, manager._id);
      console.log(`Created/found manager: ${manager.name}`);
    }

    // Create expenses - split into pending and finance pending
    const createdExpenses = [];
    const financePendingData = [
      {
        employeeName: 'H ACHYUTH',
        amount: 156.00,
        approvalAmount: 156.00,
        approvedManager: 'Janardhan',
        expType: 'Travel',
        category: 'Travel',
        raisedDate: new Date('2025-10-25T10:00:00'),
        pendingMonths: 'October',
        status: 'Finance Pending',
        title: 'Travel Expense - H ACHYUTH',
        description: 'Client visit and travel expense',
        expItemId: '94780',
        gpsDistance: '120 Kms',
        expenseDescription: 'Client visit and travel',
        dateOfExpense: new Date('2025-10-15'),
        employeeRemarks: 'Petrol charges',
      },
      {
        employeeName: 'Mounika',
        amount: 148.80,
        approvalAmount: 148.00,
        approvedManager: 'Pramod',
        expType: 'Travel',
        category: 'Travel',
        raisedDate: new Date('2025-07-20T14:30:00'),
        pendingMonths: 'July',
        status: 'Finance Pending',
        title: 'Travel Expense - Mounika',
        description: 'Office supplies and materials expense',
        expItemId: '94781',
        gpsDistance: '',
        expenseDescription: 'Office supplies and materials',
        dateOfExpense: new Date('2025-07-18'),
        employeeRemarks: 'Office items',
      },
      {
        employeeName: 'LINKAN BABU',
        amount: 120.00,
        approvalAmount: 120.00,
        approvedManager: 'Srikanth Mgr',
        expType: 'Travel',
        category: 'Travel',
        raisedDate: new Date('2025-06-15T09:15:00'),
        pendingMonths: 'June',
        status: 'Finance Pending',
        title: 'Travel Expense - LINKAN BABU',
        description: 'Field visit expenses',
        expItemId: '94782',
        gpsDistance: '95 Kms',
        expenseDescription: 'Field visit expenses',
        dateOfExpense: new Date('2025-06-12'),
        employeeRemarks: 'Fuel and parking',
      },
      {
        employeeName: 'Rajesh Kumar',
        amount: 225.50,
        approvalAmount: 220.00,
        approvedManager: 'Jagadish',
        expType: 'Travel',
        category: 'Travel',
        raisedDate: new Date('2025-04-10T11:20:00'),
        pendingMonths: 'April',
        status: 'Finance Pending',
        title: 'Travel Expense - Rajesh Kumar',
        description: 'Multiple client visits expense',
        expItemId: '94783',
        gpsDistance: '180 Kms',
        expenseDescription: 'Multiple client visits',
        dateOfExpense: new Date('2025-04-08'),
        employeeRemarks: 'Travel expenses',
      },
      {
        employeeName: 'Priya Sharma',
        amount: 89.75,
        approvalAmount: 89.75,
        approvedManager: 'Janardhan',
        expType: 'Office Supplies',
        category: 'Office Supplies',
        raisedDate: new Date('2025-02-28T16:00:00'),
        pendingMonths: 'February',
        status: 'Finance Pending',
        title: 'Office Supplies - Priya Sharma',
        description: 'Stationery and office materials expense',
        expItemId: '94784',
        gpsDistance: '',
        expenseDescription: 'Stationery and office materials',
        dateOfExpense: new Date('2025-02-25'),
        employeeRemarks: 'Office supplies',
      },
      {
        employeeName: 'Anil Reddy',
        amount: 234.90,
        approvalAmount: 230.00,
        approvedManager: 'Pramod',
        expType: 'Travel',
        category: 'Travel',
        raisedDate: new Date('2025-11-12T10:30:00'),
        pendingMonths: 'November',
        status: 'Finance Pending',
        title: 'Travel Expense - Anil Reddy',
        description: 'Long distance client meeting expense',
        expItemId: '94785',
        gpsDistance: '200 Kms',
        expenseDescription: 'Long distance client meeting',
        dateOfExpense: new Date('2025-11-10'),
        employeeRemarks: 'Fuel charges',
      },
      {
        employeeName: 'Sneha Patel',
        amount: 156.40,
        approvalAmount: 150.00,
        approvedManager: 'Srikanth Mgr',
        expType: 'Marketing',
        category: 'Marketing',
        raisedDate: new Date('2025-03-15T14:00:00'),
        pendingMonths: 'March',
        status: 'Finance Pending',
        title: 'Marketing Expense - Sneha Patel',
        description: 'Marketing materials purchase expense',
        expItemId: '94786',
        gpsDistance: '',
        expenseDescription: 'Marketing materials purchase',
        dateOfExpense: new Date('2025-03-12'),
        employeeRemarks: 'Marketing collateral',
      },
      {
        employeeName: 'Vikram Singh',
        amount: 312.60,
        approvalAmount: 310.00,
        approvedManager: 'Jagadish',
        expType: 'Travel',
        category: 'Travel',
        raisedDate: new Date('2025-10-28T09:00:00'),
        pendingMonths: 'October',
        status: 'Finance Pending',
        title: 'Travel Expense - Vikram Singh',
        description: 'Extended field visit expense',
        expItemId: '94787',
        gpsDistance: '250 Kms',
        expenseDescription: 'Extended field visit',
        dateOfExpense: new Date('2025-10-25'),
        employeeRemarks: 'Fuel and accommodation',
      },
      {
        employeeName: 'Kavitha Nair',
        amount: 175.25,
        approvalAmount: 175.25,
        approvedManager: 'Janardhan',
        expType: 'Food',
        category: 'Food',
        raisedDate: new Date('2025-10-22T12:00:00'),
        pendingMonths: 'October',
        status: 'Finance Pending',
        title: 'Food Expense - Kavitha Nair',
        description: 'Team lunch meeting expense',
        expItemId: '94788',
        gpsDistance: '',
        expenseDescription: 'Team lunch meeting',
        dateOfExpense: new Date('2025-10-20'),
        employeeRemarks: 'Business meal',
      },
      {
        employeeName: 'Ravi Shankar',
        amount: 198.50,
        approvalAmount: 195.00,
        approvedManager: 'Pramod',
        expType: 'Travel',
        category: 'Travel',
        raisedDate: new Date('2025-10-20T15:30:00'),
        pendingMonths: 'October',
        status: 'Finance Pending',
        title: 'Travel Expense - Ravi Shankar',
        description: 'Client presentation travel expense',
        expItemId: '94789',
        gpsDistance: '140 Kms',
        expenseDescription: 'Client presentation travel',
        dateOfExpense: new Date('2025-10-18'),
        employeeRemarks: 'Travel and parking',
      },
      {
        employeeName: 'Swarna Kumar',
        amount: 417.60,
        approvalAmount: 415.00,
        approvedManager: 'Srikanth Mgr',
        expType: 'Travel',
        category: 'Travel',
        raisedDate: new Date('2025-10-30T08:00:00'),
        pendingMonths: 'October',
        status: 'Finance Pending',
        title: 'Travel Expense - Swarna Kumar',
        description: 'Multiple location visits expense',
        expItemId: '94790',
        gpsDistance: '174 Kms',
        expenseDescription: 'Multiple location visits',
        dateOfExpense: new Date('2025-10-28'),
        employeeRemarks: 'Petrol charges',
      },
    ];

    // Create manager pending expenses
    for (const expenseData of sampleExpenses) {
      const employeeId = employeeMap.get(expenseData.employeeName);
      
      const expense = await Expense.create({
        ...expenseData,
        employeeId: employeeId,
        employeeName: expenseData.employeeName,
        createdBy: adminUser._id,
        date: expenseData.raisedDate,
        status: 'Pending',
        expItemId: expenseData.expItemId || Math.floor(10000 + Math.random() * 90000).toString(),
        gpsDistance: expenseData.gpsDistance || '',
        expenseDescription: expenseData.expenseDescription || expenseData.description || '',
        dateOfExpense: expenseData.dateOfExpense || expenseData.raisedDate,
        employeeRemarks: expenseData.employeeRemarks || '',
        billImage: expenseData.billImage || '',
      });

      createdExpenses.push(expense);
      console.log(`Created pending expense: ${expenseData.employeeName} - ${expenseData.amount}`);
    }

    // Create finance pending expenses
    for (const expenseData of financePendingData) {
      let employeeId = employeeMap.get(expenseData.employeeName);
      if (!employeeId) {
        // Create employee if doesn't exist
        const email = `${expenseData.employeeName.toLowerCase().replace(/\s+/g, '.')}@viswamedutech.com`;
        const employee = await User.findOne({ email }) || await User.create({
          name: expenseData.employeeName,
          email: email,
          password: 'Employee@123',
          role: 'Employee',
          isActive: true,
        });
        employeeId = employee._id;
        employeeMap.set(expenseData.employeeName, employee._id);
        console.log(`Created/found employee for finance pending: ${employee.name}`);
      }
      
      const managerId = managerMap.get(expenseData.approvedManager);
      
      const expense = await Expense.create({
        ...expenseData,
        employeeId: employeeId,
        employeeName: expenseData.employeeName,
        createdBy: adminUser._id,
        date: expenseData.raisedDate,
        status: 'Finance Pending',
        approvedBy: managerId,
        approvedAt: new Date(expenseData.raisedDate.getTime() + 24 * 60 * 60 * 1000), // Approved 1 day after raised
        approvedManager: expenseData.approvedManager,
        approvalAmount: expenseData.approvalAmount || expenseData.amount,
        expItemId: expenseData.expItemId || Math.floor(10000 + Math.random() * 90000).toString(),
        gpsDistance: expenseData.gpsDistance || '',
        expenseDescription: expenseData.expenseDescription || '',
        dateOfExpense: expenseData.dateOfExpense || expenseData.raisedDate,
        employeeRemarks: expenseData.employeeRemarks || '',
        billImage: `https://via.placeholder.com/300x400?text=Bill+Receipt+${expenseData.expItemId}`,
      });

      createdExpenses.push(expense);
      console.log(`Created finance pending expense: ${expenseData.employeeName} - ${expenseData.amount} - Approved by ${expenseData.approvedManager}`);
    }

    console.log(`\n✅ Successfully seeded ${createdExpenses.length} expenses!`);
    console.log(`  - Manager Pending: ${sampleExpenses.length} expenses`);
    console.log(`  - Finance Pending: ${financePendingData.length} expenses`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding expenses:', error);
    process.exit(1);
  }
}

// Run the seed function
seedExpenses();

