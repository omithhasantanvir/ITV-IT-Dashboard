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
    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'The API took too long to respond.'
        : !error.response
          ? 'Cannot reach the API. Is the backend running on port 5000?'
          : error.message) ||
      'Request failed';
    return Promise.reject(Object.assign(error, { message, status: error.response?.status }));
  }
);

export const getErrorMessage = (error) => error?.message || 'Unexpected error';

export default api;
