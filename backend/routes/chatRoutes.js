const express = require('express');
const router = express.Router();
const ChatFolder = require('../models/ChatFolder');

// Test route
router.get('/', (req, res) => res.send('Backend running'));

// Create a chat folder
router.post('/create', async (req, res) => {
  const { password } = req.body;
  try {
    const existing = await ChatFolder.findOne({ password });
    if (existing) return res.status(400).json({ message: 'Folder already exists' });
    const newFolder = new ChatFolder({ password });
    await newFolder.save();
    res.json({ message: 'Chat folder created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Find folder by password
router.post('/find', async (req, res) => {
  const { password } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    res.json(folder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post a message (text or voice, with optional replyTo)
router.post('/message', async (req, res) => {
  const { password, sender, text, replyTo, type, audioData, audioDuration } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    const newMsg = { sender, text: text || '', type: type || 'text' };
    if (type === 'voice') {
      newMsg.audioData = audioData;
      newMsg.audioDuration = audioDuration;
      newMsg.text = '🎤 Voice message';
    }
    if (replyTo && replyTo.messageId) {
      newMsg.replyTo = { messageId: replyTo.messageId, sender: replyTo.sender, text: replyTo.text };
    }

    folder.messages.push(newMsg);
    folder.typingUsers = folder.typingUsers.filter(t => t.username !== sender);
    await folder.save();
    res.json({ message: 'Message added', folder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Poll — messages + typing + online users + pinned
router.post('/poll', async (req, res) => {
  const { password } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });

    const now = new Date();

    // Clean stale typing (>4s)
    const activeTyping = folder.typingUsers.filter(t => (now - new Date(t.lastTyping)) < 4000);

    // Clean stale online (>10s)
    const activeOnline = folder.onlineUsers.filter(u => (now - new Date(u.lastSeen)) < 10000);

    let needSave = false;
    if (activeTyping.length !== folder.typingUsers.length) {
      folder.typingUsers = activeTyping;
      needSave = true;
    }
    if (activeOnline.length !== folder.onlineUsers.length) {
      folder.onlineUsers = activeOnline;
      needSave = true;
    }
    if (needSave) await folder.save();

    // Get pinned messages
    const pinnedMessages = folder.messages.filter(m => m.pinned && !m.deletedAt);

    res.json({
      messages: folder.messages,
      typingUsers: activeTyping.map(t => t.username),
      onlineUsers: activeOnline.map(u => u.username),
      pinnedMessages
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Typing indicator
router.post('/typing', async (req, res) => {
  const { password, username } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    const idx = folder.typingUsers.findIndex(t => t.username === username);
    if (idx >= 0) folder.typingUsers[idx].lastTyping = new Date();
    else folder.typingUsers.push({ username, lastTyping: new Date() });
    await folder.save();
    res.json({ message: 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Online heartbeat
router.post('/heartbeat', async (req, res) => {
  const { password, username } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    const idx = folder.onlineUsers.findIndex(u => u.username === username);
    if (idx >= 0) folder.onlineUsers[idx].lastSeen = new Date();
    else folder.onlineUsers.push({ username, lastSeen: new Date() });
    await folder.save();
    res.json({ message: 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read receipts
router.post('/read', async (req, res) => {
  const { password, username, messageIds } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    let updated = false;
    for (const msg of folder.messages) {
      if (messageIds.includes(msg._id.toString())) {
        if (!msg.readBy.some(r => r.username === username)) {
          msg.readBy.push({ username, readAt: new Date() });
          updated = true;
        }
      }
    }
    if (updated) await folder.save();
    res.json({ message: 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle reaction
router.post('/react', async (req, res) => {
  const { password, username, messageId, emoji } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    const msg = folder.messages.id(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    const e = emoji || '❤️';
    const idx = msg.reactions.findIndex(r => r.username === username && r.emoji === e);
    if (idx >= 0) msg.reactions.splice(idx, 1);
    else msg.reactions.push({ username, emoji: e });
    await folder.save();
    res.json({ message: 'ok', folder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete message (soft delete)
router.post('/delete', async (req, res) => {
  const { password, username, messageId } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    const msg = folder.messages.id(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (msg.sender !== username) return res.status(403).json({ message: 'Not your message' });
    msg.deletedAt = new Date();
    msg.text = '';
    msg.audioData = null;
    await folder.save();
    res.json({ message: 'ok', folder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit message
router.post('/edit', async (req, res) => {
  const { password, username, messageId, newText } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    const msg = folder.messages.id(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (msg.sender !== username) return res.status(403).json({ message: 'Not your message' });
    if (msg.deletedAt) return res.status(400).json({ message: 'Message is deleted' });
    msg.text = newText;
    msg.editedAt = new Date();
    await folder.save();
    res.json({ message: 'ok', folder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pin/Unpin message
router.post('/pin', async (req, res) => {
  const { password, messageId } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    const msg = folder.messages.id(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    // Max 3 pinned
    const pinnedCount = folder.messages.filter(m => m.pinned && !m.deletedAt).length;
    if (!msg.pinned && pinnedCount >= 3) {
      return res.status(400).json({ message: 'Max 3 pinned messages' });
    }
    msg.pinned = !msg.pinned;
    await folder.save();
    res.json({ message: 'ok', folder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Forward message to another room
router.post('/forward', async (req, res) => {
  const { fromPassword, toPassword, messageId, sender } = req.body;
  try {
    const fromFolder = await ChatFolder.findOne({ password: fromPassword });
    if (!fromFolder) return res.status(404).json({ message: 'Source room not found' });
    const originalMsg = fromFolder.messages.id(messageId);
    if (!originalMsg) return res.status(404).json({ message: 'Message not found' });

    const toFolder = await ChatFolder.findOne({ password: toPassword });
    if (!toFolder) return res.status(404).json({ message: 'Destination room not found' });

    toFolder.messages.push({
      sender,
      text: originalMsg.deletedAt ? '' : originalMsg.text,
      type: originalMsg.type,
      audioData: originalMsg.audioData,
      audioDuration: originalMsg.audioDuration
    });
    await toFolder.save();
    res.json({ message: 'ok', folder: toFolder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;