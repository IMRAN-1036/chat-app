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
    await folder.save();
    res.json({ message: 'Message added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;