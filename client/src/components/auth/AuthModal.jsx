import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';

/* ═══════════════════════════════════════════════════════════════
   SVG ICONS — Inline so we never rely on emoji or external assets
   ═══════════════════════════════════════════════════════════════ */

/** Shield crest — decorative header icon */
function ShieldCrest({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M24 4L6 12v12c0 11.1 7.7 21.5 18 24 10.3-2.5 18-12.9 18-24V12L24 4z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M24 4L6 12v12c0 11.1 7.7 21.5 18 24 10.3-2.5 18-12.9 18-24V12L24 4z"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <path
        d="M24 14l-2 6h-5l4 3-1.5 5L24 25l4.5 3L27 23l4-3h-5l-2-6z"
        fill="currentColor"
        fillOpacity="0.7"
      />
      <path
        d="M24 34v-6M20 30h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Discord brand mark — monochrome, inherits currentColor */
function DiscordIcon({ size = 20 }) {
  return (
    <svg
      className="auth-discord-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PASSWORD STRENGTH
   ═══════════════════════════════════════════════════════════════ */

function getPasswordStrength(pw) {
  if (!pw) return { level: 0, label: '', cls: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', cls: 'weak' };
  if (score <= 2) return { level: 2, label: 'Fair', cls: 'fair' };
  if (score <= 3) return { level: 3, label: 'Good', cls: 'good' };
  return { level: 4, label: 'Strong', cls: 'strong' };
}

/* ═══════════════════════════════════════════════════════════════
   AUTH MODAL COMPONENT
   ═══════════════════════════════════════════════════════════════ */

/**
 * AuthModal — Unified Login / Register modal for Wonderlore AI.
 *
 * Props:
 *   isOpen       — boolean, controls visibility
 *   onClose      — callback when the modal should close
 *   initialMode  — 'login' | 'register' (default: 'login')
 */
export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const { login, register } = useAuth();

  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const firstInputRef = useRef(null);
  const modalRef = useRef(null);

  // Sync initialMode prop when it changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Reset form state when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setUsername('');
      setPassword('');
      setError('');
      setFieldErrors({});
      setSubmitting(false);
    }
  }, [isOpen, mode]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      const timer = setTimeout(() => firstInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mode]);

  // Escape key closes modal + focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableSelector =
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const focusable = modalRef.current.querySelectorAll(focusableSelector);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // ── Validation ──
  const validateForm = useCallback(() => {
    const errors = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Enter a valid email address';
    }

    if (mode === 'register') {
      if (!username.trim()) {
        errors.username = 'Username is required';
      } else if (username.trim().length < 3) {
        errors.username = 'Username must be at least 3 characters';
      }
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    return errors;
  }, [email, username, password, mode]);

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, username, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Mode switch ──
  const switchMode = useCallback((newMode) => {
    setMode(newMode);
    setError('');
    setFieldErrors({});
  }, []);

  // ── Overlay click ──
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // ── Don't render when closed ──
  if (!isOpen) return null;

  const isLogin = mode === 'login';
  const passwordStrength = !isLogin ? getPasswordStrength(password) : null;

  return (
    <div
      className="auth-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="auth-modal" ref={modalRef}>
        {/* ── Close ── */}
        <button
          className="auth-close"
          onClick={onClose}
          aria-label="Close authentication modal"
          type="button"
        >
          &#x2715;
        </button>

        {/* ── Header with crest ── */}
        <div className="auth-header">
          <div className="auth-crest" aria-hidden="true">
            <ShieldCrest />
          </div>
          <h2 className="auth-title" id="auth-modal-title">
            {isLogin ? 'Welcome Back' : 'Join the Realm'}
          </h2>
          <p className="auth-subtitle">
            {isLogin
              ? 'Enter your credentials to continue your quest'
              : 'Create your free account and begin your adventure'}
          </p>
        </div>

        {/* ── Mode Toggle Tabs ── */}
        <div className="auth-toggle" role="tablist" aria-label="Authentication mode">
          <button
            className={`auth-toggle-btn${isLogin ? ' active' : ''}`}
            onClick={() => switchMode('login')}
            role="tab"
            aria-selected={isLogin}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`auth-toggle-btn${!isLogin ? ' active' : ''}`}
            onClick={() => switchMode('register')}
            role="tab"
            aria-selected={!isLogin}
            type="button"
          >
            Create Account
          </button>
        </div>

        {/* ── Form ── */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-email">
              Email<span className="auth-required" aria-hidden="true">*</span>
            </label>
            <input
              id="auth-email"
              className={`auth-input${fieldErrors.email ? ' input-error' : ''}`}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
              }}
              placeholder="adventurer@realm.com"
              required
              autoComplete="email"
              disabled={submitting}
              ref={firstInputRef}
              aria-required="true"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined}
            />
            {fieldErrors.email && (
              <span className="auth-field-error" id="auth-email-error" role="alert">
                {fieldErrors.email}
              </span>
            )}
          </div>

          {/* Username (register only) */}
          {!isLogin && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-username">
                Username<span className="auth-required" aria-hidden="true">*</span>
              </label>
              <input
                id="auth-username"
                className={`auth-input${fieldErrors.username ? ' input-error' : ''}`}
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username) setFieldErrors((prev) => ({ ...prev, username: '' }));
                }}
                placeholder="Choose your adventurer name"
                required
                autoComplete="username"
                disabled={submitting}
                minLength={3}
                aria-required="true"
                aria-invalid={!!fieldErrors.username}
                aria-describedby={fieldErrors.username ? 'auth-username-error' : undefined}
              />
              {fieldErrors.username && (
                <span className="auth-field-error" id="auth-username-error" role="alert">
                  {fieldErrors.username}
                </span>
              )}
            </div>
          )}

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-password">
              Password<span className="auth-required" aria-hidden="true">*</span>
            </label>
            <input
              id="auth-password"
              className={`auth-input${fieldErrors.password ? ' input-error' : ''}`}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
              }}
              placeholder={isLogin ? 'Enter your password' : 'At least 8 characters'}
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              disabled={submitting}
              minLength={8}
              aria-required="true"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={
                [
                  fieldErrors.password ? 'auth-password-error' : '',
                  !isLogin ? 'auth-password-hint' : '',
                ]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
            />
            {!isLogin && (
              <span className="auth-hint" id="auth-password-hint">
                Minimum 8 characters. Mix letters, numbers, and symbols for a stronger ward.
              </span>
            )}
            {fieldErrors.password && (
              <span className="auth-field-error" id="auth-password-error" role="alert">
                {fieldErrors.password}
              </span>
            )}

            {/* Password strength indicator (register only) */}
            {!isLogin && password.length > 0 && passwordStrength && (
              <>
                <div className="auth-password-strength" aria-hidden="true">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`auth-strength-bar${
                        i <= passwordStrength.level
                          ? ` filled strength-${passwordStrength.cls}`
                          : ''
                      }`}
                    />
                  ))}
                </div>
                <span
                  className={`auth-strength-text strength-${passwordStrength.cls}`}
                  aria-live="polite"
                >
                  {passwordStrength.label}
                </span>
              </>
            )}
          </div>

          {/* Server error */}
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="auth-submit-btn"
            disabled={submitting}
          >
            <span className="auth-submit-content">
              {submitting && <span className="auth-spinner" aria-hidden="true" />}
              {submitting
                ? isLogin
                  ? 'Signing In...'
                  : 'Forging Account...'
                : isLogin
                  ? 'Sign In'
                  : 'Create Account'}
            </span>
          </button>
        </form>

        {/* ── Divider ── */}
        <div className="auth-divider" aria-hidden="true">
          <span className="auth-divider-text">or</span>
        </div>

        {/* ── Discord OAuth (placeholder) ── */}
        <div className="auth-discord-wrapper">
          <button
            className="auth-discord-btn"
            type="button"
            onClick={() => { /* Discord OAuth not yet implemented */ }}
            aria-describedby="discord-tooltip"
          >
            <DiscordIcon />
            Continue with Discord
          </button>
          <div className="auth-discord-tooltip" id="discord-tooltip" role="tooltip">
            Coming soon &mdash; Discord login is on the roadmap
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="auth-footer">
          {isLogin ? (
            <span>
              No account?{' '}
              <button
                className="auth-footer-link"
                onClick={() => switchMode('register')}
                type="button"
              >
                Create one free
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                className="auth-footer-link"
                onClick={() => switchMode('login')}
                type="button"
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
