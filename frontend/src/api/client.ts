import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

declare global {
  interface Window {
    NEXUS_API_URL?: string;
  }
}

export function resolveApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.NEXUS_API_URL) {
    return window.NEXUS_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const { hostname, port, origin } = window.location;
    // FastAPI port 8000
    if (port === '8000') {
      return origin;
    }
    // Vite Dev Server default port 5173
    if (port === '5173') {
      return '/api';
    }
    // Nginx container proxy (port 80, 443, or standard HTTP/HTTPS)
    if (port === '80' || port === '443' || port === '') {
      return `${origin}/api`;
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    return `${origin}/api`;
  }
  return 'http://localhost:8000';
}

export const API_BASE_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('nexus_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 and Token Expiry
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/login') || error.config?.url?.includes('/reset-password');
      if (!isAuthEndpoint) {
        localStorage.removeItem('nexus_token');
        localStorage.removeItem('nexus_user');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(error: unknown, defaultMessage = 'An unexpected error occurred'): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ');
    }
    if (error.response?.data?.message) {
      return String(error.response.data.message);
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
}
