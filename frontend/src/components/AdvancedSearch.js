import React, { useState } from "react";
import apiClient from "../api/client";

export default function AdvancedSearch({ folder, onClose }) {
  const [query, setQuery] = useState("");
  const [sender, setSender] = useState("");
  const [messageType, setMessageType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hasReactions, setHasReactions] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const res = await apiClient.post(`/api/chat/search-advanced`, {
        password: folder.password,
        query: query || undefined,
        sender: sender || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        messageType: messageType || undefined,
        hasReactions: hasReactions || undefined
      });
      setResults(res.data.results || []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="advanced-search-overlay" onClick={onClose}>
      <div className="advanced-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <h2>🔍 Advanced Search</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <div className="search-field">
            <label>Message Text</label>
            <input
              type="text"
              placeholder="Search message content..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="search-field">
            <label>Sender</label>
            <input
              type="text"
              placeholder="Filter by sender..."
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="search-field">
            <label>Message Type</label>
            <select
              value={messageType}
              onChange={(e) => setMessageType(e.target.value)}
              className="search-input"
            >
              <option value="">All Types</option>
              <option value="text">Text</option>
              <option value="voice">Voice</option>
              <option value="image">Image</option>
              <option value="file">File</option>
            </select>
          </div>

          <div className="search-row">
            <div className="search-field">
              <label>From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="search-field">
              <label>To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="search-field checkbox">
            <input
              type="checkbox"
              id="hasReactions"
              checked={hasReactions}
              onChange={(e) => setHasReactions(e.target.checked)}
            />
            <label htmlFor="hasReactions">Only messages with reactions</label>
          </div>

          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        <div className="search-results-container">
          {searched && (
            <>
              <div className="results-count">
                Found {results.length} message{results.length !== 1 ? "s" : ""}
              </div>
              {results.length > 0 ? (
                <div className="search-results-list">
                  {results.map((msg, idx) => (
                    <div key={idx} className="search-result">
                      <div className="result-sender">{msg.sender}</div>
                      <div className="result-text">{msg.text}</div>
                      <div className="result-meta">
                        {new Date(msg.timestamp).toLocaleString()}
                        {msg.type !== "text" && ` • ${msg.type}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">No messages found matching your criteria</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
