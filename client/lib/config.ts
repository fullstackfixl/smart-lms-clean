/**
 * Application Configuration
 * Centralized configuration for API endpoints and app settings
 */

// Get API URL from environment variable or default to localhost
const getApiUrlFromEnv = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use NEXT_PUBLIC_API_URL
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }
  // Server-side: use NEXT_PUBLIC_API_URL
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

const getAppUrlFromEnv = () => {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

export const config = {
  // API Configuration
  apiUrl: getApiUrlFromEnv(),
  appUrl: getAppUrlFromEnv(),
  
  // API Endpoints
  api: {
    baseUrl: getApiUrlFromEnv(),
    csrfToken: '/api/csrf-token',
    auth: {
      me: '/auth/me',
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout',
    },
    instructor: {
      courses: '/instructor/courses',
      sections: '/instructor/sections',
      lessons: '/instructor/lessons',
      notifications: '/instructor/notifications',
      upload: '/api/instructor/lectures',
    },
    student: {
      courses: '/student/courses',
      lectures: '/student/lectures',
      liveClasses: '/student/live-classes',
      progress: '/student/progress',
    },
  },
  
  // Feature Flags
  features: {
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
    enableLiveChat: process.env.NEXT_PUBLIC_ENABLE_LIVE_CHAT === 'true',
  },
} as const;

/**
 * Get full API URL for an endpoint
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = config.apiUrl.replace(/\/$/, ''); // Remove trailing slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
}

/**
 * Get API base URL
 */
export function getApiBaseUrl(): string {
  return config.apiUrl;
}
