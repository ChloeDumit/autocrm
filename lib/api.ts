import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
});

// Helper to get subdomain from cookie or hostname
function getSubdomain(): string | null {
  if (typeof document === 'undefined') return null;

  // Try to get from cookie first
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'tenant-subdomain') {
      return value;
    }
  }

  // Fall back to hostname
  const hostname = window.location.hostname;

  // For localhost development (e.g., company1.localhost)
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'localhost' && parts[0] !== '127') {
      return parts[0];
    }
    return null;
  }

  // For production (e.g., company1.autocrm.com)
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    const reserved = ['admin', 'www', 'api', 'app'];
    if (!reserved.includes(subdomain.toLowerCase())) {
      return subdomain;
    }
  }

  return null;
}

// Add token and tenant subdomain to requests
api.interceptors.request.use((config) => {
  // Add auth token
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add tenant subdomain header
  const subdomain = getSubdomain();
  if (subdomain) {
    config.headers['X-Tenant-Subdomain'] = subdomain;
  }

  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

