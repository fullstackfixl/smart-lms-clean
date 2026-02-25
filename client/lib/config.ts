// API Configuration
export const getApiUrl = (): string => {
  // Priority: 1. Environment variable, 2. Current window origin (if available), 3. Fallback to localhost
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  if (envUrl) return envUrl.replace(/\/$/, '')

  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // If we're on a deployed site but env is missing, we might be hitting a subfolder or sibling
    return window.location.origin.replace('3000', '5000').replace('3001', '5000')
  }

  return 'http://localhost:5000'
}

export const API_URL = getApiUrl();
