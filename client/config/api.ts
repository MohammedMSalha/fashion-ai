// Get the API base URL from environment variable
// Try API_URL first (custom), then VITE_API_URL (Vite standard)
export const API_BASE_URL =
  (import.meta.env as any).API_URL || import.meta.env.VITE_API_URL || "";

export const createApiUrl = (path: string) => {
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  return path; // Use relative URL in development
};
