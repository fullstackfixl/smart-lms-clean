const Organization = require('../models/Organization');

class DomainValidationService {
  /**
   * Extract domain from email address
   * @param {string} email
   * @returns {string} Normalized domain
   */
  extractDomain(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email address');
    }
    
    const parts = email.split('@');
    if (parts.length !== 2) {
      throw new Error('Invalid email format');
    }
    
    return parts[1].toLowerCase().trim();
  }

  /**
   * Validate domain format
   * @param {string} domain
   * @returns {boolean}
   */
  validateDomainFormat(domain) {
    if (!domain || typeof domain !== 'string') {
      return false;
    }
    
    // Basic domain format validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}\.?)+$/;
    return domainRegex.test(domain);
  }

  /**
   * Find organization by domain
   * @param {string} domain
   * @returns {Promise<Organization|null>}
   */
  async findOrganizationByDomain(domain) {
    const normalizedDomain = domain.toLowerCase().trim();
    return await Organization.findOne({ 
      emailDomains: normalizedDomain,
      isActive: true 
    });
  }

  /**
   * Find all organizations by domain (for shared domains)
   * @param {string} domain
   * @returns {Promise<Organization[]>}
   */
  async findAllOrganizationsByDomain(domain) {
    const normalizedDomain = domain.toLowerCase().trim();
    return await Organization.find({ 
      emailDomains: normalizedDomain,
      isActive: true 
    });
  }

  /**
   * Check if domain is already registered
   * @param {string} domain
   * @returns {Promise<boolean>}
   */
  async isDomainRegistered(domain) {
    const normalizedDomain = domain.toLowerCase().trim();
    const count = await Organization.countDocuments({ 
      emailDomains: normalizedDomain 
    });
    return count > 0;
  }
}

module.exports = new DomainValidationService();
