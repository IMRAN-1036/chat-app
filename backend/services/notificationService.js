/**
 * Notification Service
 * Handles push notifications, mentions, and real-time alerts
 */

class NotificationService {
  constructor() {
    this.subscribers = new Map(); // username -> [callbacks]
    this.mentionNotifications = new Map(); // username -> [mentions]
  }

  /**
   * Subscribe to notifications for a user
   */
  subscribe(username, callback) {
    if (!this.subscribers.has(username)) {
      this.subscribers.set(username, []);
    }
    this.subscribers.get(username).push(callback);
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribe(username, callback) {
    if (this.subscribers.has(username)) {
      const callbacks = this.subscribers.get(username);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Send notification to user
   */
  notify(username, notification) {
    if (this.subscribers.has(username)) {
      const callbacks = this.subscribers.get(username);
      callbacks.forEach(callback => {
        try {
          callback(notification);
        } catch (err) {
          console.error('Notification callback error:', err);
        }
      });
    }
  }

  /**
   * Handle mention notification
   */
  handleMention(mentionedUsername, mentionerUsername, messageContent, groupId) {
    const notification = {
      type: 'mention',
      from: mentionerUsername,
      message: messageContent,
      groupId,
      timestamp: new Date(),
      icon: '📢'
    };

    // Store mention for later retrieval
    if (!this.mentionNotifications.has(mentionedUsername)) {
      this.mentionNotifications.set(mentionedUsername, []);
    }
    this.mentionNotifications.get(mentionedUsername).push(notification);

    // Send real-time notification
    this.notify(mentionedUsername, notification);

    // Keep only last 50 mentions
    const mentions = this.mentionNotifications.get(mentionedUsername);
    if (mentions.length > 50) {
      mentions.shift();
    }
  }

  /**
   * Get pending mentions for a user
   */
  getPendingMentions(username) {
    return this.mentionNotifications.get(username) || [];
  }

  /**
   * Clear mentions for a user
   */
  clearMentions(username) {
    this.mentionNotifications.delete(username);
  }

  /**
   * Send message notification
   */
  sendMessageNotification(username, senderUsername, messagePreview, groupName) {
    const notification = {
      type: 'message',
      from: senderUsername,
      preview: messagePreview,
      group: groupName,
      timestamp: new Date(),
      icon: '💬'
    };

    this.notify(username, notification);
  }

  /**
   * Send reaction notification
   */
  sendReactionNotification(username, reactorUsername, emoji, groupName) {
    const notification = {
      type: 'reaction',
      from: reactorUsername,
      emoji,
      group: groupName,
      timestamp: new Date(),
      icon: emoji
    };

    this.notify(username, notification);
  }

  /**
   * Send typing notification
   */
  sendTypingNotification(username, typerUsername, groupName) {
    const notification = {
      type: 'typing',
      from: typerUsername,
      group: groupName,
      timestamp: new Date(),
      icon: '✏️'
    };

    this.notify(username, notification);
  }

  /**
   * Send user joined notification
   */
  sendUserJoinedNotification(groupMembers, joinedUsername, groupName) {
    const notification = {
      type: 'user_joined',
      user: joinedUsername,
      group: groupName,
      timestamp: new Date(),
      icon: '👋'
    };

    groupMembers.forEach(member => {
      if (member !== joinedUsername) {
        this.notify(member, notification);
      }
    });
  }

  /**
   * Send user left notification
   */
  sendUserLeftNotification(groupMembers, leftUsername, groupName) {
    const notification = {
      type: 'user_left',
      user: leftUsername,
      group: groupName,
      timestamp: new Date(),
      icon: '👋'
    };

    groupMembers.forEach(member => {
      if (member !== leftUsername) {
        this.notify(member, notification);
      }
    });
  }

  /**
   * Get notification statistics
   */
  getStats() {
    return {
      totalSubscribers: this.subscribers.size,
      totalMentions: Array.from(this.mentionNotifications.values()).reduce((sum, arr) => sum + arr.length, 0),
      subscribers: Array.from(this.subscribers.keys())
    };
  }
}

module.exports = new NotificationService();
