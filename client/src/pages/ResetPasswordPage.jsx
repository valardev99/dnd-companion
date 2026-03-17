import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to reset password');
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="reset-page" style={{
        minHeight: '100vh',
        background: 'var(--void)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div className="auth-modal" style={{ margin: '80px auto' }}>
          <h2>Invalid Link</h2>
          <p className="auth-switch">This reset link is invalid or has expired.</p>
          <button className="auth-submit" onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-page" style={{
      minHeight: '100vh',
      background: 'var(--void)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="auth-modal">
        {success ? (
          <>
            <h2>Password Reset</h2>
            <p className="auth-switch" style={{ marginBottom: '16px' }}>
              Your password has been reset. You can now sign in with your new password.
            </p>
            <button className="auth-submit" onClick={() => navigate('/')}>
              Go to Sign In
            </button>
          </>
        ) : (
          <>
            <h2>Set New Password</h2>
            <form onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="new-password">New Password (min 8 characters)</label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={8}
                  autoFocus
                />
              </div>
              <div className="auth-field">
                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button
                type="submit"
                className="auth-submit"
                disabled={submitting}
                style={{ marginTop: '12px' }}
              >
                {submitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
