import express from 'express';
import rateLimit from 'express-rate-limit';
import socialMediaService from '../services/socialMediaServiceNew';
import { logger } from '../utils/logger';

const router = express.Router();

// Rate limiting for social media API calls
const socialMediaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many social media requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /api/social-media/posts
 * Fetch all social media posts related to ocean hazards
 */
router.get('/posts', socialMediaLimiter, async (req, res) => {
  try {
    logger.info('📱 Social media posts requested');
    
    const posts = await socialMediaService.fetchAllSocialData();
    
    res.json({
      success: true,
      data: posts,
      count: posts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching social media posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch social media data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/social-media/reddit
 * Fetch only Reddit posts
 */
router.get('/reddit', socialMediaLimiter, async (req, res) => {
  try {
    logger.info('📱 Reddit posts requested');
    
    const posts = await socialMediaService.fetchRedditPosts();
    
    res.json({
      success: true,
      data: posts,
      count: posts.length,
      source: 'reddit',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching Reddit posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Reddit data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/social-media/news
 * Fetch only news posts
 */
router.get('/news', socialMediaLimiter, async (req, res) => {
  try {
    logger.info('📰 News posts requested');
    
    const posts = await socialMediaService.fetchNewsData();
    
    res.json({
      success: true,
      data: posts,
      count: posts.length,
      source: 'news',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching news posts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/social-media/mock
 * Get mock social media data for testing
 */
router.get('/mock', (req, res) => {
  try {
    logger.info('🎭 Mock social media data requested');
    
    const posts = socialMediaService.generateRealisticMockData();
    
    res.json({
      success: true,
      data: posts,
      count: posts.length,
      source: 'mock',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error generating mock data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate mock data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/social-media/health
 * Health check for social media service
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Social Media API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/social-media/posts',
      '/api/social-media/reddit',
      '/api/social-media/news',
      '/api/social-media/mock'
    ]
  });
});

export default router;
