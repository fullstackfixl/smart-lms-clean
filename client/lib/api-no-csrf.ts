import { API_URL as API_BASE } from '../lib/config'

// Simplified API file with CSRF completely removed

interface ApiOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  token?: string
}

interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
  success: boolean
  pagination?: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers = {}, token } = options

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(token ? { Authorization: `Bearer ${token} ` } : {}),
    },
    credentials: 'include',
  }

  if (body && method !== "GET") {
    config.body = JSON.stringify(body)
  }

  const fullUrl = `${API_BASE}${endpoint} `
  console.log(`🌐[API] ${method} ${fullUrl} `)

  try {
    const response = await fetch(fullUrl, config)

    let data
    try {
      data = await response.json()
    } catch (parseError) {
      console.error(`❌[API] Failed to parse JSON response: `, parseError)
      return {
        success: false,
        error: "Invalid response from server",
      }
    }

    console.log(`🌐[API] Response status: ${response.status} `)

    if (!response.ok) {
      console.error(`❌[API] Request failed: ${data.message || data.error} `)
      return {
        success: false,
        error: data.message || data.error || `Request failed with status ${response.status} `,
      }
    }

    console.log(`✅[API] Request successful`)
    return { success: true, data: data.data || data, pagination: data.pagination }
  } catch (error) {
    console.error(`❌[API] Network error: `, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    }
  }
}

// Auth APIs
export const authApi = {
  register: (data: { name: string; email: string; password: string; role?: string; organization_code?: string }) =>
    apiRequest("/auth/register/request-otp", { method: "POST", body: data }),
  requestOtp: (data: { email: string; name: string; role: string; organization_code?: string }) =>
    apiRequest("/auth/register/request-otp", { method: "POST", body: data }),
  verifyOtp: (data: { email: string; otp: string }) =>
    apiRequest("/auth/verify-otp", { method: "POST", body: data }),
  resendOtp: (email: string) =>
    apiRequest("/auth/register/resend-otp", { method: "POST", body: { email } }),
  login: (data: { email: string; password: string }) =>
    apiRequest("/auth/login", { method: "POST", body: data }),
  logout: (token: string) =>
    apiRequest("/auth/logout", { method: "POST", token }),
  forgotPassword: (email: string) =>
    apiRequest("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (data: { token: string; password: string }) =>
    apiRequest("/auth/reset-password", { method: "POST", body: data }),
  getMe: (token: string) =>
    apiRequest("/auth/me", { token }),
  updateMe: (token: string, data: Record<string, unknown>) =>
    apiRequest("/auth/me", { method: "PUT", token, body: data }),
}

// Platform Admin APIs - CSRF REMOVED
export const platformApi = {
  // Organizations
  createOrg: (data: {
    name: string
    email: string
    phone?: string
    address?: {
      street?: string
      city?: string
      state?: string
      country?: string
      zipCode?: string
    }
    plan?: 'basic' | 'premium'
  }) => apiRequest("/platform/organizations", { method: "POST", body: data }),

  listOrgs: (token?: string, params?: { page?: number; limit?: number; status?: string; plan?: string; search?: string; sortBy?: string; sortOrder?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.plan) queryParams.append('plan', params.plan)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    const query = queryParams.toString()
    return apiRequest(`/ platform / organizations${query ? `?${query}` : ""} `, { token })
  },

  getOrg: (token: string, id: string) =>
    apiRequest(`/ platform / organizations / ${id} `, { token }),

  updateOrg: (id: string, data: {
    name?: string
    email?: string
    phone?: string
    address?: {
      street?: string
      city?: string
      state?: string
      country?: string
      zipCode?: string
    }
    plan?: 'basic' | 'premium'
  }) => apiRequest(`/ platform / organizations / ${id} `, { method: "PUT", body: data }),

  updateOrgStatus: (id: string, status: 'active' | 'suspended') =>
    apiRequest(`/ platform / organizations / ${id}/status`, { method: "PATCH", body: { status } }),

  deleteOrg: (id: string) =>
    apiRequest(`/platform/organizations/${id}`, { method: "DELETE" }),

  restoreOrg: (id: string) =>
    apiRequest(`/platform/organizations/${id}/restore`, { method: "POST" }),

  getOrgStats: (token?: string) =>
    apiRequest("/platform/organizations/stats", { token }),

  analytics: (token: string) =>
    apiRequest("/platform/analytics", { token }),
  revenue: (token: string) =>
    apiRequest("/platform/revenue", { token }),

  // Dashboard
  getDashboardStats: (token?: string) =>
    apiRequest("/platform/dashboard/stats", { token }),
  getGlobalAnalytics: (token?: string, period?: string) =>
    apiRequest(`/platform/analytics/global${period ? `?period=${period}` : ""}`, { token }),
  getRevenueAnalytics: (token?: string) =>
    apiRequest("/platform/analytics/revenue", { token }),

  // Platform Admins
  listAdmins: (token: string, params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)

    const query = queryParams.toString()
    return apiRequest(`/platform/admins${query ? `?${query}` : ""}`, { token })
  },

  createAdmin: (token: string, data: {
    name: string
    email: string
    password: string
  }) => apiRequest("/platform/admins", { method: "POST", token, body: data }),

  updateAdminStatus: (token: string, id: string, isActive: boolean) =>
    apiRequest(`/platform/admins/${id}/status`, { method: "PATCH", token, body: { isActive } }),
}

// Export the simplified version
export default apiRequest
