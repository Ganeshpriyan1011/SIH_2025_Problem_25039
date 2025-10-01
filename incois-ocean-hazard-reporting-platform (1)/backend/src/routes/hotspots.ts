import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { hotspotService } from '../services/hotspotService';
import { nlpService } from '../services/nlpService';
import { db } from '../services/database';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

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

// GET /api/hotspots - Get all active hotspots
router.get('/', 
  authenticate,
  query('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('hazardType').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  checkValidation,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { riskLevel, hazardType, limit = 50 } = req.query;

    // Get all reports and social media data
    const reports = await db.getAllReports();
    
    // For demo purposes, create some mock social media analyses
    // In production, this would come from real social media monitoring
    const mockSocialMediaAnalyses = [
      {
        id: 'social_1',
        analysis: nlpService.analyzeSocialMediaPost('Tsunami warning issued for Chennai coast! Evacuate immediately!'),
        location: { lat: 13.0827, lng: 80.2707 }
      },
      {
        id: 'social_2', 
        analysis: nlpService.analyzeSocialMediaPost('Heavy flooding in Mumbai coastal areas due to cyclone'),
        location: { lat: 19.0760, lng: 72.8777 }
      }
    ];

    // Generate hotspots
    const hotspots = hotspotService.generateHotspots(reports, mockSocialMediaAnalyses);

    // Filter by risk level if specified
    let filteredHotspots = hotspots;
    if (riskLevel) {
      filteredHotspots = hotspots.filter(h => h.riskLevel === riskLevel);
    }

    // Filter by hazard type if specified
    if (hazardType) {
      filteredHotspots = filteredHotspots.filter(h => h.hazardType === hazardType);
    }

    // Apply limit
    filteredHotspots = filteredHotspots.slice(0, parseInt(limit as string));

    logger.info(`Retrieved ${filteredHotspots.length} hotspots`);

    res.json({
      success: true,
      data: {
        hotspots: filteredHotspots,
        total: filteredHotspots.length,
        filters: { riskLevel, hazardType }
      }
    });
  })
);

// GET /api/hotspots/critical - Get critical hotspots requiring immediate attention
router.get('/critical',
  authenticate,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const criticalHotspots = hotspotService.getCriticalHotspots();

    res.json({
      success: true,
      data: {
        hotspots: criticalHotspots,
        count: criticalHotspots.length,
        message: criticalHotspots.length > 0 ? 'Critical hotspots detected' : 'No critical hotspots'
      }
    });
  })
);

// GET /api/hotspots/:id - Get specific hotspot details
router.get('/:id',
  authenticate,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    
    // This would typically fetch from a database
    // For now, regenerate hotspots and find the specific one
    const reports = await db.getAllReports();
    const mockSocialMediaAnalyses: any[] = []; // Add mock data as needed
    
    const hotspots = hotspotService.generateHotspots(reports, mockSocialMediaAnalyses);
    const hotspot = hotspots.find(h => h.id === id);

    if (!hotspot) {
      return res.status(404).json({
        success: false,
        message: 'Hotspot not found'
      });
    }

    // Get related reports and social media posts
    const relatedReports = reports.filter(r => hotspot.reports.includes(r.id));

    res.json({
      success: true,
      data: {
        hotspot,
        relatedReports,
        socialMediaCount: hotspot.socialMediaPosts.length
      }
    });
  })
);

// POST /api/hotspots/analyze - Analyze social media for hotspot generation
router.post('/analyze',
  authenticate,
  body('posts').isArray().withMessage('Posts must be an array'),
  body('posts.*.text').isString().withMessage('Post text is required'),
  body('posts.*.id').isString().withMessage('Post ID is required'),
  checkValidation,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { posts } = req.body;

    // Analyze social media posts using NLP
    const analyses = nlpService.batchAnalyze(posts);
    
    // Filter for hazard-related posts
    const hazardPosts = analyses.filter(a => a.analysis.isHazardRelated);

    // Get trending hazards
    const trendingHazards = nlpService.getTrendingHazards(analyses.map(a => a.analysis));

    res.json({
      success: true,
      data: {
        totalAnalyzed: analyses.length,
        hazardRelated: hazardPosts.length,
        trendingHazards,
        analyses: hazardPosts
      }
    });
  })
);

// PUT /api/hotspots/config - Update hotspot generation configuration
router.put('/config',
  authenticate,
  body('minReportsForHotspot').optional().isInt({ min: 1 }),
  body('maxRadius').optional().isFloat({ min: 1, max: 200 }),
  body('decayFactor').optional().isFloat({ min: 0, max: 1 }),
  body('socialMediaWeight').optional().isFloat({ min: 0, max: 1 }),
  body('verificationBonus').optional().isFloat({ min: 1, max: 5 }),
  checkValidation,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const config = req.body;
    
    // Only allow admins to update configuration
    const user = (req as any).user;
    if (user.role !== 'admin' && user.role !== 'official') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update configuration'
      });
    }

    hotspotService.updateConfig(config);

    logger.info(`Hotspot configuration updated by user ${user.userId}`);

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: { config }
    });
  })
);

// GET /api/hotspots/stats - Get hotspot statistics
router.get('/stats/overview',
  authenticate,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const reports = await db.getAllReports();
    const mockSocialMediaAnalyses: any[] = [];
    
    const hotspots = hotspotService.generateHotspots(reports, mockSocialMediaAnalyses);

    const stats = {
      totalHotspots: hotspots.length,
      byRiskLevel: {
        critical: hotspots.filter(h => h.riskLevel === 'critical').length,
        high: hotspots.filter(h => h.riskLevel === 'high').length,
        medium: hotspots.filter(h => h.riskLevel === 'medium').length,
        low: hotspots.filter(h => h.riskLevel === 'low').length
      },
      byHazardType: {} as any,
      earlyWarningsIssued: hotspots.filter(h => h.earlyWarningIssued).length,
      averageIntensity: hotspots.reduce((sum, h) => sum + h.intensity, 0) / hotspots.length || 0
    };

    // Count by hazard type
    for (const hotspot of hotspots) {
      const hazardType = hotspot.hazardType;
      stats.byHazardType[hazardType] = (stats.byHazardType[hazardType] || 0) + 1;
    }

    res.json({
      success: true,
      data: stats
    });
  })
);

export default router;
