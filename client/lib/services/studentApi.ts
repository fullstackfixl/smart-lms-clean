import axios from 'axios'
import { API_URL } from '../config'

const API_BASE_URL = API_URL

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Add JWT token to all requests
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
export const getDashboard = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/student/dashboard')
  return response.data
}

// ============================================
// COURSES
// ============================================
export const getCourses = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/student/courses')
  return response.data
}

export const getCourseById = async (courseId: string): Promise<ApiResponse> => {
  const response = await apiClient.get(`/student/courses/${courseId}`)
  return response.data
}

export const getPublicCourses = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/public/courses')
  return response.data
}

// ============================================
// ENROLLMENT
// ============================================
export const enrollCourse = async (courseId: string): Promise<ApiResponse> => {
  const response = await apiClient.post(`/student/enroll/${courseId}`)
  return response.data
}

export const getEnrollments = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/student/enrollments')
  return response.data
}

export const getEnrollmentByCourse = async (courseId: string): Promise<ApiResponse> => {
  const response = await apiClient.get(`/student/enrollments/${courseId}`)
  return response.data
}

// ============================================
// PROGRESS
// ============================================
export const markLectureComplete = async (lectureId: string): Promise<ApiResponse> => {
  const response = await apiClient.patch(`/student/progress/lecture/${lectureId}`)
  return response.data
}

export const getLectureProgress = async (lectureId: string): Promise<ApiResponse> => {
  const response = await apiClient.get(`/student/progress/lecture/${lectureId}`)
  return response.data
}

export const getCourseProgress = async (courseId: string): Promise<ApiResponse> => {
  const response = await apiClient.get(`/student/progress/course/${courseId}`)
  return response.data
}

// ============================================
// QUIZZES
// ============================================
export const getQuizzes = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/api/quizzes')
  return response.data
}

export const getQuizById = async (quizId: string): Promise<ApiResponse> => {
  const response = await apiClient.get(`/api/quizzes/${quizId}`)
  return response.data
}

export const submitQuiz = async (quizId: string, answers: any): Promise<ApiResponse> => {
  const response = await apiClient.post(`/api/quizzes/${quizId}/submit`, { answers })
  return response.data
}

export const getQuizResults = async (quizId: string): Promise<ApiResponse> => {
  const response = await apiClient.get(`/api/quizzes/${quizId}/results`)
  return response.data
}

// ============================================
// GRADES
// ============================================
export const getGrades = async (): Promise<ApiResponse> => {
  // Get current user ID from token or context
  const token = typeof window !== 'undefined'
    ? window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
    : null

  if (!token) {
    throw new Error('No authentication token found')
  }

  // Decode token to get user ID (basic decode, not verification)
  const payload = JSON.parse(atob(token.split('.')[1]))
  const userId = payload.userId

  const response = await apiClient.get(`/api/grades/student/${userId}`)
  return response.data
}

// ============================================
// COLLEGE ACADEMIC
// ============================================
export const getTranscript = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/student/transcript')
  return response.data
}

export const getAcademicOverview = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/student/academic-overview')
  return response.data
}

export const getAcademicAttendance = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/student/academic-attendance')
  return response.data
}

export const getSemesters = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/student/semesters')
  return response.data
}

export const getCourseGrades = async (courseId: string): Promise<ApiResponse> => {
  const token = typeof window !== 'undefined'
    ? window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
    : null

  if (!token) {
    throw new Error('No authentication token found')
  }

  const payload = JSON.parse(atob(token.split('.')[1]))
  const userId = payload.userId

  const response = await apiClient.get(`/api/grades/summary/${courseId}/${userId}`)
  return response.data
}

// ============================================
// CERTIFICATES
// ============================================
export const getCertificates = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/api/certificates')
  return response.data
}

export const getCertificateById = async (certificateId: string): Promise<ApiResponse> => {
  const response = await apiClient.get(`/api/certificates/${certificateId}`)
  return response.data
}

export const downloadCertificate = async (certificateId: string): Promise<Blob> => {
  const response = await apiClient.get(`/api/certificates/${certificateId}/download`, {
    responseType: 'blob',
  })
  return response.data
}

// ============================================
// LIVE CLASSES
// ============================================
export const getLiveClasses = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/student/live-classes/upcoming')
  return response.data
}

export const joinLiveClass = async (classId: string): Promise<ApiResponse> => {
  const response = await apiClient.post(`/student/live-classes/${classId}/join`)
  return response.data
}

// ============================================
// NOTIFICATIONS
// ============================================
export const getNotifications = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/notifications')
  return response.data
}

export const markNotificationRead = async (notificationId: string): Promise<ApiResponse> => {
  const response = await apiClient.put(`/notifications/${notificationId}/read`)
  return response.data
}

export const markAllNotificationsRead = async (): Promise<ApiResponse> => {
  const response = await apiClient.put('/notifications/mark-all-read')
  return response.data
}

export const getUnreadCount = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/notifications/unread-count')
  return response.data
}

// ============================================
// LEADERBOARD
// ============================================
export const getLeaderboard = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/student/leaderboard')
  return response.data
}

export const getCourseLeaderboard = async (courseId: string): Promise<ApiResponse> => {
  const response = await apiClient.get(`/student/leaderboard/${courseId}`)
  return response.data
}

// ============================================
// TIMETABLE
// ============================================
export const getTimetable = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/student/timetable')
  return response.data
}

// ============================================
// EVENTS
// ============================================
export const getEvents = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/student/events')
  return response.data
}

export const registerForEvent = async (eventId: string): Promise<ApiResponse> => {
  const response = await apiClient.post(`/student/events/${eventId}/register`)
  return response.data
}

// ============================================
// PROFILE
// ============================================
export const getProfile = async (): Promise<ApiResponse> => {
  const response = await apiClient.get('/student/profile')
  return response.data
}

export const updateProfile = async (data: any): Promise<ApiResponse> => {
  const response = await apiClient.patch('/student/profile', data)
  return response.data
}

export const updateAvatar = async (formData: FormData): Promise<ApiResponse> => {
  const response = await apiClient.post('/student/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

// ============================================
// LECTURE VIDEO
// ============================================
export const getLectureVideo = async (lectureId: string): Promise<ApiResponse> => {
  const response = await apiClient.get(`/student/lectures/${lectureId}`)
  return response.data
}

export const updateVideoProgress = async (
  lectureId: string,
  progress: number,
  completed: boolean
): Promise<ApiResponse> => {
  const response = await apiClient.patch(`/student/lectures/${lectureId}/progress`, {
    progress,
    completed,
  })
  return response.data
}

export default apiClient