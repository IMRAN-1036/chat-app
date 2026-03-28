/**
 * Rate limiting utilities
 * Prevents spam and excessive API calls
 */

import { RATE_LIMIT_CONSTANTS, ERROR_MESSAGES } from '../constants';

/**
 * Rate limiter class for managing request limits
 */
export class RateLimiter {
  constructor(maxRequests = 5, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  /**
   * Check if request is allowed
   * @returns {Object} { allowed: boolean, remainingRequests: number, resetTime: number }
   */
  isAllowed() {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const resetTime = oldestRequest + this.windowMs;
      const waitTime = Math.ceil((resetTime - now) / 1000);

      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: waitTime,
        message: `Too many requests. Please wait ${waitTime}s.`,
      };
    }

    this.requests.push(now);

    return {
      allowed: true,
      remainingRequests: this.maxRequests - this.requests.length,
      resetTime: 0,
      message: null,
    };
  }

  /**
   * Reset the rate limiter
   */
  reset() {
    this.requests = [];
  }

  /**
   * Get current request count
   * @returns {number} Number of requests in current window
   */
  getRequestCount() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length;
  }
}

/**
 * Debounce function to prevent excessive calls
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (fn, delay = 300) => {
  let timeoutId;

  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Throttle function to limit call frequency
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (fn, limit = 300) => {
  let inThrottle;

  return function throttled(...args) {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Create a rate limiter hook for React components
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} { isAllowed: Function, getRemainingRequests: Function, reset: Function }
 */
export const createRateLimiter = (
  maxRequests = RATE_LIMIT_CONSTANTS.MAX_API_CALLS_PER_MINUTE,
  windowMs = 60000
) => {
  const limiter = new RateLimiter(maxRequests, windowMs);

  return {
    isAllowed: () => limiter.isAllowed(),
    getRemainingRequests: () => limiter.getRequestCount(),
    reset: () => limiter.reset(),
    limiter,
  };
};

/**
 * Wrap async function with rate limiting
 * @param {Function} fn - Async function to wrap
 * @param {RateLimiter} limiter - Rate limiter instance
 * @returns {Function} Wrapped function
 */
export const withRateLimit = (fn, limiter) => {
  return async (...args) => {
    const check = limiter.isAllowed();

    if (!check.allowed) {
      const error = new Error(check.message);
      error.code = 429;
      throw error;
    }

    return fn(...args);
  };
};

/**
 * Message rate limiter - prevents message spam
 */
export const messageRateLimiter = createRateLimiter(
  RATE_LIMIT_CONSTANTS.MAX_MESSAGES_PER_MINUTE,
  60000
);

/**
 * API call rate limiter
 */
export const apiRateLimiter = createRateLimiter(
  RATE_LIMIT_CONSTANTS.MAX_API_CALLS_PER_MINUTE,
  60000
);

/**
 * File upload rate limiter
 */
export const fileUploadRateLimiter = createRateLimiter(
  RATE_LIMIT_CONSTANTS.MAX_FILE_UPLOADS_PER_HOUR,
  3600000
);

export default {
  RateLimiter,
  debounce,
  throttle,
  createRateLimiter,
  withRateLimit,
  messageRateLimiter,
  apiRateLimiter,
  fileUploadRateLimiter,
};
