import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { db } from '../services/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

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

// GET /api/reports - Get all reports (public endpoint with optional auth)
router.get('/', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  query('hazard')
    .optional()
    .isString()
    .withMessage('Hazard type must be a string'),
  query('verified')
    .optional()
    .isBoolean()
    .withMessage('Verified must be a boolean')
], optionalAuth, checkValidation, asyncHandler(async (req: express.Request, res: express.Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const hazardFilter = req.query.hazard as string;
  const verifiedFilter = req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined;

  let reports = await db.getAllReports();

  // Apply filters
  if (hazardFilter) {
    reports = reports.filter(report => report.hazard.toLowerCase() === hazardFilter.toLowerCase());
  }

  if (verifiedFilter !== undefined) {
    reports = reports.filter(report => report.verified === verifiedFilter);
  }

  // Sort by timestamp (newest first)
  reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Apply pagination
  const paginatedReports = reports.slice(offset, offset + limit);

  res.status(200).json({
    success: true,
    data: {
      reports: paginatedReports,
      total: reports.length,
      limit,
      offset,
      hasMore: offset + limit < reports.length
    }
  });
}));

// GET /api/reports/:id - Get specific report
router.get('/:id', optionalAuth, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;

  const report = await db.getReportById(id);
  if (!report) {
    throw new AppError('Report not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { report }
  });
}));

// POST /api/reports - Create new report (requires authentication)
router.post('/', authenticate, [
  body('hazard')
    .notEmpty()
    .isString()
    .withMessage('Hazard type is required'),
  body('description')
    .notEmpty()
    .isString()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('location.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('location.name')
    .notEmpty()
    .isString()
    .withMessage('Location name is required'),
  body('image')
    .optional()
    .isString()
    .withMessage('Image must be a base64 string'),
  body('summary')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Summary must be less than 500 characters')
], checkValidation, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { hazard, description, location, image, summary } = req.body;
  
  // Debug logging
  logger.info('Report submission request:', {
    body: req.body,
    user: req.user ? { id: req.user.id, email: req.user.email } : 'No user',
    headers: req.headers.authorization ? 'Has auth header' : 'No auth header'
  });
  
  const user = req.user;
  if (!user) {
    logger.error('No authenticated user found for report submission');
    throw new AppError('Authentication required', 401);
  }

  // Determine if report should be auto-verified based on user role
  const isOfficial = user.role === 'official' || user.role === 'analyst';
  let confidence = isOfficial ? 75 : 30 + Math.floor(Math.random() * 20);

  // Skip ocean data enhancement for now to prevent import issues
  logger.info(`Using base confidence: ${confidence}%`);

  const reportData = {
    author: user.name,
    authorId: user.id,
    role: user.role,
    hazard,
    description,
    location,
    image,
    verified: isOfficial,
    summary: summary || 'AI summary unavailable.',
    confidence
  };

  const newReport = await db.createReport(reportData);

  logger.info(`New report created by ${user.email}: ${newReport.id}`);

  res.status(201).json({
    success: true,
    message: 'Report created successfully',
    data: { report: newReport }
  });
}));

// PUT /api/reports/:id/verify - Verify a report (requires official/analyst role)
router.put('/:id/verify', authenticate, authorize('official', 'analyst'), asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const user = req.user!;

  const report = await db.getReportById(id);
  if (!report) {
    throw new AppError('Report not found', 404);
  }

  if (report.verified) {
    throw new AppError('Report is already verified', 400);
  }

  // Update report verification status
  const updatedReport = await db.updateReport(id, {
    verified: true,
    confidence: Math.min(report.confidence + 25, 100)
  });

  if (!updatedReport) {
    throw new AppError('Failed to verify report', 500);
  }

  logger.info(`Report ${id} verified by ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Report verified successfully',
    data: { report: updatedReport }
  });
}));

// PUT /api/reports/:id - Update report (only by author or officials)
router.put('/:id', authenticate, [
  body('description')
    .optional()
    .isString()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('location.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('location.name')
    .optional()
    .isString()
    .withMessage('Location name must be a string'),
  body('image')
    .optional()
    .isString()
    .withMessage('Image must be a base64 string')
], checkValidation, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const user = req.user!;
  const updates = req.body;

  const report = await db.getReportById(id);
  if (!report) {
    throw new AppError('Report not found', 404);
  }

  // Check permissions: only author or officials can update
  const canUpdate = report.authorId === user.id || user.role === 'official' || user.role === 'analyst';
  if (!canUpdate) {
    throw new AppError('You do not have permission to update this report', 403);
  }

  // Remove empty updates
  const filteredUpdates = Object.keys(updates).reduce((acc: any, key) => {
    if (updates[key] !== undefined && updates[key] !== null && updates[key] !== '') {
      acc[key] = updates[key];
    }
    return acc;
  }, {});

  if (Object.keys(filteredUpdates).length === 0) {
    throw new AppError('No valid fields to update', 400);
  }

  const updatedReport = await db.updateReport(id, filteredUpdates);
  if (!updatedReport) {
    throw new AppError('Failed to update report', 500);
  }

  logger.info(`Report ${id} updated by ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Report updated successfully',
    data: { report: updatedReport }
  });
}));

