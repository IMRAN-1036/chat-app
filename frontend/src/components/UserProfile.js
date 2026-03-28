import React, { useState } from "react";

function getAvatarColor(n) {
  let h = 0;
  for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
  return `hsl(${Math.abs(h) % 360}, 60%, 50%)`;
}

function getInitials(n) {
  return n.slice(0, 2).toUpperCase();
}

export default function UserProfile({ username, onClose, onSetStatus }) {
  const [statusInput, setStatusInput] = useState("");
  const [showStatusForm, setShowStatusForm] = useState(false);

  const handleSetStatus = () => {
    if (statusInput.trim()) {
      onSetStatus(statusInput);
      setStatusInput("");
      setShowStatusForm(false);
    }
  };

  return (
    <div className="user-profile-overlay" onClick={onClose}>
      <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="profile-close" onClick={onClose}>✕</button>
        
        <div className="profile-header">
          <div className="profile-avatar" style={{ background: getAvatarColor(username) }}>
            {getInitials(username)}
          </div>
          <h2 className="profile-name">{username}</h2>
          <p className="profile-label">ChatVault Member</p>
        </div>

        <div className="profile-section">
          <h3>Status</h3>
          {!showStatusForm ? (
            <button 
              className="profile-action-btn"
              onClick={() => setShowStatusForm(true)}
            >
              ✨ Set Status
            </button>
          ) : (
            <div className="profile-status-form">
              <input
                type="text"
                className="status-input"
                placeholder="What's on your mind?"
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                maxLength="50"
              />
              <div className="status-form-actions">
                <button className="btn-small" onClick={handleSetStatus}>Save</button>
                <button className="btn-small-secondary" onClick={() => setShowStatusForm(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        <div className="profile-section">
          <h3>Preferences</h3>
          <p className="profile-info">🔐 Your messages are encrypted</p>
          <p className="profile-info">📱 Mobile-friendly interface</p>
        </div>
      </div>
    </div>
  );
}
