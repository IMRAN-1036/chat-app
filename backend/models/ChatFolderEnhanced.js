const mongoose = require('mongoose');

// Enhanced schemas for new features

const BookmarkSchema = new mongoose.Schema({
  messageId: String,
  bookmarkedBy: String,
  bookmarkedAt: { type: Date, default: Date.now }
}, { _id: false });

const ThreadSchema = new mongoose.Schema({
  parentMessageId: String,
  replies: [{
    messageId: String,
    sender: String,
    text: String,
    timestamp: { type: Date, default: Date.now }
  }],
  replyCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const RoomSettingsSchema = new mongoose.Schema({
  roomName: { type: String, default: "Chat Room" },
  roomDescription: { type: String, default: "" },
  theme: { type: String, enum: ['dark', 'light', 'custom'], default: 'dark' },
  messageRetentionDays: { type: Number, default: null }, // null = unlimited
  allowFileSharing: { type: Boolean, default: true },
  allowVoiceMessages: { type: Boolean, default: true },
  maxFileSize: { type: Number, default: 5 * 1024 * 1024 }, // 5MB
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const UserStatsSchema = new mongoose.Schema({
  username: String,
  messageCount: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  filesShared: { type: Number, default: 0 },
  reactionsGiven: { type: Number, default: 0 }
}, { _id: false });

// Enhanced ChatFolder schema with new features
const EnhancedChatFolderSchema = new mongoose.Schema({
  password: { type: String, required: true },
  createdBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  
  // Original fields
  messages: mongoose.Schema.Types.Mixed, // Keep original message structure
  typingUsers: mongoose.Schema.Types.Mixed,
  onlineUsers: mongoose.Schema.Types.Mixed,
  
  // New feature fields
  bookmarks: [BookmarkSchema],
  threads: [ThreadSchema],
  roomSettings: { type: RoomSettingsSchema, default: () => ({}) },
  userStats: [UserStatsSchema],
  
  // Analytics
  totalMessagesCount: { type: Number, default: 0 },
  totalUsersCount: { type: Number, default: 0 },
  lastActivityAt: { type: Date, default: Date.now }
});

// Indexes for better query performance
EnhancedChatFolderSchema.index({ password: 1 });
EnhancedChatFolderSchema.index({ createdAt: 1 });
EnhancedChatFolderSchema.index({ 'bookmarks.messageId': 1 });
EnhancedChatFolderSchema.index({ 'threads.parentMessageId': 1 });

module.exports = mongoose.model('EnhancedChatFolder', EnhancedChatFolderSchema);
