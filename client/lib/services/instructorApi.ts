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
// AI QUIZZES
// ============================================
export const generateAIQuiz = async (data: {
  courseId: string;
  prompt: string;
  difficulty: string;
  numQuestions: number
}): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post('/api/quizzes/generate-ai', {
      course_id: data.courseId,      // Backend expects course_id (snake_case)
      topic: data.prompt,            // Backend expects topic, not prompt
      difficulty: data.difficulty,
      num_questions: data.numQuestions  // Backend expects num_questions
    })
    // Normalize: backend returns { success, data: { questions, course_id, topic } }
    // Page expects { success, data: { quiz: { title, questions } } }
    const raw = response.data
    if (raw.success && raw.data?.questions) {
      return {
        success: true,
        data: {
          quiz: {
            title: `AI Quiz: ${data.prompt.slice(0, 40)}`,
            questions: raw.data.questions,
            course_id: raw.data.course_id,
            _id: null  // Draft, not saved yet — use null
          }
        }
      }
    }
    return raw
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'AI generation failed'
    }
  }
}

export const publishQuiz = async (quizId: string): Promise<ApiResponse> => {
  // PATCH /api/quizzes/:id/publish (not POST)
  const response = await apiClient.patch(`/api/quizzes/${quizId}/publish`)
  return response.data
}

export const getInstructorQuizzes = async (courseId?: string): Promise<ApiResponse> => {
  // Use the standard quizzes list endpoint which scopes by organization + instructor
  const params: Record<string, string> = {}
  if (courseId) params.course_id = courseId
  try {
    const response = await apiClient.get('/api/quizzes', { params })
    // Backend may return { success, data: [...quiz] } or { success, data: { quizzes: [...] } }
    const raw = response.data
    if (raw.success) {
      const quizList = raw.data?.quizzes || raw.data || []
      return { success: true, data: quizList }
    }
    return raw
  } catch {
    return { success: true, data: [] } // Return empty on error to not crash the page
  }
}

// ============================================
// LIVE CLASSES
// ============================================
export const scheduleLiveClass = async (data: any): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post('/instructor/live-classes', data)
    return response.data
  } catch (error: any) {
    console.error('❌ scheduleLiveClass error:', error)

    // Return error in consistent format
    if (error.response?.data) {
      return {
        success: false,
        message: error.response.data.message || error.response.data.error || 'Failed to schedule live class',
        data: error.response.data
      }
    }

    return {
      success: false,
      message: error.message || 'Failed to schedule live class'
    }
  }
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
