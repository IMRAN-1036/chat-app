const mongoose = require('mongoose');

const ReadReceiptSchema = new mongoose.Schema({
  username: String,
  readAt: { type: Date, default: Date.now }
}, { _id: false });

const MessageSchema = new mongoose.Schema({
  sender: String,
  text: String,
  timestamp: { type: Date, default: Date.now },
  readBy: [ReadReceiptSchema]
});

const TypingUserSchema = new mongoose.Schema({
  username: String,
  lastTyping: { type: Date, default: Date.now }
}, { _id: false });

const ChatFolderSchema = new mongoose.Schema({
  password: { type: String, required: true },
  messages: [MessageSchema],
  typingUsers: [TypingUserSchema]
});

module.exports = mongoose.model('ChatFolder', ChatFolderSchema);