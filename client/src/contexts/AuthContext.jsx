import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
      const err = await res.json();
      // Pydantic validation errors return detail as an array of objects
      let message = 'Registration failed';
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
      const err = await res.json();
      let message = 'Login failed';
      if (typeof err.detail === 'string') {
        message = err.detail;
      } else if (Array.isArray(err.detail) && err.detail.length > 0) {
        const field = err.detail[0].loc?.slice(-1)[0];
        if (field === 'email') message = 'Please enter a valid email address';
        else message = err.detail[0].msg || 'Login failed';
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

  // Authenticated fetch helper — injects JWT
  const authFetch = useCallback(async (url, options = {}) => {
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers, credentials: 'include' });
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user, setUser, token, loading,
      isAuthenticated: !!user,
      register, login, logout, storeApiKey, authFetch, resendVerification,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
