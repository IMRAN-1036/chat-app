/**
 * Security middleware
 * Implements security best practices
 */

const helmet = require('helmet');
const cors = require('cors');

/**
 * Helmet middleware for security headers
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
});

/**
 * CORS configuration
 */
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  maxAge: 86400, // 24 hours
};

const corsMiddleware = cors(corsOptions);

/**
 * Middleware to prevent CSRF attacks
 */
const preventCsrf = (req, res, next) => {
  // Only check state-changing methods
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin || req.headers.referer;
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    if (origin && !allowedOrigins.some(allowed => origin.includes(allowed))) {
      return res.status(403).json({
        success: false,
        message: 'CSRF validation failed',
      });
    }
  }
  
  next();
};

/**
 * Middleware to set security headers
 */
const setSecurityHeaders = (req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Feature policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * Middleware to validate API key (if using API keys)
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required',
    });
  }
  
  // Validate API key (implement your own validation)
  // For now, just check if it exists
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key',
    });
  }
  
  next();
};

/**
 * Middleware to validate request signature
 */
const validateSignature = (req, res, next) => {
  const signature = req.headers['x-signature'];
  
  if (!signature) {
    return res.status(401).json({
      success: false,
      message: 'Signature is required',
    });
  }
  
  // Implement signature validation
  // This is a placeholder
  next();
};

/**
 * Middleware to log security events
 */
const logSecurityEvents = (req, res, next) => {
  // Log suspicious activity
  if (req.body && typeof req.body === 'object') {
    const suspiciousPatterns = [
      /<script/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
    ];
    
    const bodyStr = JSON.stringify(req.body);
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(bodyStr));
    
    if (isSuspicious) {
      console.warn(`[SECURITY] Suspicious request from ${req.ip}:`, {
        method: req.method,
        path: req.path,
        body: bodyStr.substring(0, 100),
      });
    }
  }
  
  next();
};

/**
 * Middleware to sanitize output
 */
const sanitizeOutput = (req, res, next) => {
  // Store original json method
  const originalJson = res.json;
  
  // Override json method
  res.json = function(data) {
    // Sanitize data before sending
    if (data && typeof data === 'object') {
      // Remove sensitive fields
      delete data.password;
      delete data.token;
      delete data.apiKey;
    }
    
    // Call original json method
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  securityHeaders,
  corsMiddleware,
  corsOptions,
  preventCsrf,
  setSecurityHeaders,
  validateApiKey,
  validateSignature,
  logSecurityEvents,
  sanitizeOutput,
};
