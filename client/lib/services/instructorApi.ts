import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for CSRF
})

// CSRF token storage
let csrfToken: string | null = null

// Fetch CSRF token from server
const fetchCsrfToken = async (): Promise<string> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/csrf-token`, {
      withCredentials: true,
    })
    csrfToken = response.data.data.csrfToken
    if (!csrfToken) {
      throw new Error('CSRF token not found in response')
    }
    return csrfToken
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error)
    throw error
  }
}

// Initialize CSRF token on client side
if (typeof window !== 'undefined') {
  fetchCsrfToken().catch(console.error)
}

// Add JWT token and CSRF token to all requests
apiClient.interceptors.request.use(
  async (config) => {
    // Add JWT token
    const token = 
      typeof window !== 'undefined' 
        ? window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
        : null
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add CSRF token for state-changing operations
    if (['post', 'patch', 'delete', 'put'].includes(config.method?.toLowerCase() || '')) {
      // Fetch CSRF token if not available
      if (!csrfToken) {
        try {
          await fetchCsrfToken()
        } catch (error) {
          console.error('Failed to fetch CSRF token for request:', error)
        }
      }
      
      if (csrfToken) {
        config.headers['x-csrf-token'] = csrfToken
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    } else if (error.response?.status === 403 && error.response?.data?.error?.includes('CSRF')) {
      // CSRF token expired or invalid - refetch and retry
      console.log('CSRF token invalid, refetching...')
      try {
        await fetchCsrfToken()
        // Retry the original request with new token
        if (error.config && csrfToken) {
          error.config.headers['x-csrf-token'] = csrfToken
          return apiClient.request(error.config)
        }
      } catch (retryError) {
        console.error('Failed to retry request after CSRF refresh:', retryError)
      }
    }
    return Promise.reject(error)
  }
)

// API Response Type
interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
}

// ============================================
// DASHBOARD
// ============================================
export const getDashboardOverview = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/instructor/dashboard/overview')
  return response.data
}

// ============================================
// COURSES
// ============================================
export const createCourse = async (data: any): Promise<ApiResponse> => {
  const response = await apiClient.post('/instructor/courses', data)
  return response.data
}

export const getCourses = async (params?: {
  page?: number
  limit?: number
  status?: string
}): Promise<ApiResponse> => {
  const response = await apiClient.get('/instructor/courses', { params })
  return response.data
}

export const getCourseById = async (courseId: string): Promise<ApiResponse> => {
  const response = await apiClient.get(`/instructor/courses/${courseId}`)
  return response.data
}

export const updateCourse = async (courseId: string, data: any): Promise<ApiResponse> => {
  const response = await apiClient.put(`/instructor/courses/${courseId}`, data)
  return response.data
}

export const deleteCourse = async (courseId: string): Promise<ApiResponse> => {
  const response = await apiClient.delete(`/instructor/courses/${courseId}`)
  return response.data
}

export const publishCourse = async (courseId: string): Promise<ApiResponse> => {
  const response = await apiClient.patch(`/instructor/courses/${courseId}/publish`)
  return response.data
}

// ============================================
// MODULES (SECTIONS)
// ============================================
export const createModule = async (courseId: string, data: any): Promise<ApiResponse> => {
  const response = await apiClient.post(`/instructor/courses/${courseId}/modules`, data)
  return response.data
}

export const getCourseSections = async (courseId: string): Promise<ApiResponse> => {
  const response = await apiClient.get(`/instructor/courses/${courseId}/sections`)
  return response.data
}

export const updateModule = async (moduleId: string, data: any): Promise<ApiResponse> => {
  const response = await apiClient.put(`/instructor/modules/${moduleId}`, data)
  return response.data
}

export const deleteModule = async (moduleId: string): Promise<ApiResponse> => {
  const response = await apiClient.delete(`/instructor/modules/${moduleId}`)
  return response.data
}

// ============================================
// LESSONS
// ============================================
export const createLesson = async (moduleId: string, data: any): Promise<ApiResponse> => {
  const response = await apiClient.post(`/instructor/modules/${moduleId}/lessons`, data)
  return response.data
}

export const getSectionLessons = async (sectionId: string): Promise<ApiResponse> => {
  const response = await apiClient.get(`/instructor/sections/${sectionId}/lessons`)
  return response.data
}

export const updateLesson = async (lessonId: string, data: any): Promise<ApiResponse> => {
  const response = await apiClient.put(`/instructor/lessons/${lessonId}`, data)
  return response.data
}

export const deleteLesson = async (lessonId: string): Promise<ApiResponse> => {
  const response = await apiClient.delete(`/instructor/lessons/${lessonId}`)
  return response.data
}

// ============================================
// QUIZZES
// ============================================
export const createQuiz = async (courseId: string, data: any): Promise<ApiResponse> => {
  const response = await apiClient.post(`/instructor/courses/${courseId}/quizzes`, data)
  return response.data
}

export const updateQuiz = async (quizId: string, data: any): Promise<ApiResponse> => {
  const response = await apiClient.put(`/instructor/quizzes/${quizId}`, data)
  return response.data
}

export const deleteQuiz = async (quizId: string): Promise<ApiResponse> => {
  const response = await apiClient.delete(`/instructor/quizzes/${quizId}`)
  return response.data
}

// ============================================
// LIVE CLASSES
// ============================================
export const scheduleLiveClass = async (data: any): Promise<ApiResponse> => {
  const response = await apiClient.post('/instructor/live-classes', data)
  return response.data
}

export const getLiveClasses = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/instructor/live-classes')
  return response.data
}

export const updateLiveClass = async (classId: string, data: any): Promise<ApiResponse> => {
  const response = await apiClient.patch(`/instructor/live-classes/${classId}`, data)
  return response.data
}

export const cancelLiveClass = async (classId: string): Promise<ApiResponse> => {
  const response = await apiClient.delete(`/instructor/live-classes/${classId}`)
  return response.data
}

// ============================================
// STUDENTS & ANALYTICS
// ============================================
export const getCourseStudents = async (courseId: string): Promise<ApiResponse> => {
  const response = await apiClient.get(`/instructor/courses/${courseId}/students`)
  return response.data
}

export const getCourseAnalytics = async (courseId: string): Promise<ApiResponse> => {
  const response = await apiClient.get(`/instructor/courses/${courseId}/analytics`)
  return response.data
}

// ============================================
// ANNOUNCEMENTS
// ============================================
export const createAnnouncement = async (courseId: string, data: any): Promise<ApiResponse> => {
  const response = await apiClient.post(`/instructor/courses/${courseId}/announcements`, data)
  return response.data
}

export const getAnnouncements = async (courseId: string): Promise<ApiResponse> => {
  const response = await apiClient.get(`/instructor/courses/${courseId}/announcements`)
  return response.data
}

export const deleteAnnouncement = async (announcementId: string): Promise<ApiResponse> => {
  const response = await apiClient.delete(`/instructor/announcements/${announcementId}`)
  return response.data
}

// ============================================
// SUBMISSIONS
// ============================================
export const getSubmissions = async (params?: {
  page?: number
  limit?: number
  courseId?: string
  status?: string
}): Promise<ApiResponse> => {
  const response = await apiClient.get('/instructor/submissions', { params })
  return response.data
}

export const gradeSubmission = async (submissionId: string, data: {
  earned_score?: number
  comments?: string
  rubric_scores?: any[]
}): Promise<ApiResponse> => {
  const response = await apiClient.patch(`/instructor/submissions/${submissionId}/grade`, data)
  return response.data
}

// ============================================
// NOTIFICATIONS
// ============================================
export const getNotifications = async (params?: {
  page?: number
  limit?: number
  status?: string
}): Promise<ApiResponse> => {
  const response = await apiClient.get('/instructor/notifications', { params })
  return response.data
}

export const markNotificationRead = async (notificationId: string): Promise<ApiResponse> => {
  const response = await apiClient.patch(`/instructor/notifications/${notificationId}/read`)
  return response.data
}

export const markAllNotificationsRead = async (): Promise<ApiResponse> => {
  const response = await apiClient.patch('/instructor/notifications/read-all')
  return response.data
}

export const deleteNotification = async (notificationId: string): Promise<ApiResponse> => {
  const response = await apiClient.delete(`/instructor/notifications/${notificationId}`)
  return response.data
}

export default apiClient
