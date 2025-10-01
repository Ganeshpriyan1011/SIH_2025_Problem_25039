import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { offlineService } from '../services/offlineService';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';
// Define HazardType locally to avoid import issues
enum HazardType {
  Tsunami = 'tsunami',
  Cyclone = 'cyclone',
  Flooding = 'flooding',
  StormSurge = 'storm_surge',
  Earthquake = 'earthquake',
  CoastalErosion = 'coastal_erosion'
}

const router = express.Router();

// Validation middleware
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

// POST /api/offline/reports - Store report for offline use
router.post('/reports',
  authenticate,
  body('hazard').isIn(Object.values(HazardType)).withMessage('Invalid hazard type'),
  body('description').isString().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('location.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('location.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('location.name').isString().withMessage('Location name is required'),
  body('location.accuracy').optional().isFloat({ min: 0 }),
  body('images').optional().isArray(),
  body('deviceInfo.platform').isString().withMessage('Device platform is required'),
  body('deviceInfo.version').isString().withMessage('Device version is required'),
  body('deviceInfo.connectivity').isIn(['offline', 'poor', 'good']).withMessage('Invalid connectivity status'),
  body('deviceInfo.batteryLevel').optional().isFloat({ min: 0, max: 100 }),
  checkValidation,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const user = (req as any).user;
    const reportData = {
      ...req.body,
      userId: user.userId
    };

    const offlineReport = await offlineService.storeOfflineReport(reportData);

    logger.info(`Offline report stored: ${offlineReport.tempId} by user ${user.userId}`);

    res.status(201).json({
      success: true,
      message: 'Report stored for offline sync',
      data: {
        tempId: offlineReport.tempId,
        priority: offlineReport.priority,
        syncStatus: offlineReport.syncStatus,
        timestamp: offlineReport.timestamp
      }
    });
  })
);

// POST /api/offline/sync - Sync pending reports to server
router.post('/sync',
  authenticate,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const user = (req as any).user;
    
    logger.info(`Sync initiated by user ${user.userId}`);
    
    const syncResult = await offlineService.syncPendingReports();

    res.json({
      success: syncResult.success,
      message: syncResult.success ? 'Sync completed successfully' : 'Sync completed with errors',
      data: syncResult
    });
  })
);

// GET /api/offline/reports - Get pending offline reports
router.get('/reports',
  authenticate,
  query('status').optional().isIn(['pending', 'syncing', 'synced', 'failed']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  checkValidation,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { status, priority } = req.query;
    
    let reports = offlineService.getPendingReports();

    // Filter by status if specified
    if (status) {
      reports = reports.filter(r => r.syncStatus === status);
    }

    // Filter by priority if specified
    if (priority) {
      reports = reports.filter(r => r.priority === priority);
    }

    // Remove sensitive information for response
    const sanitizedReports = reports.map(report => ({
      tempId: report.tempId,
      id: report.id,
      hazard: report.hazard,
      description: report.description,
      location: report.location,
      timestamp: report.timestamp,
      syncStatus: report.syncStatus,
      priority: report.priority,
      syncAttempts: report.syncAttempts,
      lastSyncAttempt: report.lastSyncAttempt,
      imageCount: report.images.length
    }));

    res.json({
      success: true,
      data: {
        reports: sanitizedReports,
        count: sanitizedReports.length,
        filters: { status, priority }
      }
    });
  })
);

// GET /api/offline/stats - Get offline sync statistics
router.get('/stats',
  authenticate,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const stats = offlineService.getSyncStats();

    res.json({
      success: true,
      data: stats
    });
  })
);

// POST /api/offline/retry-failed - Retry failed sync attempts
router.post('/retry-failed',
  authenticate,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const user = (req as any).user;
    
    offlineService.retryFailedReports();
    
    logger.info(`Failed reports retry initiated by user ${user.userId}`);

    res.json({
      success: true,
      message: 'Failed reports queued for retry'
    });
  })
);

// DELETE /api/offline/reports/:tempId - Delete specific offline report
router.delete('/reports/:tempId',
  authenticate,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { tempId } = req.params;
    const user = (req as any).user;

    const deleted = offlineService.deleteOfflineReport(tempId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Offline report not found'
      });
    }

    logger.info(`Offline report deleted: ${tempId} by user ${user.userId}`);

    res.json({
      success: true,
      message: 'Offline report deleted successfully'
    });
  })
);

// POST /api/offline/clear-synced - Clear synced reports from local storage
router.post('/clear-synced',
  authenticate,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const user = (req as any).user;
    
    const clearedCount = offlineService.clearSyncedReports();
    
    logger.info(`${clearedCount} synced reports cleared by user ${user.userId}`);

    res.json({
      success: true,
      message: `${clearedCount} synced reports cleared`,
      data: { clearedCount }
    });
  })
);

// PUT /api/offline/config - Update offline service configuration
router.put('/config',
  authenticate,
  body('maxStorageSize').optional().isInt({ min: 10, max: 1000 }),
  body('maxRetryAttempts').optional().isInt({ min: 1, max: 10 }),
  body('syncBatchSize').optional().isInt({ min: 1, max: 50 }),
  body('compressionEnabled').optional().isBoolean(),
  body('autoSyncInterval').optional().isInt({ min: 1, max: 120 }),
  checkValidation,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const user = (req as any).user;
    
    // Only allow admins to update configuration
    if (user.role !== 'admin' && user.role !== 'official') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update configuration'
      });
    }

    const config = req.body;
    offlineService.updateConfig(config);

    logger.info(`Offline service configuration updated by user ${user.userId}`);

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: { config }
    });
  })
);

// GET /api/offline/health - Check offline service health
router.get('/health',
  authenticate,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const stats = offlineService.getSyncStats();
    
    const health = {
      status: 'healthy',
      pendingReports: stats.totalPending,
      storageUsed: stats.totalStorageUsed,
      issues: [] as string[]
    };

    // Check for potential issues
    if (stats.totalStorageUsed > 80) { // 80MB threshold
      health.issues.push('High storage usage detected');
    }

    if (stats.byStatus.failed && stats.byStatus.failed > 10) {
      health.issues.push('High number of failed sync attempts');
    }

    if (stats.totalPending > 100) {
      health.issues.push('Large number of pending reports');
    }

    if (health.issues.length > 0) {
      health.status = 'warning';
    }

    res.json({
      success: true,
      data: health
    });
  })
);

// POST /api/offline/bulk-upload - Handle bulk upload of offline reports
router.post('/bulk-upload',
  authenticate,
  body('reports').isArray().withMessage('Reports must be an array'),
  body('reports.*.hazard').isIn(Object.values(HazardType)),
  body('reports.*.description').isString().isLength({ min: 10 }),
  body('reports.*.location.lat').isFloat({ min: -90, max: 90 }),
  body('reports.*.location.lng').isFloat({ min: -180, max: 180 }),
  body('reports.*.location.name').isString(),
  checkValidation,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { reports } = req.body;
    const user = (req as any).user;

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const reportData of reports) {
      try {
        const offlineReport = await offlineService.storeOfflineReport({
          ...reportData,
          userId: user.userId,
          deviceInfo: reportData.deviceInfo || {
            platform: 'bulk_upload',
            version: '1.0',
            connectivity: 'good'
          }
        });
        
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          report: reportData,
          error: (error as Error).message
        });
      }
    }

    logger.info(`Bulk upload completed by user ${user.userId}: ${results.successful} successful, ${results.failed} failed`);

    res.json({
      success: results.failed === 0,
      message: `Bulk upload completed: ${results.successful} successful, ${results.failed} failed`,
      data: results
    });
  })
);

export default router;
