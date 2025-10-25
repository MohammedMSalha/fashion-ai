// Get the API base URL from environment variable (API_URL)
// Vite requires public env vars to start with VITE_, so this reads VITE_API_URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const createApiUrl = (path: string) => {
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  return path; // Use relative URL in development
};
