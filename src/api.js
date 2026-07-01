// Centralized API configuration
// During development, it defaults to localhost. 
// In production, it uses a relative path or the production URL.

const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000');
export const API_BASE = `${BASE_URL}/api/v1`;

// Global Fetch Interceptor for Authentication
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  const token = localStorage.getItem('hr_token');
  
  // Inject Bearer Token into headers if session exists and is internal api
  if (token && url.toString().includes('/api/v1/')) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  const response = await originalFetch(url, options);
  
  // Clear local storage and redirect if token has expired or is invalid
  if (response.status === 401 && url.toString().includes('/api/v1/')) {
    localStorage.removeItem('hr_token');
    // Prevent redirect loops if already on the login page
    if (window.location.pathname.startsWith('/hr') && window.location.pathname !== '/hr/login') {
      window.location.href = '/hr/login';
    }
  }
  
  return response;
};

export default API_BASE;
