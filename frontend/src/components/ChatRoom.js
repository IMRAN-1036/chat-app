import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages from backend
  const fetchMessages = useCallback(async () => {
    try {
      const res = await axios.post(`${API_URL}/api/chat/find`, {
        password: folder.password,
      });
      if (res.data && res.data.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      // silently ignore polling errors
    }
  }, [API_URL, folder.password]);

  // Auto-refresh every 3 seconds
  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSaveUsername = () => {
    const name = usernameInput.trim();
    if (!name) return;
    localStorage.setItem("chatvault_username", name);
    setUsername(name);
    setShowUsernameModal(false);
    addToast(`Welcome, ${name}! 👋`, "success");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSend = async () => {
    if (!text.trim()) return;

    const msgText = text;
    setText("");

    // Optimistic update
    const optimisticMsg = {
      sender: username,
      text: msgText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await axios.post(`${API_URL}/api/chat/message`, {
        password: folder.password,
        sender: username,
        text: msgText,
      });
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
      <div className="chat-messages">
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
            return (
              <div
                key={i}
                className={`message-row ${isSent ? "sent" : "received"}`}
              >
                <div className="message-bubble">
                  {!isSent && (
                    <div className="message-sender">{msg.sender}</div>
                  )}
                  <div className="message-text">{msg.text}</div>
                  <div className="message-time">{timeAgo(msg.timestamp)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <input
          ref={inputRef}
          type="text"
          className="chat-text-input"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
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
      </div>
    </div>
  );
}