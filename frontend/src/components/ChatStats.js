import React, { useState, useEffect } from "react";
import apiClient from "../api/client";

export default function ChatStats({ folder, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await apiClient.post(`/api/chat/stats`, {
        password: folder.password
      });
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stats-panel-overlay" onClick={onClose}>
      <div className="stats-panel" onClick={(e) => e.stopPropagation()}>
        <div className="stats-header">
          <h2>📊 Chat Statistics</h2>
          <button className="panel-close" onClick={onClose}>✕</button>
        </div>

        <div className="stats-content">
          {loading ? (
            <div className="loading">Loading statistics...</div>
          ) : stats ? (
            <>
              <div className="stat-card">
                <div className="stat-label">Total Messages</div>
                <div className="stat-value">{stats.totalMessages}</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Active Users</div>
                <div className="stat-value">{stats.totalUsers}</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Average Message Length</div>
                <div className="stat-value">{stats.averageMessageLength} chars</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Files Shared</div>
                <div className="stat-value">{stats.filesShared}</div>
              </div>

              <div className="stat-section">
                <h3>Messages by Type</h3>
                <div className="stat-breakdown">
                  <div className="breakdown-item">
                    <span>Text:</span>
                    <span>{stats.messagesByType.text}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Voice:</span>
                    <span>{stats.messagesByType.voice}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Images:</span>
                    <span>{stats.messagesByType.image}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Files:</span>
                    <span>{stats.messagesByType.file}</span>
                  </div>
                </div>
              </div>

              <div className="stat-section">
                <h3>Top Contributors</h3>
                <div className="stat-breakdown">
                  {Object.entries(stats.messagesByUser)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([user, count]) => (
                      <div key={user} className="breakdown-item">
                        <span>{user}</span>
                        <span>{count} messages</span>
                      </div>
                    ))}
                </div>
              </div>

              {stats.topEmojis && stats.topEmojis.length > 0 && (
                <div className="stat-section">
                  <h3>Top Reactions</h3>
                  <div className="emoji-list">
                    {stats.topEmojis.map(({ emoji, count }) => (
                      <div key={emoji} className="emoji-item">
                        <span className="emoji">{emoji}</span>
                        <span className="count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="error">Failed to load statistics</div>
          )}
        </div>
      </div>
    </div>
  );
}
