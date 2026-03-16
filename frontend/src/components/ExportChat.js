import React, { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "";

export default function ExportChat({ folder, onClose, addToast }) {
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState("json");

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/chat/export`,
        { password: folder.password, format },
        { responseType: format === "csv" ? "blob" : "json" }
      );

      if (format === "csv") {
        // Download CSV file
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `chat-export-${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      } else {
        // Download JSON file
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `chat-export-${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      }

      addToast(`Chat exported as ${format.toUpperCase()}`, "success");
      onClose();
    } catch (err) {
      console.error("Export failed:", err);
      addToast("Failed to export chat", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="export-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-header">
          <h2>📥 Export Chat</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="export-content">
          <p className="export-description">
            Download all messages from this chat room. Choose your preferred format:
          </p>

          <div className="format-options">
            <label className="format-option">
              <input
                type="radio"
                value="json"
                checked={format === "json"}
                onChange={(e) => setFormat(e.target.value)}
              />
              <span className="format-name">JSON</span>
              <span className="format-desc">Complete data with all metadata</span>
            </label>

            <label className="format-option">
              <input
                type="radio"
                value="csv"
                checked={format === "csv"}
                onChange={(e) => setFormat(e.target.value)}
              />
              <span className="format-name">CSV</span>
              <span className="format-desc">Spreadsheet-compatible format</span>
            </label>
          </div>

          <div className="export-info">
            <strong>What's included:</strong>
            <ul>
              <li>All messages and their content</li>
              <li>Sender information and timestamps</li>
              <li>Message reactions and status</li>
              <li>Pinned and edited messages</li>
            </ul>
          </div>

          <div className="export-actions">
            <button
              className="btn-cancel"
              onClick={onClose}
              disabled={exporting}
            >
              Cancel
            </button>
            <button
              className="btn-export"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? "Exporting..." : "📥 Export Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