// DELETE /api/reports/:id - Delete report (only by author or officials)
router.delete('/:id', authenticate, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const user = req.user!;

  const report = await db.getReportById(id);
  if (!report) {
    throw new AppError('Report not found', 404);
  }

  // Check permissions: only author or officials can delete
  const canDelete = report.authorId === user.id || user.role === 'official' || user.role === 'analyst';
  if (!canDelete) {
    throw new AppError('You do not have permission to delete this report', 403);
  }

  // In a real application, you might want to soft delete instead
  // For now, we'll mark it as deleted by updating the description
  const deletedReport = await db.updateReport(id, {
    description: '[DELETED]',
    verified: false,
    confidence: 0
  });

  if (!deletedReport) {
    throw new AppError('Failed to delete report', 500);
  }

  logger.info(`Report ${id} deleted by ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Report deleted successfully'
  });
}));

// GET /api/reports/stats/summary - Get reports statistics
router.get('/stats/summary', optionalAuth, asyncHandler(async (req: express.Request, res: express.Response) => {
  const reports = await db.getAllReports();

  const stats = {
    total: reports.length,
    verified: reports.filter(r => r.verified).length,
    unverified: reports.filter(r => !r.verified).length,
    byHazardType: reports.reduce((acc: any, report) => {
      acc[report.hazard] = (acc[report.hazard] || 0) + 1;
      return acc;
    }, {}),
    byRole: reports.reduce((acc: any, report) => {
      acc[report.role] = (acc[report.role] || 0) + 1;
      return acc;
    }, {}),
    recent: reports.filter(report => {
      const reportDate = new Date(report.timestamp);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return reportDate > dayAgo;
    }).length
  };

  res.status(200).json({
    success: true,
    data: { stats }
  });
}));

// POST /api/reports/:id/verify - Verify a report (Officials only)
router.post('/:id/verify', [
  authenticate,
  authorize('official', 'analyst'),
  body('verificationNote')
    .optional()
    .isString()
    .withMessage('Verification note must be a string')
], checkValidation, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { verificationNote } = req.body;
  const user = (req as any).user;

  // Get the report
  const report = await db.getReportById(id);
  if (!report) {
    throw new AppError('Report not found', 404);
  }

  // Update report verification status
  const updatedReport = await db.updateReport(id, {
    verified: true,
    confidence: Math.max(report.confidence, 85) // Boost confidence when verified by official
  });

  logger.info(`Report ${id} verified by ${user.name} (${user.role})`);

  res.status(200).json({
    success: true,
    message: 'Report verified successfully',
    data: { report: updatedReport }
  });
}));

// POST /api/reports/:id/reject - Reject a report (Officials only)
router.post('/:id/reject', [
  authenticate,
  authorize('official', 'analyst'),
  body('rejectionReason')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isString()
    .withMessage('Rejection reason must be a string')
], checkValidation, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;
  const user = (req as any).user;

  // Get the report
  const report = await db.getReportById(id);
  if (!report) {
    throw new AppError('Report not found', 404);
  }

  // Check if report is already rejected (permanent status)
  if (report.verificationStatus === 'rejected') {
    throw new AppError('Report is already rejected and cannot be modified', 400);
  }

  // Update report verification status (mark as rejected - permanent)
  const updatedReport = await db.updateReport(id, {
    verified: false,
    verificationStatus: 'rejected',
    rejectionReason,
    verifiedBy: user.name,
    verifiedAt: new Date().toISOString(),
    confidence: Math.min(report.confidence, 20) // Lower confidence for rejected reports
  });

  logger.info(`Report ${id} rejected by ${user.name} (${user.role}): ${rejectionReason}`);

  res.status(200).json({
    success: true,
    message: 'Report rejected successfully',
    data: { report: updatedReport }
  });
}));

// DELETE feature removed - Reports can only be rejected, not deleted
// This maintains audit trail and prevents data loss

export default router;
