import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import '../../styles/verify-banner.css';

export default function VerifyBanner() {
  const { user, resendVerification } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || user.email_verified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerification();
      setSent(true);
    } catch (e) {
      // silent fail
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="verify-banner">
      <span className="verify-banner-icon">✉</span>
      <span className="verify-banner-text">
        {sent
          ? 'Verification email sent! Check your inbox.'
          : 'Check your email to verify your account.'}
      </span>
      {!sent && (
        <button
          className="verify-banner-resend"
          onClick={handleResend}
          disabled={sending}
        >
          {sending ? 'Sending...' : 'Resend'}
        </button>
      )}
      <button className="verify-banner-close" onClick={() => setDismissed(true)} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}
