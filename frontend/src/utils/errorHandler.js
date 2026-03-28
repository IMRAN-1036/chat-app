/**
 * Centralized error handling utilities
 * Provides consistent error handling across the application
 */

import { ERROR_MESSAGES } from '../constants';

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @param {string} context - Error context for logging
 * @returns {Object} { message: string, code: number, context: string }
 */
export const handleApiError = (error, context = 'UNKNOWN') => {
  let message = ERROR_MESSAGES.SERVER_ERROR;
  let code = 500;

  if (error.response) {
    // Server responded with error status
    code = error.response.status;
    message = error.response.data?.message || ERROR_MESSAGES.SERVER_ERROR;

    switch (code) {
      case 400:
        message = ERROR_MESSAGES.INVALID_INPUT;
        break;
      case 401:
        message = ERROR_MESSAGES.UNAUTHORIZED;
        break;
      case 404:
        message = ERROR_MESSAGES.ROOM_NOT_FOUND;
        break;
      case 429:
        message = ERROR_MESSAGES.TOO_MANY_REQUESTS;
        break;
      case 500:
        message = ERROR_MESSAGES.SERVER_ERROR;
        break;
      default:
        break;
    }
  } else if (error.request) {
    // Request made but no response
    message = ERROR_MESSAGES.NETWORK_ERROR;
    code = 0;
  } else if (error.message) {
    // Client-side error
    message = error.message;
    code = -1;
  }

  // Log error for debugging
  logError(message, context, code, error);

  return {
    message,
    code,
    context,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Log error with context
 * @param {string} message - Error message
 * @param {string} context - Error context
 * @param {number} code - Error code
 * @param {Error} error - Original error object
 */
export const logError = (message, context, code, error) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    message,
    code,
    stack: error?.stack,
    userAgent: navigator.userAgent,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}] Error ${code}:`, message, error);
  }

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to Sentry or similar service
    // Sentry.captureException(error, { tags: { context } });
  }

  // Store in local storage for debugging
  try {
    const logs = JSON.parse(localStorage.getItem('chatvault_error_logs') || '[]');
    logs.push(errorLog);
    // Keep only last 50 errors
    if (logs.length > 50) logs.shift();
    localStorage.setItem('chatvault_error_logs', JSON.stringify(logs));
  } catch (e) {
    // Ignore localStorage errors
  }
};

/**
 * Create custom error with context
 * @param {string} message - Error message
 * @param {string} context - Error context
 * @param {number} code - Error code
 * @returns {Error} Custom error object
 */
export const createError = (message, context, code = -1) => {
  const error = new Error(message);
  error.context = context;
  error.code = code;
  error.timestamp = new Date().toISOString();
  return error;
};

/**
 * Retry async operation with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delayMs - Initial delay in milliseconds
 * @returns {Promise} Result of successful operation
 */
export const retryWithBackoff = async (fn, maxRetries = 3, delayMs = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const delay = delayMs * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

/**
 * Validate API response
 * @param {Object} response - API response object
 * @returns {Object} { isValid: boolean, error: string | null }
 */
export const validateApiResponse = (response) => {
  if (!response) {
    return { isValid: false, error: 'No response from server' };
  }

  if (response.status && response.status >= 400) {
    return { isValid: false, error: response.data?.message || 'API error' };
  }

  return { isValid: true, error: null };
};

/**
 * Create error boundary wrapper
 * @param {Function} fn - Function to wrap
 * @param {string} context - Error context
 * @returns {Function} Wrapped function
 */
export const withErrorBoundary = (fn, context) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const handled = handleApiError(error, context);
      throw handled;
    }
  };
};

/**
 * Get error logs from localStorage
 * @returns {Array} Array of error logs
 */
export const getErrorLogs = () => {
  try {
    return JSON.parse(localStorage.getItem('chatvault_error_logs') || '[]');
  } catch {
    return [];
  }
};

/**
 * Clear error logs from localStorage
 */
export const clearErrorLogs = () => {
  try {
    localStorage.removeItem('chatvault_error_logs');
  } catch {
    // Ignore errors
  }
};

export default {
  handleApiError,
  logError,
  createError,
  retryWithBackoff,
  validateApiResponse,
  withErrorBoundary,
  getErrorLogs,
  clearErrorLogs,
};
