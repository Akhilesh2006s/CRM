const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');
const salesRoutes = require('./routes/salesRoutes');
const dcRoutes = require('./routes/dcRoutes');
const dcOrderRoutes = require('./routes/dcOrderRoutes');
const empDcRoutes = require('./routes/empDcRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const trainingRoutes = require('./routes/trainingRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const metadataRoutes = require('./routes/metadataRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
const connectDB = require('./config/db');
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dc', dcRoutes);
app.use('/api/dc-orders', dcOrderRoutes);
app.use('/api/emp-dc', empDcRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/metadata', metadataRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CRM System Management Forge API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

