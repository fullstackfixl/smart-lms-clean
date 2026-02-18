const jwt = require('jsonwebtoken');
const redisClient = require('../utils/redisClient');

/**
 * TokenService - Handles JWT token generation, verification, and management
 * 
 * This service is responsible for:
 * - Generating JWT tokens with configurable expiration
 * - Verifying and decoding JWT tokens
 * - Blacklisting tokens for logout functionality
 * - Refreshing tokens
 * - Caching validation results in Redis
 */
class TokenService {
  /**
   * Generate JWT token
   * 
   * @param {Object} payload - Token payload containing user_id, role, organization_id
   * @param {string} expiresIn - Token expiration time (default: '24h')
   * @returns {string} - JWT token
   * 
   * Requirements: 4.1, 4.4
   * 
   * @example
   * const token = tokenService.generateToken({
   *   user_id: '507f1f77bcf86cd799439011',
   *   role: 'student',
   *   organization_id: '507f1f77bcf86cd799439012'
   * });
   */
  generateToken(payload, expiresIn = '24h') {
    if (!payload) {
      throw new Error('Payload is required for token generation');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    // Generate JWT with the provided payload and expiration
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn
    });

    return token;
  }

  /**
   * Verify and decode JWT token
   * 
   * @param {string} token - JWT token to verify
   * @returns {Promise<Object>} - Decoded payload
   * @throws {Error} - If token is invalid, expired, or blacklisted
   * 
   * Requirements: 5.5, 5.7
   * 
   * This method:
   * 1. Validates the JWT signature and expiration
   * 2. Checks if the token is blacklisted in Redis
   * 3. Returns the decoded payload if valid
   */
  async verifyToken(token) {
    if (!token) {
      throw new Error('Token is required for verification');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    try {
      // Step 1: Verify JWT signature and expiration
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Step 2: Check Redis blacklist
      // In test environment, use global.redisClient (mock)
      // In production, use redisClient singleton
      const redis = process.env.NODE_ENV === 'test' 
        ? global.redisClient 
        : redisClient.getClient();
      
      if (redis) {
        try {
          const blacklistKey = `blacklist:${token}`;
          const isBlacklisted = await redis.get(blacklistKey);
          
          if (isBlacklisted) {
            throw new Error('Token has been revoked');
          }
        } catch (error) {
          // If it's the revoked error, rethrow it
          if (error.message === 'Token has been revoked') {
            throw error;
          }
          // Otherwise, log and continue (graceful degradation)
          // This handles Redis connection errors
        }
      }
      // If Redis is not available, we still allow the token (graceful degradation)
      // This ensures the system continues to function even if Redis is down

      // Step 3: Return decoded payload
      return decoded;
    } catch (error) {
      // Handle JWT-specific errors
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else if (error.message === 'Token has been revoked') {
        throw error;
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Blacklist token for logout
   * 
   * @param {string} token - JWT token to blacklist
   * @returns {Promise<void>}
   * 
   * Requirements: 5.4
   * 
   * This method adds the token to Redis blacklist with TTL equal to token's remaining lifetime
   */
  async blacklistToken(token) {
    if (!token) {
      throw new Error('Token is required for blacklisting');
    }

    try {
      // Decode token to get expiration
      const decoded = jwt.decode(token);
      
      if (!decoded || !decoded.exp) {
        throw new Error('Invalid token format');
      }

      // Calculate TTL (time until token expires)
      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - now;

      // Only blacklist if token hasn't expired yet
      if (ttl > 0) {
        const redis = process.env.NODE_ENV === 'test' 
          ? global.redisClient 
          : redisClient.getClient();
        
        if (redis) {
          const blacklistKey = `blacklist:${token}`;
          await redis.set(blacklistKey, '1', 'EX', ttl);
        }
      }
    } catch (error) {
      // Log error but don't throw - graceful degradation
      console.error('Failed to blacklist token:', error.message);
    }
  }

  /**
   * Refresh JWT token
   * 
   * @param {string} oldToken - Current JWT token
   * @returns {Promise<string>} - New JWT token
   * 
   * Requirements: 6.1, 6.3, 6.4
   * 
   * This method:
   * 1. Verifies the old token is valid
   * 2. Generates a new token with same payload but extended expiration
   * 3. Blacklists the old token
   */
  async refreshToken(oldToken) {
    if (!oldToken) {
      throw new Error('Token is required for refresh');
    }

    try {
      // Verify old token (will throw if expired or invalid)
      const decoded = await this.verifyToken(oldToken);

      // Extract payload (remove JWT-specific fields)
      const { iat, exp, ...payload } = decoded;

      // Generate new token with same payload
      const newToken = this.generateToken(payload, '24h');

      // Blacklist old token
      await this.blacklistToken(oldToken);

      return newToken;
    } catch (error) {
      if (error.message === 'Token has expired') {
        throw new Error('Cannot refresh expired token');
      }
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new TokenService();
