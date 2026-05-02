
// Centralized API configuration
// During development, it defaults to localhost. 
// In production (Vercel), it uses the VITE_API_URL environment variable.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_BASE = `${BASE_URL}/api/v1`;

export default API_BASE;
