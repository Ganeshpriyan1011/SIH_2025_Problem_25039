import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../services/database';
import { AuthUtils } from '../utils/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply authentication to all user routes
router.use(authenticate);

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

// GET /api/users/profile - Get current user profile
router.get('/profile', asyncHandler(async (req: express.Request, res: express.Response) => {
  const user = await db.getUserById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    user: AuthUtils.sanitizeUser(user)
  });
}));

// PUT /api/users/profile - Update current user profile
router.put('/profile', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('avatar')
    .optional()
    .isString()
    .withMessage('Avatar must be a string')
], checkValidation, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { name, avatar } = req.body;
  
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (avatar !== undefined) updates.avatar = avatar;

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  const updatedUser = await db.updateUser(req.user!.id, updates);
  if (!updatedUser) {
    throw new AppError('Failed to update user', 500);
  }

  logger.info(`User profile updated: ${req.user!.email}`);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: AuthUtils.sanitizeUser(updatedUser)
  });
}));

// PUT /api/users/change-password - Change user password
router.put('/change-password', [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
], checkValidation, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { currentPassword, newPassword } = req.body;

  // Get current user with password
  const user = await db.getUserById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await AuthUtils.comparePassword(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Validate new password
  const passwordValidation = AuthUtils.validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'New password does not meet requirements',
      errors: passwordValidation.errors
    });
  }

  // Check if new password is different from current
  const isSamePassword = await AuthUtils.comparePassword(newPassword, user.password);
  if (isSamePassword) {
    throw new AppError('New password must be different from current password', 400);
  }

  // Hash new password
  const hashedNewPassword = await AuthUtils.hashPassword(newPassword);

  // Update password
  const updatedUser = await db.updateUser(user.id, { password: hashedNewPassword });
  if (!updatedUser) {
    throw new AppError('Failed to update password', 500);
  }

  logger.info(`Password changed for user: ${req.user!.email}`);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
}));

// GET /api/users/stats - Get user statistics
router.get('/stats', asyncHandler(async (req: express.Request, res: express.Response) => {
  const reports = await db.getAllReports();
  const userReports = reports.filter(report => report.authorId === req.user!.id);
  
  const stats = {
    totalReports: userReports.length,
    verifiedReports: userReports.filter(report => report.verified).length,
    recentReports: userReports.filter(report => {
      const reportDate = new Date(report.timestamp);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return reportDate > weekAgo;
    }).length,
    hazardTypes: userReports.reduce((acc: any, report) => {
      acc[report.hazard] = (acc[report.hazard] || 0) + 1;
      return acc;
    }, {})
  };

  res.status(200).json({
    success: true,
    stats
  });
}));

// DELETE /api/users/account - Delete user account
router.delete('/account', [
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete account')
], checkValidation, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { password } = req.body;

  // Get current user with password
  const user = await db.getUserById(req.user!.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify password
  const isPasswordValid = await AuthUtils.comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Password is incorrect', 400);
  }

  // In a real application, you would:
  // 1. Soft delete the user (mark as deleted)
  // 2. Anonymize their reports
  // 3. Clean up related data
  // For now, we'll just mark the user as deleted by updating their email
  
  const deletedEmail = `deleted_${Date.now()}_${user.email}`;
  await db.updateUser(user.id, { 
    email: deletedEmail,
    isVerified: false,
    name: 'Deleted User'
  });

  logger.info(`User account deleted: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully'
  });
}));

export default router;
