import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000
});

// Automatically inject Supabase / Demo Auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('researchly_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authApi = {
  sync: (data) => api.post('/auth/sync', data),
  getMe: () => api.get('/auth/me'),
  updatePreferences: (data) => api.put('/auth/preferences', data),
};

export const conferenceApi = {
  getAll: (params) => api.get('/conferences', { params }),
  getStats: () => api.get('/conferences/stats/summary'),
  getById: (id) => api.get(`/conferences/${id}`),
  ingest: (data, apiKey) => api.post('/conferences/ingest', data, {
    headers: { 'x-api-key': apiKey || 'researchly-scraper-auth-secret-key-9988' }
  }),
  evaluatePreview: (data) => api.post('/conferences/evaluate-preview', data),
};

export const agentApi = {
  configure: (agent_prompt) => api.post('/agent/configure', { agent_prompt }),
  triggerScan: () => api.post('/agent/trigger'),
  getMatches: (params) => api.get('/agent/matches', { params }),
  updateMatchStatus: (id, status) => api.patch(`/agent/matches/${id}`, { status }),
};

export const submissionApi = {
  getAll: () => api.get('/submissions'),
  create: (data) => api.post('/submissions', data),
  update: (id, data) => api.patch(`/submissions/${id}`, data),
  delete: (id) => api.delete(`/submissions/${id}`),
};

export const notificationApi = {
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (notification_preference) => api.post('/notifications/preferences', { notification_preference }),
  sendTestDigest: () => api.post('/notifications/test-digest'),
};

export default api;
