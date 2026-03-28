import React, { useState, useEffect } from "react";

export default function MessageSearch({ messages, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const results = messages.filter(
        (msg) =>
          msg.text?.toLowerCase().includes(query) ||
          msg.sender?.toLowerCase().includes(query)
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, messages]);

  return (
    <div className="message-search-overlay">
      <div className="message-search-modal">
        <div className="search-header">
          <input
            type="text"
            className="search-input"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <button className="search-close" onClick={onClose}>✕</button>
        </div>
        <div className="search-results">
          {searchResults.length > 0 ? (
            searchResults.map((msg, idx) => (
              <div key={idx} className="search-result-item">
                <span className="search-sender">{msg.sender}:</span>
                <span className="search-text">
                  {msg.text?.length > 80 ? msg.text.slice(0, 80) + "…" : msg.text}
                </span>
              </div>
            ))
          ) : searchQuery.trim() ? (
            <div className="search-no-results">No messages found</div>
          ) : (
            <div className="search-empty">Start typing to search</div>
          )}
        </div>
      </div>
    </div>
  );
}
