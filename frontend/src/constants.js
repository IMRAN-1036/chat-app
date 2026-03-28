/**
 * Application-wide constants and configuration values
 * Centralized location for all magic numbers and strings
 */

export const TIME_CONSTANTS = {
  SECONDS_PER_MINUTE: 60,
  SECONDS_PER_HOUR: 3600,
  SECONDS_PER_DAY: 86400,
  TYPING_DEBOUNCE: 300,
  LONG_PRESS_DURATION: 500,
  TOAST_DURATION: 3000,
  MODAL_ANIMATION_DURATION: 300,
  SCROLL_THRESHOLD: 100,
};

export const VALIDATION_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 5000,
  MIN_MESSAGE_LENGTH: 1,
  MAX_USERNAME_LENGTH: 50,
  MIN_USERNAME_LENGTH: 2,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGE_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_FILE_TYPES: ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'csv'],
  ALLOWED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
};

export const RATE_LIMIT_CONSTANTS = {
  MAX_MESSAGES_PER_MINUTE: 30,
  MAX_API_CALLS_PER_MINUTE: 60,
  MAX_FILE_UPLOADS_PER_HOUR: 50,
};

export const UI_CONSTANTS = {
  HEADER_BUTTON_COUNT: 8,
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
  EMOJI_PICKER_HEIGHT: 300,
  EMOJI_PICKER_WIDTH: 350,
  MESSAGE_ITEM_HEIGHT: 80, // For virtual scrolling
  MESSAGES_BATCH_SIZE: 50,
  SEARCH_RESULTS_PER_PAGE: 10,
  TOP_EMOJIS_LIMIT: 10,
  TOP_CONTRIBUTORS_LIMIT: 5,
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_INPUT: 'Invalid input. Please check your entry.',
  ROOM_NOT_FOUND: 'Chat room not found.',
  MESSAGE_NOT_FOUND: 'Message not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FILE_TOO_LARGE: `File is too large. Maximum size is ${VALIDATION_CONSTANTS.MAX_FILE_SIZE / 1024 / 1024}MB.`,
  MESSAGE_TOO_LONG: `Message is too long. Maximum length is ${VALIDATION_CONSTANTS.MAX_MESSAGE_LENGTH} characters.`,
  MESSAGE_EMPTY: 'Message cannot be empty.',
  INVALID_USERNAME: 'Username must be 2-50 characters.',
  TOO_MANY_REQUESTS: 'Too many requests. Please wait a moment.',
};

export const SUCCESS_MESSAGES = {
  MESSAGE_SENT: 'Message sent successfully.',
  MESSAGE_BOOKMARKED: 'Message bookmarked.',
  MESSAGE_UNBOOKMARKED: 'Bookmark removed.',
  CHAT_EXPORTED: 'Chat exported successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.',
  STATUS_UPDATED: 'Status updated successfully.',
};

export const KEYBOARD_SHORTCUTS = {
  SEND_MESSAGE: 'Enter',
  NEW_LINE: 'Shift+Enter',
  SEARCH: 'Ctrl+K',
  BOOKMARK: 'Ctrl+B',
  EXPORT: 'Ctrl+E',
  CLOSE_MODAL: 'Escape',
  EDIT_LAST: 'ArrowUp',
  HELP: 'Ctrl+/',
};

export const EMOJI_LIST = [
  '😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😎', '🤩', '🥳',
  '😇', '🤗', '🤔', '🤫', '🤭', '😏', '😌', '😴', '🥱', '😜',
  '😝', '🤪', '🤓', '😤', '😠', '🤯', '😱', '😈', '💀', '👻',
  '👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '🤟', '🤙', '💪',
  '👊', '✊', '🫶', '❤️', '🔥', '⭐', '✨', '💯', '🎉', '🎊',
  '💬', '💭', '🗯️', '💡', '📌', '📍', '🎯', '🏆', '🎵', '🎶',
  '🌟', '🌈', '☀️', '🌙', '⚡', '💧', '🌸', '🍀', '🦋', '🐱',
  '☕', '🍕', '🍔', '🎂', '🍰', '🍫', '🍿', '🥤', '🍹', '🧃',
];

export const QUICK_REACTIONS = ['😂', '❤️', '👍', '😮', '😢', '🔥'];

export const API_ENDPOINTS = {
  SEND_MESSAGE: '/api/chat/send',
  GET_MESSAGES: '/api/chat/messages',
  BOOKMARK: '/api/chat/bookmark',
  GET_BOOKMARKS: '/api/chat/bookmarks',
  EXPORT: '/api/chat/export',
  STATS: '/api/chat/stats',
  SEARCH: '/api/chat/search-advanced',
  SETTINGS: '/api/chat/settings',
  GET_SETTINGS: '/api/chat/settings/get',
  BURN_ROOM: '/api/chat/burn',
};

export const LOCAL_STORAGE_KEYS = {
  USERNAME: 'chatvault_username',
  SOUND_ENABLED: 'chatvault_sound',
  THEME: 'chatvault_theme',
  TIMEZONE: 'chatvault_timezone',
  NOTIFICATIONS_ENABLED: 'chatvault_notifications',
};

export const THEME_COLORS = {
  PRIMARY: '#6c63ff',
  SECONDARY: '#f59e0b',
  TERTIARY: '#10b981',
  DANGER: '#ef4444',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',
};

export const BREAKPOINTS = {
  MOBILE: '480px',
  TABLET: '768px',
  DESKTOP: '1024px',
  WIDE: '1280px',
};

export default {
  TIME_CONSTANTS,
  VALIDATION_CONSTANTS,
  RATE_LIMIT_CONSTANTS,
  UI_CONSTANTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  KEYBOARD_SHORTCUTS,
  EMOJI_LIST,
  QUICK_REACTIONS,
  API_ENDPOINTS,
  LOCAL_STORAGE_KEYS,
  THEME_COLORS,
  BREAKPOINTS,
};
