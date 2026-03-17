import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const token = params.get('token');

  const [status, setStatus] = useState('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Invalid verification link.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch('/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || 'Verification failed');
        }
        setStatus('success');
        if (user) {
          setUser({ ...user, email_verified: true });
        }
      } catch (err) {
        setStatus('error');
        setErrorMsg(err.message);
      }
    };
    verify();
  }, [token]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--void)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="auth-modal">
        {status === 'verifying' && (
          <>
            <h2>Verifying...</h2>
            <p className="auth-switch">Checking your verification link...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h2>Email Verified!</h2>
            <p className="auth-switch" style={{ marginBottom: '16px' }}>
              Your email has been verified. Welcome to the realm, adventurer!
            </p>
            <button className="auth-submit" onClick={() => navigate(user ? '/play' : '/')}>
              {user ? 'Enter the Command Center' : 'Sign In'}
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <h2>Verification Failed</h2>
            <p className="auth-switch" style={{ marginBottom: '16px' }}>
              {errorMsg}
            </p>
            <button className="auth-submit" onClick={() => navigate('/')}>
              Go Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
