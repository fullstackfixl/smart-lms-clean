// API Configuration
// Priority: 1. NEXT_PUBLIC_API_URL env var, 2. Render backend (production fallback), 3. localhost (dev)
export const getApiUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  if (envUrl) return envUrl.replace(/\/$/, '')

  // If running in the browser and NOT on localhost, use the Render backend
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return 'https://smart-lms-clean-1.onrender.com'
  }

  return 'http://localhost:5000'
}

export const API_URL = getApiUrl();

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token');
};
