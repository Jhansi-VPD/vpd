"use client";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { login as loginApi, register as registerApi, logout as logoutApi } from '../api/auth.js';

/**
 * @typedef {Object} AuthUser
 * @property {string} [id]
 * @property {string} [name]
 * @property {string} [email]
 * @property {string} [role]
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {AuthUser | null} user
 * @property {string | null} accessToken
 * @property {boolean} isAuthenticated
 * @property {boolean} initializing
 * @property {(email: string, password: string) => Promise<AuthUser>} login
 * @property {() => Promise<void>} logout
 * @property {(name: string, email: string, password: string) => Promise<void>} register
 */

/**
 * Explicit contract for legacy portal shells. The mounted provider for the
 * App Router portals is `auth/auth.context.tsx`; this context is retained for
 * the legacy .jsx portal components and is typed here so TypeScript consumers
 * (PortalLayout, ProtectedRoute) get `AuthContextValue` instead of `never`.
 * @type {import('react').Context<AuthContextValue | null>}
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    async function initAuth() {
      try {
        // First check localStorage for persisted user
        const storedUser = localStorage.getItem('vpd_user');
        const storedToken = localStorage.getItem('vpd_access_token');
        if (storedUser && storedToken) {
          try {
            setUser(JSON.parse(storedUser));
            setSession({ access_token: storedToken });
          } catch {
            // invalid JSON
          }
        }

        // Also check Supabase session if present
        const { data: { session: s } } = await supabase.auth.getSession();
        if (s) {
          setSession(s);
          if (!storedUser) {
            setUser(s.user);
          }
        }
      } catch (err) {
        console.warn('Auth initialization check:', err);
      } finally {
        setInitializing(false);
      }
    }

    initAuth();

    let subscription;
    try {
      ({ data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
        if (s) {
          setSession(s);
        }
      }));
    } catch (err) {
      console.warn('Supabase auth state subscription skipped:', err);
    }

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email, password) => {
    // FastAPI is the single source of truth for authentication. There is no
    // direct-database or Supabase fallback: only the six accounts listed in
    // docs/credentials.md, with the correct password, can establish a session.
    const response = await loginApi(email, password);
    const tokenData = response?.data;
    if (!tokenData?.user) {
      throw new Error('Invalid email or password.');
    }
    const u = tokenData.user;
    const token = tokenData.access_token || 'vpd_session_token';
    localStorage.setItem('vpd_user', JSON.stringify(u));
    localStorage.setItem('vpd_access_token', token);
    setUser(u);
    setSession({ access_token: token });
    return u;
  };

  const register = async (name, email, password) => {
    // Backend-only registration: if the API rejects it, no local session is
    // created — an account that cannot log in must not look logged in.
    await registerApi(name, email, password);
  };

  const logout = async () => {
    const token = session?.access_token;
    localStorage.removeItem('vpd_user');
    localStorage.removeItem('vpd_access_token');
    setUser(null);
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // Best-effort: the local session is already cleared above.
    }
    if (token) {
      try {
        await logoutApi(token);
      } catch {
        // Best-effort server-side revocation; never block logout on it.
      }
    }
  };

  const value = useMemo(
    () => ({
      user,
      accessToken: session?.access_token ?? null,
      isAuthenticated: Boolean(user),
      initializing,
      login,
      logout,
      register,
    }),
    [user, session, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Safe outside a mounted provider: returns an anonymous, signed-out value so
 * legacy shells degrade to guest rendering instead of throwing.
 * @returns {AuthContextValue}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      accessToken: null,
      isAuthenticated: false,
      initializing: false,
      login: async () => null,
      logout: async () => {},
      register: async () => null,
    };
  }
  return ctx;
}
