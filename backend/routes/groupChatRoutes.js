const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const GroupChat = require('../models/GroupChat');
const axios = require('axios');

// Create a new group chat
router.post('/create', auth, async (req, res) => {
  const { name, description, isPrivate } = req.body;
  const createdBy = req.user.username;
  
  try {
    const newGroup = new GroupChat({
      name,
      description,
      createdBy,
      isPrivate,
      members: [{ username: createdBy, role: 'admin' }],
      avatar: '👥'
    });
    
    await newGroup.save();
    res.json({ message: 'Group created successfully', group: newGroup });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all groups
router.get('/list', auth, async (req, res) => {
  try {
    const groups = await GroupChat.find({
      $or: [
        { createdBy: req.user.username },
        { 'members.username': req.user.username },
        { isPrivate: false }
      ]
    }).select('_id name description avatar members createdAt');
    
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get group details
router.get('/:groupId', auth, async (req, res) => {
  try {
    const group = await GroupChat.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    // Check if user is member or group is public
    const isMember = group.members.some(m => m.username === req.user.username);
    if (group.isPrivate && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join a group
router.post('/:groupId/join', auth, async (req, res) => {
  try {
    const group = await GroupChat.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    const isMember = group.members.some(m => m.username === req.user.username);
    if (isMember) return res.status(400).json({ message: 'Already a member' });
    
    if (group.isPrivate) {
      return res.status(403).json({ message: 'Cannot join private group' });
    }
    
    group.members.push({ username: req.user.username, role: 'member' });
    await group.save();
    
    res.json({ message: 'Joined group successfully', group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send message to group
router.post('/:groupId/message', auth, async (req, res) => {
  const { text, type, audioData, audioDuration, imageData, fileName, fileData, fileSize, replyTo, mentions } = req.body;
  
  try {
    const group = await GroupChat.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    const isMember = group.members.some(m => m.username === req.user.username);
    if (!isMember) return res.status(403).json({ message: 'Not a member of this group' });
    
    const newMsg = {
      sender: req.user.username,
      text: text || '',
      type: type || 'text',
      mentions: mentions || []
    };
    
    if (type === 'voice') {
      newMsg.audioData = audioData;
      newMsg.audioDuration = audioDuration;
    }
    if (type === 'image') {
      newMsg.imageData = imageData;
    }
    if (type === 'file') {
      newMsg.fileName = fileName;
      newMsg.fileData = fileData;
      newMsg.fileSize = fileSize;
    }
    if (replyTo) {
      newMsg.replyTo = replyTo;
    }
    
    group.messages.push(newMsg);
    await group.save();
    
    // Emit to all group members via Socket.io
    req.app.get('io')?.to(req.params.groupId).emit('group_message', {
      groupId: req.params.groupId,
      message: newMsg,
      mentions
    });
    
    res.json({ message: 'Message sent', group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add member to group (admin only)
router.post('/:groupId/add-member', auth, async (req, res) => {
  const { username } = req.body;
  
  try {
    const group = await GroupChat.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    const isAdmin = group.members.some(m => m.username === req.user.username && m.role === 'admin');
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can add members' });
    
    const isMember = group.members.some(m => m.username === username);
    if (isMember) return res.status(400).json({ message: 'User already in group' });
    
    group.members.push({ username, role: 'member' });
    await group.save();
    
    res.json({ message: 'Member added successfully', group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove member from group (admin only)
router.post('/:groupId/remove-member', auth, async (req, res) => {
  const { username } = req.body;
  
  try {
    const group = await GroupChat.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    const isAdmin = group.members.some(m => m.username === req.user.username && m.role === 'admin');
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can remove members' });
    
    group.members = group.members.filter(m => m.username !== username);
    await group.save();
    
    res.json({ message: 'Member removed successfully', group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit message
router.post('/:groupId/message/:messageId/edit', auth, async (req, res) => {
  const { newText } = req.body;
  
  try {
    const group = await GroupChat.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    const msg = group.messages.id(req.params.messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    
    if (msg.sender !== req.user.username) {
      return res.status(403).json({ message: 'Can only edit your own messages' });
    }
    
    msg.text = newText;
    msg.editedAt = new Date();
    await group.save();
    
    req.app.get('io')?.to(req.params.groupId).emit('group_message_edited', {
      groupId: req.params.groupId,
      messageId: req.params.messageId,
      newText,
      editedAt: msg.editedAt
    });
    
    res.json({ message: 'Message edited', group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete message
router.post('/:groupId/message/:messageId/delete', auth, async (req, res) => {
  try {
    const group = await GroupChat.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    const msg = group.messages.id(req.params.messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    
    if (msg.sender !== req.user.username) {
      return res.status(403).json({ message: 'Can only delete your own messages' });
    }
    
    msg.deletedAt = new Date();
    msg.text = '';
    await group.save();
    
    req.app.get('io')?.to(req.params.groupId).emit('group_message_deleted', {
      groupId: req.params.groupId,
      messageId: req.params.messageId
    });
    
    res.json({ message: 'Message deleted', group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// React to message
router.post('/:groupId/message/:messageId/react', auth, async (req, res) => {
  const { emoji } = req.body;
  
  try {
    const group = await GroupChat.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    const msg = group.messages.id(req.params.messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    
    const e = emoji || '❤️';
    const idx = msg.reactions.findIndex(r => r.username === req.user.username && r.emoji === e);
    
    if (idx >= 0) {
      msg.reactions.splice(idx, 1);
    } else {
      msg.reactions.push({ username: req.user.username, emoji: e });
    }
    
    await group.save();
    
    req.app.get('io')?.to(req.params.groupId).emit('group_message_reacted', {
      groupId: req.params.groupId,
      messageId: req.params.messageId,
      reactions: msg.reactions
    });
    
    res.json({ message: 'Reaction added', group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pin message
router.post('/:groupId/message/:messageId/pin', auth, async (req, res) => {
  try {
    const group = await GroupChat.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    const isAdmin = group.members.some(m => m.username === req.user.username && m.role === 'admin');
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can pin messages' });
    
    const msg = group.messages.id(req.params.messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    
    msg.pinned = !msg.pinned;
    await group.save();
    
    req.app.get('io')?.to(req.params.groupId).emit('group_message_pinned', {
      groupId: req.params.groupId,
      messageId: req.params.messageId,
      pinned: msg.pinned
    });
    
    res.json({ message: 'Message pinned', group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
