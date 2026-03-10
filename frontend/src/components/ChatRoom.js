import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

/* ===== Emoji data ===== */
const EMOJI_LIST = [
  "😀","😂","🤣","😊","😍","🥰","😘","😎","🤩","🥳",
  "😇","🤗","🤔","🤫","🤭","😏","😌","😴","🥱","😜",
  "😝","🤪","🤓","😤","😠","🤯","😱","😈","💀","👻",
  "👍","👎","👏","🙌","🤝","✌️","🤞","🤟","🤙","💪",
  "👊","✊","🫶","❤️","🔥","⭐","✨","💯","🎉","🎊",
  "💬","💭","🗯️","💡","📌","📍","🎯","🏆","🎵","🎶",
  "🌟","🌈","☀️","🌙","⚡","💧","🌸","🍀","🦋","🐱",
  "☕","🍕","🍔","🎂","🍰","🍫","🍿","🥤","🍹","🧃",
];
const QUICK_REACTIONS = ["😂", "❤️", "👍", "😮", "😢", "🔥"];

/* ===== Avatar ===== */
function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 60%, 50%)`;
}
function getInitials(name) { return name.slice(0, 2).toUpperCase(); }

/* ===== Time ===== */
function timeAgo(date) {
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 10) return "now";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return new Date(date).toLocaleDateString();
}
function getDateLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ===== Sound ===== */
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === "send") {
      osc.frequency.value = 600;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {}
}

export default function ChatRoom({ folder, onBack, addToast }) {
  const [messages, setMessages] = useState(folder.messages || []);
  const [text, setText] = useState("");
  const [username, setUsername] = useState("");
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showOnlineList, setShowOnlineList] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [copyToast, setCopyToast] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState("");
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinned, setShowPinned] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("chatvault_sound") !== "off");
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const emojiPanelRef = useRef(null);
  const emojiBtnRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const prevMsgCountRef = useRef(messages.length);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0, msgId: null });
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingTimeRef = useRef(0); // FIX: ref for closure
  const audioPlayerRef = useRef(null);
  const isSendingRef = useRef(false); // FIX: prevent poll overwrite during send
  const longPressTimerRef = useRef(null);
  const swipeStateRef = useRef({ msgId: null, x: 0 });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:2000";

  // ===== Username =====
  useEffect(() => {
    const saved = localStorage.getItem("chatvault_username");
    if (saved) setUsername(saved); else setShowUsernameModal(true);
  }, []);

  // ===== Emoji outside click =====
  useEffect(() => {
    const h = (e) => {
      if (emojiPanelRef.current && !emojiPanelRef.current.contains(e.target) &&
          emojiBtnRef.current && !emojiBtnRef.current.contains(e.target)) setShowEmojiPicker(false);
    };
    if (showEmojiPicker) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showEmojiPicker]);

  // Close reaction picker on any tap outside
  useEffect(() => {
    if (showReactionPicker) {
      const h = () => setShowReactionPicker(null);
      setTimeout(() => document.addEventListener("touchstart", h, { once: true }), 100);
      return () => document.removeEventListener("touchstart", h);
    }
  }, [showReactionPicker]);

  // ===== Scroll =====
  const handleScroll = useCallback(() => {
    const c = messagesContainerRef.current;
    if (!c) return;
    const atBottom = c.scrollHeight - c.scrollTop - c.clientHeight < 100;
    setIsAtBottom(atBottom);
    setShowScrollBtn(!atBottom);
    if (atBottom) setNewMsgCount(0);
  }, []);

  useEffect(() => {
    if (isAtBottom) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    else {
      const diff = messages.length - prevMsgCountRef.current;
      if (diff > 0) setNewMsgCount((p) => p + diff);
    }
    prevMsgCountRef.current = messages.length;
  }, [messages, isAtBottom]);

  // ===== Poll (skip while sending) =====
  const fetchMessages = useCallback(async () => {
    if (isSendingRef.current) return; // FIX: don't overwrite during send
    try {
      const res = await axios.post(`${API_URL}/api/chat/poll`, { password: folder.password });
      if (res.data) {
        const oldLen = prevMsgCountRef.current;
        if (res.data.messages) {
          setMessages(res.data.messages);
          if (soundEnabled && res.data.messages.length > oldLen) {
            const newest = res.data.messages[res.data.messages.length - 1];
            if (newest && newest.sender !== username) playSound("receive");
          }
        }
        if (res.data.typingUsers) setTypingUsers(res.data.typingUsers.filter((u) => u !== username));
        if (res.data.onlineUsers) setOnlineUsers(res.data.onlineUsers);
        if (res.data.pinnedMessages) setPinnedMessages(res.data.pinnedMessages);
      }
    } catch (e) {}
  }, [API_URL, folder.password, username, soundEnabled]);

  // ===== Read receipts =====
  const sendReadReceipts = useCallback(async (msgs) => {
    if (!username) return;
    const ids = msgs.filter((m) => m.sender !== username && !m.deletedAt && (!m.readBy || !m.readBy.some((r) => r.username === username)))
      .map((m) => m._id).filter(Boolean);
    if (ids.length > 0) try { await axios.post(`${API_URL}/api/chat/read`, { password: folder.password, username, messageIds: ids }); } catch (e) {}
  }, [API_URL, folder.password, username]);

  // ===== Heartbeat =====
  useEffect(() => {
    if (!username) return;
    const beat = async () => { try { await axios.post(`${API_URL}/api/chat/heartbeat`, { password: folder.password, username }); } catch (e) {} };
    beat();
    const i = setInterval(beat, 5000);
    return () => clearInterval(i);
  }, [API_URL, folder.password, username]);

  useEffect(() => { const i = setInterval(fetchMessages, 2000); return () => clearInterval(i); }, [fetchMessages]);
  useEffect(() => { if (messages.length > 0 && username) sendReadReceipts(messages); }, [messages, username, sendReadReceipts]);

  const handleSaveUsername = () => {
    const name = usernameInput.trim();
    if (!name) return;
    localStorage.setItem("chatvault_username", name);
    setUsername(name); setShowUsernameModal(false);
    addToast(`Welcome, ${name}! 👋`, "success");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ===== Typing =====
  const sendTypingIndicator = useCallback(async () => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    try { await axios.post(`${API_URL}/api/chat/typing`, { password: folder.password, username }); } catch (e) {}
  }, [API_URL, folder.password, username]);

  const handleInputChange = (e) => { setText(e.target.value); if (e.target.value.trim()) sendTypingIndicator(); };

  // ===== Send text (with send lock) =====
  const handleSend = async () => {
    if (!text.trim()) return;
    const msgText = text;
    setText("");
    isSendingRef.current = true; // FIX: lock polling

    const opt = { _id: `opt_${Date.now()}`, sender: username, text: msgText, timestamp: new Date().toISOString(), readBy: [], reactions: [], replyTo: replyTo || null, type: "text" };
    setMessages((p) => [...p, opt]);
    setIsAtBottom(true); setNewMsgCount(0);
    if (soundEnabled) playSound("send");

    const data = { password: folder.password, sender: username, text: msgText };
    if (replyTo) data.replyTo = { messageId: replyTo._id, sender: replyTo.sender, text: replyTo.text };
    setReplyTo(null);

    try {
      const res = await axios.post(`${API_URL}/api/chat/message`, data);
      if (res.data?.folder) setMessages(res.data.folder.messages);
    } catch (err) { addToast("Failed to send", "error"); }
    finally { isSendingRef.current = false; } // FIX: unlock
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleEmojiClick = (emoji) => { setText((p) => p + emoji); inputRef.current?.focus(); };

  // ===== Voice recording (FIX: use ref for duration) =====
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Try mp4 first (Safari), fall back to webm
      const mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 
                        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result;
          const duration = recordingTimeRef.current; // FIX: use ref, not state
          isSendingRef.current = true;
          try {
            const res = await axios.post(`${API_URL}/api/chat/message`, {
              password: folder.password, sender: username,
              type: "voice", audioData: base64, audioDuration: duration
            });
            if (res.data?.folder) setMessages(res.data.folder.messages);
            if (soundEnabled) playSound("send");
          } catch (err) { addToast("Failed to send voice", "error"); }
          finally { isSendingRef.current = false; }
        };
        reader.readAsDataURL(blob);
        setRecordingTime(0);
        recordingTimeRef.current = 0;
      };

      recorder.start(100); // collect data every 100ms for reliability
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      recordingTimeRef.current = 0;
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(recordingTimeRef.current);
        if (recordingTimeRef.current >= 30) stopRecording();
      }, 1000);
    } catch (err) { addToast("Microphone access denied", "error"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") mediaRecorderRef.current.stop();
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
  };

  // ===== Audio playback (FIX: better error handling) =====
  const playAudio = (audioData, msgId) => {
    if (audioPlayerRef.current) { audioPlayerRef.current.pause(); audioPlayerRef.current = null; }
    if (playingAudioId === msgId) { setPlayingAudioId(null); return; } // toggle pause
    try {
      const audio = new Audio(audioData);
      audioPlayerRef.current = audio;
      setPlayingAudioId(msgId);
      audio.onended = () => { setPlayingAudioId(null); audioPlayerRef.current = null; };
      audio.onerror = () => { setPlayingAudioId(null); audioPlayerRef.current = null; addToast("Cannot play audio", "error"); };
      audio.play().catch(() => { setPlayingAudioId(null); addToast("Cannot play audio", "error"); });
    } catch (e) { addToast("Cannot play audio", "error"); }
  };

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); setShowScrollBtn(false); setNewMsgCount(0); setIsAtBottom(true); };

  const handleCopyMessage = (msgText) => {
    navigator.clipboard.writeText(msgText).then(() => { setCopyToast(Date.now()); setTimeout(() => setCopyToast(null), 1500); });
  };

  // ===== Reactions =====
  const handleReaction = async (msgId, emoji = "❤️") => {
    setShowReactionPicker(null);
    try { const res = await axios.post(`${API_URL}/api/chat/react`, { password: folder.password, username, messageId: msgId, emoji }); if (res.data?.folder) setMessages(res.data.folder.messages); } catch (e) {}
  };

  // ===== Delete =====
  const handleDelete = async (msgId) => {
    try { const res = await axios.post(`${API_URL}/api/chat/delete`, { password: folder.password, username, messageId: msgId }); if (res.data?.folder) setMessages(res.data.folder.messages); addToast("Deleted", "info"); } catch (e) { addToast("Failed", "error"); }
  };

  // ===== Edit =====
  const startEditing = (msg) => { setEditingMsgId(msg._id); setEditText(msg.text); };
  const cancelEditing = () => { setEditingMsgId(null); setEditText(""); };
  const saveEdit = async () => {
    if (!editText.trim()) return;
    try { const res = await axios.post(`${API_URL}/api/chat/edit`, { password: folder.password, username, messageId: editingMsgId, newText: editText }); if (res.data?.folder) setMessages(res.data.folder.messages); } catch (e) { addToast("Failed", "error"); }
    cancelEditing();
  };

  // ===== Pin =====
  const handlePin = async (msgId) => {
    try { const res = await axios.post(`${API_URL}/api/chat/pin`, { password: folder.password, messageId: msgId }); if (res.data?.folder) setMessages(res.data.folder.messages); } catch (e) { addToast(e.response?.data?.message || "Failed", "error"); }
  };

  const toggleSound = () => { const n = !soundEnabled; setSoundEnabled(n); localStorage.setItem("chatvault_sound", n ? "on" : "off"); };

  // ===== Touch handlers: Swipe-to-reply + long-press-to-react =====
  const handleTouchStart = (e, msg) => {
    if (msg.deletedAt) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now(), msgId: msg._id };
    swipeStateRef.current = { msgId: null, x: 0 };

    // Start long-press timer for reactions (500ms)
    longPressTimerRef.current = setTimeout(() => {
      setShowReactionPicker(msg._id);
      touchStartRef.current.msgId = null; // cancel swipe
    }, 500);
  };

  const handleTouchMove = (e, msg) => {
    const start = touchStartRef.current;
    if (!start.msgId || start.msgId !== msg._id) return;

    const dx = e.touches[0].clientX - start.x;
    const dy = Math.abs(e.touches[0].clientY - start.y);

    // Cancel long-press on any movement
    clearTimeout(longPressTimerRef.current);

    // Ignore vertical scrolls
    if (dy > 20) { swipeStateRef.current = { msgId: null, x: 0 }; return; }

    // Right swipe only
    if (dx > 5) {
      e.preventDefault(); // prevent scroll
      swipeStateRef.current = { msgId: msg._id, x: Math.min(dx, 80) };
      // Force re-render for swipe visual
      const row = e.currentTarget;
      row.style.transform = `translateX(${Math.min(dx, 80)}px)`;
      row.style.transition = "none";
    }
  };

  const handleTouchEnd = (e, msg) => {
    clearTimeout(longPressTimerRef.current);
    const row = e.currentTarget;
    row.style.transform = "";
    row.style.transition = "transform 0.2s ease";

    if (swipeStateRef.current.x > 40) {
      // Trigger reply
      setReplyTo(msg);
      inputRef.current?.focus();
    }
    swipeStateRef.current = { msgId: null, x: 0 };
  };

  // ===== Helpers =====
  const getReadCount = (msg) => msg.readBy ? msg.readBy.filter((r) => r.username !== msg.sender).length : 0;
  const getReactions = (msg) => {
    if (!msg.reactions || !msg.reactions.length) return null;
    const g = {}; msg.reactions.forEach((r) => { g[r.emoji] = (g[r.emoji] || 0) + 1; }); return g;
  };
  const shouldShowDate = (msgs, idx) => idx === 0 || new Date(msgs[idx].timestamp).toDateString() !== new Date(msgs[idx - 1].timestamp).toDateString();

  // ===== USERNAME MODAL =====
  if (showUsernameModal) {
    return (
      <div className="username-overlay">
        <div className="username-modal">
          <div className="modal-icon">👤</div>
          <h3>What's your name?</h3>
          <p>This will be shown next to your messages</p>
          <div className="input-group" style={{ marginBottom: "1rem" }}>
            <input type="text" className="styled-input" placeholder="Enter your name..." value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSaveUsername()} autoFocus id="username-input" />
          </div>
          <button className="btn btn-primary" onClick={handleSaveUsername} disabled={!usernameInput.trim()} id="save-username-btn">Let's Chat ✨</button>
        </div>
      </div>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <div className="chat-container">
      {copyToast && <div className="copy-toast" key={copyToast}>Copied ✓</div>}

      {/* Header */}
      <div className="chat-header">
        <button className="chat-back-btn" onClick={onBack} id="back-btn">←</button>
        <div className="chat-header-info">
          <div className="chat-room-name">🔐 {folder.password}</div>
          <div className="chat-room-status">
            <span className="status-dot"></span>
            <span className="online-count" onClick={() => setShowOnlineList(!showOnlineList)} style={{ cursor: "pointer" }}>
              {onlineUsers.length} online
            </span>
          </div>
        </div>
        <button className="header-icon-btn" onClick={toggleSound} title={soundEnabled ? "Mute" : "Unmute"}>{soundEnabled ? "🔊" : "🔇"}</button>
      </div>

      {/* Online dropdown */}
      {showOnlineList && (
        <div className="online-dropdown">
          <div className="online-dropdown-title">Online Members</div>
          {onlineUsers.map((u, i) => (
            <div key={i} className="online-user-item">
              <div className="avatar-tiny" style={{ background: getAvatarColor(u) }}>{getInitials(u)}</div>
              <span>{u}</span>
              <span className="online-dot-green">●</span>
            </div>
          ))}
          {onlineUsers.length === 0 && <div className="online-user-item" style={{ color: "var(--text-muted)" }}>No one online</div>}
        </div>
      )}

      {/* Pinned banner */}
      {pinnedMessages.length > 0 && (
        <div className="pinned-banner" onClick={() => setShowPinned(!showPinned)}>
          <span>📌 {pinnedMessages.length} pinned</span>
          <span className="pinned-toggle">{showPinned ? "▲" : "▼"}</span>
        </div>
      )}
      {showPinned && pinnedMessages.length > 0 && (
        <div className="pinned-list">
          {pinnedMessages.map((pm) => (
            <div key={pm._id} className="pinned-item">
              <span className="pinned-sender">{pm.sender}:</span>
              <span className="pinned-text">{pm.text?.length > 60 ? pm.text.slice(0, 60) + "…" : pm.text}</span>
              <button className="pinned-unpin" onClick={() => handlePin(pm._id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages" ref={messagesContainerRef} onScroll={handleScroll}>
        {messages.length === 0 ? (
          <div className="chat-messages-empty">
            <div className="empty-icon">💭</div>
            <div className="empty-text">No messages yet</div>
            <div className="empty-subtext">Be the first to say something!</div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isSent = msg.sender === username;
            const readCount = getReadCount(msg);
            const reactions = getReactions(msg);
            const isDeleted = !!msg.deletedAt;
            const isEditing = editingMsgId === msg._id;

            return (
              <React.Fragment key={msg._id || i}>
                {shouldShowDate(messages, i) && (
                  <div className="date-separator"><span>{getDateLabel(msg.timestamp)}</span></div>
                )}

                <div
                  className={`message-row ${isSent ? "sent" : "received"}`}
                  onTouchStart={(e) => handleTouchStart(e, msg)}
                  onTouchMove={(e) => handleTouchMove(e, msg)}
                  onTouchEnd={(e) => handleTouchEnd(e, msg)}
                >
                  {/* Avatar */}
                  {!isSent && <div className="avatar-sm" style={{ background: getAvatarColor(msg.sender) }}>{getInitials(msg.sender)}</div>}

                  <div className="message-bubble-wrap">
                    <div className="message-bubble" onClick={() => !isDeleted && !isEditing && handleCopyMessage(msg.text)}>
                      {isDeleted ? (
                        <div className="message-deleted">🚫 This message was deleted</div>
                      ) : (
                        <>
                          {msg.replyTo && (
                            <div className="quoted-reply">
                              <span className="quoted-sender">{msg.replyTo.sender}</span>
                              <span className="quoted-text">{msg.replyTo.text?.length > 60 ? msg.replyTo.text.slice(0, 60) + "…" : msg.replyTo.text}</span>
                            </div>
                          )}
                          {!isSent && <div className="message-sender">{msg.sender}</div>}

                          {msg.type === "voice" ? (
                            <div className="voice-message">
                              <button className="voice-play-btn" onClick={(e) => { e.stopPropagation(); playAudio(msg.audioData, msg._id); }}>
                                {playingAudioId === msg._id ? "⏸" : "▶"}
                              </button>
                              <div className="voice-waveform">
                                {[...Array(16)].map((_, j) => (
                                  <div key={j} className={`waveform-bar ${playingAudioId === msg._id ? "playing" : ""}`}
                                    style={{ height: `${Math.random() * 16 + 6}px`, animationDelay: `${j * 0.05}s` }} />
                                ))}
                              </div>
                              <span className="voice-duration">{msg.audioDuration || 0}s</span>
                              <span className="message-meta-inline">
                                <span className="meta-time">{timeAgo(msg.timestamp)}</span>
                                {isSent && (
                                  <span className="meta-ticks">
                                    {readCount > 0 ? (<><span className="tick-read">✓✓</span>{readCount > 1 && <sup className="tick-count">{readCount}</sup>}</>) : <span className="tick-sent">✓</span>}
                                  </span>
                                )}
                              </span>
                            </div>
                          ) : isEditing ? (
                            <div className="edit-inline">
                              <input type="text" className="edit-input" value={editText} onChange={(e) => setEditText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEditing(); }} autoFocus />
                              <div className="edit-actions">
                                <button className="edit-save" onClick={saveEdit}>✓</button>
                                <button className="edit-cancel" onClick={cancelEditing}>✕</button>
                              </div>
                            </div>
                          ) : (
                            <div className="message-text">
                              {msg.text}
                              {msg.editedAt && <span className="edited-tag">(edited)</span>}
                              <span className="message-meta-inline">
                                <span className="meta-time">{timeAgo(msg.timestamp)}</span>
                                {isSent && (
                                  <span className="meta-ticks">
                                    {readCount > 0 ? (<><span className="tick-read">✓✓</span>{readCount > 1 && <sup className="tick-count">{readCount}</sup>}</>) : <span className="tick-sent">✓</span>}
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {msg.pinned && !isDeleted && <div className="pinned-indicator">📌</div>}

                    {/* Reactions - FIX: proper spacing */}
                    {reactions && (
                      <div className="reactions-row">
                        {Object.entries(reactions).map(([emoji, count]) => (
                          <button key={emoji} className="reaction-badge" onClick={() => handleReaction(msg._id, emoji)}>
                            {emoji}{count > 1 && <span>{count}</span>}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Desktop hover actions */}
                    {!isDeleted && !isEditing && (
                      <div className={`message-actions ${isSent ? "sent-actions" : ""}`}>
                        <button className="msg-action-btn" onClick={(e) => { e.stopPropagation(); setReplyTo(msg); inputRef.current?.focus(); }} title="Reply">↩</button>
                        <button className="msg-action-btn" onClick={(e) => { e.stopPropagation(); setShowReactionPicker(showReactionPicker === msg._id ? null : msg._id); }} title="React">😊</button>
                        <button className="msg-action-btn" onClick={(e) => { e.stopPropagation(); handlePin(msg._id); }} title={msg.pinned ? "Unpin" : "Pin"}>📌</button>
                        {isSent && <button className="msg-action-btn" onClick={(e) => { e.stopPropagation(); startEditing(msg); }} title="Edit">✏️</button>}
                        {isSent && <button className="msg-action-btn" onClick={(e) => { e.stopPropagation(); handleDelete(msg._id); }} title="Delete">🗑</button>}
                      </div>
                    )}

                    {/* Reaction picker (works on both mobile long-press + desktop hover) */}
                    {showReactionPicker === msg._id && (
                      <div className="quick-reaction-picker">
                        {QUICK_REACTIONS.map((em) => (
                          <button key={em} className="quick-reaction-item" onClick={() => handleReaction(msg._id, em)}>{em}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll */}
      {showScrollBtn && (
        <button className="scroll-to-bottom" onClick={scrollToBottom} id="scroll-bottom-btn">
          ↓{newMsgCount > 0 && <span className="scroll-badge">{newMsgCount}</span>}
        </button>
      )}

      {/* Typing */}
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          <div className="typing-dots"><span></span><span></span><span></span></div>
          <span className="typing-text">{typingUsers.length === 1 ? `${typingUsers[0]} is typing` : `${typingUsers.join(", ")} are typing`}</span>
        </div>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="reply-preview-bar">
          <div className="reply-preview-content">
            <span className="reply-preview-label">Replying to {replyTo.sender}</span>
            <span className="reply-preview-text">{replyTo.text?.length > 50 ? replyTo.text.slice(0, 50) + "…" : replyTo.text}</span>
          </div>
          <button className="reply-preview-close" onClick={() => setReplyTo(null)}>✕</button>
        </div>
      )}

      {/* Input */}
      <div className="chat-input-area">
        <button className="emoji-btn" ref={emojiBtnRef} onClick={() => setShowEmojiPicker((p) => !p)} id="emoji-toggle-btn">😊</button>

        {isRecording ? (
          <div className="recording-bar">
            <div className="recording-dot"></div>
            <span className="recording-time">{recordingTime}s</span>
            <div className="recording-waves"><span></span><span></span><span></span></div>
            <button className="recording-stop" onClick={stopRecording}>⬛</button>
          </div>
        ) : (
          <>
            <input ref={inputRef} type="text" className="chat-text-input" placeholder="Type a message..."
              value={text} onChange={handleInputChange} onKeyDown={handleKeyDown} autoFocus id="message-input" />
            {text.trim() ? (
              <button className="send-btn" onClick={handleSend} id="send-btn">➤</button>
            ) : (
              <button className="mic-btn" onClick={startRecording} id="mic-btn">🎤</button>
            )}
          </>
        )}

        {showEmojiPicker && (
          <div className="emoji-panel" ref={emojiPanelRef}>
            <div className="emoji-panel-header">Pick emojis</div>
            <div className="emoji-grid">
              {EMOJI_LIST.map((emoji, i) => (<button key={i} className="emoji-item" onClick={() => handleEmojiClick(emoji)}>{emoji}</button>))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}