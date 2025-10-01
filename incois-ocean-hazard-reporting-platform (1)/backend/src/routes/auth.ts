import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../services/database';
import { emailService } from '../services/emailService';
import { AuthUtils } from '../utils/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// User Portal Validation (Citizens only)
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least 8 characters with uppercase, lowercase, number and special character'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
];

// Admin Portal Validation (Officials & Analysts)
const validateAdminRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .custom((value) => {
      if (!value.endsWith('.gov.in')) {
        throw new Error('Admin registration requires a .gov.in email address');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 12, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/)
    .withMessage('Admin password must be at least 12 characters with uppercase, lowercase, number and special character'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('role')
    .isIn(['analyst', 'official'])
    .withMessage('Admin role must be either analyst or official'),
  body('employeeId')
    .isLength({ min: 5, max: 20 })
    .withMessage('Employee ID is required for admin registration')
];

// Legacy validation for backward compatibility
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('role')
    .isIn(['citizen', 'analyst', 'official'])
    .withMessage('Role must be citizen, analyst, or official')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateOTP = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number')
];

// Helper function to check validation results
const checkValidation = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }
  next();
};

// POST /api/auth/register
router.post('/register', validateRegistration, checkValidation, asyncHandler(async (req: express.Request, res: express.Response): Promise<void> => {
  const { email, password, name, role } = req.body;

  // Additional password validation
  const passwordValidation = AuthUtils.validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Password does not meet requirements',
      errors: passwordValidation.errors
    });
  }

  // Check if user already exists
  const existingUser = await db.getUserByEmail(email);
  if (existingUser) {
    if (existingUser.isVerified) {
      throw new AppError('User with this email already exists', 409);
    } else {
      // User exists but not verified, we can resend OTP
      const otp = AuthUtils.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      await db.saveOTP({
        email,
        otp,
        expiresAt,
        attempts: 0
      });

      await emailService.sendOTPEmail(email, otp, name);

      return res.status(200).json({
        success: true,
        message: 'OTP sent to your email. Please verify to complete registration.',
        requiresVerification: true
      });
    }
  }

  // Hash password
  const hashedPassword = await AuthUtils.hashPassword(password);

  // Test users are created immediately for development convenience
  const isTestUser = email.includes('test@') || email.includes('demo@');
  if (isTestUser) {
    const newUser = await db.createUser({
      email,
      password: hashedPassword,
      name,
      role: role as 'citizen' | 'analyst' | 'official',
      isVerified: true
    });

    const token = AuthUtils.generateToken(newUser);
    return res.status(201).json({
      success: true,
      message: 'Registration successful! You are now logged in.',
      requiresVerification: false,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isVerified: newUser.isVerified
      },
      token
    });
  }

  // For non-test users, defer user creation until OTP is verified.
  const otp = AuthUtils.generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  await db.saveOTP({
    email,
    otp,
    expiresAt,
    attempts: 0,
    pendingUserData: {
      email,
      password: hashedPassword,
      name,
      role: (role as 'citizen' | 'analyst' | 'official')
    }
  });

  // Send OTP email
  const emailSent = await emailService.sendOTPEmail(email, otp, name);
  if (!emailSent) {
    logger.error(`Failed to send OTP email to ${email}`);
    // Don't fail registration, but log the error
  }

  logger.info(`OTP sent for pending registration: ${email} (${role})`);

  return res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email for verification code.',
    requiresVerification: true
  });
}));

// POST /api/auth/user/register - User Portal Registration (Citizens only)
router.post('/user/register', validateUserRegistration, checkValidation, asyncHandler(async (req: express.Request, res: express.Response): Promise<void> => {
  const { email, password, name } = req.body;
  const role = 'citizen'; // Fixed role for user portal

  // Check if user already exists
  const existingUser = await db.getUserByEmail(email);
  if (existingUser) {
    if (existingUser.isVerified) {
      throw new AppError('User with this email already exists', 409);
    } else {
      // User exists but not verified, we can resend OTP
      const otp = AuthUtils.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await db.saveOTP({
        email,
        otp,
        expiresAt,
        attempts: 0
      });

      await emailService.sendOTPEmail(email, otp, name);

      return res.status(200).json({
        success: true,
        message: 'OTP sent to your email. Please verify to complete registration.',
        requiresVerification: true
      });
    }
  }

  // Hash password
  const hashedPassword = await AuthUtils.hashPassword(password);

  // Auto-verify test users (for development)
  const isTestUser = email.includes('test@') || email.includes('demo@');
  
  if (isTestUser) {
    // Create user immediately for test users
    const newUser = await db.createUser({
      email,
      password: hashedPassword,
      name,
      role: 'citizen',
      isVerified: true
    });

    logger.info(`Auto-verified test user during registration: ${email}`);
    
    // Generate JWT token for immediate login
    const token = AuthUtils.generateToken(newUser);
    
    return res.status(201).json({
      success: true,
      message: 'Registration successful. You are now logged in.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isVerified: newUser.isVerified
      },
      token,
      requiresVerification: false
    });
  }

  // For non-test users, DON'T create user yet - only send OTP
  // Generate and save OTP with pending user data
  const otp = AuthUtils.generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await db.saveOTP({
    email,
    otp,
    expiresAt,
    attempts: 0,
    // Store pending user data for creation after verification
    pendingUserData: {
      email,
      password: hashedPassword,
      name,
      role: 'citizen'
    }
  });

  // Send OTP email
  await emailService.sendOTPEmail(email, otp, name);

  logger.info(`OTP sent for pending registration: ${email} (citizen)`);

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please check your email for verification code.',
    requiresVerification: true
  });
}));

