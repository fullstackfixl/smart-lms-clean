/**
 * Organization Admin API Service
 * Handles all API calls for organization admin features
 */

import { API_URL } from '../config'

const API_BASE_URL = API_URL;

// Helper to make authenticated requests
async function apiRequest(
  endpoint: string,
  options: any = {}
): Promise<any> {
  const token = options.token;
  if (!token) throw new Error('No authentication token provided');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers as Record<string, string> || {})
  };

  const body = options.body && typeof options.body === 'object'
    ? JSON.stringify(options.body)
    : options.body;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    // Ensure we don't leak token or unstringified body in options
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ...(options.token ? { token: undefined } : {}),
    headers,
    body: body as any,
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

// ==================== DASHBOARD ====================

export async function getDashboardMetrics(token: string) {
  return apiRequest('/api/admin/dashboard/metrics', { token });
}

export async function getDashboardActivities(token: string, limit: number = 10) {
  return apiRequest(`/api/admin/dashboard/activities?limit=${limit}`, { token });
}

export async function getOrgEvents(token: string) {
  return apiRequest('/api/org/events', { token });
}

// ==================== USER MANAGEMENT ====================

export interface GetUsersParams {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
}

export async function getUsers(token: string, params: GetUsersParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.role) queryParams.append('role', params.role);
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.status) queryParams.append('status', params.status);

  const query = queryParams.toString();
  return apiRequest(`/api/admin/users${query ? `?${query}` : ''}`, { token });
}

// Org-admin user creation (invite flow)
export async function createInstructor(token: string, data: { name: string; email: string }) {
  return apiRequest(`/api/org/users/create-instructor`, {
    method: 'POST',
    body: data,
    token
  });
}

export async function createStudent(token: string, data: { name: string; email: string; admissionNumber?: string }) {
  return apiRequest(`/api/org/users/create-student`, {
    method: 'POST',
    body: data,
    token
  });
}

export async function listInstructors(token: string) {
  const res = await apiRequest(`/api/org/users/instructors`, { token });
  if (res?.success && res?.data?.users && Array.isArray(res.data.users)) {
    return { ...res, data: res.data.users };
  }
  return res;
}

export async function listStudents(token: string) {
  const res = await apiRequest(`/api/org/users/students`, { token });
  if (res?.success && res?.data?.users && Array.isArray(res.data.users)) {
    return { ...res, data: res.data.users };
  }
  return res;
}

export async function getUserById(token: string, userId: string) {
  return apiRequest(`/api/admin/users/${userId}`, { token });
}

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'instructor' | 'parent';
  phone?: string;
}

export async function createUser(token: string, data: CreateUserData) {
  return apiRequest('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

export interface UpdateUserData {
  fullName?: string;
  phone?: string;
  email?: string;
}

export async function updateUser(token: string, userId: string, data: UpdateUserData) {
  return apiRequest(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    token,
  });
}

export async function assignUserRole(token: string, userId: string, role: string) {
  return apiRequest(`/api/admin/users/${userId}/assign-role`, {
    method: 'POST',
    body: JSON.stringify({ role }),
    token,
  });
}

export async function updateUserStatus(token: string, userId: string, isActive: boolean) {
  return apiRequest(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
    token,
  });
}

export async function deleteUser(token: string, userId: string) {
  return apiRequest(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    token,
  });
}

// ==================== COURSE MANAGEMENT ====================

export interface GetCoursesParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function getCourses(token: string, params: GetCoursesParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.status) queryParams.append('status', params.status);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const query = queryParams.toString();
  // Regular LMS content courses
  return apiRequest(`/api/admin/courses${query ? `?${query}` : ''}`, { token });
}

