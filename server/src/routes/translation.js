const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authMiddleware: auth } = require('../middleware/auth');
const translationService = require('../utils/translationService');
const router = express.Router();

// Validation middleware
const validateTranslation = [
  body('text')
    .isString()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Text must be between 1 and 5000 characters'),
  body('target_language')
    .isString()
    .isLength({ min: 2, max: 5 })
    .withMessage('Target language must be a valid language code'),
  body('source_language')
    .optional()
    .isString()
    .isLength({ min: 2, max: 5 })
    .withMessage('Source language must be a valid language code')
];

const validateBatchTranslation = [
  body('texts')
    .isArray({ min: 1, max: 50 })
    .withMessage('Texts must be an array with 1-50 items'),
  body('texts.*')
    .isString()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Each text must be between 1 and 5000 characters'),
  body('target_language')
    .isString()
    .isLength({ min: 2, max: 5 })
    .withMessage('Target language must be a valid language code'),
  body('source_language')
    .optional()
    .isString()
    .isLength({ min: 2, max: 5 })
    .withMessage('Source language must be a valid language code')
];

// POST /api/translate - Translate text content
router.post('/', auth, validateTranslation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { text, target_language, source_language = 'auto' } = req.body;

    // Rate limiting check (simple in-memory counter per user)
    const userId = req.user._id.toString();
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 30; // 30 requests per minute per user

    if (!global.translationRateLimit) {
      global.translationRateLimit = new Map();
    }

    const userRequests = global.translationRateLimit.get(userId) || [];
    const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many translation requests. Please try again later.'
      });
    }

    // Update rate limit counter
    recentRequests.push(now);
    global.translationRateLimit.set(userId, recentRequests);

    // Perform translation
    const result = await translationService.translateText(text, target_language, source_language);

    // Log translation request for analytics (optional)
    console.log(`Translation request: ${req.user.organization_id} - ${source_language} -> ${target_language}`);

    if (result.success || result.fallback) {
      res.json({
        success: true,
        data: {
          original_text: result.original_text,
          translated_text: result.translated_text,
          source_language: result.source_language,
          target_language: result.target_language,
          cached: result.cached || false,
          skipped: result.skipped || false,
          fallback: result.fallback || false
        },
        message: result.fallback ? 
          'Translation service unavailable, returning original text' : 
          'Text translated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Translation failed',
        data: {
          original_text: result.original_text,
          translated_text: result.translated_text, // Fallback to original
          source_language: result.source_language,
          target_language: result.target_language,
          fallback: true
        }
      });
    }

  } catch (error) {
    console.error('Translation API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Translation service error',
      data: {
        original_text: req.body.text,
        translated_text: req.body.text, // Fallback to original
        fallback: true
      }
    });
  }
});

// POST /api/translate/batch - Translate multiple texts
router.post('/batch', auth, validateBatchTranslation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { texts, target_language, source_language = 'auto' } = req.body;

    // Enhanced rate limiting for batch requests
    const userId = req.user._id.toString();
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxBatchRequests = 5; // 5 batch requests per minute per user

    if (!global.batchTranslationRateLimit) {
      global.batchTranslationRateLimit = new Map();
    }

    const userBatchRequests = global.batchTranslationRateLimit.get(userId) || [];
    const recentBatchRequests = userBatchRequests.filter(timestamp => now - timestamp < windowMs);

    if (recentBatchRequests.length >= maxBatchRequests) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many batch translation requests. Please try again later.'
      });
    }

    // Update rate limit counter
    recentBatchRequests.push(now);
    global.batchTranslationRateLimit.set(userId, recentBatchRequests);

    // Perform batch translation
    const result = await translationService.translateBatch(texts, target_language, source_language);

    res.json({
      success: true,
      data: {
        results: result.results,
        total_processed: result.total_processed,
        successful_translations: result.successful_translations,
        errors: result.errors
      },
      message: `Processed ${result.total_processed} texts, ${result.successful_translations} successful`
    });

  } catch (error) {
    console.error('Batch translation API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Batch translation service error'
    });
  }
});

// GET /api/translate/languages - Get supported languages
router.get('/languages', auth, async (req, res) => {
  try {
    const result = await translationService.getSupportedLanguages();

    if (result.success) {
      res.json({
        success: true,
        data: {
          languages: result.languages
        },
        message: 'Supported languages retrieved successfully'
      });
    } else {
      // Return fallback languages if service is unavailable
      res.json({
        success: true,
        data: {
          languages: result.languages // Fallback languages from service
        },
        message: 'Returned fallback language list'
      });
    }

  } catch (error) {
    console.error('Get languages API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve supported languages'
    });
  }
});

// POST /api/translate/detect - Detect language of text
router.post('/detect', auth, [
  body('text')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Text must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please check your input',
        details: errors.array()
      });
    }

    const { text } = req.body;

    // Simple rate limiting for detection
    const userId = req.user._id.toString();
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxDetectionRequests = 20; // 20 detection requests per minute per user

    if (!global.detectionRateLimit) {
      global.detectionRateLimit = new Map();
    }

    const userDetectionRequests = global.detectionRateLimit.get(userId) || [];
    const recentDetectionRequests = userDetectionRequests.filter(timestamp => now - timestamp < windowMs);

    if (recentDetectionRequests.length >= maxDetectionRequests) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many language detection requests. Please try again later.'
      });
    }

    // Update rate limit counter
    recentDetectionRequests.push(now);
    global.detectionRateLimit.set(userId, recentDetectionRequests);

    // Perform language detection
    const result = await translationService.detectLanguage(text);

    res.json({
      success: true,
      data: {
        detected_language: result.language,
        confidence: result.confidence,
        text_sample: text.substring(0, 100) + (text.length > 100 ? '...' : '')
      },
      message: result.success ? 
        'Language detected successfully' : 
        'Language detection failed, returned default'
    });

  } catch (error) {
    console.error('Language detection API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Language detection service error',
      data: {
        detected_language: 'en', // Fallback to English
        confidence: 0
      }
    });
  }
});

// GET /api/translate/stats - Get translation service statistics (admin only)
router.get('/stats', auth, async (req, res) => {
  try {
    // Only admins can view translation statistics
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can view translation statistics'
      });
    }

    const cacheStats = translationService.getCacheStats();

    res.json({
      success: true,
      data: {
        cache_statistics: cacheStats,
        service_status: 'operational', // Could be enhanced with health checks
        rate_limits: {
          translation_requests_per_minute: 30,
          batch_requests_per_minute: 5,
          detection_requests_per_minute: 20
        }
      },
      message: 'Translation service statistics retrieved'
    });

  } catch (error) {
    console.error('Translation stats API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to retrieve translation statistics'
    });
  }
});

// DELETE /api/translate/cache - Clear translation cache (admin only)
router.delete('/cache', auth, async (req, res) => {
  try {
    // Only admins can clear translation cache
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only administrators can clear translation cache'
      });
    }

    translationService.clearCache();

    res.json({
      success: true,
      message: 'Translation cache cleared successfully'
    });

  } catch (error) {
    console.error('Clear cache API error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to clear translation cache'
    });
  }
});

module.exports = router;