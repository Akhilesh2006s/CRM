const express = require('express');
const router = express.Router();
const { register, login, getMe, firebaseLogin, registerFranchise } = require('../controllers/authController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/firebase-login', firebaseLogin);
router.post('/register-franchise', authMiddleware, roleMiddleware('Admin', 'Super Admin'), registerFranchise);
router.get('/me', authMiddleware, getMe);

module.exports = router;

