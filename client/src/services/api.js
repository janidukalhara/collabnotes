/**
 * services/api.js
 *
 * Axios instance pre-configured with:
 *  - Base URL from env
 *  - Request interceptor → attaches Bearer access token
 *  - Response interceptor → auto-refreshes expired access tokens (once)
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
});

// ─── Request: attach access token ────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response: 401 → try refresh once ────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        api.defaults.headers.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth endpoints ───────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)  => api.post('/auth/register', data),
  login:    (data)  => api.post('/auth/login', data),
  logout:   ()      => api.post('/auth/logout'),
  getMe:    ()      => api.get('/auth/me'),
};

// ─── Note endpoints ───────────────────────────────────────────────────────────
export const notesAPI = {
  getAll:   (params) => api.get('/notes', { params }),
  getById:  (id)     => api.get(`/notes/${id}`),
  create:   (data)   => api.post('/notes', data),
  update:   (id, data) => api.put(`/notes/${id}`, data),
  delete:   (id)     => api.delete(`/notes/${id}`),
  search:   (q)      => api.get('/notes/search', { params: { q } }),

  addCollaborator:    (id, data)           => api.post(`/notes/${id}/collaborators`, data),
  updateCollaborator: (id, cId, data)      => api.put(`/notes/${id}/collaborators/${cId}`, data),
  removeCollaborator: (id, cId)            => api.delete(`/notes/${id}/collaborators/${cId}`),
};

// ─── User endpoints ───────────────────────────────────────────────────────────
export const usersAPI = {
  updateProfile:  (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/password', data),
  search:         (email) => api.get('/users/search', { params: { email } }),
};

export default api;