export async function createCourse(token: string, data: any) {
  return apiRequest('/api/org-admin/courses', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

export async function getCourseById(token: string, courseId: string) {
  return apiRequest(`/api/admin/courses/${courseId}`, { token });
}

export async function publishCourse(token: string, courseId: string, isPublished: boolean) {
  return apiRequest(`/api/admin/courses/${courseId}/publish`, {
    method: 'PUT',
    body: JSON.stringify({ isPublished }),
    token,
  });
}

export async function assignInstructor(token: string, courseId: string, instructorId: string) {
  return apiRequest(`/api/admin/courses/${courseId}/assign-instructor`, {
    method: 'PUT',
    body: JSON.stringify({ instructorId }),
    token,
  });
}

// ==================== ATTENDANCE ====================

export const attendanceApi = {
  getSummary: (token: string) => apiRequest('/api/attendance/reports/summary', { token }),
  getCourseAttendance: (token: string, courseId: string) => apiRequest(`/api/attendance/course/${courseId}`, { token }),
  getStudentAttendance: (token: string, studentId: string) => apiRequest(`/api/attendance/student/${studentId}`, { token }),
  mark: (token: string, data: any) => apiRequest('/api/attendance/mark', { method: 'POST', body: data, token }),
  update: (token: string, id: string, data: any) => apiRequest(`/api/attendance/${id}`, { method: 'PUT', body: data, token }),
};

// ==================== GRADES & EXAMS ====================

export const gradeApi = {
  list: (token: string, params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/grades${query ? `?${query}` : ''}`, { token });
  },
  getCourseGrades: (token: string, id: string) => apiRequest(`/api/admin/grades/course/${id}`, { token }),
  export: (token: string, data: any) => apiRequest('/api/admin/grades/export', { method: 'POST', body: data, token }),
};

// ==================== FEES ====================

export interface SetFeeData {
  studentId?: string;
  courseId?: string;
  amount: number;
  dueDate: string;
  description?: string;
  type?: string;
}

export async function setFee(token: string, data: SetFeeData) {
  return apiRequest('/api/admin/fees/set', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

export async function getPendingFees(token: string) {
  return apiRequest('/api/admin/fees/pending', { token });
}

export interface GetFeeHistoryParams {
  startDate?: string;
  endDate?: string;
  status?: string;
}

export async function getFeeHistory(token: string, params: GetFeeHistoryParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.status) queryParams.append('status', params.status);

  const query = queryParams.toString();
  return apiRequest(`/api/admin/fees/history${query ? `?${query}` : ''}`, { token });
}

export async function sendFeeReminder(token: string, feeId: string) {
  return apiRequest('/api/admin/fees/reminder', {
    method: 'POST',
    body: JSON.stringify({ feeId }),
    token,
  });
}

// ==================== EVENTS ====================

export interface CreateEventData {
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate?: string;
  location?: string;
  participants?: string[];
}

export async function createEvent(token: string, data: CreateEventData) {
  return apiRequest('/api/admin/events', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

export interface GetEventsParams {
  type?: string;
  startDate?: string;
  endDate?: string;
}

export async function getEvents(token: string, params: GetEventsParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.type) queryParams.append('type', params.type);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const query = queryParams.toString();
  return apiRequest(`/api/admin/events${query ? `?${query}` : ''}`, { token });
}

export async function updateEvent(token: string, eventId: string, data: Partial<CreateEventData>) {
  return apiRequest(`/api/admin/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    token,
  });
}

export async function deleteEvent(token: string, eventId: string) {
  return apiRequest(`/api/admin/events/${eventId}`, {
    method: 'DELETE',
    token,
  });
}

// ==================== LIVE CLASSES (NEW) ====================

export async function getLiveClasses(token: string, params: any = {}) {
  const query = new URLSearchParams(params).toString();
  return apiRequest(`/api/live-classes${query ? `?${query}` : ''}`, { token });
}

export async function createLiveClass(token: string, data: any) {
  return apiRequest('/api/live-classes', {
    method: 'POST',
    body: data,
    token,
  });
}

export async function updateLiveClass(token: string, id: string, data: any) {
  return apiRequest(`/api/live-classes/${id}`, {
    method: 'PUT',
    body: data,
    token,
  });
}

export async function deleteLiveClass(token: string, id: string) {
  return apiRequest(`/api/live-classes/${id}`, {
    method: 'DELETE',
    token,
  });
}

// ==================== ANALYTICS ====================

export async function getAnalyticsOverview(token: string) {
  return apiRequest('/api/admin/analytics/overview', { token });
}

export async function getAttendanceAnalytics(token: string) {
  return apiRequest('/api/admin/analytics/attendance', { token });
}

export interface GetRevenueAnalyticsParams {
  startDate?: string;
  endDate?: string;
}

export async function getRevenueAnalytics(token: string, params: GetRevenueAnalyticsParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const query = queryParams.toString();
  return apiRequest(`/api/admin/analytics/revenue${query ? `?${query}` : ''}`, { token });
}

// ==================== SETTINGS ====================

export async function getSettings(token: string) {
  return apiRequest('/api/admin/settings', { token });
}

export interface UpdateSettingsData {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  preferences?: Record<string, any>;
}

export async function updateSettings(token: string, data: UpdateSettingsData) {
  return apiRequest('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
    token,
  });
}

