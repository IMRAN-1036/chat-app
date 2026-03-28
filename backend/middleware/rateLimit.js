/**
 * Rate limiting middleware
 * Prevents spam and excessive API calls
 */

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * 60 requests per minute
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

/**
 * Message rate limiter
 * 30 messages per minute
 */
const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many messages sent, please wait before sending more.',
  keyGenerator: (req) => {
    // Rate limit by room password + username
    return `${req.body.password}-${req.body.sender}`;
  },
});

/**
 * Authentication rate limiter
 * 5 attempts per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * File upload rate limiter
 * 10 uploads per hour
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many file uploads, please try again later.',
  keyGenerator: (req) => {
    return `${req.body.password}-${req.body.sender}`;
  },
});

/**
 * Search rate limiter
 * 20 searches per minute
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many search requests, please try again later.',
  keyGenerator: (req) => {
    return `${req.body.password}`;
  },
});

/**
 * Export rate limiter
 * 5 exports per hour
 */
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many export requests, please try again later.',
  keyGenerator: (req) => {
    return `${req.body.password}`;
  },
});

/**
 * Create custom rate limiter
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum requests per window
 * @param {string} message - Error message
 * @returns {Function} Rate limiter middleware
 */
const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
  });
};

module.exports = {
  apiLimiter,
  messageLimiter,
  authLimiter,
  uploadLimiter,
  searchLimiter,
  exportLimiter,
  createLimiter,
};
