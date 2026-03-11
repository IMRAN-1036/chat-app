const mongoose = require('mongoose');

const ReadReceiptSchema = new mongoose.Schema({
  username: String,
  readAt: { type: Date, default: Date.now }
}, { _id: false });

const ReactionSchema = new mongoose.Schema({
  username: String,
  emoji: { type: String, default: '❤️' }
}, { _id: false });

const ReplyToSchema = new mongoose.Schema({
  messageId: String,
  sender: String,
  text: String
}, { _id: false });

const MessageSchema = new mongoose.Schema({
  sender: String,
  text: String,
  type: { type: String, enum: ['text', 'voice', 'image', 'file'], default: 'text' },
  audioData: String,       // base64 audio for voice messages
  audioDuration: Number,   // duration in seconds
  imageData: String,       // base64 image data
  fileName: String,        // original file name for attachments
  fileData: String,        // base64 file data
  fileSize: Number,        // file size in bytes
  linkPreview: {           // link preview metadata
    url: String,
    title: String,
    description: String,
    image: String
  },
  timestamp: { type: Date, default: Date.now },
  readBy: [ReadReceiptSchema],
  reactions: [ReactionSchema],
  replyTo: { type: ReplyToSchema, default: null },
  pinned: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  editedAt: { type: Date, default: null },
  selfDestruct: { type: Boolean, default: false },
  expiresAt: { type: Date, default: null }
});

const TypingUserSchema = new mongoose.Schema({
  username: String,
  lastTyping: { type: Date, default: Date.now }
}, { _id: false });

const OnlineUserSchema = new mongoose.Schema({
  username: String,
  lastSeen: { type: Date, default: Date.now }
}, { _id: false });

const ChatFolderSchema = new mongoose.Schema({
  password: { type: String, required: true },
  createdBy: { type: String, default: null },
  messages: [MessageSchema],
  typingUsers: [TypingUserSchema],
  onlineUsers: [OnlineUserSchema]
});

// TTL index — MongoDB auto-deletes expired self-destruct messages
MessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

module.exports = mongoose.model('ChatFolder', ChatFolderSchema);