import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { SESSION_EXPIRED_EVENT, TOKEN_KEY, USER_KEY } from '@/lib/api';

// The dashboard shell, the login page and the 401 handler in lib/api.js all
// need the same "is somebody signed in?" answer, so it lives in one context
// instead of being re-read from localStorage in every component.
const AuthContext = createContext(null);

const readStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Corrupt JSON in storage must read as "signed out", never crash the shell.
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [checking, setChecking] = useState(() => Boolean(window.localStorage.getItem(TOKEN_KEY)));

  const signOut = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // lib/api.js fires this whenever a protected call comes back 401 (expired or
  // revoked token). Reacting here is what turns a silent data failure into a
  // real sign-in prompt.
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, signOut);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, signOut);
  }, [signOut]);

  // Runs once on boot. A stored token proves nothing on its own — the JWT may
  // have expired or the account may have been deleted — so confirm it against
  // /auth/me before letting the dashboard render its data.
  useEffect(() => {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setChecking(false);
      return;
    }

    let active = true;
    api
      .get('/auth/me')
      .then((data) => {
        if (!active) return;
        const fresh = data && typeof data === 'object' ? data : null;
        if (fresh) {
          window.localStorage.setItem(USER_KEY, JSON.stringify(fresh));
          setUser(fresh);
        } else {
          signOut();
        }
      })
      .catch(() => {
        if (active) signOut();
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [signOut]);

  const login = useCallback(async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, user: profile } = response || {};
    if (!token) throw new Error('Login response did not include a token');
    window.localStorage.setItem(TOKEN_KEY, token);
    if (profile) window.localStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile || null);
    return profile || null;
  }, []);

  const value = useMemo(() => ({ user, checking, isAuthenticated: Boolean(user), login, signOut }), [user, checking, login, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

export default AuthProvider;
