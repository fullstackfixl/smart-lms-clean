const API_BASE = "https://smart-lms-clean-1.onrender.com"

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
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include', // IMPORTANT: Include cookies for auth
  }

  if (body && method !== "GET") {
    config.body = JSON.stringify(body)
  }

  const fullUrl = `${API_BASE}${endpoint}`
  console.log(`🌐 [API] ${method} ${fullUrl}`)
  console.log(`🌐 [API] Request body:`, body)
  console.log(`🌐 [API] Headers:`, config.headers)

  try {
    const response = await fetch(fullUrl, config)
    
    // Try to parse JSON response
    let data
    try {
      data = await response.json()
    } catch (parseError) {
      console.error(`❌ [API] Failed to parse JSON response:`, parseError)
      return {
        success: false,
        error: "Invalid response from server",
      }
    }

    console.log(`🌐 [API] Response status: ${response.status}`)
    console.log(`🌐 [API] Response data:`, data)

    if (!response.ok) {
      console.error(`❌ [API] Request failed: ${data.message || data.error}`)
      return {
        success: false,
        error: data.message || data.error || `Request failed with status ${response.status}`,
      }
    }

    console.log(`✅ [API] Request successful`)
    return { success: true, data: data.data || data, pagination: data.pagination }
  } catch (error) {
    console.error(`❌ [API] Network error:`, error)
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

// Course APIs
export const courseApi = {
  create: (token: string, data: Record<string, unknown>) =>
    apiRequest("/api/courses", { method: "POST", token, body: data }),
  list: (token: string, params?: string) =>
    apiRequest(`/api/courses${params ? `?${params}` : ""}`, { token }),
  get: (token: string, id: string) =>
    apiRequest(`/api/courses/${id}`, { token }),
  update: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/api/courses/${id}`, { method: "PUT", token, body: data }),
  delete: (token: string, id: string) =>
    apiRequest(`/api/courses/${id}`, { method: "DELETE", token }),
  publish: (token: string, id: string) =>
    apiRequest(`/api/courses/${id}/publish`, { method: "POST", token }),
  addSection: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/api/courses/${id}/sections`, { method: "POST", token, body: data }),
  addLesson: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/api/courses/${id}/lessons`, { method: "POST", token, body: data }),
  updateLesson: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/api/lessons/${id}`, { method: "PUT", token, body: data }),
  deleteLesson: (token: string, id: string) =>
    apiRequest(`/api/lessons/${id}`, { method: "DELETE", token }),
  getStudents: (token: string, id: string) =>
    apiRequest(`/api/courses/${id}/students`, { token }),
}

// Enrollment APIs
export const enrollmentApi = {
  enroll: (token: string, data: { course_id: string }) =>
    apiRequest("/api/enrollments", { method: "POST", token, body: data }),
  list: (token: string) =>
    apiRequest("/api/enrollments", { token }),
  myCourses: (token: string) =>
    apiRequest("/api/my-courses", { token }),
  unenroll: (token: string, id: string) =>
    apiRequest(`/api/enrollments/${id}`, { method: "DELETE", token }),
}

