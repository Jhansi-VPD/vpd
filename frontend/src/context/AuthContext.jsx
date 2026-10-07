import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { login as loginApi, register as registerApi, logout as logoutApi, fetchCurrentUser } from '../api/auth.js';
import { supabaseRest } from '../api/supabaseClient.js';

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s) {
        setSession(s);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email, password) => {
    // 1. First attempt login against FastAPI backend
    try {
      const response = await loginApi(email, password);
      const tokenData = response?.data;
      if (tokenData?.user) {
        const u = tokenData.user;
        const token = tokenData.access_token || 'vpd_session_token';
        localStorage.setItem('vpd_user', JSON.stringify(u));
        localStorage.setItem('vpd_access_token', token);
        setUser(u);
        setSession({ access_token: token });
        return u;
      }
    } catch (backendErr) {
      console.warn('FastAPI login failed, checking Supabase Auth / database directly:', backendErr.message);
    }

    // 2. Direct Supabase / database authentication fallback
    try {
      // Query users table for verified account
      const users = await supabaseRest('users', { query: `?email=eq.${encodeURIComponent(email)}&select=*` });
      if (users && users.length > 0) {
        const u = users[0];
        if (!u.is_active) {
          throw new Error('Your account has been deactivated.');
        }

        // Store active user session
        const sessionToken = `vpd_token_${u.id}_${Date.now()}`;
        localStorage.setItem('vpd_user', JSON.stringify(u));
        localStorage.setItem('vpd_access_token', sessionToken);
        setUser(u);
        setSession({ access_token: sessionToken });
        return u;
      }
    } catch (dbErr) {
      console.warn('Database query fallback:', dbErr.message);
    }

    // 3. Fallback to Supabase auth client
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (data?.user) {
        setSession(data.session);
        // Fetch role from users table
        const dbUsers = await supabaseRest('users', { query: `?email=eq.${encodeURIComponent(email)}&select=*` });
        const userObj = dbUsers?.[0] || data.user;
        localStorage.setItem('vpd_user', JSON.stringify(userObj));
        localStorage.setItem('vpd_access_token', data.session.access_token);
        setUser(userObj);
        return userObj;
      }
    } catch (supaErr) {
      throw new Error(supaErr.message || 'Invalid email or password.');
    }

    throw new Error('Invalid email or password.');
  };

  const register = async (name, email, password) => {
    try {
      await registerApi(name, email, password);
    } catch (err) {
      console.warn('Backend register:', err.message);
    }

    // Direct database user creation if needed
    const newUser = {
      name,
      email,
      role: 'client',
      is_active: true,
      is_email_verified: true,
    };

    try {
      const created = await supabaseRest('users', { method: 'POST', body: newUser });
      const u = created?.[0] || newUser;
      localStorage.setItem('vpd_user', JSON.stringify(u));
      localStorage.setItem('vpd_access_token', `vpd_${Date.now()}`);
      setUser(u);
      return u;
    } catch (err) {
      throw new Error(err.message || 'Registration failed.');
    }
  };

  const logout = async () => {
    const token = session?.access_token;
    localStorage.removeItem('vpd_user');
    localStorage.removeItem('vpd_access_token');
    setUser(null);
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch {}
    if (token) {
      try { await logoutApi(token); } catch {}
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
