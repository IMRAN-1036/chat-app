/**
 * Validation and sanitization utilities
 * Handles input validation, XSS prevention, and data sanitization
 */

import DOMPurify from 'dompurify';
import { VALIDATION_CONSTANTS, ERROR_MESSAGES } from '../constants';

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
};

/**
 * Validate message text
 * @param {string} text - Message text to validate
 * @returns {Object} { isValid: boolean, error: string | null }
 */
export const validateMessage = (text) => {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: ERROR_MESSAGES.MESSAGE_EMPTY };
  }

  if (text.length < VALIDATION_CONSTANTS.MIN_MESSAGE_LENGTH) {
    return { isValid: false, error: ERROR_MESSAGES.MESSAGE_EMPTY };
  }

  if (text.length > VALIDATION_CONSTANTS.MAX_MESSAGE_LENGTH) {
    return { isValid: false, error: ERROR_MESSAGES.MESSAGE_TOO_LONG };
  }

  return { isValid: true, error: null };
};

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {Object} { isValid: boolean, error: string | null }
 */
export const validateUsername = (username) => {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: 'Username cannot be empty.' };
  }

  if (username.length < VALIDATION_CONSTANTS.MIN_USERNAME_LENGTH) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_USERNAME };
  }

  if (username.length > VALIDATION_CONSTANTS.MAX_USERNAME_LENGTH) {
    return { isValid: false, error: ERROR_MESSAGES.INVALID_USERNAME };
  }

  // Only allow alphanumeric, underscore, and hyphen
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens.' };
  }

  return { isValid: true, error: null };
};

/**
 * Validate file
 * @param {File} file - File to validate
 * @param {string} type - File type ('image' or 'file')
 * @returns {Object} { isValid: boolean, error: string | null }
 */
export const validateFile = (file, type = 'file') => {
  if (!file) {
    return { isValid: false, error: 'No file selected.' };
  }

  const maxSize = type === 'image' 
    ? VALIDATION_CONSTANTS.MAX_IMAGE_SIZE 
    : VALIDATION_CONSTANTS.MAX_FILE_SIZE;

  if (file.size > maxSize) {
    return { isValid: false, error: ERROR_MESSAGES.FILE_TOO_LARGE };
  }

  const fileExtension = file.name.split('.').pop().toLowerCase();
  const allowedTypes = type === 'image'
    ? VALIDATION_CONSTANTS.ALLOWED_IMAGE_TYPES
    : VALIDATION_CONSTANTS.ALLOWED_FILE_TYPES;

  if (!allowedTypes.includes(fileExtension)) {
    return { 
      isValid: false, 
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` 
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate password (room ID)
 * @param {string} password - Password to validate
 * @returns {Object} { isValid: boolean, error: string | null }
 */
export const validatePassword = (password) => {
  if (!password || password.trim().length === 0) {
    return { isValid: false, error: 'Room ID cannot be empty.' };
  }

  if (password.length < 4) {
    return { isValid: false, error: 'Room ID must be at least 4 characters.' };
  }

  return { isValid: true, error: null };
};

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

/**
 * Validate email
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if input contains potentially malicious content
 * @param {string} input - Input to check
 * @returns {boolean} True if suspicious
 */
export const isSuspiciousInput = (input) => {
  const suspiciousPatterns = [
    /<script/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
};

/**
 * Sanitize and validate message
 * @param {string} text - Message text
 * @returns {Object} { isValid: boolean, error: string | null, sanitized: string }
 */
export const sanitizeAndValidateMessage = (text) => {
  const validation = validateMessage(text);
  if (!validation.isValid) {
    return { ...validation, sanitized: '' };
  }

  const sanitized = sanitizeInput(text);
  
  if (isSuspiciousInput(sanitized)) {
    return { 
      isValid: false, 
      error: 'Message contains potentially malicious content.',
      sanitized: ''
    };
  }

  return { isValid: true, error: null, sanitized };
};

export default {
  sanitizeInput,
  validateMessage,
  validateUsername,
  validateFile,
  validatePassword,
  escapeHtml,
  validateEmail,
  validateUrl,
  isSuspiciousInput,
  sanitizeAndValidateMessage,
};
