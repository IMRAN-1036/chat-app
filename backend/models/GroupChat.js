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
  type: { type: String, enum: ['text', 'voice', 'image', 'file', 'mention'], default: 'text' },
  audioData: String,
  audioDuration: Number,
  imageData: String,
  fileName: String,
  fileData: String,
  fileSize: Number,
  linkPreview: {
    url: String,
    title: String,
    description: String,
    image: String
  },
  mentions: [String], // Array of mentioned usernames
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

const GroupChatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  createdBy: {
    type: String,
    required: true,
  },
  members: [
    {
      username: String,
      role: { type: String, enum: ['admin', 'member'], default: 'member' },
      joinedAt: { type: Date, default: Date.now }
    }
  ],
  messages: [MessageSchema],
  avatar: String, // Group avatar URL or emoji
  isPrivate: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// TTL index — MongoDB auto-deletes expired self-destruct messages
MessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

module.exports = mongoose.model('GroupChat', GroupChatSchema);