// Assessment APIs
export const quizApi = {
  create: (token: string, data: Record<string, unknown>) =>
    apiRequest("/api/quizzes", { method: "POST", token, body: data }),
  get: (token: string, id: string) =>
    apiRequest(`/api/quizzes/${id}`, { token }),
  update: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/api/quizzes/${id}`, { method: "PUT", token, body: data }),
  delete: (token: string, id: string) =>
    apiRequest(`/api/quizzes/${id}`, { method: "DELETE", token }),
  submit: (token: string, id: string, answers: unknown[]) =>
    apiRequest(`/api/quizzes/${id}/submit`, { method: "POST", token, body: { answers } }),
  getAttempts: (token: string, id: string) =>
    apiRequest(`/api/quizzes/${id}/attempts`, { token }),
  getAttempt: (token: string, id: string) =>
    apiRequest(`/api/attempts/${id}`, { token }),
}

// Progress & Certificate APIs
export const progressApi = {
  update: (token: string, data: Record<string, unknown>) =>
    apiRequest("/api/progress", { method: "POST", token, body: data }),
  get: (token: string, courseId: string) =>
    apiRequest(`/api/progress/${courseId}`, { token }),
}

export const certificateApi = {
  list: (token: string) =>
    apiRequest("/api/certificates", { token }),
  get: (token: string, id: string) =>
    apiRequest(`/api/certificates/${id}`, { token }),
  download: (token: string, id: string) =>
    apiRequest(`/api/certificates/${id}/download`, { method: "POST", token }),
  verify: (uniqueId: string) =>
    apiRequest(`/api/certificates/verify/${uniqueId}`),
}

// Payment APIs
export const paymentApi = {
  create: (token: string, data: Record<string, unknown>) =>
    apiRequest("/payments/create", { method: "POST", token, body: data }),
  verify: (token: string, data: Record<string, unknown>) =>
    apiRequest("/payments/verify", { method: "POST", token, body: data }),
  history: (token: string) =>
    apiRequest("/payments/history", { token }),
  refund: (token: string, data: Record<string, unknown>) =>
    apiRequest("/payments/refund", { method: "POST", token, body: data }),
}

// Attendance APIs
export const attendanceApi = {
  mark: (token: string, data: Record<string, unknown>) =>
    apiRequest("/api/attendance/mark", { method: "POST", token, body: data }),
  bulk: (token: string, data: Record<string, unknown>) =>
    apiRequest("/api/attendance/bulk", { method: "POST", token, body: data }),
  report: (token: string, userId: string) =>
    apiRequest(`/api/attendance/report/${userId}`, { token }),
  classAttendance: (token: string, classId: string) =>
    apiRequest(`/api/attendance/class/${classId}`, { token }),
  summary: (token: string, userId: string) =>
    apiRequest(`/api/attendance/summary/${userId}`, { token }),
}

// Gradebook APIs
export const gradeApi = {
  update: (token: string, data: Record<string, unknown>) =>
    apiRequest("/api/grades/update", { method: "POST", token, body: data }),
  getStudent: (token: string, userId: string) =>
    apiRequest(`/api/grades/${userId}`, { token }),
  getCourse: (token: string, courseId: string) =>
    apiRequest(`/api/grades/course/${courseId}`, { token }),
  export: (token: string, data: Record<string, unknown>) =>
    apiRequest("/api/grades/export", { method: "POST", token, body: data }),
  analytics: (token: string, courseId: string) =>
    apiRequest(`/api/grades/analytics/${courseId}`, { token }),
}

// Timetable APIs
export const timetableApi = {
  create: (token: string, data: Record<string, unknown>) =>
    apiRequest("/api/timetable/create", { method: "POST", token, body: data }),
  getOrg: (token: string, orgId: string) =>
    apiRequest(`/api/timetable/${orgId}`, { token }),
  getUser: (token: string, userId: string) =>
    apiRequest(`/api/timetable/user/${userId}`, { token }),
  update: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/api/timetable/${id}`, { method: "PUT", token, body: data }),
  delete: (token: string, id: string) =>
    apiRequest(`/api/timetable/${id}`, { method: "DELETE", token }),
  conflicts: (token: string) =>
    apiRequest("/api/timetable/conflicts", { token }),
}

