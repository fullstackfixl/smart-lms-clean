import { API_URL } from './config'
const API_BASE = API_URL

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
    credentials: 'include',
  }

  if (body && method !== "GET") {
    const bodyString = JSON.stringify(body)
    console.log(`📝 [API BODY] ${method} ${endpoint}:`, bodyString.substring(0, 500))
    console.log(`📝 [API BODY LENGTH] ${bodyString.length} characters`)
    config.body = bodyString
  } else {
    console.log(`📝 [API BODY] ${method} ${endpoint}: NO BODY`)
  }

  // Add timeout signal - 30 seconds for submission operations
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
  config.signal = controller.signal

  const fullUrl = `${API_BASE}${endpoint}`
  console.log(`🌐 [API] ${method} ${fullUrl}`)

  try {
    const response = await fetch(fullUrl, config)
    clearTimeout(timeoutId)

    let data
    try {
      data = await response.json()
    } catch (parseError) {
      return {
        success: false,
        error: "Invalid response from server",
      }
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `Request failed with status ${response.status}`,
      }
    }

    return { success: true, data: data.data || data, pagination: data.pagination }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: "Request timed out. Please check if the server is running.",
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    }
  }
}

// Auth APIs
export const authApi = {
  register: (data: any) =>
    apiRequest("/auth/register", { method: "POST", body: data }),
  applyOrganization: (data: any) =>
    apiRequest("/auth/apply-organization", { method: "POST", body: data }),
  completeOrganizationRegistration: (data: { token: string; name?: string; password: string }) =>
    apiRequest("/auth/complete-organization-registration", { method: "POST", body: data }),
  acceptInvite: (data: any) =>
    apiRequest("/auth/accept-invite", { method: "POST", body: data }),
  registerRequestOtp: (data: { email: string; name: string; role: string; organization_code?: string; organization_name?: string }) =>
    apiRequest("/auth/register/request-otp", { method: "POST", body: data }),
  verifyOtp: (data: { email: string; otp: string }) =>
    apiRequest("/auth/register/verify-otp", { method: "POST", body: data }),
  resendOtp: (email: string) =>
    apiRequest("/auth/register/resend-otp", { method: "POST", body: { email } }),
  createSuperAdmin: (data: any) =>
    apiRequest("/platform/create-super-admin", { method: "POST", body: data }),
  login: (data: { email: string; password: string }) =>
    apiRequest("/auth/login", { method: "POST", body: data }),
  platformAdminLogin: (data: { email: string; password: string }) =>
    apiRequest("/auth/platform-admin/login", { method: "POST", body: data }),
  platformStaffLogin: (data: { email: string; password: string }) =>
    apiRequest("/auth/platform-staff/login", { method: "POST", body: data }),
  orgAdminLogin: (data: { email: string; password: string }) =>
    apiRequest("/auth/org-admin/login", { method: "POST", body: data }),
  logout: (token: string) =>
    apiRequest("/auth/logout", { method: "POST", token }),
  forgotPassword: (email: string) =>
    apiRequest("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (token: string, password: string) =>
    apiRequest(`/auth/reset-password/${token}`, { method: "POST", body: { password } }),
  getMe: (token: string) =>
    apiRequest("/auth/me", { token }),
  updateMe: (token: string, data: Record<string, unknown>) =>
    apiRequest("/auth/me", { method: "PUT", token, body: data }),
  refresh: (token: string) =>
    apiRequest("/auth/refresh", { method: "POST", token }),
}

// College tenant APIs
export const collegeApi = {
  // Dashboards
  adminDashboard: (token: string) =>
    apiRequest('/api/college/admin/dashboard', { token }),
  instructorDashboard: (token: string) =>
    apiRequest('/api/college/instructor/dashboard', { token }),
  studentDashboard: (token: string) =>
    apiRequest('/api/college/student/dashboard', { token }),

  // Org Admin (direct chain routes)
  assignLearnerToProgramBatch: (token: string, data: { studentId: string; programId: string; batchId: string }) =>
    apiRequest('/org-admin/learners/assign', { method: 'POST', token, body: data }),

  // Student (direct chain routes)
  getStudentBatchTimetable: (token: string, params?: string) =>
    apiRequest(`/student/timetable${params ? `?${params}` : ''}`, { token }),

  // Instructor (direct chain routes)
  getInstructorTimetable: (token: string, params?: string) =>
    apiRequest(`/instructor/timetable${params ? `?${params}` : ''}`, { token }),

  assignInstructorToBatchSubject: (token: string, data: { subjectId: string; batchId: string; instructorId: string }) =>
    apiRequest('/api/admin/instructor-assignments', { method: 'POST', token, body: data }),

  // Admin - Departments
  listDepartments: (token: string) =>
    apiRequest("/api/college/admin/departments", { token }),
  createDepartment: (token: string, data: Record<string, unknown>) =>
    apiRequest("/api/college/admin/departments", { method: "POST", token, body: data }),
  getDepartment: (token: string, id: string) =>
    apiRequest(`/api/college/admin/departments/${id}`, { token }),
  updateDepartment: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/api/college/admin/departments/${id}`, { method: "PUT", token, body: data }),
  deleteDepartment: (token: string, id: string) =>
    apiRequest(`/api/college/admin/departments/${id}`, { method: "DELETE", token }),

  // Admin - Batches
  listBatches: (token: string, params?: string) =>
    apiRequest(`/api/college/admin/batches${params ? `?${params}` : ''}`, { token }),
  createBatch: (token: string, data: Record<string, unknown>) =>
    apiRequest('/api/college/admin/batches', { method: 'POST', token, body: data }),
  getBatch: (token: string, id: string) =>
    apiRequest(`/api/college/admin/batches/${id}`, { token }),
  updateBatch: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/api/college/admin/batches/${id}`, { method: 'PUT', token, body: data }),
  deleteBatch: (token: string, id: string) =>
    apiRequest(`/api/college/admin/batches/${id}`, { method: 'DELETE', token }),

  // Admin - Students
  listStudents: (token: string, params?: string) =>
    apiRequest(`/api/college/admin/students${params ? `?${params}` : ''}`, { token }),
  createStudent: (token: string, data: Record<string, unknown>) =>
    apiRequest('/api/college/admin/students', { method: 'POST', token, body: data }),
  getStudent: (token: string, id: string) =>
    apiRequest(`/api/college/admin/students/${id}`, { token }),
  updateStudent: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/api/college/admin/students/${id}`, { method: 'PUT', token, body: data }),
  deleteStudent: (token: string, id: string) =>
    apiRequest(`/api/college/admin/students/${id}`, { method: 'DELETE', token }),

  // Admin - Instructors
  listInstructors: (token: string, params?: string) =>
    apiRequest(`/api/college/admin/instructors${params ? `?${params}` : ''}`, { token }),
  createInstructor: (token: string, data: Record<string, unknown>) =>
    apiRequest('/api/college/admin/instructors', { method: 'POST', token, body: data }),
  getInstructor: (token: string, id: string) =>
    apiRequest(`/api/college/admin/instructors/${id}`, { token }),
  updateInstructor: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/api/college/admin/instructors/${id}`, { method: 'PUT', token, body: data }),
  deleteInstructor: (token: string, id: string) =>
    apiRequest(`/api/college/admin/instructors/${id}`, { method: 'DELETE', token }),

  // Admin - Courses
  listCollegeCourses: (token: string, params?: string) =>
    apiRequest(`/api/college/admin/courses${params ? `?${params}` : ''}`, { token }),
  getCollegeCourse: (token: string, id: string) =>
    apiRequest(`/api/college/admin/courses/${id}`, { token }),

  // Admin - Attendance
  listAdminAttendance: (token: string, params?: string) =>
    apiRequest(`/api/college/admin/attendance/records${params ? `?${params}` : ''}`, { token }),
  getAdminAttendanceDashboard: (token: string) =>
    apiRequest('/api/college/admin/attendance/dashboard', { token }),
  getAdminStudentReport: (token: string, studentId: string) =>
    apiRequest(`/api/college/admin/attendance/student-report/${studentId}`, { token }),
  getAdminBatchSummary: (token: string, batchId: string) =>
    apiRequest(`/api/college/admin/attendance/batch-summary/${batchId}`, { token }),

  // Admin - Events
  listAdminEvents: (token: string, params?: string) =>
    apiRequest(`/api/college/admin/events${params ? `?${params}` : ''}`, { token }),
  createEvent: (token: string, data: Record<string, unknown>) =>
    apiRequest('/api/college/admin/events', { method: 'POST', token, body: data }),
  updateEvent: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/api/college/admin/events/${id}`, { method: 'PUT', token, body: data }),
  deleteEvent: (token: string, id: string) =>
    apiRequest(`/api/college/admin/events/${id}`, { method: 'DELETE', token }),

  // Admin - Analytics
  getAnalytics: (token: string) =>
    apiRequest('/api/college/admin/analytics', { token }),

  // Instructor - Courses
  getInstructorCourses: (token: string) =>
    apiRequest('/api/college/instructor/courses', { token }),
  getInstructorCourse: (token: string, id: string) =>
    apiRequest(`/api/college/instructor/courses/${id}`, { token }),

  // Instructor - Students
  getInstructorStudents: (token: string) =>
    apiRequest('/api/college/instructor/students', { token }),
  getInstructorStudent: (token: string, id: string) =>
    apiRequest(`/api/college/instructor/students/${id}`, { token }),

  // Instructor - Attendance
  getAssignedSessions: (token: string) =>
    apiRequest('/api/college/instructor/attendance/assigned-sessions', { token }),
  getStudentsForAttendance: (token: string, subjectId: string, batchId: string) =>
    apiRequest(`/api/college/instructor/attendance/students-for-attendance/${subjectId}/${batchId}`, { token }),
  markAttendance: (token: string, data: Record<string, unknown>) =>
    apiRequest('/api/college/instructor/attendance/mark-attendance', { method: 'POST', token, body: data }),
  getInstructorAttendance: (token: string, params?: string) =>
    apiRequest(`/api/college/instructor/attendance/attendance-history${params ? `?${params}` : ''}`, { token }),

  // Instructor - Live Classes
  getInstructorLiveClasses: (token: string) =>
    apiRequest('/api/college/instructor/live-classes', { token }),

  // Instructor - Quizzes
  getInstructorQuizzes: (token: string) =>
    apiRequest('/api/college/instructor/quizzes', { token }),

  // Instructor - Events
  getInstructorEvents: (token: string, params?: string) =>
    apiRequest(`/api/college/instructor/events${params ? `?${params}` : ''}`, { token }),

  // Instructor - Analytics
  getInstructorAnalytics: (token: string) =>
    apiRequest('/api/college/instructor/analytics', { token }),

  // Student - Courses
  getStudentCourses: (token: string) =>
    apiRequest('/api/college/student/courses', { token }),
  getStudentCourse: (token: string, id: string) =>
    apiRequest(`/api/college/student/courses/${id}`, { token }),
  browseCourses: (token: string, params?: string) =>
    apiRequest(`/api/college/student/browse-courses${params ? `?${params}` : ''}`, { token }),
  enrollInCourse: (token: string, courseId: string) =>
    apiRequest(`/api/college/student/courses/${courseId}/enroll`, { method: 'POST', token }),

  // Student - Attendance
  getStudentAttendance: (token: string, params?: string) =>
    apiRequest(`/api/college/student/attendance/my-attendance${params ? `?${params}` : ''}`, { token }),
  getStudentAttendanceBySubject: (token: string, subjectId: string) =>
    apiRequest(`/api/college/student/attendance/attendance-by-subject/${subjectId}`, { token }),

  // Student - Quizzes
  getStudentQuizzes: (token: string) =>
    apiRequest('/api/college/student/quizzes', { token }),

  // Student - Assignments
  getStudentAssignments: (token: string) =>
    apiRequest('/api/college/student/assignments', { token }),

  // Student - Live Classes
  getStudentLiveClasses: (token: string) =>
    apiRequest('/api/college/student/live-classes', { token }),

  // Student - Events
  getStudentEvents: (token: string, params?: string) =>
    apiRequest(`/api/college/student/events${params ? `?${params}` : ''}`, { token }),

  // Student - Certificates
  getStudentCertificates: (token: string) =>
    apiRequest('/api/college/student/certificates', { token }),

  // Student - Progress
  getStudentProgress: (token: string) =>
    apiRequest('/api/college/student/progress', { token }),

  // Student - Grades
  getStudentGrades: (token: string, params?: string) =>
    apiRequest(`/api/college/student/grades${params ? `?${params}` : ''}`, { token }),

  // Student - Timetable
  getStudentTimetable: (token: string, params?: string) =>
    apiRequest(`/api/college/student/timetable${params ? `?${params}` : ''}`, { token }),

  // Student - Subjects
  getMySubjects: (token: string) =>
    apiRequest('/api/college/student/subjects', { token }),

  // Student - Announcements
  getStudentAnnouncements: (token: string, params?: string) =>
    apiRequest(`/api/college/student/announcements${params ? `?${params}` : ''}`, { token }),

  // Student - Results
  getStudentResults: (token: string, params?: string) =>
    apiRequest(`/api/college/student/results${params ? `?${params}` : ''}`, { token }),

  // Student - Exams
  getStudentExams: (token: string, params?: string) =>
    apiRequest(`/api/college/student/exams${params ? `?${params}` : ''}`, { token }),

  // Student actions
  joinLiveClass: (token: string, liveClassId: string) =>
    apiRequest(`/api/live-classes/${liveClassId}/join`, { token }),
  submitQuiz: (token: string, quizId: string, data: Record<string, unknown>) =>
    apiRequest(`/api/quizzes/${quizId}/submit`, { method: 'POST', token, body: data }),

  // Admin - Academic Programs
  listPrograms: (token: string) =>
    apiRequest('/api/college/admin/programs', { token }),
  createProgram: (token: string, data: Record<string, unknown>) =>
    apiRequest('/api/college/admin/programs', { method: 'POST', token, body: data }),
  getProgram: (token: string, id: string) =>
    apiRequest(`/api/college/admin/programs/${id}`, { token }),
  updateProgram: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/api/college/admin/programs/${id}`, { method: 'PUT', token, body: data }),
  deleteProgram: (token: string, id: string) =>
    apiRequest(`/api/college/admin/programs/${id}`, { method: 'DELETE', token }),

  // Admin - Subjects
  listSubjects: (token: string, params?: string) =>
    apiRequest(`/api/college/admin/subjects${params ? `?${params}` : ''}`, { token }),
  createSubject: (token: string, data: Record<string, unknown>) =>
    apiRequest('/api/college/admin/subjects', { method: 'POST', token, body: data }),
  getProgramSubjects: (token: string, programId: string) =>
    apiRequest(`/api/college/admin/programs/${programId}/subjects`, { token }),
  updateSubject: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/api/college/admin/subjects/${id}`, { method: 'PUT', token, body: data }),
  deleteSubject: (token: string, id: string) =>
    apiRequest(`/api/college/admin/subjects/${id}`, { method: 'DELETE', token }),
  assignInstructorToSubject: (token: string, id: string, instructorId: string) =>
    apiRequest(`/api/college/admin/subjects/${id}/assign-instructor`, { method: 'PUT', token, body: { instructorId } }),

  // Admin - Timetable
  listTimetable: (token: string, params?: string) =>
    apiRequest(`/api/college/admin/timetable${params ? `?${params}` : ''}`, { token }),
  createTimetableEntry: (token: string, data: Record<string, unknown>) =>
    apiRequest('/api/college/admin/timetable', { method: 'POST', token, body: data }),
  deleteTimetableEntry: (token: string, id: string) =>
    apiRequest(`/api/college/admin/timetable/${id}`, { method: 'DELETE', token }),

  // Admin - Attendance Summary (alias for dashboard)
  getAttendanceSummary: (token: string, params?: string) =>
    apiRequest(`/api/college/admin/attendance/dashboard${params ? `?${params}` : ''}`, { token }),

  // Admin - Course Approval
  listPendingCourses: (token: string) =>
    apiRequest('/api/college/admin/courses/pending', { token }),
  approveCourse: (token: string, id: string, data?: { status?: string; rejectionReason?: string }) =>
    apiRequest(`/api/college/admin/courses/${id}/approve`, { method: 'PATCH', token, body: data || {} }),
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
    apiRequest(`/api/grades/student/${userId}`, { token }),
  getCourse: (token: string, courseId: string) =>
    apiRequest(`/api/grades/course/${courseId}`, { token }),
}

// Assignments APIs
export const assignmentApi = {
  list: (token: string, params?: string) =>
    apiRequest(`/api/assignments${params ? `?${params}` : ""}`, { token }),
  get: (token: string, id: string) =>
    apiRequest(`/api/assignments/${id}`, { token }),
  create: (token: string, data: Record<string, unknown>) =>
    apiRequest('/api/assignments', { method: 'POST', token, body: data }),
  update: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/api/assignments/${id}`, { method: 'PUT', token, body: data }),
  remove: (token: string, id: string) =>
    apiRequest(`/api/assignments/${id}`, { method: 'DELETE', token })
}

