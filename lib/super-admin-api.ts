import axios from 'axios';

const superAdminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
});

// Add super admin token to requests
superAdminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('super-admin-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
superAdminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('super-admin-token');
      localStorage.removeItem('super-admin');
      window.location.href = '/super-admin/login';
    }
    return Promise.reject(error);
  }
);

export default superAdminApi;
