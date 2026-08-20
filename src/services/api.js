import axios from 'axios';
import { getToken } from '../utils/storage';

const API_BASE_URL = 'http://192.168.29.167:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Auth ────────────────────────────────────────────
export const loginGuard = (phone, pin) => {
  return api.post('/api/guards/login', { phone: `+91${phone}`, pin });
};

// ─── Shift ───────────────────────────────────────────
export const startShift = () => {
  return api.post('/api/guards/shift/start');
};

export const endShift = (shiftId) => {
  return api.post('/api/guards/shift/end', { shiftId });
};

// ─── Visitors ────────────────────────────────────────
export const createVisitorRequest = (data) => {
  return api.post('/api/visitors/request', data);
};

export const getActiveVisitors = () => {
  return api.get('/api/visitors/active');
};

export const markExit = (id) => {
  return api.patch(`/api/visitors/${id}/exit`);
};

// ─── Emergency ───────────────────────────────────────
export const createEmergency = (data) => {
  return api.post('/api/visitors/emergency', data);
};

export default api;