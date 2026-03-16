import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import "./Notifications.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:2000";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const token = Cookies.get("authToken");

  useEffect(() => {
    fetchMentions();
    const interval = setInterval(fetchMentions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMentions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications/mentions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
      setUnreadCount(response.data.length);
    } catch (err) {
      console.error("Failed to fetch mentions:", err);
    }
  };

  const clearMentions = async () => {
    try {
      await axios.post(
        `${API_URL}/api/notifications/mentions/clear`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications([]);
      setUnreadCount(0);
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to clear mentions:", err);
    }
  };

  const handleNotificationClick = (notification) => {
    // Navigate to the group or message
    console.log("Clicked notification:", notification);
  };

  return (
    <div className="notifications-container">
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notifications-panel glass-morphism">
          <div className="notifications-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="clear-btn" onClick={clearMentions}>
                Clear All
              </button>
            )}
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="empty-notifications">
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div
                  key={idx}
                  className="notification-item"
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notification-icon">{notif.icon}</div>
                  <div className="notification-content">
                    <p className="notification-title">
                      {notif.type === "mention"
                        ? `@${notif.from} mentioned you`
                        : `${notif.from} in ${notif.group}`}
                    </p>
                    <p className="notification-message">{notif.message}</p>
                    <span className="notification-time">
                      {new Date(notif.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