// POST /api/auth/admin/register - Admin Portal Registration (Officials & Analysts)
router.post('/admin/register', validateAdminRegistration, checkValidation, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { email, password, name, role, employeeId } = req.body;

  // Check if user already exists
  const existingUser = await db.getUserByEmail(email);
  if (existingUser) {
    throw new AppError('Admin user with this email already exists', 409);
  }

  // Hash password
  const hashedPassword = await AuthUtils.hashPassword(password);

  // Create admin user (pending approval by super admin)
  const newUser = await db.createUser({
    email,
    password: hashedPassword,
    name,
    role: role as 'analyst' | 'official',
    isVerified: false, // Will be verified after approval
    approvalStatus: 'pending', // Requires super admin approval
    employeeId
  });

  logger.info(`Admin user registered (pending approval): ${email} (${role}) - Employee ID: ${employeeId}`);

  res.status(201).json({
    success: true,
    message: 'Registration submitted successfully! Your account is pending approval by a super administrator. You will be notified once approved.',
    requiresVerification: false,
    requiresApproval: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      isVerified: newUser.isVerified,
      approvalStatus: newUser.approvalStatus,
      employeeId: newUser.employeeId
    }
  });
}));

// POST /api/auth/user/login - User Portal Login
router.post('/user/login', validateLogin, checkValidation, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;

  // Get user
  const user = await db.getUserByEmail(email);
  if (!user || user.role !== 'citizen') {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user is verified (auto-verify test users)
  if (!user.isVerified) {
    // Auto-verify test users for development
    if (email.includes('test@') || email.includes('demo@')) {
      await db.updateUser(user.id, { isVerified: true });
      user.isVerified = true;
      logger.info(`Auto-verified test user: ${email}`);
    } else {
      throw new AppError('Please verify your email before logging in', 401);
    }
  }

  // Verify password
  const isPasswordValid = await AuthUtils.comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate JWT token
  const token = AuthUtils.generateToken(user);

  logger.info(`User logged in: ${email}`);

  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified
    },
    token
  });
}));

// POST /api/auth/admin/login - Admin Portal Login
router.post('/admin/login', validateLogin, checkValidation, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;

  // Get user - no email domain restriction for login (only for registration)
  const user = await db.getUserByEmail(email);
  if (!user || (user.role !== 'analyst' && user.role !== 'official' && user.role !== 'SuperAdmin')) {
    throw new AppError('Invalid email or password', 401);
  }

  // Verify password
  const isPasswordValid = await AuthUtils.comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check approval status for officials and analysts
  if ((user.role === 'analyst' || user.role === 'official') && user.approvalStatus !== 'approved') {
    if (user.approvalStatus === 'pending') {
      throw new AppError('Your account is pending approval by a super administrator. Please wait for approval before logging in.', 403);
    } else if (user.approvalStatus === 'rejected') {
      throw new AppError('Your account has been rejected. Please contact support for more information.', 403);
    }
  }

  // Generate JWT token
  const token = AuthUtils.generateToken(user);

  logger.info(`Admin logged in: ${email} (${user.role})`);

  res.json({
    success: true,
    message: 'Admin login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
      approvalStatus: user.approvalStatus,
      employeeId: user.employeeId
    },
    token
  });
}));

