/**
 * Utility for OTP (One-Time Password) Generation
 */

/**
 * Generates a 6-digit numeric OTP
 * @returns {string} The 6-digit OTP
 */
const generateOTP = () => {
    // Generates a random number between 100000 and 999999
    return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
    generateOTP
};
