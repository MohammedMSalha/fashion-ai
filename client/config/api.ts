// Get the API base URL from Vercel environment variable
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const createApiUrl = (path: string) => {
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  return path; // Use relative URL in development
};
