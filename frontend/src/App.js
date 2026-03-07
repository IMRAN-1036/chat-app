import React, { useState, useCallback } from "react";
import CreateFolder from "./components/CreateFolder";
import SearchFolder from "./components/SearchFolder";
import ChatRoom from "./components/ChatRoom";
import './App.css';

function App() {
  const [folder, setFolder] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, 3000);
  }, []);

  const toastIcons = { success: "✅", error: "❌", info: "💬" };

  const handleBack = () => {
    setFolder(null);
  };

  return (
    <div className="app-wrapper">
      {/* Animated background orbs */}
      <div className="bg-orbs">
        <div className="orb"></div>
        <div className="orb"></div>
        <div className="orb"></div>
      </div>

      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${toast.type} ${toast.exiting ? "exiting" : ""}`}
          >
            <span className="toast-icon">{toastIcons[toast.type]}</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Main content */}
      {!folder ? (
        <div className="app-content" key="lobby">
          <div className="app-header">
            <div className="app-logo">💬</div>
            <h1 className="app-title">ChatVault</h1>
            <p className="app-subtitle">
              Private, password-protected chat rooms
            </p>
          </div>

          <CreateFolder addToast={addToast} />

          <div className="divider">
            <div className="divider-line"></div>
            <span className="divider-text">or join existing</span>
            <div className="divider-line"></div>
          </div>

          <SearchFolder onFound={setFolder} addToast={addToast} />

          <div className="app-footer">
            <p>End-to-end encrypted • Built with ❤️</p>
          </div>
        </div>
      ) : (
        <div className="app-content" key="chat" style={{ maxWidth: "540px" }}>
          <ChatRoom folder={folder} onBack={handleBack} addToast={addToast} />
        </div>
      )}
    </div>
  );
}

export default App;