// ==================== ORGANIZATION FEATURES (NEW) ====================

// Generic CRUD helper for org features
async function orgFeatureRequest(token: string, resource: string, method: string = 'GET', data?: any) {
  const options: any = { method, token };
  if (data) options.body = data;
  return apiRequest(`/api/org-features/${resource}`, options);
}

// Academic Years
export const academicYearApi = {
  list: (token: string) => orgFeatureRequest(token, 'academic-years'),
  create: (token: string, data: any) => orgFeatureRequest(token, 'academic-years', 'POST', data),
  get: (token: string, id: string) => orgFeatureRequest(token, `academic-years/${id}`),
  update: (token: string, id: string, data: any) => orgFeatureRequest(token, `academic-years/${id}`, 'PUT', data),
  delete: (token: string, id: string) => orgFeatureRequest(token, `academic-years/${id}`, 'DELETE'),
};

// Departments
export const departmentApi = {
  list: (token: string) => orgFeatureRequest(token, 'departments'),
  create: (token: string, data: any) => orgFeatureRequest(token, 'departments', 'POST', data),
  get: (token: string, id: string) => orgFeatureRequest(token, `departments/${id}`),
  update: (token: string, id: string, data: any) => orgFeatureRequest(token, `departments/${id}`, 'PUT', data),
  delete: (token: string, id: string) => orgFeatureRequest(token, `departments/${id}`, 'DELETE'),
};

// Batches
export const batchApi = {
  list: (token: string) => orgFeatureRequest(token, 'batches'),
  create: (token: string, data: any) => orgFeatureRequest(token, 'batches', 'POST', data),
  get: (token: string, id: string) => orgFeatureRequest(token, `batches/${id}`),
  update: (token: string, id: string, data: any) => orgFeatureRequest(token, `batches/${id}`, 'PUT', data),
  delete: (token: string, id: string) => orgFeatureRequest(token, `batches/${id}`, 'DELETE'),
};

// Semesters
export const semesterApi = {
  list: (token: string) => orgFeatureRequest(token, 'semesters'),
  create: (token: string, data: any) => orgFeatureRequest(token, 'semesters', 'POST', data),
  get: (token: string, id: string) => orgFeatureRequest(token, `semesters/${id}`),
  update: (token: string, id: string, data: any) => orgFeatureRequest(token, `semesters/${id}`, 'PUT', data),
  delete: (token: string, id: string) => orgFeatureRequest(token, `semesters/${id}`, 'DELETE'),
};

// Subjects
export const subjectApi = {
  list: (token: string, programId?: string) => orgFeatureRequest(token, `subjects${programId ? `?program_id=${programId}` : ''}`),
  create: (token: string, data: any) => orgFeatureRequest(token, 'subjects', 'POST', data),
  get: (token: string, id: string) => orgFeatureRequest(token, `subjects/${id}`),
  update: (token: string, id: string, data: any) => orgFeatureRequest(token, `subjects/${id}`, 'PUT', data),
  delete: (token: string, id: string) => orgFeatureRequest(token, `subjects/${id}`, 'DELETE'),
};

// Test Series
export const testSeriesApi = {
  list: (token: string) => orgFeatureRequest(token, 'test-series'),
  create: (token: string, data: any) => orgFeatureRequest(token, 'test-series', 'POST', data),
  update: (token: string, id: string, data: any) => orgFeatureRequest(token, `test-series/${id}`, 'PUT', data),
  delete: (token: string, id: string) => orgFeatureRequest(token, `test-series/${id}`, 'DELETE'),
}

