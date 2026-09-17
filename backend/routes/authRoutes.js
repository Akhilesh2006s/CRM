const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  firebaseLogin,
  registerFranchise,
  changePassword,
  forgotPassword,
  resetPassword,
  resetDevice,
} = require('../controllers/authController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/firebase-login', firebaseLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/register-franchise', authMiddleware, roleMiddleware('Admin', 'Super Admin'), registerFranchise);
router.post('/reset-device', authMiddleware, roleMiddleware('Admin', 'Super Admin'), resetDevice);
router.get('/me', authMiddleware, getMe);
router.put('/change-password', authMiddleware, changePassword);

module.exports = router;
