import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ct_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ct_token');
      localStorage.removeItem('ct_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// ── Animals ───────────────────────────────────────────────────────────────────
export const animalsAPI = {
  getAll: (params) => api.get('/animals', { params }),
  getById: (animalId) => api.get(`/animals/${animalId}`),
  getByRfid: (rfid) => api.get(`/animals/rfid/${rfid}`),
  create: (data) => api.post('/animals', data),
  update: (animalId, data) => api.put(`/animals/${animalId}`, data),
  updateStatus: (animalId, status) => api.patch(`/animals/${animalId}/status`, { status }),
  delete: (animalId) => api.delete(`/animals/${animalId}`),
};

// ── Detections ────────────────────────────────────────────────────────────────
export const detectionsAPI = {
  getAll: (params) => api.get('/detections', { params }),
  getLatest: (limit = 10) => api.get('/detections/latest', { params: { limit } }),
  getById: (id) => api.get(`/detections/${id}`),
  getByAnimal: (animalId) => api.get(`/detections/animal/${animalId}`),
  predict: (formData) =>
    api.post('/detections/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),
  create: (data) => api.post('/detections', data),
};

// ── Tracking ──────────────────────────────────────────────────────────────────
export const trackingAPI = {
  getAll: (params) => api.get('/tracking', { params }),
  getByAnimal: (animalId, limit) => api.get(`/tracking/animal/${animalId}`, { params: { limit } }),
  getLatest: (animalId) => api.get(`/tracking/latest/${animalId}`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getBreeds: () => api.get('/dashboard/breeds'),
  getRecent: (limit) => api.get('/dashboard/recent', { params: { limit } }),
  getLive: () => api.get('/dashboard/live'),
};

// ── Devices ───────────────────────────────────────────────────────────────────
export const devicesAPI = {
  getAll: () => api.get('/devices'),
  getById: (deviceId) => api.get(`/devices/${deviceId}`),
  register: (data) => api.post('/devices/register', data),
  heartbeat: (deviceId) => api.post('/devices/heartbeat', { deviceId }),
};

// ── Health ────────────────────────────────────────────────────────────────────
export const healthAPI = {
  check: () => api.get('/health'),
};
