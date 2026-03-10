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
  type: { type: String, enum: ['text', 'voice'], default: 'text' },
  audioData: String,       // base64 audio for voice messages
  audioDuration: Number,   // duration in seconds
  timestamp: { type: Date, default: Date.now },
  readBy: [ReadReceiptSchema],
  reactions: [ReactionSchema],
  replyTo: { type: ReplyToSchema, default: null },
  pinned: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  editedAt: { type: Date, default: null }
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
  messages: [MessageSchema],
  typingUsers: [TypingUserSchema],
  onlineUsers: [OnlineUserSchema]
});

module.exports = mongoose.model('ChatFolder', ChatFolderSchema);