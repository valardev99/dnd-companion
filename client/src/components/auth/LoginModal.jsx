import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function LoginModal({ onClose, onSuccess, onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      (onSuccess || onClose)();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotSubmitting(true);
    try {
      await fetch('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSent(true);
    } catch (err) {
      setForgotSent(true);
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="auth-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal">
        {forgotMode ? (
          <>
            <h2>Reset Password</h2>
            {forgotSent ? (
              <div style={{ textAlign: 'center' }}>
                <p className="auth-switch" style={{ marginBottom: '16px' }}>
                  If an account exists with that email, a reset link has been sent.
                  Check your inbox.
                </p>
                <button
                  className="auth-submit"
                  onClick={() => { setForgotMode(false); setForgotSent(false); }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot}>
                <div className="auth-field">
                  <label htmlFor="forgot-email">Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="adventurer@realm.com"
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="auth-submit"
                  disabled={forgotSubmitting}
                  style={{ marginTop: '12px' }}
                >
                  {forgotSubmitting ? 'Sending...' : 'Send Reset Link'}
                </button>
                <div className="auth-switch" style={{ marginTop: '12px' }}>
                  <a onClick={() => setForgotMode(false)}>Back to Sign In</a>
                </div>
              </form>
            )}
          </>
        ) : (
          <>
            <h2>Sign In</h2>
            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="adventurer@realm.com"
                  required
                  autoFocus
                />
              </div>
              <div className="auth-field">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <a
                  className="auth-forgot-link"
                  onClick={() => { setForgotMode(true); setForgotEmail(email); }}
                  style={{
                    color: 'var(--gold-dim)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontFamily: "'Crimson Text', serif",
                    marginTop: '4px',
                    display: 'inline-block',
                  }}
                >
                  Forgot password?
                </a>
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button
                type="submit"
                className="auth-submit"
                disabled={submitting}
              >
                {submitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            <div className="auth-switch">
              No account?{' '}
              <a onClick={onSwitchToRegister}>Create one</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