// POST /api/auth/verify-otp
router.post('/verify-otp', validateOTP, checkValidation, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { email, otp } = req.body;

  logger.info(`OTP verification attempt for email: ${email}, OTP: ${otp}`);

  // Get OTP record
  const otpRecord = await db.getOTP(email);
  if (!otpRecord) {
    logger.error(`OTP not found for email: ${email}`);
    throw new AppError('OTP not found or expired', 400);
  }

  logger.info(`Found OTP record for ${email}: ${JSON.stringify({ otp: otpRecord.otp, expiresAt: otpRecord.expiresAt, attempts: otpRecord.attempts })}`);

  // Check if OTP is expired
  if (AuthUtils.isOTPExpired(otpRecord.expiresAt)) {
    await db.deleteOTP(email);
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }

  // Check rate limiting
  if (AuthUtils.isOTPRateLimited(otpRecord.attempts)) {
    await db.deleteOTP(email);
    throw new AppError('Too many failed attempts. Please request a new OTP.', 429);
  }

  // Verify OTP
  if (otpRecord.otp !== otp) {
    await db.incrementOTPAttempts(email);
    throw new AppError('Invalid OTP', 400);
  }

  // If user doesn't exist yet, create from pending registration data
  let user = await db.getUserByEmail(email);
  if (!user) {
    if (!otpRecord.pendingUserData) {
      // No pending data to create a user from
      throw new AppError('Registration data not found for this OTP', 404);
    }
    // Create the user now using pending data; mark as verified
    user = await db.createUser({
      email: otpRecord.pendingUserData.email,
      password: otpRecord.pendingUserData.password,
      name: otpRecord.pendingUserData.name,
      role: otpRecord.pendingUserData.role,
      isVerified: true
    });
  } else if (!user.isVerified) {
    // Mark existing user as verified
    const updated = await db.updateUser(user.id, { isVerified: true });
    if (!updated) {
      throw new AppError('Failed to verify user', 500);
    }
    user = updated;
  }

  // Clean up OTP
  await db.deleteOTP(email);

  // Send welcome email
  await emailService.sendWelcomeEmail(email, user.name, user.role);

  // Generate JWT token
  const token = AuthUtils.generateToken(user);

  logger.info(`User verified and logged in: ${email}`);

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    token,
    user: AuthUtils.sanitizeUser(user)
  });
}));

// POST /api/auth/resend-otp
router.post('/resend-otp', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address')
], checkValidation, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { email } = req.body;

  // Get user
  const user = await db.getUserByEmail(email);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.isVerified) {
    throw new AppError('User is already verified', 400);
  }

  // Generate new OTP
  const otp = AuthUtils.generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  await db.saveOTP({
    email,
    otp,
    expiresAt,
    attempts: 0
  });

  // Send OTP email
  await emailService.sendOTPEmail(email, otp, user.name);

  logger.info(`OTP resent to: ${email}`);

  res.status(200).json({
    success: true,
    message: 'OTP sent to your email'
  });
}));

// POST /api/auth/login
router.post('/login', validateLogin, checkValidation, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;

  // Get user
  const user = await db.getUserByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user is verified
  if (!user.isVerified) {
    throw new AppError('Please verify your email before logging in', 401);
  }

  // Verify password
  const isPasswordValid = await AuthUtils.comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate JWT token
  const token = AuthUtils.generateToken(user);

  logger.info(`User logged in: ${email}`);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: AuthUtils.sanitizeUser(user)
  });
}));

// POST /api/auth/logout
router.post('/logout', (req: express.Request, res: express.Response) => {
  // Since we're using stateless JWT, logout is handled client-side
  // In a production app, you might want to implement token blacklisting
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// GET /api/auth/me (get current user info)
router.get('/me', asyncHandler(async (req: express.Request, res: express.Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Access token is required', 401);
  }

  const token = authHeader.substring(7);
  const decoded = AuthUtils.verifyToken(token);
  
  if (!decoded) {
    throw new AppError('Invalid or expired token', 401);
  }

  const user = await db.getUserById(decoded.userId);
  if (!user || !user.isVerified) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    user: AuthUtils.sanitizeUser(user)
  });
}));

// GET /api/auth/pending-approvals - Get pending admin approvals (Super Admin only)
router.get('/pending-approvals', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const user = (req as any).user;
  
  if (!user || user.role !== 'SuperAdmin') {
    throw new AppError('Access denied. Super admin privileges required.', 403);
  }

  const pendingUsers = await db.getPendingApprovals();
  
  res.json({
    success: true,
    data: pendingUsers
  });
}));

// POST /api/auth/approve-user/:userId - Approve admin user (Super Admin only)
router.post('/approve-user/:userId', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { userId } = req.params;
  const user = (req as any).user;
  
  if (!user || user.role !== 'SuperAdmin') {
    throw new AppError('Access denied. Super admin privileges required.', 403);
  }

  const updatedUser = await db.approveUser(userId, user.id);
  
  if (!updatedUser) {
    throw new AppError('User not found or already processed', 404);
  }

  logger.info(`User approved: ${updatedUser.email} by ${user.email}`);
  
  res.json({
    success: true,
    message: 'User approved successfully',
    data: updatedUser
  });
}));

// POST /api/auth/reject-user/:userId - Reject admin user (Super Admin only)
router.post('/reject-user/:userId', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { userId } = req.params;
  const { reason } = req.body;
  const user = (req as any).user;
  
  if (!user || user.role !== 'SuperAdmin') {
    throw new AppError('Access denied. Super admin privileges required.', 403);
  }

  const updatedUser = await db.rejectUser(userId, user.id, reason);
  
  if (!updatedUser) {
    throw new AppError('User not found or already processed', 404);
  }

  logger.info(`User rejected: ${updatedUser.email} by ${user.email} - Reason: ${reason}`);
  
  res.json({
    success: true,
    message: 'User rejected successfully',
    data: updatedUser
  });
}));

export default router;
