const express = require('express');
const router = express.Router();
const ChatFolder = require('../models/ChatFolder');

// Test route to check if backend is running
router.get('/', (req, res) => res.send('Backend running'));

// Create a chat folder
router.post('/create', async (req, res) => {
  const { password } = req.body;
  try {
    const existing = await ChatFolder.findOne({ password });
    if (existing) {
      return res.status(400).json({ message: 'Folder already exists' });
    }

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
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    res.json(folder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post a message
router.post('/message', async (req, res) => {
  const { password, sender, text } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    folder.messages.push({ sender, text });

    // Remove sender from typingUsers when they send a message
    folder.typingUsers = folder.typingUsers.filter(t => t.username !== sender);

    await folder.save();
    res.json({ message: 'Message added', folder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Poll endpoint — returns messages + active typing users in one call
router.post('/poll', async (req, res) => {
  const { password } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Clean up stale typing users (older than 4 seconds)
    const now = new Date();
    const activeTyping = folder.typingUsers.filter(t => {
      return (now - new Date(t.lastTyping)) < 4000;
    });

    // Only save if we actually removed stale entries
    if (activeTyping.length !== folder.typingUsers.length) {
      folder.typingUsers = activeTyping;
      await folder.save();
    }

    res.json({
      messages: folder.messages,
      typingUsers: activeTyping.map(t => t.username)
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
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    const existingIdx = folder.typingUsers.findIndex(t => t.username === username);
    if (existingIdx >= 0) {
      folder.typingUsers[existingIdx].lastTyping = new Date();
    } else {
      folder.typingUsers.push({ username, lastTyping: new Date() });
    }

    await folder.save();
    res.json({ message: 'Typing status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark messages as read
router.post('/read', async (req, res) => {
  const { password, username, messageIds } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    let updated = false;
    for (const msg of folder.messages) {
      if (messageIds.includes(msg._id.toString())) {
        // Don't add duplicate reads
        const alreadyRead = msg.readBy.some(r => r.username === username);
        if (!alreadyRead) {
          msg.readBy.push({ username, readAt: new Date() });
          updated = true;
        }
      }
    }

    if (updated) {
      await folder.save();
    }

    res.json({ message: 'Read receipts updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;