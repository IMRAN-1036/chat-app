import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const EMOJI_LIST = [
  // Smileys
  "😀","😂","🤣","😊","😍","🥰","😘","😎","🤩","🥳",
  "😇","🤗","🤔","🤫","🤭","😏","😌","😴","🥱","😜",
  "😝","🤪","🤓","😤","😠","🤯","😱","😈","💀","👻",
  // Gestures
  "👍","👎","👏","🙌","🤝","✌️","🤞","🤟","🤙","💪",
  "👊","✊","🫶","❤️","🔥","⭐","✨","💯","🎉","🎊",
  // Objects
  "💬","💭","🗯️","💡","📌","📍","🎯","🏆","🎵","🎶",
  // Nature
  "🌟","🌈","☀️","🌙","⚡","💧","🌸","🍀","🦋","🐱",
  // Food
  "☕","🍕","🍔","🎂","🍰","🍫","🍿","🥤","🍹","🧃",
];

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function ChatRoom({ folder, onBack, addToast }) {
  const [messages, setMessages] = useState(folder.messages || []);
  const [text, setText] = useState("");
  const [username, setUsername] = useState("");
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const emojiPanelRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const prevMsgCountRef = useRef(messages.length);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:2000";

  // Check for saved username
  useEffect(() => {
    const saved = localStorage.getItem("chatvault_username");
    if (saved) {
      setUsername(saved);
    } else {
      setShowUsernameModal(true);
    }
  }, []);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPanelRef.current && !emojiPanelRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  // Scroll detection
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 100;
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    setIsAtBottom(atBottom);
    setShowScrollBtn(!atBottom);
    if (atBottom) {
      setNewMsgCount(0);
    }
  }, []);

  // Auto-scroll only if user is at the bottom
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      // Count new messages while scrolled up
      const diff = messages.length - prevMsgCountRef.current;
      if (diff > 0) {
        setNewMsgCount((prev) => prev + diff);
      }
    }
    prevMsgCountRef.current = messages.length;
  }, [messages, isAtBottom]);

  // Poll for messages + typing users
  const fetchMessages = useCallback(async () => {
    try {
      const res = await axios.post(`${API_URL}/api/chat/poll`, {
        password: folder.password,
      });
      if (res.data) {
        if (res.data.messages) {
          setMessages(res.data.messages);
        }
        if (res.data.typingUsers) {
          // Filter out current user from typing list
          setTypingUsers(
            res.data.typingUsers.filter((u) => u !== username)
          );
        }
      }
    } catch (err) {
      // silently ignore polling errors
    }
  }, [API_URL, folder.password, username]);

  // Send read receipts for unread messages
  const sendReadReceipts = useCallback(async (msgs) => {
    if (!username) return;
    const unreadIds = msgs
      .filter((msg) => {
        if (msg.sender === username) return false;
        if (!msg.readBy) return true;
        return !msg.readBy.some((r) => r.username === username);
      })
      .map((msg) => msg._id)
      .filter(Boolean);

    if (unreadIds.length > 0) {
      try {
        await axios.post(`${API_URL}/api/chat/read`, {
          password: folder.password,
          username,
          messageIds: unreadIds,
        });
      } catch (err) {
        // silently ignore
      }
    }
  }, [API_URL, folder.password, username]);

  // Auto-refresh every 2 seconds
  useEffect(() => {
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Send read receipts when messages update
  useEffect(() => {
    if (messages.length > 0 && username) {
      sendReadReceipts(messages);
    }
  }, [messages, username, sendReadReceipts]);

  const handleSaveUsername = () => {
    const name = usernameInput.trim();
    if (!name) return;
    localStorage.setItem("chatvault_username", name);
    setUsername(name);
    setShowUsernameModal(false);
    addToast(`Welcome, ${name}! 👋`, "success");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Send typing indicator (debounced — max once per 2s)
  const sendTypingIndicator = useCallback(async () => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    try {
      await axios.post(`${API_URL}/api/chat/typing`, {
        password: folder.password,
        username,
      });
    } catch (err) {
      // silently ignore
    }
  }, [API_URL, folder.password, username]);

  const handleInputChange = (e) => {
    setText(e.target.value);
    if (e.target.value.trim()) {
      sendTypingIndicator();
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;

    const msgText = text;
    setText("");

    // Optimistic update
    const optimisticMsg = {
      _id: `optimistic_${Date.now()}`,
      sender: username,
      text: msgText,
      timestamp: new Date().toISOString(),
      readBy: [],
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Auto-scroll to bottom when sending
    setIsAtBottom(true);
    setNewMsgCount(0);

    try {
      const res = await axios.post(`${API_URL}/api/chat/message`, {
        password: folder.password,
        sender: username,
        text: msgText,
      });
      // Replace optimistic messages with server data immediately
      if (res.data && res.data.folder) {
        setMessages(res.data.folder.messages);
      }
    } catch (err) {
      addToast("Failed to send message", "error");
    }

    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollBtn(false);
    setNewMsgCount(0);
    setIsAtBottom(true);
  };

  const getReadCount = (msg) => {
    if (!msg.readBy) return 0;
    // Don't count the sender's own read
    return msg.readBy.filter((r) => r.username !== msg.sender).length;
  };

  // Username modal
  if (showUsernameModal) {
    return (
      <div className="username-overlay">
        <div className="username-modal">
          <div className="modal-icon">👤</div>
          <h3>What's your name?</h3>
          <p>This will be shown next to your messages</p>
          <div className="input-group" style={{ marginBottom: "1rem" }}>
            <input
              type="text"
              className="styled-input"
              placeholder="Enter your name..."
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveUsername()}
              autoFocus
              id="username-input"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSaveUsername}
            disabled={!usernameInput.trim()}
            id="save-username-btn"
          >
            Let's Chat ✨
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <button className="chat-back-btn" onClick={onBack} id="back-btn">
          ←
        </button>
        <div className="chat-header-info">
          <div className="chat-room-name">🔐 {folder.password}</div>
          <div className="chat-room-status">
            <span className="status-dot"></span>
            Live • Auto-refreshing
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        className="chat-messages"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="chat-messages-empty">
            <div className="empty-icon">💭</div>
            <div className="empty-text">No messages yet</div>
            <div className="empty-subtext">
              Be the first to say something!
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isSent = msg.sender === username;
            const readCount = getReadCount(msg);
            return (
              <div
                key={msg._id || i}
                className={`message-row ${isSent ? "sent" : "received"}`}
              >
                <div className="message-bubble">
                  {!isSent && (
                    <div className="message-sender">{msg.sender}</div>
                  )}
                  <div className="message-text">{msg.text}</div>
                  <div className="message-meta">
                    <span className="message-time">
                      {timeAgo(msg.timestamp)}
                    </span>
                    {isSent && (
                      <span className="read-receipt">
                        {readCount > 0 ? (
                          <>
                            <span className="check-double">✓✓</span>
                            <span className="read-count">
                              Read by {readCount}
                            </span>
                          </>
                        ) : (
                          <span className="check-single">✓</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          className="scroll-to-bottom"
          onClick={scrollToBottom}
          id="scroll-bottom-btn"
        >
          ↓
          {newMsgCount > 0 && (
            <span className="scroll-badge">{newMsgCount}</span>
          )}
        </button>
      )}

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="typing-text">
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing`
              : `${typingUsers.join(", ")} are typing`}
          </span>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-area">
        <button
          className="emoji-btn"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          id="emoji-toggle-btn"
        >
          😊
        </button>
        <input
          ref={inputRef}
          type="text"
          className="chat-text-input"
          placeholder="Type a message..."
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoFocus
          id="message-input"
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!text.trim()}
          id="send-btn"
        >
          ➤
        </button>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="emoji-panel" ref={emojiPanelRef}>
            <div className="emoji-panel-header">Emojis</div>
            <div className="emoji-grid">
              {EMOJI_LIST.map((emoji, i) => (
                <button
                  key={i}
                  className="emoji-item"
                  onClick={() => handleEmojiClick(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}