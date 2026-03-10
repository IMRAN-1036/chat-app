import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

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

function getAvatarColor(n) { let h = 0; for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h); return `hsl(${Math.abs(h) % 360}, 60%, 50%)`; }
function getInitials(n) { return n.slice(0, 2).toUpperCase(); }

function timeAgo(date) {
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 10) return "now"; if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  return new Date(date).toLocaleDateString();
}
function getDateLabel(date) {
  const d = new Date(date), today = new Date(), yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = type === "send" ? 600 : 800;
    gain.gain.setValueAtTime(type === "send" ? 0.08 : 0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (type === "send" ? 0.12 : 0.2));
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + (type === "send" ? 0.12 : 0.2));
  } catch (e) {}
}

/* ===== Swipeable Row (touch + mouse drag) ===== */
function SwipeableRow({ children, className, onSwipeReply, onLongPress, disabled }) {
  const rowRef = useRef(null);
  const stateRef = useRef({ startX: 0, startY: 0, dragging: false, longTimer: null, isMouse: false });

  useEffect(() => {
    const el = rowRef.current;
    if (!el || disabled) return;

    const start = (x, y, isMouse) => {
      stateRef.current = { startX: x, startY: y, dragging: false, longTimer: null, isMouse };
      stateRef.current.longTimer = setTimeout(() => {
        stateRef.current.dragging = false;
        if (onLongPress) onLongPress();
      }, 500);
    };

    const move = (x, y, e) => {
      const s = stateRef.current;
      const dx = x - s.startX;
      const dy = Math.abs(y - s.startY);
      if (s.longTimer && (Math.abs(dx) > 5 || dy > 5)) { clearTimeout(s.longTimer); s.longTimer = null; }
      if (dy > 15 && !s.dragging) return;
      if (dx > 8) {
        s.dragging = true;
        if (e && e.cancelable) { try { e.preventDefault(); } catch (err) {} }
        el.style.transform = `translateX(${Math.min(dx, 80)}px)`;
        el.style.transition = "none";
      }
    };

    const end = () => {
      if (stateRef.current.longTimer) clearTimeout(stateRef.current.longTimer);
      const wasDragging = stateRef.current.dragging;
      const px = parseInt(el.style.transform?.replace(/[^0-9.-]/g, "")) || 0;
      el.style.transform = ""; el.style.transition = "transform 0.2s ease";
      if (wasDragging && px > 40 && onSwipeReply) onSwipeReply();
      stateRef.current.dragging = false;
      // Remove mouse listeners after drag
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    // Touch
    const onTouchStart = (e) => start(e.touches[0].clientX, e.touches[0].clientY, false);
    const onTouchMove = (e) => move(e.touches[0].clientX, e.touches[0].clientY, e);
    const onTouchEnd = () => end();

    // Mouse (for desktop drag)
    const onMouseDown = (e) => {
      if (e.button !== 0) return; // left click only
      start(e.clientX, e.clientY, true);
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };
    const onMouseMove = (e) => { if (stateRef.current.isMouse) move(e.clientX, e.clientY, e); };
    const onMouseUp = () => { if (stateRef.current.isMouse) end(); };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("mousedown", onMouseDown);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [disabled, onSwipeReply, onLongPress]);

  return <div ref={rowRef} className={className}>{children}</div>;
}

/* ===== Main ===== */
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
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
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
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingTimeRef = useRef(0);
  const audioPlayerRef = useRef(null);
  const isSendingRef = useRef(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:2000";

  useEffect(() => { const s = localStorage.getItem("chatvault_username"); if (s) setUsername(s); else setShowUsernameModal(true); }, []);

  useEffect(() => {
    const h = (e) => { if (emojiPanelRef.current && !emojiPanelRef.current.contains(e.target) && emojiBtnRef.current && !emojiBtnRef.current.contains(e.target)) setShowEmojiPicker(false); };
    if (showEmojiPicker) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showEmojiPicker]);

  useEffect(() => {
    if (showReactionPicker) {
      const close = (e) => { if (!e.target.closest(".quick-reaction-picker")) setShowReactionPicker(null); };
      const t = setTimeout(() => { document.addEventListener("touchstart", close); document.addEventListener("mousedown", close); }, 200);
      return () => { clearTimeout(t); document.removeEventListener("touchstart", close); document.removeEventListener("mousedown", close); };
    }
  }, [showReactionPicker]);

  const handleScroll = useCallback(() => {
    const c = messagesContainerRef.current; if (!c) return;
    const atBottom = c.scrollHeight - c.scrollTop - c.clientHeight < 100;
    setIsAtBottom(atBottom); setShowScrollBtn(!atBottom); if (atBottom) setNewMsgCount(0);
  }, []);

  useEffect(() => {
    if (isAtBottom) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    else { const d = messages.length - prevMsgCountRef.current; if (d > 0) setNewMsgCount((p) => p + d); }
    prevMsgCountRef.current = messages.length;
  }, [messages, isAtBottom]);

  const fetchMessages = useCallback(async () => {
    if (isSendingRef.current) return;
    try {
      const res = await axios.post(`${API_URL}/api/chat/poll`, { password: folder.password });
      if (res.data) {
        const oldLen = prevMsgCountRef.current;
        if (res.data.messages) { setMessages(res.data.messages); if (soundEnabled && res.data.messages.length > oldLen) { const n = res.data.messages[res.data.messages.length - 1]; if (n && n.sender !== username) playSound("receive"); } }
        if (res.data.typingUsers) setTypingUsers(res.data.typingUsers.filter((u) => u !== username));
        if (res.data.onlineUsers) setOnlineUsers(res.data.onlineUsers);
        if (res.data.pinnedMessages) setPinnedMessages(res.data.pinnedMessages);
      }
    } catch (e) {}
  }, [API_URL, folder.password, username, soundEnabled]);

  const sendReadReceipts = useCallback(async (msgs) => {
    if (!username) return;
    const ids = msgs.filter((m) => m.sender !== username && !m.deletedAt && (!m.readBy || !m.readBy.some((r) => r.username === username))).map((m) => m._id).filter(Boolean);
    if (ids.length) try { await axios.post(`${API_URL}/api/chat/read`, { password: folder.password, username, messageIds: ids }); } catch (e) {}
  }, [API_URL, folder.password, username]);

  useEffect(() => { if (!username) return; const b = async () => { try { await axios.post(`${API_URL}/api/chat/heartbeat`, { password: folder.password, username }); } catch (e) {} }; b(); const i = setInterval(b, 5000); return () => clearInterval(i); }, [API_URL, folder.password, username]);
  useEffect(() => { const i = setInterval(fetchMessages, 2000); return () => clearInterval(i); }, [fetchMessages]);
  useEffect(() => { if (messages.length > 0 && username) sendReadReceipts(messages); }, [messages, username, sendReadReceipts]);

  const handleSaveUsername = () => { const n = usernameInput.trim(); if (!n) return; localStorage.setItem("chatvault_username", n); setUsername(n); setShowUsernameModal(false); addToast(`Welcome, ${n}! 👋`, "success"); setTimeout(() => inputRef.current?.focus(), 100); };

  const sendTypingIndicator = useCallback(async () => { const now = Date.now(); if (now - lastTypingSentRef.current < 2000) return; lastTypingSentRef.current = now; try { await axios.post(`${API_URL}/api/chat/typing`, { password: folder.password, username }); } catch (e) {} }, [API_URL, folder.password, username]);
  const handleInputChange = (e) => { setText(e.target.value); if (e.target.value.trim()) sendTypingIndicator(); };

  const handleSend = async () => {
    if (!text.trim()) return;
    const mt = text; setText(""); isSendingRef.current = true;
    setMessages((p) => [...p, { _id: `opt_${Date.now()}`, sender: username, text: mt, timestamp: new Date().toISOString(), readBy: [], reactions: [], replyTo: replyTo || null, type: "text" }]);
    setIsAtBottom(true); setNewMsgCount(0); if (soundEnabled) playSound("send");
    const d = { password: folder.password, sender: username, text: mt };
    if (replyTo) d.replyTo = { messageId: replyTo._id, sender: replyTo.sender, text: replyTo.text };
    setReplyTo(null);
    try { const r = await axios.post(`${API_URL}/api/chat/message`, d); if (r.data?.folder) setMessages(r.data.folder.messages); } catch (e) { addToast("Failed", "error"); }
    finally { isSendingRef.current = false; } inputRef.current?.focus();
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleEmojiClick = (em) => { setText((p) => p + em); inputRef.current?.focus(); };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const rec = new MediaRecorder(stream, { mimeType: mime });
      audioChunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mime });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dur = recordingTimeRef.current; isSendingRef.current = true;
          try { const r = await axios.post(`${API_URL}/api/chat/message`, { password: folder.password, sender: username, type: "voice", audioData: reader.result, audioDuration: dur });
            if (r.data?.folder) setMessages(r.data.folder.messages); if (soundEnabled) playSound("send");
          } catch (e) { addToast("Failed", "error"); } finally { isSendingRef.current = false; }
        }; reader.readAsDataURL(blob);
        setRecordingTime(0); recordingTimeRef.current = 0;
      };
      rec.start(100); mediaRecorderRef.current = rec; setIsRecording(true);
      recordingTimeRef.current = 0; setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => { recordingTimeRef.current += 1; setRecordingTime(recordingTimeRef.current); if (recordingTimeRef.current >= 30) stopRecording(); }, 1000);
    } catch (e) { addToast("Mic denied", "error"); }
  };
  const stopRecording = () => { if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current.stop(); clearInterval(recordingTimerRef.current); setIsRecording(false); };

  const playAudio = (data, id) => {
    if (audioPlayerRef.current) { audioPlayerRef.current.pause(); audioPlayerRef.current = null; }
    if (playingAudioId === id) { setPlayingAudioId(null); return; }
    try { const a = new Audio(data); audioPlayerRef.current = a; setPlayingAudioId(id);
      a.onended = () => { setPlayingAudioId(null); audioPlayerRef.current = null; };
      a.onerror = () => { setPlayingAudioId(null); audioPlayerRef.current = null; };
      a.play().catch(() => setPlayingAudioId(null));
    } catch (e) {}
  };

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); setShowScrollBtn(false); setNewMsgCount(0); setIsAtBottom(true); };
  const handleCopyMessage = (t) => { navigator.clipboard.writeText(t).then(() => { setCopyToast(Date.now()); setTimeout(() => setCopyToast(null), 1500); }); };
  const handleReaction = async (id, em = "❤️") => { setShowReactionPicker(null); try { const r = await axios.post(`${API_URL}/api/chat/react`, { password: folder.password, username, messageId: id, emoji: em }); if (r.data?.folder) setMessages(r.data.folder.messages); } catch (e) {} };
  const handleDelete = async (id) => { try { const r = await axios.post(`${API_URL}/api/chat/delete`, { password: folder.password, username, messageId: id }); if (r.data?.folder) setMessages(r.data.folder.messages); } catch (e) {} };
  const startEditing = (m) => { setEditingMsgId(m._id); setEditText(m.text); };
  const cancelEditing = () => { setEditingMsgId(null); setEditText(""); };
  const saveEdit = async () => { if (!editText.trim()) return; try { const r = await axios.post(`${API_URL}/api/chat/edit`, { password: folder.password, username, messageId: editingMsgId, newText: editText }); if (r.data?.folder) setMessages(r.data.folder.messages); } catch (e) {} cancelEditing(); };
  const handlePin = async (id) => { try { const r = await axios.post(`${API_URL}/api/chat/pin`, { password: folder.password, messageId: id }); if (r.data?.folder) setMessages(r.data.folder.messages); } catch (e) { addToast(e.response?.data?.message || "Failed", "error"); } };
  const toggleSound = () => { const n = !soundEnabled; setSoundEnabled(n); localStorage.setItem("chatvault_sound", n ? "on" : "off"); };

  const getReadCount = (m) => m.readBy ? m.readBy.filter((r) => r.username !== m.sender).length : 0;
  const getReactions = (m) => { if (!m.reactions?.length) return null; const g = {}; m.reactions.forEach((r) => { g[r.emoji] = (g[r.emoji] || 0) + 1; }); return g; };
  const shouldShowDate = (ms, i) => i === 0 || new Date(ms[i].timestamp).toDateString() !== new Date(ms[i - 1].timestamp).toDateString();
  const triggerReply = useCallback((m) => { setReplyTo(m); setTimeout(() => inputRef.current?.focus(), 50); }, []);

  if (showUsernameModal) {
    return (
      <div className="username-overlay"><div className="username-modal">
        <div className="modal-icon">👤</div><h3>What's your name?</h3><p>This will be shown next to your messages</p>
        <div className="input-group" style={{ marginBottom: "1rem" }}><input type="text" className="styled-input" placeholder="Enter your name..." value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSaveUsername()} autoFocus id="username-input" /></div>
        <button className="btn btn-primary" onClick={handleSaveUsername} disabled={!usernameInput.trim()} id="save-username-btn">Let's Chat ✨</button>
      </div></div>
    );
  }

  return (
    <div className="chat-container">
      {copyToast && <div className="copy-toast" key={copyToast}>Copied ✓</div>}

      <div className="chat-header">
        <button className="chat-back-btn" onClick={onBack}>←</button>
        <div className="chat-header-info">
          <div className="chat-room-name">🔐 {folder.password}</div>
          <div className="chat-room-status">
            <span className="status-dot"></span>
            <span className="online-count" onClick={() => setShowOnlineList(!showOnlineList)}>{onlineUsers.length} online</span>
          </div>
        </div>
        <button className="header-icon-btn" onClick={toggleSound}>{soundEnabled ? "🔊" : "🔇"}</button>
      </div>

      {showOnlineList && (
        <div className="online-dropdown">
          <div className="online-dropdown-title">Online Members</div>
          {onlineUsers.map((u, i) => (<div key={i} className="online-user-item"><div className="avatar-tiny" style={{ background: getAvatarColor(u) }}>{getInitials(u)}</div><span>{u}</span><span className="online-dot-green">●</span></div>))}
          {!onlineUsers.length && <div className="online-user-item" style={{ color: "var(--text-muted)" }}>No one online</div>}
        </div>
      )}

      {pinnedMessages.length > 0 && <div className="pinned-banner" onClick={() => setShowPinned(!showPinned)}><span>📌 {pinnedMessages.length} pinned</span><span className="pinned-toggle">{showPinned ? "▲" : "▼"}</span></div>}
      {showPinned && pinnedMessages.length > 0 && (
        <div className="pinned-list">{pinnedMessages.map((pm) => (<div key={pm._id} className="pinned-item"><span className="pinned-sender">{pm.sender}:</span><span className="pinned-text">{pm.text?.length > 60 ? pm.text.slice(0, 60) + "…" : pm.text}</span><button className="pinned-unpin" onClick={() => handlePin(pm._id)}>✕</button></div>))}</div>
      )}

      <div className="chat-messages" ref={messagesContainerRef} onScroll={handleScroll}>
        {!messages.length ? (
          <div className="chat-messages-empty"><div className="empty-icon">💭</div><div className="empty-text">No messages yet</div><div className="empty-subtext">Be the first to say something!</div></div>
        ) : messages.map((msg, i) => {
          const isSent = msg.sender === username;
          const rc = getReadCount(msg);
          const rxns = getReactions(msg);
          const isDel = !!msg.deletedAt;
          const isEdit = editingMsgId === msg._id;
          const isHovered = hoveredMsgId === msg._id;

          return (
            <React.Fragment key={msg._id || i}>
              {shouldShowDate(messages, i) && <div className="date-separator"><span>{getDateLabel(msg.timestamp)}</span></div>}

              <SwipeableRow
                className={`message-row ${isSent ? "sent" : "received"}`}
                onSwipeReply={() => triggerReply(msg)}
                onLongPress={() => !isDel && setShowReactionPicker(msg._id)}
                disabled={isDel}
              >
                {!isSent && <div className="avatar-sm" style={{ background: getAvatarColor(msg.sender) }}>{getInitials(msg.sender)}</div>}

                <div className="message-bubble-wrap"
                  onMouseEnter={() => setHoveredMsgId(msg._id)}
                  onMouseLeave={() => { setHoveredMsgId(null); setShowReactionPicker(null); }}
                >
                  <div className="message-bubble" onClick={() => !isDel && !isEdit && handleCopyMessage(msg.text)}>
                    {isDel ? <div className="message-deleted">🚫 This message was deleted</div> : (
                      <>
                        {msg.replyTo && <div className="quoted-reply"><span className="quoted-sender">{msg.replyTo.sender}</span><span className="quoted-text">{msg.replyTo.text?.length > 60 ? msg.replyTo.text.slice(0, 60) + "…" : msg.replyTo.text}</span></div>}
                        {!isSent && <div className="message-sender">{msg.sender}</div>}

                        {msg.type === "voice" ? (
                          <div className="voice-message">
                            <button className="voice-play-btn" onClick={(e) => { e.stopPropagation(); playAudio(msg.audioData, msg._id); }}>{playingAudioId === msg._id ? "⏸" : "▶"}</button>
                            <div className="voice-waveform">{[...Array(16)].map((_, j) => <div key={j} className={`waveform-bar ${playingAudioId === msg._id ? "playing" : ""}`} style={{ height: `${Math.random() * 16 + 6}px`, animationDelay: `${j * 0.05}s` }} />)}</div>
                            <span className="voice-duration">{msg.audioDuration || 0}s</span>
                            <span className="message-meta-inline"><span className="meta-time">{timeAgo(msg.timestamp)}</span>{isSent && <span className="meta-ticks">{rc > 0 ? <><span className="tick-read">✓✓</span>{rc > 1 && <sup className="tick-count">{rc}</sup>}</> : <span className="tick-sent">✓</span>}</span>}</span>
                          </div>
                        ) : isEdit ? (
                          <div className="edit-inline">
                            <input type="text" className="edit-input" value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEditing(); }} autoFocus />
                            <div className="edit-actions"><button className="edit-save" onClick={saveEdit}>✓</button><button className="edit-cancel" onClick={cancelEditing}>✕</button></div>
                          </div>
                        ) : (
                          <div className="message-text">
                            {msg.text}{msg.editedAt && <span className="edited-tag">(edited)</span>}
                            <span className="message-meta-inline"><span className="meta-time">{timeAgo(msg.timestamp)}</span>{isSent && <span className="meta-ticks">{rc > 0 ? <><span className="tick-read">✓✓</span>{rc > 1 && <sup className="tick-count">{rc}</sup>}</> : <span className="tick-sent">✓</span>}</span>}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {msg.pinned && !isDel && <div className="pinned-indicator">📌</div>}

                  {rxns && <div className="reactions-row">{Object.entries(rxns).map(([em, c]) => <button key={em} className="reaction-badge" onClick={() => handleReaction(msg._id, em)}>{em}{c > 1 && <span>{c}</span>}</button>)}</div>}

                  {/* Action toolbar — appears ABOVE the bubble on hover */}
                  {isHovered && !isDel && !isEdit && (
                    <div className="msg-toolbar">
                      <button onClick={(e) => { e.stopPropagation(); triggerReply(msg); }} title="Reply">↩</button>
                      <button onClick={(e) => { e.stopPropagation(); setShowReactionPicker(msg._id); }} title="React">😊</button>
                      <button onClick={(e) => { e.stopPropagation(); handlePin(msg._id); }} title={msg.pinned ? "Unpin" : "Pin"}>📌</button>
                      {isSent && <button onClick={(e) => { e.stopPropagation(); startEditing(msg); }} title="Edit">✏️</button>}
                      {isSent && <button onClick={(e) => { e.stopPropagation(); handleDelete(msg._id); }} title="Delete">🗑</button>}
                    </div>
                  )}

                  {showReactionPicker === msg._id && (
                    <div className="quick-reaction-picker">{QUICK_REACTIONS.map((em) => <button key={em} className="quick-reaction-item" onClick={() => handleReaction(msg._id, em)}>{em}</button>)}</div>
                  )}
                </div>
              </SwipeableRow>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {showScrollBtn && <button className="scroll-to-bottom" onClick={scrollToBottom}>↓{newMsgCount > 0 && <span className="scroll-badge">{newMsgCount}</span>}</button>}

      {typingUsers.length > 0 && <div className="typing-indicator"><div className="typing-dots"><span></span><span></span><span></span></div><span className="typing-text">{typingUsers.length === 1 ? `${typingUsers[0]} is typing` : `${typingUsers.join(", ")} are typing`}</span></div>}

      {replyTo && (
        <div className="reply-preview-bar">
          <div className="reply-preview-content"><span className="reply-preview-label">Replying to {replyTo.sender}</span><span className="reply-preview-text">{replyTo.text?.length > 50 ? replyTo.text.slice(0, 50) + "…" : replyTo.text}</span></div>
          <button className="reply-preview-close" onClick={() => setReplyTo(null)}>✕</button>
        </div>
      )}

      <div className="chat-input-area">
        <button className="emoji-btn" ref={emojiBtnRef} onClick={() => setShowEmojiPicker((p) => !p)}>😊</button>
        {isRecording ? (
          <div className="recording-bar"><div className="recording-dot"></div><span className="recording-time">{recordingTime}s</span><div className="recording-waves"><span></span><span></span><span></span></div><button className="recording-stop" onClick={stopRecording}>⬛</button></div>
        ) : (
          <>
            <input ref={inputRef} type="text" className="chat-text-input" placeholder="Type a message..." value={text} onChange={handleInputChange} onKeyDown={handleKeyDown} autoFocus />
            {text.trim() ? <button className="send-btn" onClick={handleSend}>➤</button> : <button className="mic-btn" onClick={startRecording}>🎤</button>}
          </>
        )}
        {showEmojiPicker && <div className="emoji-panel" ref={emojiPanelRef}><div className="emoji-panel-header">Pick emojis</div><div className="emoji-grid">{EMOJI_LIST.map((em, i) => <button key={i} className="emoji-item" onClick={() => handleEmojiClick(em)}>{em}</button>)}</div></div>}
      </div>
    </div>
  );
}