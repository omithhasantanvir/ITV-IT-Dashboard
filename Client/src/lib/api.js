import axios from 'axios';

export const TOKEN_KEY = 'it_management_token';
export const USER_KEY = 'it_management_user';

// In dev, Vite proxies /api to the backend (see vite.config.js), which keeps
// LAN clients working without hard-coding a host. Set VITE_API_URL to override.
const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({ baseURL });

// Attach the JWT once a login flow stores one. Harmless while auth is bypassed.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Dispatched when the API rejects a request because the JWT is missing, expired
// or invalid. AuthContext listens for it and drops the session so the shell
// falls back to the login page instead of rendering empty panels forever.
export const SESSION_EXPIRED_EVENT = 'it-management:session-expired';

const endSession = () => {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
};

// The API wraps payloads as { success, data }. Unwrap here so callers get data.
api.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (payload && typeof payload === 'object' && payload.success === true && 'data' in payload) {
      return payload.data;
    }
    return payload;
  },
  (error) => {
    const status = error.response?.status;

    // A 401 on /auth/login is just "wrong password" — the login form renders
    // that inline, so it must not be treated as an expired session.
    const isLoginAttempt = error.config?.url?.includes('/auth/login');
    if (status === 401 && !isLoginAttempt) endSession();

    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'The API took too long to respond.'
        : !error.response
          ? 'Cannot reach the API. Is the backend running on port 5000?'
          : error.message) ||
      'Request failed';
    return Promise.reject(Object.assign(error, { message, status }));
  }
);

export const getErrorMessage = (error) => error?.message || 'Unexpected error';

export default api;
