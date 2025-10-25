// Get the API base URL from environment variable
// In production on Vercel, both frontend and backend are on same domain
// So we use relative URLs (/api/...)
export const API_BASE_URL =
  (import.meta.env as any).API_URL || import.meta.env.VITE_API_URL || "";

export const createApiUrl = (path: string) => {
  // If an explicit API_URL is set (e.g., for external backend), use it
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  // Otherwise use relative URL (works for Vercel same-domain deployment)
  return path;
};
