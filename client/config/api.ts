// Get the API base URL from environment or use default
export const API_BASE_URL = 
  process.env.REACT_APP_API_URL || 
  process.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.includes('vercel') 
    ? 'https://c9490d0ac88e4b849e13d3d7de56a268-8cae1a264aad42febe4fa3fff.fly.dev'
    : '');

export const createApiUrl = (path: string) => {
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  return path; // Use relative URL in development
};