// Submissions APIs
export const submissionApi = {
  list: (token: string, params?: string) =>
    apiRequest(`/api/submissions${params ? `?${params}` : ""}`, { token }),
  get: (token: string, id: string) =>
    apiRequest(`/api/submissions/${id}`, { token }),
  create: (token: string, data: Record<string, unknown>) =>
    apiRequest('/api/submissions', { method: 'POST', token, body: data }),
  grade: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/api/submissions/${id}/grade`, { method: 'PATCH', token, body: data }),
  remove: (token: string, id: string) =>
    apiRequest(`/api/submissions/${id}`, { method: 'DELETE', token })
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
  schedule: (token: string, data: Record<string, unknown>) =>
    apiRequest("/instructor/live-classes", {
      method: "POST",
      token,
      body: data,
    }),
  listInstructor: (token: string, params?: string) =>
    apiRequest(`/instructor/live-classes${params ? `?${params}` : ""}`, { token }),
  update: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/instructor/live-classes/${id}`, {
      method: "PATCH",
      token,
      body: data,
    }),
  cancel: (token: string, id: string) =>
    apiRequest(`/instructor/live-classes/${id}`, {
      method: "DELETE",
      token,
    }),

  // Student endpoints
  upcoming: (token: string) =>
    apiRequest("/student/live-classes/upcoming", { token }),
  join: (token: string, id: string) =>
    apiRequest(`/student/live-classes/${id}/join`, {
      method: "POST",
      token,
    }),
}

