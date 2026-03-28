import React, { useState } from "react";
import Cookies from "js-cookie";
import { post } from "../api/client";

export default function Authentication({ onAuthenticated }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      // Use the centralized api client 'post'
      const response = await post(endpoint, {
        username,
        password,
      });

      if (response.token) {
        // Store token in both cookie and localStorage for API client compatibility
        Cookies.set("authToken", response.token, { expires: 1 });
        localStorage.setItem("chatvault_token", response.token);
        onAuthenticated(response.username);
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '420px', margin: '0 auto', animation: 'fadeInUp 0.6s ease-out' }}>
      <div className="card-header" style={{ flexDirection: 'column', textAlign: 'center', marginBottom: '1.8rem', gap: '0.8rem' }}>
        <div className="app-logo" style={{ margin: '0', width: '56px', height: '56px', fontSize: '1.5rem' }}>🔐</div>
        <div>
          <h2 className="app-title" style={{ fontSize: '1.5rem' }}>{isLogin ? "Welcome Back" : "Create Account"}</h2>
          <p className="app-subtitle" style={{ fontSize: '0.85rem' }}>
            {isLogin ? "Sign in to access your secure chats" : "Join ChatVault for encrypted messaging"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div className="input-group" style={{ margin: 0 }}>
          <input
            id="username"
            type="text"
            className="styled-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="input-group" style={{ margin: 0 }}>
          <input
            id="password"
            type="password"
            className="styled-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.8rem',
            color: '#ef4444',
            fontSize: '0.85rem',
            textAlign: 'center',
            animation: 'shake 0.4s ease'
          }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? <div className="spinner"></div> : isLogin ? "Login Now" : "Register Account"}
        </button>
      </form>

      <div style={{
        marginTop: '1.8rem',
        paddingTop: '1.2rem',
        borderTop: '1px solid var(--glass-border)',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)'
      }}>
        <p>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            type="button"
            className="btn-ghost"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-1)',
              fontWeight: 600,
              cursor: 'pointer',
              marginLeft: '0.5rem',
              padding: 0
            }}
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
          >
            {isLogin ? "Register here" : "Login instead"}
          </button>
        </p>
      </div>
    </div>
  );
}
