function stripTrailingSlash(value) {
  return value?.trim().replace(/\/+$/, '');
}

export const SERVER_ORIGIN =
  stripTrailingSlash(import.meta.env.VITE_SERVER_URL) ||
  (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);

export const API_BASE_URL =
  stripTrailingSlash(import.meta.env.VITE_API_BASE_URL) ||
  `${SERVER_ORIGIN}/api`;

export function apiUrl(path = '') {
  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
}
