import React, { useState } from 'react';
import { useAdmin } from './AdminContext';

export default function AdminLogin() {
  const { login } = useAdmin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    // Simulate minor network delay for realism
    setTimeout(() => {
      const res = login(username, password);
      setIsLoading(false);
      if (!res.success) {
        setError(res.message || 'Incorrect credentials');
      }
    }, 450);
  };

  return (
    <div className="admin-login-overlay">
      <div className="admin-login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>
          <h2>Admin Portal</h2>
          <p>Sri Venkateswara Gents PG Dashboard</p>
        </div>

        {error && (
          <div className="login-error-alert animate-fade-in">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-input-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrapper">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" className="input-icon">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="form-input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" className="input-icon">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="spinner"></span>
            ) : (
              <>
                <span>Secure Log In</span>
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Protected by secure local session tokens.</p>
        </div>
      </div>
    </div>
  );
}
