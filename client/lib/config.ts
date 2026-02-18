// API Configuration
export const getApiUrl = (): string => {
  // Remove trailing slash if present
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '')
}

export const API_URL = getApiUrl()