// Academic Programs (Academic Courses in Org Admin context)
export const programApi = {
  list: (token: string, params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    // Academic Programs (Structural)
    return apiRequest(`/api/org-admin/courses${query ? `?${query}` : ''}`, { token });
  },
  create: (token: string, data: any) => apiRequest('/api/org-admin/courses', { method: 'POST', body: data, token }),
  get: (token: string, id: string) => apiRequest(`/api/org-admin/courses/${id}`, { token }),
  update: (token: string, id: string, data: any) => apiRequest(`/api/org-admin/courses/${id}`, { method: 'PUT', body: data, token }),
  delete: (token: string, id: string) => apiRequest(`/api/org-admin/courses/${id}`, { method: 'DELETE', token }),
};

export const schoolGradeApi = {
  listLevels: (token: string) => orgFeatureRequest(token, 'school-levels'),
  createLevel: (token: string, data: any) => orgFeatureRequest(token, 'school-levels', 'POST', data),
  updateLevel: (token: string, id: string, data: any) => orgFeatureRequest(token, `school-levels/${id}`, 'PUT', data),
  deleteLevel: (token: string, id: string) => orgFeatureRequest(token, `school-levels/${id}`, 'DELETE'),

  listSections: (token: string, gradeLevelId?: string) => orgFeatureRequest(token, `school-sections${gradeLevelId ? `?grade_level_id=${gradeLevelId}` : ''}`),
  createSection: (token: string, data: any) => orgFeatureRequest(token, 'school-sections', 'POST', data),
  updateSection: (token: string, id: string, data: any) => orgFeatureRequest(token, `school-sections/${id}`, 'PUT', data),
  deleteSection: (token: string, id: string) => orgFeatureRequest(token, `school-sections/${id}`, 'DELETE'),
}

export const gpaApi = {
  getStats: (token: string) => orgFeatureRequest(token, 'gpa/stats'),
  getAtRisk: (token: string, threshold?: number) => orgFeatureRequest(token, `gpa/at-risk${threshold ? `?threshold=${threshold}` : ''}`),
  getDepartments: (token: string) => orgFeatureRequest(token, 'gpa/departments'),
  getStudentGPA: (token: string, studentId: string) => orgFeatureRequest(token, `gpa/student/${studentId}`),
}

export const trainerApi = {
  list: (token: string) => orgFeatureRequest(token, 'trainers'),
  updateExpertise: (token: string, id: string, data: { expertise: string; bio?: string }) => orgFeatureRequest(token, `trainers/${id}/expertise`, 'PUT', data),
}

export const leaderboardApi = {
  getGlobal: (token: string) => orgFeatureRequest(token, 'leaderboard'),
  getBadges: (token: string, userId: string) => orgFeatureRequest(token, `leaderboard/badges/${userId}`),
}

// ==================== COLLEGE-SPECIFIC APIS ====================

// College Dashboard
export async function getCollegeDashboard(token: string) {
  return apiRequest('/api/college/admin/dashboard', { token });
}

// College Departments
export async function getCollegeDepartments(token: string) {
  return apiRequest('/api/college/admin/departments', { token });
}

export async function createCollegeDepartment(token: string, data: { name: string; code: string; description?: string; headInstructor?: string }) {
  return apiRequest('/api/college/admin/departments', { method: 'POST', body: data, token });
}

export async function getCollegeDepartment(token: string, id: string) {
  return apiRequest(`/api/college/admin/departments/${id}`, { token });
}

export async function updateCollegeDepartment(token: string, id: string, data: { name: string; code: string; description?: string; headInstructor?: string }) {
  return apiRequest(`/api/college/admin/departments/${id}`, { method: 'PUT', body: data, token });
}

// College Batches
export async function getCollegeBatches(token: string, filters?: { departmentId?: string; year?: number; semester?: number }) {
  const query = new URLSearchParams();
  if (filters?.departmentId) query.append('departmentId', filters.departmentId);
  if (filters?.year) query.append('year', filters.year.toString());
  if (filters?.semester) query.append('semester', filters.semester.toString());
  return apiRequest(`/api/college/admin/batches${query.toString() ? `?${query}` : ''}`, { token });
}

