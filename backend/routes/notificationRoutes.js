const express = require('express');
const auth = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const router = express.Router();

// Get pending mentions
router.get('/mentions', auth, (req, res) => {
  const mentions = notificationService.getPendingMentions(req.user.username);
  res.json(mentions);
});

// Clear mentions
router.post('/mentions/clear', auth, (req, res) => {
  notificationService.clearMentions(req.user.username);
  res.json({ message: 'Mentions cleared' });
});

// Get notification stats (for debugging/admin)
router.get('/stats', auth, (req, res) => {
  const stats = notificationService.getStats();
  res.json(stats);
});

// Subscribe to notifications (WebSocket fallback)
router.post('/subscribe', auth, (req, res) => {
  const { groupId } = req.body;
  
  // In a real implementation, this would establish a WebSocket connection
  // For now, we'll just acknowledge the subscription
  res.json({
    message: 'Subscribed to notifications',
    username: req.user.username,
    groupId
  });
});

module.exports = router;
