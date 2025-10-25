// Get the API base URL from environment variable
// In production on Vercel, both frontend and backend are on same domain
// So we use relative URLs (/api/...)
const rawApiBaseUrl =
  ((import.meta.env as any).API_URL as string | undefined) ||
  import.meta.env.VITE_API_URL ||
  "";

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");
const normalizePath = (value: string) => (value.startsWith("/") ? value : `/${value}`);
const ensureTrailingSlash = (value: string) =>
  value.endsWith("/") ? value : `${value}/`;

export const API_BASE_URL = normalizeBaseUrl(rawApiBaseUrl.trim());

export const createApiUrl = (path: string) => {
  const normalizedPath = normalizePath(path);

  // If an explicit API_URL is set (e.g., for external backend), use it
  if (API_BASE_URL) {
    try {
      return new URL(normalizedPath, ensureTrailingSlash(API_BASE_URL)).toString();
    } catch (error) {
      console.warn("[API] Failed to construct URL from API_BASE_URL", error);
      return `${API_BASE_URL}${normalizedPath}`;
    }
  }

  // Otherwise use relative URL (works for Vercel same-domain deployment)
  return normalizedPath;
};
