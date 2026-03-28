import React, { useState } from "react";
import { post } from "../api/client";

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
      const res = await post("/api/chat/find", { password });
      addToast("Welcome to the room!", "success");
      onFound(res);
    } catch (err) {
      triggerShake();
      addToast(err.message || "Room not found. Check the password.", "error");
    } finally {
      setLoading(false);
    }
  };



  return (
    <form className="glass-card" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
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
          disabled={loading}
          id="join-room-input"
        />
      </div>
      <button
        type="submit"
        className="btn btn-secondary"
        disabled={loading}
        id="join-room-btn"
      >
        {loading ? <div className="spinner"></div> : "🔓 Enter Room"}
      </button>
    </form>
  );
}