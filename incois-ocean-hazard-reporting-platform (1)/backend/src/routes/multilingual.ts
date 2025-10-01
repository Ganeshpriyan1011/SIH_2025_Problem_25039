import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { multilingualService } from '../services/multilingualService';
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

// GET /api/multilingual/languages - Get supported languages
router.get('/languages',
  query('region').optional().isString(),
  checkValidation,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { region } = req.query;

    let languages;
    if (region) {
      languages = multilingualService.getLanguagesForRegion(region as string);
    } else {
      languages = multilingualService.getSupportedLanguages();
    }

    res.json({
      success: true,
      data: {
        languages,
        count: languages.length
      }
    });
  })
);

// GET /api/multilingual/translations/:language - Get translations for a language
router.get('/translations/:language',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { language } = req.params;
    const { keys } = req.query;

    if (!multilingualService.getSupportedLanguages().find(l => l.code === language)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported language'
      });
    }

    let translations: any = {};

    if (keys) {
      // Get specific translation keys
      const keyArray = (keys as string).split(',');
      for (const key of keyArray) {
        translations[key] = multilingualService.getTranslation(key.trim(), language);
      }
    } else {
      // Get common translations
      const commonKeys = [
        'app.title',
        'app.subtitle',
        'auth.login',
        'auth.register',
        'auth.email',
        'auth.password',
        'hazards.tsunami',
        'hazards.cyclone',
        'hazards.flooding',
        'hazards.stormSurge',
        'hazards.earthquake',
        'hazards.coastalErosion',
        'dashboard.reports',
        'dashboard.hotspots',
        'dashboard.warnings',
        'warnings.critical',
        'warnings.high',
        'warnings.medium',
        'warnings.low'
      ];

      for (const key of commonKeys) {
        translations[key] = multilingualService.getTranslation(key, language);
      }
    }

    res.json({
      success: true,
      data: {
        language,
        translations
      }
    });
  })
);

// POST /api/multilingual/translate - Translate specific text
router.post('/translate',
  body('text').isString().withMessage('Text is required'),
  body('targetLanguage').isString().withMessage('Target language is required'),
  body('sourceLanguage').optional().isString(),
  body('context').optional().isIn(['hazard', 'report', 'warning', 'general']),
  checkValidation,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { text, targetLanguage, sourceLanguage, context } = req.body;

    // Auto-detect source language if not provided
    const detectedLanguage = sourceLanguage || multilingualService.detectLanguage(text);

    // For hazard names, use specialized translation
    if (context === 'hazard') {
      const translatedHazard = multilingualService.translateHazard(text, targetLanguage);
      return res.json({
        success: true,
        data: {
          originalText: text,
          translatedText: translatedHazard,
          sourceLanguage: detectedLanguage,
          targetLanguage,
          context
        }
      });
    }

    // For other contexts, this would integrate with a translation service
    // For now, return a placeholder response
    res.json({
      success: true,
      data: {
        originalText: text,
        translatedText: `[${targetLanguage}] ${text}`, // Placeholder
        sourceLanguage: detectedLanguage,
        targetLanguage,
        context: context || 'general'
      }
    });
  })
);

// POST /api/multilingual/emergency-message - Format emergency message in multiple languages
router.post('/emergency-message',
  authenticate,
  body('hazardType').isString().withMessage('Hazard type is required'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
  body('location').isString().withMessage('Location is required'),
  body('languages').isArray().withMessage('Languages must be an array'),
  checkValidation,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { hazardType, severity, location, languages } = req.body;

    // Validate languages
    const supportedLanguages = multilingualService.getSupportedLanguages().map(l => l.code);
    const invalidLanguages = languages.filter((lang: string) => !supportedLanguages.includes(lang));
    
    if (invalidLanguages.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Unsupported languages: ${invalidLanguages.join(', ')}`
      });
    }

    const messages = multilingualService.formatEmergencyMessage(
      hazardType,
      severity,
      location,
      languages
    );

    // Convert Map to object for JSON response
    const messageObject: any = {};
    messages.forEach((message, lang) => {
      messageObject[lang] = message;
    });

    logger.info(`Generated emergency message for ${hazardType} in ${languages.length} languages`);

    res.json({
      success: true,
      data: {
        hazardType,
        severity,
        location,
        messages: messageObject,
        timestamp: new Date().toISOString()
      }
    });
  })
);

// GET /api/multilingual/detect-language - Detect language of text
router.get('/detect-language',
  query('text').isString().withMessage('Text parameter is required'),
  checkValidation,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { text } = req.query;
    
    const detectedLanguage = multilingualService.detectLanguage(text as string);
    const languageInfo = multilingualService.getSupportedLanguages()
      .find(l => l.code === detectedLanguage);

    res.json({
      success: true,
      data: {
        text,
        detectedLanguage,
        languageInfo,
        confidence: detectedLanguage === 'en' ? 0.8 : 0.9 // Placeholder confidence
      }
    });
  })
);

// GET /api/multilingual/hazard-terms/:language - Get hazard terminology for a language
router.get('/hazard-terms/:language',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { language } = req.params;

    const hazardTerms = multilingualService.getHazardTermsForLanguage(language);
    
    // Convert Map to object
    const termsObject: any = {};
    hazardTerms.forEach((terms, hazard) => {
      termsObject[hazard] = terms;
    });

    res.json({
      success: true,
      data: {
        language,
        hazardTerms: termsObject
      }
    });
  })
);

// POST /api/multilingual/add-translation - Add custom translation (Admin only)
router.post('/add-translation',
  authenticate,
  body('language').isString().withMessage('Language is required'),
  body('key').isString().withMessage('Translation key is required'),
  body('value').isString().withMessage('Translation value is required'),
  checkValidation,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { language, key, value } = req.body;
    const user = (req as any).user;

    // Only allow admins to add translations
    if (user.role !== 'admin' && user.role !== 'official') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to add translations'
      });
    }

    multilingualService.addTranslation(language, key, value);

    logger.info(`Translation added by user ${user.userId}: ${language}.${key}`);

    res.json({
      success: true,
      message: 'Translation added successfully',
      data: { language, key, value }
    });
  })
);

// GET /api/multilingual/stats - Get translation statistics
router.get('/stats',
  authenticate,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const stats = multilingualService.getTranslationStats();

    // Convert Map to object for JSON response
    const completionObject: any = {};
    stats.completionByLanguage.forEach((completion, lang) => {
      completionObject[lang] = completion;
    });

    res.json({
      success: true,
      data: {
        supportedLanguages: stats.supportedLanguages,
        totalTranslations: stats.totalTranslations,
        completionByLanguage: completionObject
      }
    });
  })
);

export default router;
