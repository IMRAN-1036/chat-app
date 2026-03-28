const express = require('express');
const router = express.Router();
const ChatFolder = require('../models/ChatFolder');
const auth = require('../middleware/auth');

// ===== BOOKMARKING =====
// Bookmark a message
router.post('/bookmark', auth, async (req, res) => {
  const { password, username, messageId } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) return res.status(404).json({ message: 'Room not found' });
    
    const msg = folder.messages.id(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    
    // Add bookmark metadata to message
    if (!msg.bookmarkedBy) msg.bookmarkedBy = [];
    const isBookmarked = msg.bookmarkedBy.includes(username);
    
    if (isBookmarked) {
      msg.bookmarkedBy = msg.bookmarkedBy.filter(u => u !== username);
    } else {
      msg.bookmarkedBy.push(username);
    }
    
    await folder.save();
    req.app.get('io')?.to(password).emit('folder_updated', folder);
    res.json({ message: 'ok', bookmarked: !isBookmarked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get bookmarked messages for a user
router.post('/bookmarks', auth, async (req, res) => {
  const { password, username } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) return res.status(404).json({ message: 'Room not found' });
    
    const bookmarkedMessages = folder.messages.filter(
      msg => msg.bookmarkedBy && msg.bookmarkedBy.includes(username)
    );
    
    res.json({ bookmarks: bookmarkedMessages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== CHAT EXPORT =====
// Export messages as JSON
router.post('/export', auth, async (req, res) => {
  const { password, format = 'json' } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) return res.status(404).json({ message: 'Room not found' });
    
    const exportData = {
      roomPassword: password,
      createdBy: folder.createdBy,
      exportedAt: new Date(),
      totalMessages: folder.messages.length,
      messages: folder.messages.map(msg => ({
        sender: msg.sender,
        text: msg.text,
        type: msg.type,
        timestamp: msg.timestamp,
        reactions: msg.reactions,
        pinned: msg.pinned,
        editedAt: msg.editedAt,
        deletedAt: msg.deletedAt
      }))
    };
    
    if (format === 'json') {
      res.json(exportData);
    } else if (format === 'csv') {
      // Convert to CSV format
      const csv = [
        ['Sender', 'Message', 'Type', 'Timestamp', 'Reactions', 'Pinned'],
        ...folder.messages.map(msg => [
          msg.sender,
          msg.text || '',
          msg.type,
          msg.timestamp,
          msg.reactions.length,
          msg.pinned ? 'Yes' : 'No'
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="chat-export.csv"');
      res.send(csv);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ROOM STATISTICS & ANALYTICS =====
// Get room statistics
router.post('/stats', auth, async (req, res) => {
  const { password } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) return res.status(404).json({ message: 'Room not found' });
    
    // Calculate statistics
    const stats = {
      totalMessages: folder.messages.length,
      totalUsers: new Set(folder.messages.map(m => m.sender)).size,
      messagesByUser: {},
      messagesByType: { text: 0, voice: 0, image: 0, file: 0 },
      mostUsedEmojis: {},
      averageMessageLength: 0,
      filesShared: 0,
      createdAt: folder._id.getTimestamp ? folder._id.getTimestamp() : new Date()
    };
    
    let totalLength = 0;
    
    folder.messages.forEach(msg => {
      // Messages by user
      stats.messagesByUser[msg.sender] = (stats.messagesByUser[msg.sender] || 0) + 1;
      
      // Messages by type
      stats.messagesByType[msg.type || 'text']++;
      
      // Text length
      if (msg.text) totalLength += msg.text.length;
      
      // Emojis
      msg.reactions?.forEach(reaction => {
        stats.mostUsedEmojis[reaction.emoji] = (stats.mostUsedEmojis[reaction.emoji] || 0) + 1;
      });
      
      // Files
      if (msg.type === 'file') stats.filesShared++;
    });
    
    stats.averageMessageLength = folder.messages.length > 0 ? Math.round(totalLength / folder.messages.length) : 0;
    
    // Sort emojis by frequency
    stats.topEmojis = Object.entries(stats.mostUsedEmojis)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([emoji, count]) => ({ emoji, count }));
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ADVANCED SEARCH =====
// Advanced message search with filters
router.post('/search-advanced', auth, async (req, res) => {
  const { password, query, sender, startDate, endDate, messageType, hasReactions } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) return res.status(404).json({ message: 'Room not found' });
    
    let results = folder.messages;
    
    // Text search
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(msg => msg.text?.toLowerCase().includes(q));
    }
    
    // Filter by sender
    if (sender) {
      results = results.filter(msg => msg.sender === sender);
    }
    
    // Filter by date range
    if (startDate || endDate) {
      results = results.filter(msg => {
        const msgDate = new Date(msg.timestamp);
        if (startDate && msgDate < new Date(startDate)) return false;
        if (endDate && msgDate > new Date(endDate)) return false;
        return true;
      });
    }
    
    // Filter by message type
    if (messageType) {
      results = results.filter(msg => msg.type === messageType);
    }
    
    // Filter by reactions
    if (hasReactions) {
      results = results.filter(msg => msg.reactions && msg.reactions.length > 0);
    }
    
    res.json({ results, count: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== ROOM SETTINGS =====
// Update room settings
router.post('/settings', auth, async (req, res) => {
  const { password, username, settings } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) return res.status(404).json({ message: 'Room not found' });
    
    // Only creator can change settings
    if (folder.createdBy && folder.createdBy !== username) {
      return res.status(403).json({ message: 'Only room creator can change settings' });
    }
    
    // Update settings
    if (!folder.roomSettings) folder.roomSettings = {};
    Object.assign(folder.roomSettings, settings);
    
    await folder.save();
    req.app.get('io')?.to(password).emit('settings_updated', folder.roomSettings);
    res.json({ message: 'Settings updated', settings: folder.roomSettings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get room settings
router.post('/settings/get', auth, async (req, res) => {
  const { password } = req.body;
  try {
    const folder = await ChatFolder.findOne({ password });
    if (!folder) return res.status(404).json({ message: 'Room not found' });
    
    res.json({ settings: folder.roomSettings || {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
