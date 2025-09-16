const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator'); // Add this import
const emailService = require('../services/email');
const azureStorage = require('../services/azure-storage');

const authController = {
  async signup(req, res) {
    try {
      // Check for validation errors - ADD THIS BLOCK
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, email, mobile, role, password } = req.body;

      // Validate role (this is now redundant due to validation middleware, but keeping for safety)
      if (!['citizen', 'official', 'analyst'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
      }

      // Generate OTP
      const otp = emailService.generateOTP();
      
      // Store OTP data in Azure
      const otpData = {
        otp,
        userData: {
          name,
          email,
          mobile,
          role,
          password: await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS)),
        }
      };
      
      await azureStorage.storeOTPData(email, otpData);

      // Send OTP
      await emailService.sendOTP(email, otp);

      res.status(200).json({
        success: true,
        message: 'OTP sent to email'
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during signup'
      });
    }
  },

  async verifyOTP(req, res) {
    try {
      // Check for validation errors - ADD THIS BLOCK
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, otp } = req.body;

      const storedData = await azureStorage.getOTPData(email);
      
      if (!storedData) {
        return res.status(400).json({
          success: false,
          message: 'OTP expired or invalid'
        });
      }

      if (storedData.otp !== otp) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP'
        });
      }

      // Store user data in Azure
      try {
        console.log('Attempting to store user data in Azure:', {
          email,
          userData: {
            ...storedData.userData,
            password: '[REDACTED]'
          }
        });
        
        await azureStorage.storeUserData(email, storedData.userData);
        console.log('Successfully stored user data in Azure for email:', email);
      } catch (error) {
        console.error('Azure storage error:', error);
        if (error.message === 'User already exists') {
          return res.status(409).json({
            success: false,
            message: 'User already exists'
          });
        }
        throw error;
      }

      // Clear OTP data from Azure
      await azureStorage.deleteOTPData(email);

      // Generate tokens
      const token = jwt.sign(
        { email, role: storedData.userData.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.status(200).json({
        success: true,
        message: 'User registered successfully',
        user: {
          email,
          name: storedData.userData.name,
          role: storedData.userData.role
        }
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during OTP verification'
      });
    }
  },

  async login(req, res) {
    try {
      // Check for validation errors - ADD THIS BLOCK
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Get user data from Azure
      const userData = await azureStorage.getUserData(email);

      if (!userData) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Additional validation: Check if user's email domain matches their role
      if (userData.role === 'official' && !userData.email.toLowerCase().endsWith('@gov.in')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email for official role'
        });
      }
      
      if (userData.role === 'analyst' && !userData.email.toLowerCase().endsWith('@univ.edu')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email for analyst role'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, userData.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const token = jwt.sign(
        { email, role: userData.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.status(200).json({
        success: true,
        user: {
          email,
          name: userData.name,
          role: userData.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during login'
      });
    }
  },

  logout(req, res) {
    res.clearCookie('token');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
};

module.exports = authController;