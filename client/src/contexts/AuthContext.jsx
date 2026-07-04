import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { connectSocket, disconnectSocket } from '../services/socketService.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null); // access token in memory (not localStorage!)

  // Check auth on mount — try to refresh session from httpOnly cookie
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setToken(data.access_token);
          setUser(data.user);
          connectSocket(data.access_token);
        }
      } catch (e) {
        // Not authenticated — no valid refresh cookie
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const register = useCallback(async (email, username, password) => {
    const res = await fetch('/auth/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    });
    if (!res.ok) {
      let message = 'Registration failed';
      try {
        const err = await res.json();
        // Pydantic validation errors return detail as an array of objects
        if (typeof err.detail === 'string') {
          message = err.detail;
        } else if (Array.isArray(err.detail) && err.detail.length > 0) {
          const field = err.detail[0].loc?.slice(-1)[0];
          const msg = err.detail[0].msg || '';
          if (field === 'email') message = 'Please enter a valid email address';
          else if (field === 'password') message = 'Password must be at least 8 characters';
          else if (field === 'username') message = 'Please enter a valid username';
          else message = msg;
        }
      } catch {
        message = res.status === 500 ? 'Server error — please try again later' : `Registration failed (${res.status})`;
      }
      throw new Error(message);
    }
    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    connectSocket(data.access_token);
    return data;
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch('/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      let message = 'Login failed';
      try {
        const err = await res.json();
        if (typeof err.detail === 'string') {
          message = err.detail;
        } else if (Array.isArray(err.detail) && err.detail.length > 0) {
          const field = err.detail[0].loc?.slice(-1)[0];
          if (field === 'email') message = 'Please enter a valid email address';
          else message = err.detail[0].msg || 'Login failed';
        }
      } catch {
        message = res.status === 500 ? 'Server error — please try again later' : `Login failed (${res.status})`;
      }
      throw new Error(message);
    }
    const data = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    connectSocket(data.access_token);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    disconnectSocket();
    setToken(null);
    setUser(null);
  }, []);

  const storeApiKey = useCallback(async (apiKey) => {
    if (!token) return;
    const res = await fetch('/auth/api-key', {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ api_key: apiKey }),
    });
    if (!res.ok) throw new Error('Failed to store API key');
  }, [token]);

  const resendVerification = useCallback(async () => {
    if (!user?.email) return;
    const res = await fetch('/auth/resend-verification', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email }),
    });
    if (!res.ok) throw new Error('Failed to resend verification email');
    return res.json();
  }, [user]);

  // Latest token in a ref so authFetch can read it after a mid-flight refresh
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  // Authenticated fetch helper — injects JWT. On 401 (access token expired
  // mid-session — it only lives 30 min and only in memory), silently tries
  // /auth/refresh once and retries; on refresh failure, signs the user out
  // so the UI can prompt re-auth instead of silently dropping saves forever.
  const authFetch = useCallback(async (url, options = {}) => {
    const doFetch = (tok) => {
      const headers = { ...options.headers };
      if (tok) headers['Authorization'] = `Bearer ${tok}`;
      return fetch(url, { ...options, headers, credentials: 'include' });
    };

    let res = await doFetch(tokenRef.current);
    if (res.status !== 401 || !tokenRef.current) return res;

    // Access token rejected — try to refresh the session once
    try {
      const refreshRes = await fetch('/auth/refresh', { method: 'POST', credentials: 'include' });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setToken(data.access_token);
        setUser(data.user);
        tokenRef.current = data.access_token;
        return doFetch(data.access_token);
      }
    } catch (e) { /* network failure — fall through to sign-out */ }

    // Refresh failed — session is truly dead
    disconnectSocket();
    setToken(null);
    setUser(null);
    return res;
  }, []);

  const contextValue = useMemo(() => ({
    user, setUser, token, loading,
    isAuthenticated: !!user,
    register, login, logout, storeApiKey, authFetch, resendVerification,
  }), [user, token, loading, register, login, logout, storeApiKey, authFetch, resendVerification]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
