import React, { useState } from "react";
import axios from "axios";

export default function SearchFolder({ onFound, addToast }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleSearch = async () => {
    if (!password.trim()) {
      triggerShake();
      addToast("Enter a password to join", "error");
      return;
    }

    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:2000";
      const res = await axios.post(`${API_URL}/api/chat/find`, { password });
      addToast("Welcome to the room!", "success");
      onFound(res.data);
    } catch (err) {
      triggerShake();
      addToast("Room not found. Check the password.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="glass-card">
      <div className="card-header">
        <div className="card-icon search">🔑</div>
        <h2 className="card-title">Join a Room</h2>
      </div>
      <div className="input-group">
        <input
          type="text"
          className={`styled-input ${shake ? "shake" : ""}`}
          placeholder="Enter room password..."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          id="join-room-input"
        />
      </div>
      <button
        className="btn btn-secondary"
        onClick={handleSearch}
        disabled={loading}
        id="join-room-btn"
      >
        {loading ? <div className="spinner"></div> : "🔓 Enter Room"}
      </button>
    </div>
  );
}