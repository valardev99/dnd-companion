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
      throw new Error(err.detail || 'Registration failed');
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
      throw new Error(err.detail || 'Login failed');
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

  // Authenticated fetch helper — injects JWT
  const authFetch = useCallback(async (url, options = {}) => {
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers, credentials: 'include' });
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated: !!user,
      register, login, logout, storeApiKey, authFetch,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
