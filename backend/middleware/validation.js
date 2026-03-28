/**
 * Express validation middleware
 * Validates incoming requests
 */

const { body, validationResult, query, param } = require('express-validator');

/**
 * Validation middleware for sending messages
 */
const validateMessage = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters'),
  body('sender')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Sender name must be between 2 and 50 characters'),
  body('type')
    .optional()
    .isIn(['text', 'file', 'image', 'voice'])
    .withMessage('Invalid message type'),
];

/**
 * Validation middleware for room password
 */
const validatePassword = [
  body('password')
    .trim()
    .isLength({ min: 4 })
    .withMessage('Room ID must be at least 4 characters'),
];

/**
 * Validation middleware for room settings
 */
const validateRoomSettings = [
  body('roomName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Room name must be between 1 and 100 characters'),
  body('theme')
    .optional()
    .isIn(['dark', 'light', 'auto'])
    .withMessage('Invalid theme'),
  body('messageRetention')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Message retention must be between 1 and 365 days'),
  body('allowFileSharing')
    .optional()
    .isBoolean()
    .withMessage('allowFileSharing must be a boolean'),
];

/**
 * Validation middleware for search
 */
const validateSearch = [
  body('text')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Search text must be less than 500 characters'),
  body('sender')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Sender name must be less than 50 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
];

/**
 * Validation middleware for export
 */
const validateExport = [
  body('format')
    .isIn(['json', 'csv'])
    .withMessage('Export format must be json or csv'),
];

/**
 * Validation middleware for bookmark
 */
const validateBookmark = [
  body('messageId')
    .trim()
    .notEmpty()
    .withMessage('Message ID is required'),
];

/**
 * Handle validation errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  
  next();
};

/**
 * Sanitize input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
};

/**
 * Middleware to sanitize request body
 */
const sanitizeRequestBody = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    });
  }
  next();
};

/**
 * Middleware to validate content length
 */
const validateContentLength = (req, res, next) => {
  const contentLength = req.headers['content-length'];
  
  if (contentLength && contentLength > 10 * 1024 * 1024) {
    return res.status(413).json({
      success: false,
      message: 'Payload too large',
    });
  }
  
  next();
};

module.exports = {
  validateMessage,
  validatePassword,
  validateRoomSettings,
  validateSearch,
  validateExport,
  validateBookmark,
  handleValidationErrors,
  sanitizeInput,
  sanitizeRequestBody,
  validateContentLength,
};
