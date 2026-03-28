import React, { useState, useEffect, useRef } from "react";
import apiClient from "../api/client";
import Cookies from "js-cookie";
import "./GroupChat.css";

export default function GroupChat({ groupId, onBack, addToast }) {
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [mentions, setMentions] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const token = Cookies.get("authToken");
  const currentUser = localStorage.getItem("username");

  useEffect(() => {
    fetchGroup();
    const interval = setInterval(fetchGroup, 2000);
    return () => clearInterval(interval);
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchGroup = async () => {
    try {
      const response = await apiClient.get(`/api/groups/${groupId}`);
      setGroup(response.data);
      setMessages(response.data.messages || []);
      setLoading(false);
    } catch (err) {
      addToast("Failed to fetch group", "error");
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const mentionedUsers = extractMentions(inputText);

    try {
      await apiClient.post(
        `/api/groups/${groupId}/message`,
        {
          text: inputText,
          type: "text",
          mentions: mentionedUsers
        }
      );

      setInputText("");
      addToast("Message sent!", "success");
      fetchGroup();
    } catch (err) {
      addToast("Failed to send message", "error");
    }
  };

  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const matches = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setTypingUsers([]);
    }, 3000);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await apiClient.post(
        `/api/groups/${groupId}/message/${messageId}/delete`,
        {}
      );
      addToast("Message deleted", "success");
      fetchGroup();
    } catch (err) {
      addToast("Failed to delete message", "error");
    }
  };

  const handleReactToMessage = async (messageId, emoji) => {
    try {
      await apiClient.post(
        `/api/groups/${groupId}/message/${messageId}/react`,
        { emoji }
      );
      fetchGroup();
    } catch (err) {
      addToast("Failed to add reaction", "error");
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading group...</div>;
  }

  if (!group) {
    return <div className="error-message">Group not found</div>;
  }

  return (
    <div className="group-chat-container glass-morphism">
      {/* Header */}
      <div className="group-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <div className="group-info">
          <h2>{group.avatar} {group.name}</h2>
          <p>{group.members.length} members</p>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message-row ${msg.sender === currentUser ? "sent" : "received"}`}
            >
              <div className="message-bubble glass-morphism">
                <div className="message-sender">{msg.sender}</div>
                <div className="message-text">{msg.text}</div>
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="message-reactions">
                    {msg.reactions.map((r, i) => (
                      <span key={i} className="reaction-badge">
                        {r.emoji} {r.username}
                      </span>
                    ))}
                  </div>
                )}
                <div className="message-timestamp">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
                {msg.sender === currentUser && (
                  <div className="message-actions">
                    <button
                      className="action-btn"
                      onClick={() => handleReactToMessage(msg._id, "❤️")}
                    >
                      ❤️
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => handleDeleteMessage(msg._id)}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <span>{typingUsers.join(", ")} typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="message-input-form">
        <input
          type="text"
          className="styled-input"
          placeholder="Type a message... (use @username to mention)"
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            handleTyping();
          }}
        />
        <button type="submit" className="btn">
          Send
        </button>
      </form>
    </div>
  );
}
