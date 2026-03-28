/**
 * Validation Utilities Tests
 * Tests for input validation and sanitization
 */

import {
  validateMessage,
  validateUsername,
  validateFile,
  validatePassword,
  sanitizeInput,
  escapeHtml,
  validateEmail,
  validateUrl,
  isSuspiciousInput,
  sanitizeAndValidateMessage,
} from '../utils/validation';

describe('Validation Utils', () => {
  // Message Validation Tests
  describe('validateMessage', () => {
    test('should reject empty message', () => {
      const result = validateMessage('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should reject whitespace-only message', () => {
      const result = validateMessage('   ');
      expect(result.isValid).toBe(false);
    });

    test('should accept valid message', () => {
      const result = validateMessage('Hello world');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should reject message exceeding max length', () => {
      const longMessage = 'a'.repeat(5001);
      const result = validateMessage(longMessage);
      expect(result.isValid).toBe(false);
    });

    test('should accept message at max length', () => {
      const maxMessage = 'a'.repeat(5000);
      const result = validateMessage(maxMessage);
      expect(result.isValid).toBe(true);
    });
  });

  // Username Validation Tests
  describe('validateUsername', () => {
    test('should reject empty username', () => {
      const result = validateUsername('');
      expect(result.isValid).toBe(false);
    });

    test('should reject username too short', () => {
      const result = validateUsername('a');
      expect(result.isValid).toBe(false);
    });

    test('should reject username too long', () => {
      const longUsername = 'a'.repeat(51);
      const result = validateUsername(longUsername);
      expect(result.isValid).toBe(false);
    });

    test('should accept valid username', () => {
      const result = validateUsername('john_doe');
      expect(result.isValid).toBe(true);
    });

    test('should accept username with numbers and hyphens', () => {
      const result = validateUsername('user-123');
      expect(result.isValid).toBe(true);
    });

    test('should reject username with special characters', () => {
      const result = validateUsername('user@name');
      expect(result.isValid).toBe(false);
    });
  });

  // Password Validation Tests
  describe('validatePassword', () => {
    test('should reject empty password', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
    });

    test('should reject password too short', () => {
      const result = validatePassword('123');
      expect(result.isValid).toBe(false);
    });

    test('should accept valid password', () => {
      const result = validatePassword('room123');
      expect(result.isValid).toBe(true);
    });
  });

  // Sanitization Tests
  describe('sanitizeInput', () => {
    test('should remove script tags', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    test('should remove event handlers', () => {
      const input = '<img src="x" onerror="alert(\'xss\')">';
      const result = sanitizeInput(input);
      expect(result).not.toContain('onerror');
    });

    test('should preserve safe text', () => {
      const input = 'Hello world';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello world');
    });

    test('should trim whitespace', () => {
      const input = '  Hello world  ';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello world');
    });
  });

  // HTML Escape Tests
  describe('escapeHtml', () => {
    test('should escape HTML special characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = escapeHtml(input);
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&quot;');
    });

    test('should escape ampersand', () => {
      const result = escapeHtml('Tom & Jerry');
      expect(result).toBe('Tom &amp; Jerry');
    });
  });

  // Email Validation Tests
  describe('validateEmail', () => {
    test('should accept valid email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    test('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });

    test('should reject email without @', () => {
      expect(validateEmail('userexample.com')).toBe(false);
    });
  });

  // URL Validation Tests
  describe('validateUrl', () => {
    test('should accept valid URL', () => {
      expect(validateUrl('https://example.com')).toBe(true);
    });

    test('should accept URL with path', () => {
      expect(validateUrl('https://example.com/path')).toBe(true);
    });

    test('should reject invalid URL', () => {
      expect(validateUrl('not a url')).toBe(false);
    });
  });

  // Suspicious Input Detection Tests
  describe('isSuspiciousInput', () => {
    test('should detect script tags', () => {
      expect(isSuspiciousInput('<script>alert("xss")</script>')).toBe(true);
    });

    test('should detect javascript protocol', () => {
      expect(isSuspiciousInput('javascript:alert("xss")')).toBe(true);
    });

    test('should detect event handlers', () => {
      expect(isSuspiciousInput('onclick="alert(\'xss\')"')).toBe(true);
    });

    test('should detect iframe tags', () => {
      expect(isSuspiciousInput('<iframe src="evil.com"></iframe>')).toBe(true);
    });

    test('should not flag safe input', () => {
      expect(isSuspiciousInput('Hello world')).toBe(false);
    });
  });

  // Combined Sanitization and Validation Tests
  describe('sanitizeAndValidateMessage', () => {
    test('should reject empty message', () => {
      const result = sanitizeAndValidateMessage('');
      expect(result.isValid).toBe(false);
    });

    test('should sanitize and validate valid message', () => {
      const result = sanitizeAndValidateMessage('Hello world');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Hello world');
    });

    test('should detect and reject suspicious input', () => {
      const result = sanitizeAndValidateMessage('<script>alert("xss")</script>');
      expect(result.isValid).toBe(false);
    });

    test('should sanitize HTML entities', () => {
      const result = sanitizeAndValidateMessage('Hello & goodbye');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('Hello & goodbye');
    });
  });

  // File Validation Tests
  describe('validateFile', () => {
    test('should reject null file', () => {
      const result = validateFile(null);
      expect(result.isValid).toBe(false);
    });

    test('should reject oversized file', () => {
      const largeFile = {
        name: 'large.pdf',
        size: 10 * 1024 * 1024, // 10MB
      };
      const result = validateFile(largeFile, 'file');
      expect(result.isValid).toBe(false);
    });

    test('should accept valid file', () => {
      const validFile = {
        name: 'document.pdf',
        size: 1 * 1024 * 1024, // 1MB
      };
      const result = validateFile(validFile, 'file');
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid file type', () => {
      const invalidFile = {
        name: 'script.exe',
        size: 100 * 1024,
      };
      const result = validateFile(invalidFile, 'file');
      expect(result.isValid).toBe(false);
    });
  });
});
