const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});

const ChatFolderSchema = new mongoose.Schema({
  password: { type: String, required: true },
  messages: [MessageSchema]
});

module.exports = mongoose.model('ChatFolder', ChatFolderSchema);