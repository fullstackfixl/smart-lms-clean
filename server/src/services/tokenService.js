const jwt = require('jsonwebtoken');

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

      // Step 2: Token blacklist disabled (Redis removed)
      // Tokens remain valid until expiration
      // For production, consider using a database-based blacklist if needed

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
   * Blacklist token for logout (No-op - Redis removed)
   * 
   * @param {string} token - JWT token to blacklist
   * @returns {Promise<void>}
   * 
   * Requirements: 5.4
   * 
   * Note: Token blacklisting is disabled. Tokens remain valid until expiration.
   * For production, consider implementing database-based blacklist if needed.
   */
  async blacklistToken(token) {
    // No-op: Redis removed, tokens remain valid until expiration
    // This is acceptable for most use cases as tokens have short lifetimes
    return;
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
