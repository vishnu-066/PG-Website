import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from './AdminContext';
import TurnstileWidget from './TurnstileWidget';

export default function AdminLogin() {
  const { login, sendOtp, verifyOtp, checkLockout } = useAdmin();

  // Mode: 'password' | 'otp'
  const [authMode, setAuthMode] = useState('password');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState('request'); // 'request' | 'verify'

  // Cloudflare Turnstile Bot Protection
  const [captchaToken, setCaptchaToken] = useState(null);
  const turnstileRef = useRef(null);

  // UI / Status states
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Rate limit / Lockout states
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // OTP 50-second expiration states
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);
  const [isOtpExpired, setIsOtpExpired] = useState(false);

  // OTP resend cooldown timer (50 seconds)
  const [resendCooldown, setResendCooldown] = useState(0);

  // Check initial lockout state on mount
  useEffect(() => {
    const status = checkLockout();
    if (status.isLocked) {
      setIsLocked(true);
      setLockoutSeconds(status.remainingSeconds);
    }
  }, [checkLockout]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) {
      if (isLocked) {
        setIsLocked(false);
        setError('');
      }
      return;
    }

    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutSeconds, isLocked]);

  // Resend OTP cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  // OTP 50-second live expiration countdown timer
  useEffect(() => {
    if (authMode !== 'otp' || otpStep !== 'verify') return;
    if (otpExpiresIn <= 0) {
      setIsOtpExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setOtpExpiresIn((prev) => {
        if (prev <= 1) {
          setIsOtpExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [otpExpiresIn, authMode, otpStep]);

  // Format MM:SS for timers
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Switch Auth Mode
  const handleModeSwitch = (mode) => {
    if (isLocked) return;
    setAuthMode(mode);
    setError('');
    setSuccessMsg('');
    setOtpStep('request');
    setOtpCode('');
    setOtpExpiresIn(0);
    setIsOtpExpired(false);
    setCaptchaToken(null);
    turnstileRef.current?.reset();
  };

  // 1. Password Login Handler
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isLocked) return;

    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password');
      return;
    }

    if (!captchaToken) {
      setError('Please complete the security verification below before logging in.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(email, password, captchaToken);
      setIsLoading(false);

      if (!res.success) {
        turnstileRef.current?.reset();
        setCaptchaToken(null);
        if (res.isLocked) {
          setIsLocked(true);
          setLockoutSeconds(res.remainingSeconds || 180);
        }
        setError(res.message || 'Invalid login credentials');
      }
    } catch (err) {
      setIsLoading(false);
      turnstileRef.current?.reset();
      setCaptchaToken(null);
      setError('Connection error while logging in');
    }
  };

  // 2. OTP Step 1: Send One-Time Code
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isLocked) return;

    if (!email.trim()) {
      setError('Please enter your admin email');
      return;
    }

    if (!captchaToken) {
      setError('Please complete the security verification below before requesting a code.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await sendOtp(email, captchaToken);
      setIsLoading(false);

      if (res.success) {
        setOtpStep('verify');
        setOtpExpiresIn(50);
        setIsOtpExpired(false);
        setResendCooldown(50);
        setSuccessMsg(res.message || 'Verification code sent to your email (valid for 50 seconds).');
      } else {
        turnstileRef.current?.reset();
        setCaptchaToken(null);
        if (res.isLocked) {
          setIsLocked(true);
          setLockoutSeconds(res.remainingSeconds || 180);
        }
        setError(res.message || 'Failed to send OTP code.');
      }
    } catch (err) {
      setIsLoading(false);
      turnstileRef.current?.reset();
      setCaptchaToken(null);
      setError('Connection error while requesting OTP code');
    }
  };

  // 3. OTP Step 2: Verify One-Time Code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isLocked) return;

    if (isOtpExpired || otpExpiresIn <= 0) {
      setError('Verification code has expired (50-second security limit). Please click Resend Code.');
      return;
    }

    const cleanedCode = otpCode.trim();
    if (!cleanedCode || cleanedCode.length < 6) {
      setError('Please enter the complete verification code');
      return;
    }

    setIsLoading(true);

    try {
      const res = await verifyOtp(email, cleanedCode);
      setIsLoading(false);

      if (!res.success) {
        if (res.isLocked) {
          setIsLocked(true);
          setLockoutSeconds(res.remainingSeconds || 180);
        }
        setError(res.message || 'Invalid verification code');
      }
    } catch (err) {
      setIsLoading(false);
      setError('Connection error while verifying code');
    }
  };

  // 4. Resend OTP handler: returns to request step to get fresh Turnstile verification
  const handleResendOtp = () => {
    if (resendCooldown > 0 || isLocked || isLoading) return;
    setOtpStep('request');
    setOtpCode('');
    setCaptchaToken(null);
    setError('');
    setSuccessMsg('Please verify security below to send a fresh code.');
  };

  return (
    <div className="admin-login-overlay">
      <div className="admin-login-card">
        {/* Header */}
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

        {/* Lockout Banner (Rate Limit Defense) */}
        {isLocked && (
          <div className="login-lockout-alert animate-fade-in">
            <div className="lockout-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="lockout-info">
              <h4>Account Temporarily Locked</h4>
              <p>Exceeded 3 failed login attempts. To prevent brute-force attacks, logins are paused.</p>
              <div className="lockout-timer">
                Cooldown remaining: <strong>{formatTime(lockoutSeconds)}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && !isLocked && (
          <div className="login-error-alert animate-fade-in">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="login-success-alert animate-fade-in">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="login-mode-tabs">
          <button
            type="button"
            className={`mode-tab ${authMode === 'password' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('password')}
            disabled={isLocked || isLoading}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Password</span>
          </button>

          <button
            type="button"
            className={`mode-tab ${authMode === 'otp' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('otp')}
            disabled={isLocked || isLoading}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>Email OTP</span>
          </button>
        </div>

        {/* --- 1. PASSWORD MODE FORM --- */}
        {authMode === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="login-form">
            <div className="form-input-group">
              <label htmlFor="email">Admin Email</label>
              <div className="input-wrapper">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" className="input-icon">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || isLocked}
                  required
                  autoComplete="email"
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
                  disabled={isLoading || isLocked}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                  disabled={isLocked}
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

            {/* Cloudflare Turnstile CAPTCHA */}
            <TurnstileWidget
              ref={turnstileRef}
              action="login"
              onSuccess={(token) => {
                setCaptchaToken(token);
                setError('');
              }}
              onExpire={() => setCaptchaToken(null)}
              onError={(code) => {
                setCaptchaToken(null);
                setError(`Security verification issue (${code || 'failed'}). If using a custom domain, ensure it is added in your Cloudflare Turnstile dashboard.`);
              }}
            />

            <button
              type="submit"
              className="login-submit-btn"
              disabled={isLoading || isLocked}
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
        )}

        {/* --- 2. OTP MODE: STEP 1 (REQUEST OTP) --- */}
        {authMode === 'otp' && otpStep === 'request' && (
          <form onSubmit={handleSendOtp} className="login-form">
            <div className="form-input-group">
              <label htmlFor="otp-email">Admin Email</label>
              <div className="input-wrapper">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" className="input-icon">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  id="otp-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || isLocked}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              A 6-digit one-time verification code will be sent to your registered admin email.
            </p>

            {/* Cloudflare Turnstile CAPTCHA */}
            <TurnstileWidget
              ref={turnstileRef}
              action="otp_request"
              onSuccess={(token) => {
                setCaptchaToken(token);
                setError('');
              }}
              onExpire={() => setCaptchaToken(null)}
              onError={(code) => {
                setCaptchaToken(null);
                setError(`Security verification issue (${code || 'failed'}). If using a custom domain, ensure it is added in your Cloudflare Turnstile dashboard.`);
              }}
            />

            <button
              type="submit"
              className="login-submit-btn"
              disabled={isLoading || isLocked}
            >
              {isLoading ? (
                <span className="spinner"></span>
              ) : (
                <>
                  <span>Send One-Time Code</span>
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </>
              )}
            </button>
          </form>
        )}

        {/* --- 3. OTP MODE: STEP 2 (VERIFY OTP) --- */}
        {authMode === 'otp' && otpStep === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="login-form">
            <div className="otp-email-badge">
              <span>Code sent to: <strong>{email}</strong></span>
              <button
                type="button"
                className="otp-change-email-btn"
                onClick={() => { setOtpStep('request'); setOtpCode(''); setError(''); }}
                disabled={isLoading}
              >
                Change
              </button>
            </div>

            {/* Live 50-Second Expiry Countdown / Alert */}
            {!isOtpExpired ? (
              <div className={`otp-countdown-badge ${otpExpiresIn <= 15 ? 'warning' : ''}`}>
                <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" strokeWidth="2" fill="none">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Code expires in: <strong>{formatTime(otpExpiresIn)}</strong></span>
              </div>
            ) : (
              <div className="otp-expired-alert animate-fade-in">
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>Code expired! Please click <strong>Resend Code</strong> below.</span>
              </div>
            )}

            <div className="form-input-group">
              <label htmlFor="otp-code">Enter Verification Code</label>
              <div className="input-wrapper">
                <input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="••••••••"
                  className="otp-code-input"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading || isLocked || isOtpExpired}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="otp-resend-container">
              <span>Didn't receive code?</span>
              <button
                type="button"
                className="otp-resend-btn"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isLoading || isLocked}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={isLoading || isLocked || isOtpExpired || otpCode.length < 6}
            >
              {isLoading ? (
                <span className="spinner"></span>
              ) : isOtpExpired ? (
                <span>Code Expired — Request New Code</span>
              ) : (
                <>
                  <span>Verify Code & Sign In</span>
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="login-footer">
          <p>Protected by Supabase Auth with 3-attempt brute-force lockout defense.</p>
        </div>
      </div>
    </div>
  );
}
