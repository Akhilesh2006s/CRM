const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mockDataService = require('../services/mockDataService');
const { buildAuthPayload, loadUserPermissions, isSuperAdminUser } = require('../utils/permissions');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

/**
 * Enforce optional device binding for mobile clients.
 * - No deviceId → allow (web)
 * - boundDeviceId set + mismatch → 403
 * - boundDeviceId empty + deviceId → bind
 * Returns an error response object if blocked, otherwise null (and may mutate user).
 */
function applyDeviceBinding(user, deviceId) {
  const incoming = deviceId != null ? String(deviceId).trim() : '';
  if (!incoming) return null;

  if (user.boundDeviceId && String(user.boundDeviceId) !== incoming) {
    return {
      status: 403,
      body: { message: 'Device not authorized. Contact admin to reset device.' },
    };
  }

  if (!user.boundDeviceId) {
    user.boundDeviceId = incoming;
    user.boundDeviceAt = new Date();
  }
  return null;
}

async function findUserByMobileOrEmail(identifier) {
  const raw = String(identifier || '').trim();
  if (!raw) return null;
  const emailLike = raw.toLowerCase();
  const digits = raw.replace(/\D/g, '');
  const or = [{ email: emailLike }];
  if (digits) {
    or.push({ mobile: digits });
    or.push({ phone: digits });
    or.push({ mobile: raw });
    or.push({ phone: raw });
  }
  return User.findOne({ $or: or });
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

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
      const payload = await buildAuthPayload(user, generateToken(user._id));
      res.status(201).json(payload);
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
        ...(await buildAuthPayload({ ...user, _id: user._id }, generateToken(user._id))),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register franchise user (Admin/Super Admin creates franchise login)
// @route   POST /api/auth/register-franchise
// @access  Private (Admin, Super Admin)
const registerFranchise = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'Franchise',
    });

    const payload = await buildAuthPayload(user, generateToken(user._id));
    res.status(201).json(payload);
  } catch (error) {
    if (error.code === 11000 || error.code === 11001) {
      return res.status(400).json({ message: 'User already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password, mobile, deviceId } = req.body;
    const identifier = email || mobile;

    if (mongoose.connection.readyState === 1) {
    const user = await findUserByMobileOrEmail(identifier) || (email ? await User.findOne({ email }) : null);

    if (user && (await user.comparePassword(password))) {
      // Ensure special admin emails have correct role
      const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || 'amenityforge@gmail.com')
        .split(',')
        .map((s) => s.trim().toLowerCase())
      if (superAdminEmails.includes(String(user.email || '').toLowerCase()) && user.role !== 'Super Admin') {
        user.role = 'Super Admin'
      }

      const deviceBlock = applyDeviceBinding(user, deviceId);
      if (deviceBlock) {
        return res.status(deviceBlock.status).json(deviceBlock.body);
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      const payload = await buildAuthPayload(user, generateToken(user._id));
      res.json(payload);
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      // Use mock data service
      const user = await mockDataService.findUser({ email: identifier });

      if (user && (await bcrypt.compare(password, user.password))) {
        const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || 'amenityforge@gmail.com')
          .split(',')
          .map((s) => s.trim().toLowerCase())
        if (superAdminEmails.includes(String(email || identifier).toLowerCase()) && user.role !== 'Super Admin') {
          user.role = 'Super Admin'
        }
        // Update last login
        await mockDataService.updateUser(user._id, { lastLogin: new Date() });

        const payload = await buildAuthPayload(
          { ...user, lastLogin: new Date() },
          generateToken(user._id)
        );
        res.json(payload);
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
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { permissionKeys, isSuperAdmin, roleName, roleId } = await loadUserPermissions(user);
    res.json({
      ...user.toObject(),
      roleName: roleName || user.role,
      roleId: roleId || user.roleId,
      permissions: permissionKeys,
      isSuperAdmin,
      rbacEnabled: process.env.RBAC_ENABLED !== 'false',
    });
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
    const { firebaseUID, email, name, deviceId } = req.body;

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

    const deviceBlock = applyDeviceBinding(user, deviceId);
    if (deviceBlock) {
      return res.status(deviceBlock.status).json(deviceBlock.body);
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

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
// NOTE: No SMS provider wired yet. In production the OTP is logged to the server console
// so ops can relay it; wire an SMS gateway here when available. In non-production the OTP
// is also returned in the JSON response for local testing.
const forgotPassword = async (req, res) => {
  try {
    const identifier = req.body.mobile || req.body.email;
    if (!identifier) {
      return res.status(400).json({ message: 'Mobile or email is required' });
    }

    const generic = { message: 'If account exists, OTP sent' };

    if (mongoose.connection.readyState !== 1) {
      return res.json(generic);
    }

    const user = await findUserByMobileOrEmail(identifier);
    if (!user) {
      return res.json(generic);
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtpHash = hashOtp(otp);
    user.resetOtpExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    if (process.env.NODE_ENV === 'production') {
      // No SMS provider configured — log OTP for manual relay until SMS is integrated.
      console.log(`[forgot-password] OTP for ${user.email || user.mobile}: ${otp}`);
      return res.json(generic);
    }

    return res.json({ ...generic, otp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const identifier = req.body.mobile || req.body.email;

    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ message: 'Mobile/email, OTP, and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const user = await User.findOne({
      $or: (() => {
        const raw = String(identifier).trim();
        const emailLike = raw.toLowerCase();
        const digits = raw.replace(/\D/g, '');
        const or = [{ email: emailLike }];
        if (digits) {
          or.push({ mobile: digits }, { phone: digits }, { mobile: raw }, { phone: raw });
        }
        return or;
      })(),
    }).select('+resetOtpHash +resetOtpExpires');

    if (
      !user ||
      !user.resetOtpHash ||
      !user.resetOtpExpires ||
      user.resetOtpExpires.getTime() < Date.now() ||
      user.resetOtpHash !== hashOtp(otp)
    ) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = newPassword;
    user.resetOtpHash = null;
    user.resetOtpExpires = null;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin clears bound device so user can re-bind on next login
// @route   POST /api/auth/reset-device
// @access  Private (Admin, Super Admin)
const resetDevice = async (req, res) => {
  try {
    const userId = req.body.userId || req.body.employeeId || req.body.id;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not available' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.boundDeviceId = null;
    user.boundDeviceAt = null;
    await user.save();
    res.json({ message: 'Device binding cleared. User can bind a new device on next login.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password for logged-in user
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not available' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const valid = await user.comparePassword(oldPassword);
    if (!valid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  registerFranchise,
  login,
  getMe,
  firebaseLogin,
  changePassword,
  forgotPassword,
  resetPassword,
  resetDevice,
};

