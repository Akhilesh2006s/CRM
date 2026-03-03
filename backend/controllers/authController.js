const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mockDataService = require('../services/mockDataService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, department } = req.body;
    const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || 'amenityforge@gmail.com')
      .split(',')
      .map((s) => s.trim().toLowerCase())

    // Check if database is available
    if (mongoose.connection.readyState === 1) {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: superAdminEmails.includes(String(email).toLowerCase()) ? 'Super Admin' : (role || 'Executive'),
      phone,
      department,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
      }
    } else {
      // Use mock data service
      const userExists = await mockDataService.findUser({ email });

      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

    const user = await mockDataService.createUser({
        name,
        email,
        password: await bcrypt.hash(password, 10),
      role: superAdminEmails.includes(String(email).toLowerCase()) ? 'Super Admin' : (role || 'Executive'),
        phone,
        department,
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (mongoose.connection.readyState === 1) {
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      // Ensure special admin emails have correct role
      const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || 'amenityforge@gmail.com')
        .split(',')
        .map((s) => s.trim().toLowerCase())
      if (superAdminEmails.includes(String(email).toLowerCase()) && user.role !== 'Super Admin') {
        user.role = 'Super Admin'
      }
      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roles: user.roles || [],
        hasCompletedFirstTimeSetup: user.hasCompletedFirstTimeSetup || false,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      // Use mock data service
      const user = await mockDataService.findUser({ email });

      if (user && (await bcrypt.compare(password, user.password))) {
        const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || 'amenityforge@gmail.com')
          .split(',')
          .map((s) => s.trim().toLowerCase())
        if (superAdminEmails.includes(String(email).toLowerCase()) && user.role !== 'Super Admin') {
          user.role = 'Super Admin'
        }
        // Update last login
        await mockDataService.updateUser(user._id, { lastLogin: new Date() });

        res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          roles: user.roles || [],
          hasCompletedFirstTimeSetup: user.hasCompletedFirstTimeSetup || false,
          token: generateToken(user._id),
        });
      } else {
        res.status(401).json({ message: 'Invalid email or password' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
    } else {
      // Use mock data service
      const user = await mockDataService.findUser({ _id: req.user._id });
      if (user) {
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Firebase login
// @route   POST /api/auth/firebase-login
// @access  Public
const firebaseLogin = async (req, res) => {
  try {
    const { firebaseUID, email, name } = req.body;

    let user = await User.findOne({ firebaseUID });

    if (!user) {
      // Create user if doesn't exist
      user = await User.create({
        firebaseUID,
        email,
        name,
        role: 'Executive',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register franchise user
// @route   POST /api/auth/register-franchise
// @access  Private (Admin only - should be called from admin panel)
const registerFranchise = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Franchise name is required' });
    }
    if (!email || !String(email).trim()) {
      return res.status(400).json({ message: 'Franchise email is required' });
    }
    if (!password || !String(password).trim()) {
      return res.status(400).json({ message: 'Franchise password is required' });
    }

    // Password security: min 6 characters
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (mongoose.connection.readyState === 1) {
      const userExists = await User.findOne({ email: String(email).trim().toLowerCase() });

      if (userExists) {
        // If user exists, update it to Franchise role if needed
        if (userExists.role !== 'Franchise') {
          userExists.role = 'Franchise';
          userExists.name = String(name).trim();
          if (password) {
            userExists.password = String(password);
          }
          await userExists.save();
        }
        return res.json({
          _id: userExists._id,
          name: userExists.name,
          email: userExists.email,
          role: userExists.role,
          message: 'Franchise user account updated',
        });
      }

      const user = await User.create({
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        password: String(password),
        role: 'Franchise',
        isActive: true,
      });

      if (user) {
        res.status(201).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          message: 'Franchise user account created successfully',
        });
      } else {
        res.status(400).json({ message: 'Invalid franchise data' });
      }
    } else {
      res.status(503).json({ message: 'Database not available' });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message).join('. ');
      return res.status(400).json({ message: messages });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  firebaseLogin,
  registerFranchise,
};

