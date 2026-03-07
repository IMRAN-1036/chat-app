import React, { useState } from "react";
import axios from "axios";

export default function CreateFolder({ addToast }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleCreate = async () => {
    if (!password.trim()) {
      triggerShake();
      addToast("Please enter a password", "error");
      return;
    }

    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:2000";
      await axios.post(`${API_URL}/api/chat/create`, { password });
      addToast("Room created successfully!", "success");
      setPassword("");
    } catch (err) {
      if (err.response && err.response.data) {
        addToast(err.response.data.message, "error");
      } else {
        addToast("Something went wrong. Try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleCreate();
  };

  return (
    <div className="glass-card">
      <div className="card-header">
        <div className="card-icon create">🛡️</div>
        <h2 className="card-title">Create a Room</h2>
      </div>
      <div className="input-group">
        <input
          type="text"
          className={`styled-input ${shake ? "shake" : ""}`}
          placeholder="Choose a secret password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          id="create-room-input"
        />
      </div>
      <button
        className="btn btn-primary"
        onClick={handleCreate}
        disabled={loading}
        id="create-room-btn"
      >
        {loading ? <div className="spinner"></div> : "🚀 Create Room"}
      </button>
    </div>
  );
}
