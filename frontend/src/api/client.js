/**
 * Centralized API client with interceptors
 * Handles all API communication, error handling, and request/response processing
 */

import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';
import { apiRateLimiter } from '../utils/rateLimit';
import { API_ENDPOINTS } from '../constants';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:2000';

/**
 * Create axios instance with default configuration
 */
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add auth token, rate limiting, etc.
 */
apiClient.interceptors.request.use(
  (config) => {
    // Check rate limiting
    const rateLimitCheck = apiRateLimiter.isAllowed();
    if (!rateLimitCheck.allowed) {
      const error = new Error(rateLimitCheck.message);
      error.code = 429;
      return Promise.reject(error);
    }

    // Add auth token if available
    const token = localStorage.getItem('chatvault_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = generateRequestId();

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors, auth failures, etc.
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.status}`, response.data);
    }

    return response;
  },
  (error) => {
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('chatvault_token');
          window.location.href = '/login';
          break;

        case 403:
          // Forbidden - user doesn't have permission
          console.error('Access forbidden');
          break;

        case 429:
          // Too many requests - rate limited
          console.warn('Rate limited - please wait');
          break;

        case 500:
          // Server error
          console.error('Server error:', data.message);
          break;

        default:
          break;
      }
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server');
    } else {
      // Client-side error
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Generate unique request ID for tracking
 * @returns {string} Request ID
 */
const generateRequestId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Wrapper for POST requests with error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request data
 * @param {Object} options - Additional options
 * @returns {Promise} Response data
 */
export const post = async (endpoint, data = {}, options = {}) => {
  try {
    const response = await apiClient.post(endpoint, data, options);
    return response.data;
  } catch (error) {
    const errorInfo = handleApiError(error, `POST_${endpoint}`);
    throw errorInfo;
  }
};

/**
 * Wrapper for GET requests with error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Additional options
 * @returns {Promise} Response data
 */
export const get = async (endpoint, options = {}) => {
  try {
    const response = await apiClient.get(endpoint, options);
    return response.data;
  } catch (error) {
    const errorInfo = handleApiError(error, `GET_${endpoint}`);
    throw errorInfo;
  }
};

/**
 * Wrapper for PUT requests with error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request data
 * @param {Object} options - Additional options
 * @returns {Promise} Response data
 */
export const put = async (endpoint, data = {}, options = {}) => {
  try {
    const response = await apiClient.put(endpoint, data, options);
    return response.data;
  } catch (error) {
    const errorInfo = handleApiError(error, `PUT_${endpoint}`);
    throw errorInfo;
  }
};

/**
 * Wrapper for DELETE requests with error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Additional options
 * @returns {Promise} Response data
 */
export const deleteRequest = async (endpoint, options = {}) => {
  try {
    const response = await apiClient.delete(endpoint, options);
    return response.data;
  } catch (error) {
    const errorInfo = handleApiError(error, `DELETE_${endpoint}`);
    throw errorInfo;
  }
};

/**
 * Send message
 * @param {Object} messageData - Message data
 * @returns {Promise} Response
 */
export const sendMessage = (messageData) => post(API_ENDPOINTS.SEND_MESSAGE, messageData);

/**
 * Get bookmarks
 * @param {Object} params - Query parameters
 * @returns {Promise} Bookmarks data
 */
export const getBookmarks = (params) => post(API_ENDPOINTS.GET_BOOKMARKS, params);

/**
 * Bookmark message
 * @param {Object} params - Bookmark parameters
 * @returns {Promise} Response
 */
export const bookmarkMessage = (params) => post(API_ENDPOINTS.BOOKMARK, params);

/**
 * Export chat
 * @param {Object} params - Export parameters
 * @returns {Promise} Export data
 */
export const exportChat = (params) => post(API_ENDPOINTS.EXPORT, params);

/**
 * Get statistics
 * @param {Object} params - Stats parameters
 * @returns {Promise} Statistics data
 */
export const getStats = (params) => post(API_ENDPOINTS.STATS, params);

/**
 * Search messages
 * @param {Object} params - Search parameters
 * @returns {Promise} Search results
 */
export const searchMessages = (params) => post(API_ENDPOINTS.SEARCH, params);

/**
 * Get room settings
 * @param {Object} params - Settings parameters
 * @returns {Promise} Settings data
 */
export const getSettings = (params) => post(API_ENDPOINTS.GET_SETTINGS, params);

/**
 * Update room settings
 * @param {Object} params - Settings data
 * @returns {Promise} Response
 */
export const updateSettings = (params) => post(API_ENDPOINTS.SETTINGS, params);

/**
 * Burn room (delete all messages)
 * @param {Object} params - Burn parameters
 * @returns {Promise} Response
 */
export const burnRoom = (params) => post(API_ENDPOINTS.BURN_ROOM, params);

export default {
  apiClient,
  post,
  get,
  put,
  deleteRequest,
  sendMessage,
  getBookmarks,
  bookmarkMessage,
  exportChat,
  getStats,
  searchMessages,
  getSettings,
  updateSettings,
  burnRoom,
};
