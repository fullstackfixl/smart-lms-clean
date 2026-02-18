const axios = require('axios');
const crypto = require('crypto');

/**
 * Translation Service
 * Handles automatic content translation using LibreTranslate API
 */
class TranslationService {
  
  constructor() {
    this.baseURL = process.env.LIBRETRANSLATE_URL || 'https://libretranslate.de';
    this.apiKey = process.env.LIBRETRANSLATE_API_KEY || null;
    this.timeout = 10000; // 10 seconds
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    
    // Cache for translation results (in-memory for now)
    this.translationCache = new Map();
    this.cacheMaxSize = 1000;
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Generate cache key for translation
   * @param {string} text - Text to translate
   * @param {string} sourceLang - Source language
   * @param {string} targetLang - Target language
   * @returns {string} Cache key
   */
  generateCacheKey(text, sourceLang, targetLang) {
    const content = `${text}|${sourceLang}|${targetLang}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Get translation from cache
   * @param {string} cacheKey - Cache key
   * @returns {Object|null} Cached translation or null
   */
  getFromCache(cacheKey) {
    const cached = this.translationCache.get(cacheKey);
    if (!cached) return null;
    
    // Check if cache entry has expired
    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.translationCache.delete(cacheKey);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Store translation in cache
   * @param {string} cacheKey - Cache key
   * @param {Object} data - Translation data
   */
  storeInCache(cacheKey, data) {
    // Remove oldest entries if cache is full
    if (this.translationCache.size >= this.cacheMaxSize) {
      const firstKey = this.translationCache.keys().next().value;
      this.translationCache.delete(firstKey);
    }
    
    this.translationCache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
  }

  /**
   * Detect language of text
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Detection result
   */
  async detectLanguage(text) {
    try {
      const requestData = { q: text };
      
      if (this.apiKey) {
        requestData.api_key = this.apiKey;
      }

      const response = await axios.post(
        `${this.baseURL}/detect`,
        requestData,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.length > 0) {
        return {
          success: true,
          language: response.data[0].language,
          confidence: response.data[0].confidence
        };
      }

      return {
        success: false,
        error: 'No language detected',
        language: 'en', // Default to English
        confidence: 0
      };

    } catch (error) {
      console.error('Language detection error:', error.message);
      return {
        success: false,
        error: error.message,
        language: 'en', // Default to English
        confidence: 0
      };
    }
  }

  /**
   * Get list of supported languages
   * @returns {Promise<Object>} Supported languages
   */
  async getSupportedLanguages() {
    try {
      const response = await axios.get(`${this.baseURL}/languages`, {
        timeout: this.timeout
      });

      return {
        success: true,
        languages: response.data
      };

    } catch (error) {
      console.error('Get languages error:', error.message);
      return {
        success: false,
        error: error.message,
        languages: [
          { code: 'en', name: 'English' },
          { code: 'es', name: 'Spanish' },
          { code: 'fr', name: 'French' },
          { code: 'de', name: 'German' },
          { code: 'it', name: 'Italian' },
          { code: 'pt', name: 'Portuguese' },
          { code: 'ru', name: 'Russian' },
          { code: 'ja', name: 'Japanese' },
          { code: 'ko', name: 'Korean' },
          { code: 'zh', name: 'Chinese' }
        ]
      };
    }
  }

  /**
   * Translate text with retry mechanism
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code
   * @param {string} sourceLang - Source language code (optional)
   * @returns {Promise<Object>} Translation result
   */
  async translateText(text, targetLang, sourceLang = 'auto') {
    // Input validation
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid text input',
        original_text: text,
        translated_text: text,
        source_language: sourceLang,
        target_language: targetLang
      };
    }

    if (!targetLang || typeof targetLang !== 'string') {
      return {
        success: false,
        error: 'Invalid target language',
        original_text: text,
        translated_text: text,
        source_language: sourceLang,
        target_language: targetLang
      };
    }

    // Detect source language if not provided
    let detectedSourceLang = sourceLang;
    if (sourceLang === 'auto') {
      const detection = await this.detectLanguage(text);
      detectedSourceLang = detection.language;
    }

    // Skip translation if source and target are the same
    if (detectedSourceLang === targetLang) {
      return {
        success: true,
        original_text: text,
        translated_text: text,
        source_language: detectedSourceLang,
        target_language: targetLang,
        cached: false,
        skipped: true
      };
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(text, detectedSourceLang, targetLang);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        ...cached,
        cached: true
      };
    }

    // Attempt translation with retries
    let lastError = null;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.performTranslation(text, targetLang, detectedSourceLang);
        
        if (result.success) {
          // Store in cache
          this.storeInCache(cacheKey, result);
          return {
            ...result,
            cached: false
          };
        }
        
        lastError = result.error;
        
      } catch (error) {
        lastError = error.message;
        console.error(`Translation attempt ${attempt} failed:`, error.message);
        
        // Wait before retry (except for last attempt)
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    // All attempts failed - return fallback
    console.error('Translation failed after all retries:', lastError);
    return {
      success: false,
      error: lastError || 'Translation failed after retries',
      original_text: text,
      translated_text: text, // Fallback to original text
      source_language: detectedSourceLang,
      target_language: targetLang,
      cached: false,
      fallback: true
    };
  }

  /**
   * Perform actual translation API call
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language
   * @param {string} sourceLang - Source language
   * @returns {Promise<Object>} Translation result
   */
  async performTranslation(text, targetLang, sourceLang) {
    const requestData = {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text'
    };

    if (this.apiKey) {
      requestData.api_key = this.apiKey;
    }

    const response = await axios.post(
      `${this.baseURL}/translate`,
      requestData,
      {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.translatedText) {
      return {
        success: true,
        original_text: text,
        translated_text: response.data.translatedText,
        source_language: sourceLang,
        target_language: targetLang
      };
    }

    throw new Error('Invalid response from translation service');
  }

  /**
   * Translate multiple texts in batch
   * @param {Array} texts - Array of texts to translate
   * @param {string} targetLang - Target language
   * @param {string} sourceLang - Source language (optional)
   * @returns {Promise<Object>} Batch translation result
   */
  async translateBatch(texts, targetLang, sourceLang = 'auto') {
    if (!Array.isArray(texts) || texts.length === 0) {
      return {
        success: false,
        error: 'Invalid texts array',
        results: []
      };
    }

    const results = [];
    const errors = [];

    // Process translations concurrently (with limit)
    const batchSize = 5; // Limit concurrent requests
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(async (text, index) => {
        try {
          const result = await this.translateText(text, targetLang, sourceLang);
          return { index: i + index, result };
        } catch (error) {
          errors.push({ index: i + index, error: error.message });
          return {
            index: i + index,
            result: {
              success: false,
              error: error.message,
              original_text: text,
              translated_text: text,
              fallback: true
            }
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // Sort results by original index
    results.sort((a, b) => a.index - b.index);

    return {
      success: errors.length === 0,
      results: results.map(r => r.result),
      errors: errors,
      total_processed: texts.length,
      successful_translations: results.filter(r => r.result.success).length
    };
  }

  /**
   * Clear translation cache
   */
  clearCache() {
    this.translationCache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.translationCache.size,
      max_size: this.cacheMaxSize,
      hit_ratio: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0
    };
  }
}

// Create singleton instance
const translationService = new TranslationService();

module.exports = translationService;