export async function createCollegeBatch(token: string, data: { name: string; code?: string; departmentId: string; year: number; semester?: number; startDate?: Date; endDate?: Date }) {
  return apiRequest('/api/college/admin/batches', { method: 'POST', body: data, token });
}

export async function getCollegeBatch(token: string, id: string) {
  return apiRequest(`/api/college/admin/batches/${id}`, { token });
}

export async function updateCollegeBatch(token: string, id: string, data: any) {
  return apiRequest(`/api/college/admin/batches/${id}`, { method: 'PUT', body: data, token });
}

// College Students
export async function getCollegeStudents(token: string, filters?: { department?: string; batch?: string; year?: number; search?: string }) {
  const query = new URLSearchParams();
  if (filters?.department) query.append('department', filters.department);
  if (filters?.batch) query.append('batch', filters.batch);
  if (filters?.year) query.append('year', filters.year.toString());
  if (filters?.search) query.append('search', filters.search);
  return apiRequest(`/api/college/admin/students${query.toString() ? `?${query}` : ''}`, { token });
}

export async function createCollegeStudent(token: string, data: { firstName: string; lastName: string; email: string; phone?: string; departmentId?: string; batchId?: string; rollNumber?: string; year?: number }) {
  return apiRequest('/api/college/admin/students', { method: 'POST', body: data, token });
}

export async function getCollegeStudent(token: string, id: string) {
  return apiRequest(`/api/college/admin/students/${id}`, { token });
}

// College Instructors
export async function getCollegeInstructors(token: string, filters?: { department?: string; search?: string }) {
  const query = new URLSearchParams();
  if (filters?.department) query.append('department', filters.department);
  if (filters?.search) query.append('search', filters.search);
  return apiRequest(`/api/college/admin/instructors${query.toString() ? `?${query}` : ''}`, { token });
}

export async function createCollegeInstructor(token: string, data: { firstName: string; lastName: string; email: string; phone?: string; departmentId?: string; bio?: string }) {
  return apiRequest('/api/college/admin/instructors', { method: 'POST', body: data, token });
}

export async function getCollegeInstructor(token: string, id: string) {
  return apiRequest(`/api/college/admin/instructors/${id}`, { token });
}

// College Courses
export async function getCollegeCourses(token: string, filters?: { department?: string; batch?: string; status?: string }) {
  const query = new URLSearchParams();
  if (filters?.department) query.append('department', filters.department);
  if (filters?.batch) query.append('batch', filters.batch);
  if (filters?.status) query.append('status', filters.status);
  return apiRequest(`/api/college/admin/courses${query.toString() ? `?${query}` : ''}`, { token });
}

export async function getCollegeCourse(token: string, id: string) {
  return apiRequest(`/api/college/admin/courses/${id}`, { token });
}

// College Attendance
export async function getCollegeAttendance(token: string, filters?: { course?: string; department?: string; batch?: string; date?: string }) {
  const query = new URLSearchParams();
  if (filters?.course) query.append('course', filters.course);
  if (filters?.department) query.append('department', filters.department);
  if (filters?.batch) query.append('batch', filters.batch);
  if (filters?.date) query.append('date', filters.date);
  return apiRequest(`/api/college/admin/attendance${query.toString() ? `?${query}` : ''}`, { token });
}

// College Events
export async function getCollegeEvents(token: string, filters?: { department?: string; upcoming?: boolean }) {
  const query = new URLSearchParams();
  if (filters?.department) query.append('department', filters.department);
  if (filters?.upcoming) query.append('upcoming', 'true');
  return apiRequest(`/api/college/admin/events${query.toString() ? `?${query}` : ''}`, { token });
}

export async function createCollegeEvent(token: string, data: { title: string; description?: string; date: Date; endDate?: Date; location?: string; departmentId?: string; batchId?: string; eventType?: string }) {
  return apiRequest('/api/college/admin/events', { method: 'POST', body: data, token });
}

// College Analytics
export async function getCollegeAnalytics(token: string) {
  return apiRequest('/api/college/admin/analytics', { token });
}