// Live Class APIs
export const liveClassApi = {
  // Instructor endpoints
  schedule: async (token: string, data: Record<string, unknown>) => {
    const csrfToken = await getCsrfToken()
    return apiRequest("/instructor/live-classes", {
      method: "POST",
      token,
      body: data,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
  listInstructor: (token: string, params?: string) =>
    apiRequest(`/instructor/live-classes${params ? `?${params}` : ""}`, { token }),
  update: async (token: string, id: string, data: Record<string, unknown>) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/live-classes/${id}`, {
      method: "PATCH",
      token,
      body: data,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
  cancel: async (token: string, id: string) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/live-classes/${id}`, {
      method: "DELETE",
      token,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
  
  // Student endpoints
  upcoming: (token: string) =>
    apiRequest("/student/live-classes/upcoming", { token }),
  join: async (token: string, id: string) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/student/live-classes/${id}/join`, {
      method: "POST",
      token,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
}

// Notification APIs
export const notificationApi = {
  list: (token: string, params?: string) =>
    apiRequest(`/notifications${params ? `?${params}` : ""}`, { token }),
  markAsRead: async (token: string, id: string) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/notifications/${id}/read`, {
      method: "PATCH",
      token,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
  markAllAsRead: async (token: string) => {
    const csrfToken = await getCsrfToken()
    return apiRequest("/notifications/read-all", {
      method: "PATCH",
      token,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
}

// Fees APIs
export const feesApi = {
  set: (token: string, data: Record<string, unknown>) =>
    apiRequest("/api/fees/set", { method: "POST", token, body: data }),
  get: (token: string, studentId: string) =>
    apiRequest(`/api/fees/${studentId}`, { token }),
  pay: (token: string, data: Record<string, unknown>) =>
    apiRequest("/api/fees/pay", { method: "POST", token, body: data }),
  pending: (token: string) =>
    apiRequest("/api/fees/pending", { token }),
  history: (token: string, studentId: string) =>
    apiRequest(`/api/fees/history/${studentId}`, { token }),
  reminder: (token: string, data: Record<string, unknown>) =>
    apiRequest("/api/fees/reminder", { method: "POST", token, body: data }),
}

// Parent Portal APIs
export const parentApi = {
  children: (token: string) =>
    apiRequest("/api/parent/children", { token }),
  linkChild: (token: string, data: { verification_code: string }) =>
    apiRequest("/api/parent/link-child", { method: "POST", token, body: data }),
  progress: (token: string, studentId: string) =>
    apiRequest(`/api/parent/progress/${studentId}`, { token }),
  attendance: (token: string, studentId: string) =>
    apiRequest(`/api/parent/attendance/${studentId}`, { token }),
  grades: (token: string, studentId: string) =>
    apiRequest(`/api/parent/grades/${studentId}`, { token }),
  fees: (token: string, studentId: string) =>
    apiRequest(`/api/parent/fees/${studentId}`, { token }),
}

// AI & Gamification APIs
export const aiApi = {
  generateQuiz: (token: string, data: Record<string, unknown>) =>
    apiRequest("/api/ai/generate-quiz", { method: "POST", token, body: data }),
  explainTopic: (token: string, data: Record<string, unknown>) =>
    apiRequest("/api/ai/explain-topic", { method: "POST", token, body: data }),
  predict: (token: string, userId: string) =>
    apiRequest(`/api/analytics/predict/${userId}`, { token }),
}

export const gamificationApi = {
  updatePoints: (token: string, data: Record<string, unknown>) =>
    apiRequest("/api/gamification/update-points", { method: "POST", token, body: data }),
  leaderboard: (token: string, courseId: string) =>
    apiRequest(`/api/gamification/leaderboard/${courseId}`, { token }),
  badges: (token: string, userId: string) =>
    apiRequest(`/api/gamification/badges/${userId}`, { token }),
}

// Platform Admin APIs
export const platformApi = {
  // CSRF Token
  getCsrfToken: () =>
    apiRequest("/api/csrf-token"),
  
  // Organizations
  createOrg: async (data: {
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
  }) => {
    // Get CSRF token first
    const csrfResponse = await apiRequest<{ csrfToken: string }>("/api/csrf-token")
    if (!csrfResponse.success || !csrfResponse.data) {
      return { success: false, error: "Failed to get CSRF token" }
    }
    
    return apiRequest("/platform/organizations", {
      method: "POST",
      body: data,
      headers: { "X-CSRF-Token": csrfResponse.data.csrfToken }
    })
  },
  
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
    return apiRequest(`/platform/organizations${query ? `?${query}` : ""}`, { token })
  },
  
  getOrg: (token: string, id: string) =>
    apiRequest(`/platform/organizations/${id}`, { token }),
  
  updateOrg: async (id: string, data: {
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
  }) => {
    const csrfResponse = await apiRequest<{ csrfToken: string }>("/api/csrf-token")
    if (!csrfResponse.success || !csrfResponse.data) {
      return { success: false, error: "Failed to get CSRF token" }
    }
    
    return apiRequest(`/platform/organizations/${id}`, {
      method: "PUT",
      body: data,
      headers: { "X-CSRF-Token": csrfResponse.data.csrfToken }
    })
  },
  
  updateOrgStatus: async (id: string, status: 'active' | 'suspended') => {
    const csrfResponse = await apiRequest<{ csrfToken: string }>("/api/csrf-token")
    if (!csrfResponse.success || !csrfResponse.data) {
      return { success: false, error: "Failed to get CSRF token" }
    }
    
    return apiRequest(`/platform/organizations/${id}/status`, {
      method: "PATCH",
      body: { status },
      headers: { "X-CSRF-Token": csrfResponse.data.csrfToken }
    })
  },
  
  deleteOrg: async (id: string) => {
    const csrfResponse = await apiRequest<{ csrfToken: string }>("/api/csrf-token")
    if (!csrfResponse.success || !csrfResponse.data) {
      return { success: false, error: "Failed to get CSRF token" }
    }
    
    return apiRequest(`/platform/organizations/${id}`, {
      method: "DELETE",
      headers: { "X-CSRF-Token": csrfResponse.data.csrfToken }
    })
  },
  
  restoreOrg: async (id: string) => {
    const csrfResponse = await apiRequest<{ csrfToken: string }>("/api/csrf-token")
    if (!csrfResponse.success || !csrfResponse.data) {
      return { success: false, error: "Failed to get CSRF token" }
    }
    
    return apiRequest(`/platform/organizations/${id}/restore`, {
      method: "POST",
      headers: { "X-CSRF-Token": csrfResponse.data.csrfToken }
    })
  },
  
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
  listAdmins: (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    
    const query = queryParams.toString()
    return apiRequest(`/platform/admins${query ? `?${query}` : ""}`)
  },
  
  createAdmin: async (data: {
    name: string
    email: string
    password: string
  }) => {
    const csrfResponse = await apiRequest<{ csrfToken: string }>("/api/csrf-token")
    if (!csrfResponse.success || !csrfResponse.data) {
      return { success: false, error: "Failed to get CSRF token" }
    }
    
    return apiRequest("/platform/admins", {
      method: "POST",
      body: data,
      headers: { "X-CSRF-Token": csrfResponse.data.csrfToken }
    })
  },
  
  updateAdminStatus: async (id: string, isActive: boolean) => {
    const csrfResponse = await apiRequest<{ csrfToken: string }>("/api/csrf-token")
    if (!csrfResponse.success || !csrfResponse.data) {
      return { success: false, error: "Failed to get CSRF token" }
    }
    
    return apiRequest(`/platform/admins/${id}/status`, {
      method: "PATCH",
      body: { isActive },
      headers: { "X-CSRF-Token": csrfResponse.data.csrfToken }
    })
  },
}

// Instructor APIs
async function getCsrfToken() {
  console.log("🔐 Fetching CSRF token...")
  const res = await apiRequest<{ csrfToken: string }>("/api/csrf-token")
  console.log("🔐 CSRF token response:", res)
  
  if (!res.success || !res.data?.csrfToken) {
    console.error("🔐 CSRF token fetch failed:", res.error)
    throw new Error(res.error || "Failed to get CSRF token")
  }
  
  console.log("🔐 CSRF token obtained successfully")
  return res.data.csrfToken
}

export const instructorApi = {
  // Courses
  listCourses: (token: string, params?: string) =>
    apiRequest(`/instructor/courses${params ? `?${params}` : ""}`, { token }),
  getCourse: (token: string, id: string) =>
    apiRequest(`/instructor/courses/${id}`, { token }),
  createCourse: async (token: string, data: Record<string, unknown>) => {
    const csrfToken = await getCsrfToken()
    return apiRequest("/instructor/courses", {
      method: "POST",
      token,
      body: data,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
  updateCourse: async (token: string, id: string, data: Record<string, unknown>) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/courses/${id}`, {
      method: "PUT",
      token,
      body: data,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
  deleteCourse: async (token: string, id: string) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/courses/${id}`, {
      method: "DELETE",
      token,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
  publishCourse: async (token: string, id: string) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/courses/${id}/publish`, {
      method: "PATCH",
      token,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },

  // Modules
  createModule: async (token: string, courseId: string, data: Record<string, unknown>) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/courses/${courseId}/modules`, {
      method: "POST",
      token,
      body: data,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
  updateModule: async (token: string, id: string, data: Record<string, unknown>) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/modules/${id}`, {
      method: "PUT",
      token,
      body: data,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
  deleteModule: async (token: string, id: string) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/modules/${id}`, {
      method: "DELETE",
      token,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },

  // Lessons
  createLesson: async (token: string, moduleId: string, data: Record<string, unknown>) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/modules/${moduleId}/lessons`, {
      method: "POST",
      token,
      body: data,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
  updateLesson: async (token: string, id: string, data: Record<string, unknown>) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/lessons/${id}`, {
      method: "PUT",
      token,
      body: data,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
  deleteLesson: async (token: string, id: string) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/lessons/${id}`, {
      method: "DELETE",
      token,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },

  // Quizzes
  createQuiz: async (token: string, courseId: string, data: Record<string, unknown>) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/courses/${courseId}/quizzes`, {
      method: "POST",
      token,
      body: data,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
  updateQuiz: async (token: string, id: string, data: Record<string, unknown>) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/quizzes/${id}`, {
      method: "PUT",
      token,
      body: data,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
  deleteQuiz: async (token: string, id: string) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/quizzes/${id}`, {
      method: "DELETE",
      token,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },

  // Students & analytics
  getStudents: (token: string, courseId: string) =>
    apiRequest(`/instructor/courses/${courseId}/students`, { token }),
  getAnalytics: (token: string, courseId: string) =>
    apiRequest(`/instructor/courses/${courseId}/analytics`, { token }),

  // Announcements
  listAnnouncements: (token: string, courseId: string) =>
    apiRequest(`/instructor/courses/${courseId}/announcements`, { token }),
  createAnnouncement: async (token: string, courseId: string, data: Record<string, unknown>) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/courses/${courseId}/announcements`, {
      method: "POST",
      token,
      body: data,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
  deleteAnnouncement: async (token: string, id: string) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/announcements/${id}`, {
      method: "DELETE",
      token,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },

  // Submissions
  listSubmissions: (token: string, params?: string) =>
    apiRequest(`/instructor/submissions${params ? `?${params}` : ""}`, { token }),
  gradeSubmission: async (token: string, id: string, data: Record<string, unknown>) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/submissions/${id}/grade`, {
      method: "PATCH",
      token,
      body: data,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },

  // Notifications
  listNotifications: (token: string, params?: string) =>
    apiRequest(`/instructor/notifications${params ? `?${params}` : ""}`, { token }),
  markNotificationRead: async (token: string, id: string) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/notifications/${id}/read`, {
      method: "PATCH",
      token,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
  markAllNotificationsRead: async (token: string) => {
    const csrfToken = await getCsrfToken()
    return apiRequest("/instructor/notifications/read-all", {
      method: "PATCH",
      token,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
  deleteNotification: async (token: string, id: string) => {
    const csrfToken = await getCsrfToken()
    return apiRequest(`/instructor/notifications/${id}`, {
      method: "DELETE",
      token,
      headers: { "X-CSRF-Token": csrfToken },
    })
  },
}

// Student APIs
export const studentApi = {
  // Course Discovery
  discoverCourses: (token: string, params?: string) =>
    apiRequest(`/student/courses${params ? `?${params}` : ""}`, { token }),
  getCourseDetail: (token: string, id: string) =>
    apiRequest(`/student/courses/${id}`, { token }),
  
  // Enrollment
  enrollInCourse: (token: string, courseId: string) =>
    apiRequest(`/student/enroll/${courseId}`, { method: "POST", token }),
  getMyEnrollments: (token: string, params?: string) =>
    apiRequest(`/student/enrollments${params ? `?${params}` : ""}`, { token }),
  
  // Progress
  markLectureComplete: (token: string, lectureId: string, data: { timeSpent?: number; score?: number }) =>
    apiRequest(`/student/progress/lecture/${lectureId}`, { method: "PATCH", token, body: data }),
  getResumeLesson: (token: string, courseId: string) =>
    apiRequest(`/student/resume/${courseId}`, { token }),
  
  // Reviews
  createOrUpdateReview: (token: string, courseId: string, data: { rating: number; comment?: string }) =>
    apiRequest(`/student/reviews/${courseId}`, { method: "POST", token, body: data }),
  getCourseReviews: (token: string, courseId: string, params?: string) =>
    apiRequest(`/student/reviews/${courseId}${params ? `?${params}` : ""}`, { token }),
  
  // Dashboard
  getDashboard: (token: string) =>
    apiRequest("/student/dashboard", { token }),
}

// Org Admin APIs
export const adminApi = {
  // Dashboard
  metrics: (token: string) =>
    apiRequest("/api/admin/dashboard/metrics", { token }),
  activities: (token: string, limit?: number) =>
    apiRequest(`/api/admin/dashboard/activities${limit ? `?limit=${limit}` : ""}`, { token }),
  
  // User Management
  listUsers: (token: string, params?: string) =>
    apiRequest(`/api/admin/users${params ? `?${params}` : ""}`, { token }),
  getUser: (token: string, id: string) =>
    apiRequest(`/api/admin/users/${id}`, { token }),
  createUser: (token: string, data: Record<string, unknown>) =>
    apiRequest("/api/admin/users", { method: "POST", token, body: data }),
  updateUser: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/api/admin/users/${id}`, { method: "PUT", token, body: data }),
  assignRole: (token: string, id: string, role: string) =>
    apiRequest(`/api/admin/users/${id}/assign-role`, { method: "POST", token, body: { role } }),
  updateUserStatus: (token: string, id: string, isActive: boolean) =>
    apiRequest(`/api/admin/users/${id}/status`, { method: "PATCH", token, body: { isActive } }),
  deleteUser: (token: string, id: string) =>
    apiRequest(`/api/admin/users/${id}`, { method: "DELETE", token }),
  
  // Course Management
  listCourses: (token: string, params?: string) =>
    apiRequest(`/api/admin/courses${params ? `?${params}` : ""}`, { token }),
  getCourse: (token: string, id: string) =>
    apiRequest(`/api/admin/courses/${id}`, { token }),
  publishCourse: (token: string, id: string, isPublished: boolean) =>
    apiRequest(`/api/admin/courses/${id}/publish`, { method: "PUT", token, body: { isPublished } }),
  assignInstructor: (token: string, id: string, instructorId: string) =>
    apiRequest(`/api/admin/courses/${id}/assign-instructor`, { method: "PUT", token, body: { instructorId } }),
  
  // Attendance
  attendanceSummary: (token: string) =>
    apiRequest("/api/admin/attendance/summary", { token }),
  studentAttendance: (token: string, studentId: string) =>
    apiRequest(`/api/admin/attendance/student/${studentId}`, { token }),
  instructorAttendance: (token: string, instructorId: string) =>
    apiRequest(`/api/admin/attendance/instructor/${instructorId}`, { token }),
  
  // Grades
  listGrades: (token: string, params?: string) =>
    apiRequest(`/api/admin/grades${params ? `?${params}` : ""}`, { token }),
  courseGrades: (token: string, courseId: string) =>
    apiRequest(`/api/admin/grades/course/${courseId}`, { token }),
  exportGrades: (token: string, data: Record<string, unknown>) =>
    apiRequest("/api/admin/grades/export", { method: "POST", token, body: data }),
}
