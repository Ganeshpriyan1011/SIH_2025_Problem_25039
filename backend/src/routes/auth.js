const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/auth');
const { auth } = require('../middleware/auth');

// Custom email validation based on role
const validateEmailByRole = (value, { req }) => {
  const role = req.body.role;
  
  if (role === 'official') {
    if (!value.toLowerCase().endsWith('@gov.in')) {
      return Promise.reject('Officials must use @gov.in email address');
    }
  } else if (role === 'analyst') {
    if (!value.toLowerCase().endsWith('@univ.edu')) {
      return Promise.reject('Analysts must use @univ.edu email address');
    }
  }
  // Citizens can use any valid email format
  
  return Promise.resolve();
};

// Validation middleware
const validateSignup = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').isIn(['citizen', 'official', 'analyst']).withMessage('Invalid role'),
  body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .custom(validateEmailByRole),
  body('mobile').matches(/^[0-9]{10}$/).withMessage('Invalid mobile number'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const validateLogin = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required')
];

const validateOTP = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('otp').matches(/^[0-9]{6}$/).withMessage('Invalid OTP')
];

// Routes
router.post('/signup', validateSignup, authController.signup);
router.post('/verify-otp', validateOTP, authController.verifyOTP);
router.post('/login', validateLogin, authController.login);
router.post('/logout', auth, authController.logout);

module.exports = router;