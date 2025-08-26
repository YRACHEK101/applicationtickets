// src/api/api.ts

import axios from 'axios';

// Base URL configuration
// This should be provided by your environment variables (e.g., VITE_API_URL from .env or Docker Compose)
// We explicitly use the environment variable. If it's not set, it will be undefined,
// and we provide a robust fallback.
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const api = axios.create({
  // Use the environment variable directly.
  // The fallback should be a full URL, not a relative path,
  // to prevent requests from going to the frontend's own domain.
  baseURL: API_BASE_URL || 'http://localhost:5000/api', // Ensure this fallback is also a full URL
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add request debugging in development
if (import.meta.env.DEV) {
  api.interceptors.request.use(request => {
    console.log('API Request:', request.method?.toUpperCase(), request.url, request.data);
    return request;
  });

  api.interceptors.response.use(
    response => {
      console.log('API Response:', response.status, response.config.url, response.data);
      return response;
    },
    error => {
      console.error('API Error:',
        error.response?.status,
        error.config?.url,
        error.response?.data || error.message
      );
      return Promise.reject(error);
    }
  );
}

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors (401)
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
