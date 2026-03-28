import React, { useState, useEffect } from "react";
import apiClient from "../api/client";

export default function BookmarksPanel({ folder, username, onClose }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const res = await apiClient.post(`/api/chat/bookmarks`, {
        password: folder.password,
        username
      });
      setBookmarks(res.data.bookmarks || []);
    } catch (err) {
      console.error("Failed to fetch bookmarks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (messageId) => {
    try {
      await apiClient.post(`/api/chat/bookmark`, {
        password: folder.password,
        username,
        messageId
      });
      setBookmarks(bookmarks.filter(b => b._id !== messageId));
    } catch (err) {
      console.error("Failed to remove bookmark:", err);
    }
  };

  return (
    <div className="bookmarks-panel-overlay" onClick={onClose}>
      <div className="bookmarks-panel" onClick={(e) => e.stopPropagation()}>
        <div className="bookmarks-header">
          <h2>📌 Bookmarks</h2>
          <button className="panel-close" onClick={onClose}>✕</button>
        </div>

        <div className="bookmarks-content">
          {loading ? (
            <div className="loading">Loading bookmarks...</div>
          ) : bookmarks.length > 0 ? (
            bookmarks.map((msg) => (
              <div key={msg._id} className="bookmark-item">
                <div className="bookmark-sender">{msg.sender}</div>
                <div className="bookmark-text">{msg.text}</div>
                <div className="bookmark-time">
                  {new Date(msg.timestamp).toLocaleString()}
                </div>
                <button
                  className="bookmark-remove"
                  onClick={() => handleRemoveBookmark(msg._id)}
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <div className="empty-bookmarks">No bookmarks yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
