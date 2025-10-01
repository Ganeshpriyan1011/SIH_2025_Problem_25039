import express from 'express';
import { body, validationResult } from 'express-validator';
import { geminiService } from '../services/geminiService';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';
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

// POST /api/chatbot/chat - General chat with AI assistant
router.post('/chat', [
  body('message')
    .notEmpty()
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('context')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('Context must be less than 200 characters')
], optionalAuth, checkValidation, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { message, context } = req.body;
  const user = (req as any).user;

  try {
    logger.info(`Chatbot request from ${user?.email || 'anonymous'}: ${message.substring(0, 50)}...`);

    const response = await geminiService.generateResponse(message, context);

    res.json({
      success: true,
      data: {
        response,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Chatbot error:', error);
    throw new AppError('Failed to generate response. Please try again.', 500);
  }
}));

// POST /api/chatbot/analyze-hazard - Get AI analysis of a hazard
router.post('/analyze-hazard', [
  body('hazardType')
    .notEmpty()
    .isString()
    .withMessage('Hazard type is required'),
  body('location')
    .notEmpty()
    .isString()
    .withMessage('Location is required'),
  body('description')
    .notEmpty()
    .isString()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters')
], optionalAuth, checkValidation, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { hazardType, location, description } = req.body;
  const user = (req as any).user;

  try {
    logger.info(`Hazard analysis request from ${user?.email || 'anonymous'}: ${hazardType} at ${location}`);

    const analysis = await geminiService.generateHazardAnalysis(hazardType, location, description);

    res.json({
      success: true,
      data: {
        analysis,
        hazardType,
        location,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Hazard analysis error:', error);
    throw new AppError('Failed to generate hazard analysis. Please try again.', 500);
  }
}));

// GET /api/chatbot/safety-guidelines/:hazardType - Get safety guidelines for a hazard type
router.get('/safety-guidelines/:hazardType', optionalAuth, asyncHandler(async (req: express.Request, res: express.Response) => {
  const { hazardType } = req.params;
  const user = (req as any).user;

  if (!hazardType || hazardType.trim().length === 0) {
    throw new AppError('Hazard type is required', 400);
  }

  try {
    logger.info(`Safety guidelines request from ${user?.email || 'anonymous'}: ${hazardType}`);

    const guidelines = await geminiService.generateSafetyGuidelines(hazardType);

    res.json({
      success: true,
      data: {
        guidelines,
        hazardType,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Safety guidelines error:', error);
    throw new AppError('Failed to generate safety guidelines. Please try again.', 500);
  }
}));

// GET /api/chatbot/quick-responses - Get predefined quick responses
router.get('/quick-responses', optionalAuth, asyncHandler(async (req: express.Request, res: express.Response) => {
  const quickResponses = [
    {
      id: 'emergency',
      title: 'Emergency Procedures',
      message: 'What should I do in case of a tsunami warning?'
    },
    {
      id: 'report',
      title: 'Report a Hazard',
      message: 'How do I report an ocean hazard I observed?'
    },
    {
      id: 'safety',
      title: 'Safety Guidelines',
      message: 'What are the general safety guidelines for coastal areas?'
    },
    {
      id: 'cyclone',
      title: 'Cyclone Information',
      message: 'Tell me about cyclone preparedness and safety measures.'
    },
    {
      id: 'waves',
      title: 'High Waves',
      message: 'What precautions should I take during high wave conditions?'
    },
    {
      id: 'contact',
      title: 'Emergency Contacts',
      message: 'Who should I contact in case of a marine emergency?'
    }
  ];

  res.json({
    success: true,
    data: {
      quickResponses,
      timestamp: new Date().toISOString()
    }
  });
}));

export default router;