// Notification APIs
export const notificationApi = {
  list: (token: string, params?: string) =>
    apiRequest(`/notifications${params ? `?${params}` : ""}`, { token }),
  markAsRead: (token: string, id: string) =>
    apiRequest(`/notifications/${id}/read`, {
      method: "PUT",
      token,
    }),
  markAllAsRead: (token: string) =>
    apiRequest("/notifications/mark-all-read", {
      method: "PUT",
      token,
    }),
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
  // Organizations
  createOrg: async (token: string, data: {
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
    return apiRequest("/api/platform/organizations", {
      method: "POST",
      token,
      body: data
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
    return apiRequest(`/api/platform/organizations${query ? `?${query}` : ""}`, { token })
  },

  getOrg: (token: string, id: string) =>
    apiRequest(`/api/platform/organizations/${id}`, { token }),

  updateOrg: async (token: string, id: string, data: {
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
    return apiRequest(`/api/platform/organizations/${id}`, {
      method: "PUT",
      token,
      body: data
    })
  },

  suspendOrg: async (token: string, id: string) => {
    return apiRequest(`/api/platform/organizations/${id}/suspend`, {
      method: "PATCH",
      token
    })
  },
  activateOrg: async (token: string, id: string) => {
    return apiRequest(`/api/platform/organizations/${id}/activate`, {
      method: "PATCH",
      token
    })
  },

  deleteOrg: async (token: string, id: string) => {
    return apiRequest(`/api/platform/organizations/${id}`, {
      method: "DELETE",
      token
    })
  },

  restoreOrg: async (token: string, id: string) => {
    return apiRequest(`/api/platform/organizations/${id}/restore`, {
      method: "POST",
      token
    })
  },

  getOrgStats: (token?: string) =>
    apiRequest("/api/platform/organizations/stats", { token }),

  analytics: (token: string) =>
    apiRequest("/api/platform/analytics", { token }),
  revenue: (token: string) =>
    apiRequest("/api/platform/revenue", { token }),

  // Dashboard
  getDashboardStats: (token?: string) =>
    apiRequest("/api/platform/dashboard/stats", { token }),
  getGlobalAnalytics: (token?: string, period?: string) =>
    apiRequest(`/api/platform/analytics/global${period ? `?period=${period}` : ""}`, { token }),
  getRevenueAnalytics: (token?: string) =>
    apiRequest("/api/platform/analytics/revenue", { token }),

  // Platform Admins
  listAdmins: (token: string, params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)

    const query = queryParams.toString()
    return apiRequest(`/api/platform/admins${query ? `?${query}` : ""}`, { token })
  },

  createAdmin: async (token: string, data: {
    name: string
    email: string
    password: string
  }) => {
    return apiRequest("/api/platform/admins", {
      method: "POST",
      token,
      body: data
    })
  },

  updateAdminStatus: async (token: string, id: string, isActive: boolean) => {
    return apiRequest(`/api/platform/admins/${id}/status`, {
      method: "PATCH",
      token,
      body: { isActive }
    })
  },

  // Users
  listUsers: (token: string, params?: string) =>
    apiRequest(`/api/platform/users${params ? `?${params}` : ""}`, { token }),

  getUserStats: (token: string) =>
    apiRequest("/api/platform/users/stats", { token }),

  updateUserStatus: (token: string, id: string, isActive: boolean) =>
    apiRequest(`/api/platform/users/${id}/status`, {
      method: "PATCH",
      token,
      body: { isActive }
    }),
  getUserDetails: (token: string, id: string) =>
    apiRequest(`/api/platform/users/${id}`, { token }),

  suspendCourse: (token: string, id: string) =>
    apiRequest(`/api/platform/courses/${id}/suspend`, { method: "PATCH", token }),
  
  activateCourse: (token: string, id: string) =>
    apiRequest(`/api/platform/courses/${id}/activate`, { method: "PATCH", token }),

  // Organization Applications
  listApplications: (token: string, status: string = 'pending') =>
    apiRequest(`/api/platform/applications?status=${status}`, { token }),
  claimApplication: (token: string, id: string) =>
    apiRequest(`/api/platform/applications/${id}/claim`, { method: "POST", token }),
  contactApplication: (token: string, id: string, data: { contact_notes?: string; follow_up_date?: string }) =>
    apiRequest(`/api/platform/applications/${id}/contact`, { method: "PATCH", token, body: data }),
  approveApplication: (token: string, id: string) =>
    apiRequest(`/api/platform/applications/${id}/approve`, { method: "PATCH", token }),
  rejectApplication: (token: string, id: string, data?: { reason?: string }) =>
    apiRequest(`/api/platform/applications/${id}/reject`, { method: "PATCH", token, body: data || {} }),

  // New Organization Invitation Flow
  createOrgV2: async (token: string, data: {
    orgName: string
    orgType: string
    adminName: string
    adminEmail: string
  }) => {
    return apiRequest("/api/platform/organizations/invite", {
      method: "POST",
      token,
      body: data
    })
  },
  verifyOrgInvite: (token: string) =>
    apiRequest(`/api/platform/org-invite/verify?token=${token}`),
  completeOrgSetup: (data: {
    token: string
    address?: string
    phone?: string
    password?: string
  }) => {
    return apiRequest("/api/platform/org-invite/complete", {
      method: "POST",
      body: data
    })
  },
}

// Instructor APIs
export const instructorApi = {
  dashboardOverview: (token: string) =>
    apiRequest('/instructor/dashboard/overview', { token }),
  // Courses
  listCourses: (token: string, params?: string) =>
    apiRequest(`/instructor/courses${params ? `?${params}` : ""}`, { token }),
  listSubjects: (token: string) =>
    apiRequest('/instructor/subjects', { token }),
  getCourse: (token: string, id: string) =>
    apiRequest(`/instructor/courses/${id}`, { token }),
  createCourse: (token: string, data: Record<string, unknown>) =>
    apiRequest("/instructor/courses", {
      method: "POST",
      token,
      body: data,
    }),
  updateCourse: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/instructor/courses/${id}`, {
      method: "PUT",
      token,
      body: data,
    }),
  deleteCourse: (token: string, id: string) =>
    apiRequest(`/instructor/courses/${id}`, {
      method: "DELETE",
      token,
    }),
  publishCourse: (token: string, id: string) =>
    apiRequest(`/instructor/courses/${id}/publish`, {
      method: "PATCH",
      token,
    }),
  submitCourseForApproval: (token: string, id: string) =>
    apiRequest(`/instructor/courses/${id}/submit-for-approval`, {
      method: "POST",
      token,
    }),

  // Modules
  createModule: (token: string, courseId: string, data: Record<string, unknown>) =>
    apiRequest(`/instructor/courses/${courseId}/modules`, {
      method: "POST",
      token,
      body: data,
    }),
  getCourseSections: (token: string, courseId: string) =>
    apiRequest(`/instructor/courses/${courseId}/sections`, { token }),
  updateModule: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/instructor/modules/${id}`, {
      method: "PUT",
      token,
      body: data,
    }),
  deleteModule: (token: string, id: string) =>
    apiRequest(`/instructor/modules/${id}`, {
      method: "DELETE",
      token,
    }),

  // Lessons
  createLesson: (token: string, moduleId: string, data: Record<string, unknown>) =>
    apiRequest(`/instructor/modules/${moduleId}/lessons`, {
      method: "POST",
      token,
      body: data,
    }),
  getSectionLessons: (token: string, sectionId: string) =>
    apiRequest(`/instructor/sections/${sectionId}/lessons`, { token }),
  updateLesson: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/instructor/lessons/${id}`, {
      method: "PUT",
      token,
      body: data,
    }),
  deleteLesson: (token: string, id: string) =>
    apiRequest(`/instructor/lessons/${id}`, {
      method: "DELETE",
      token,
    }),

  // Quizzes
  createQuiz: (token: string, courseId: string, data: Record<string, unknown>) =>
    apiRequest(`/instructor/courses/${courseId}/quizzes`, {
      method: "POST",
      token,
      body: data,
    }),
  updateQuiz: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/instructor/quizzes/${id}`, {
      method: "PUT",
      token,
      body: data,
    }),
  deleteQuiz: (token: string, id: string) =>
    apiRequest(`/instructor/quizzes/${id}`, {
      method: "DELETE",
      token,
    }),
  // AI-powered quiz generation
  generateAIQuiz: (token: string, data: { course_id?: string; subjectId?: string; batchId?: string; topic: string; num_questions?: number; difficulty?: string }) =>
    apiRequest("/api/quizzes/generate-ai", { method: "POST", token, body: data }),
  createAcademicQuiz: (token: string, data: Record<string, unknown>) =>
    apiRequest('/api/quizzes', { method: 'POST', token, body: data }),
  // Publish / Unpublish quiz
  publishQuiz: (token: string, quizId: string) =>
    apiRequest(`/api/quizzes/${quizId}/publish`, { method: "PATCH", token }),
  unpublishQuiz: (token: string, quizId: string) =>
    apiRequest(`/api/quizzes/${quizId}/unpublish`, { method: "PATCH", token }),
  // List quizzes for a course
  listCourseQuizzes: (token: string, courseId: string) =>
    apiRequest(`/api/quizzes?course_id=${courseId}&limit=100`, { token }),
  // List all quizzes for instructor
  listAllQuizzes: (token: string) =>
    apiRequest(`/api/quizzes?limit=100`, { token }),

  // Students & analytics
  getStudents: (token: string, courseId: string) =>
    apiRequest(`/instructor/courses/${courseId}/students`, { token }),
  getAnalytics: (token: string, courseId: string) =>
    apiRequest(`/instructor/courses/${courseId}/analytics`, { token }),


  // Announcements
  listAnnouncements: (token: string, courseId: string) =>
    apiRequest(`/instructor/courses/${courseId}/announcements`, { token }),
  createAnnouncement: (token: string, courseId: string, data: Record<string, unknown>) =>
    apiRequest(`/instructor/courses/${courseId}/announcements`, {
      method: "POST",
      token,
      body: data,
    }),
  deleteAnnouncement: (token: string, id: string) =>
    apiRequest(`/instructor/announcements/${id}`, {
      method: "DELETE",
      token,
    }),

  // Submissions
  listSubmissions: (token: string, params?: string) =>
    apiRequest(`/instructor/submissions${params ? `?${params}` : ""}`, { token }),
  listQuizSubmissions: (token: string, params?: string) =>
    apiRequest(`/api/quizzes/submissions${params ? `?${params}` : ""}`, { token }),
  getQuizSubmissionById: (token: string, id: string) =>
    apiRequest(`/instructor/quiz-submissions/${id}`, { token }),
  gradeSubmission: (token: string, id: string, data: Record<string, unknown>) =>
    apiRequest(`/instructor/submissions/${id}/grade`, {
      method: "PATCH",
      token,
      body: data,
    }),

  // Live classes
  listLiveClasses: (token: string) =>
    apiRequest('/instructor/live-classes', { token }),
  createLiveClass: (token: string, data: Record<string, unknown>) =>
    apiRequest('/instructor/live-classes', { method: 'POST', token, body: data }),
  deleteLiveClass: (token: string, id: string) =>
    apiRequest(`/instructor/live-classes/${id}`, { method: 'DELETE', token }),

  // Attendance & Gradebook (College/Academic)
  attendanceSummary: (token: string) =>
    apiRequest("/instructor/attendance/summary", { token }),
  getGradebook: (token: string, courseId: string) =>
    apiRequest(`/instructor/gradebook/${courseId}`, { token }),
  updateMarks: (token: string, data: Record<string, unknown>) =>
    apiRequest("/instructor/gradebook/marks", {
      method: "POST",
      token,
      body: data,
    }),

  // Notifications
  listNotifications: (token: string, params?: string) =>
    apiRequest(`/instructor/notifications${params ? `?${params}` : ""}`, { token }),
  markNotificationRead: (token: string, id: string) =>
    apiRequest(`/instructor/notifications/${id}/read`, {
      method: "PATCH",
      token,
    }),
  markAllNotificationsRead: (token: string) =>
    apiRequest("/instructor/notifications/read-all", {
      method: "PATCH",
      token,
    }),
  deleteNotification: (token: string, id: string) =>
    apiRequest(`/instructor/notifications/${id}`, {
      method: "DELETE",
      token,
    }),
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

  // Multi-Tenant Modules
  getModules: (token: string) =>
    apiRequest("/api/admin/modules", { token }),
}

// Messaging APIs
export const messagingApi = {
  getUsers: (token: string, role: 'admin' | 'instructor' | 'student') =>
    apiRequest(`/api/college/messages/users`, { token }),
  
  listConversations: (token: string) =>
    apiRequest("/api/college/messages", { token }),
  
  getConversationMessages: (token: string, conversationId: string) =>
    apiRequest(`/api/college/messages/${conversationId}`, { token }),
    
  getUnreadCount: (token: string) =>
    apiRequest("/api/college/messages/unread-count", { token }),
    
  startConversation: (token: string, receiverId: string) =>
    apiRequest("/api/college/messages/start", {
      method: "POST",
      token,
      body: { receiverId }
    }),
    
  sendMessage: (token: string, conversationId: string, text: string) =>
    apiRequest("/api/college/messages/send", {
      method: "POST",
      token,
      body: { conversationId, text }
    }),

  getUserProfile: (token: string, userId: string) =>
    apiRequest(`/api/college/messages/profile/${userId}`, { token }),
};
