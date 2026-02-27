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
  // Prefer explicit token passed in, else use 'instatute_token' from storage, else 'token'
  let token = options.token;
  if (!token && typeof window !== 'undefined') {
    token =
      window.sessionStorage.getItem('instatute_token') ||
      window.localStorage.getItem('instatute_token') ||
      window.localStorage.getItem('token') ||
      undefined;
  }
  if (!token) {
    throw new Error('No authentication token found');
  }

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

export async function getDashboardMetrics() {
  return apiRequest('/api/admin/dashboard/metrics');
}

export async function getDashboardActivities(limit: number = 10) {
  return apiRequest(`/api/admin/dashboard/activities?limit=${limit}`);
}

// ==================== USER MANAGEMENT ====================

export interface GetUsersParams {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
}

export async function getUsers(params: GetUsersParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.role) queryParams.append('role', params.role);
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.status) queryParams.append('status', params.status);

  const query = queryParams.toString();
  return apiRequest(`/api/admin/users${query ? `?${query}` : ''}`);
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
  return apiRequest(`/api/org/users/instructors`, { token });
}

export async function listStudents(token: string) {
  return apiRequest(`/api/org/users/students`, { token });
}

export async function getUserById(userId: string) {
  return apiRequest(`/api/admin/users/${userId}`);
}

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'instructor' | 'parent';
  phone?: string;
}

export async function createUser(data: CreateUserData) {
  return apiRequest('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export interface UpdateUserData {
  fullName?: string;
  phone?: string;
  email?: string;
}

export async function updateUser(userId: string, data: UpdateUserData) {
  return apiRequest(`/api/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function assignUserRole(userId: string, role: string) {
  return apiRequest(`/api/admin/users/${userId}/assign-role`, {
    method: 'POST',
    body: JSON.stringify({ role })
  });
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  return apiRequest(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive })
  });
}

export async function deleteUser(userId: string) {
  return apiRequest(`/api/admin/users/${userId}`, {
    method: 'DELETE'
  });
}

// ==================== COURSE MANAGEMENT ====================

export interface GetCoursesParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function getCourses(params: GetCoursesParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  if (params.status) queryParams.append('status', params.status);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const query = queryParams.toString();
  return apiRequest(`/api/admin/courses${query ? `?${query}` : ''}`);
}

export async function getCourseById(courseId: string) {
  return apiRequest(`/api/admin/courses/${courseId}`);
}

export async function publishCourse(courseId: string, isPublished: boolean) {
  return apiRequest(`/api/admin/courses/${courseId}/publish`, {
    method: 'PUT',
    body: JSON.stringify({ isPublished })
  });
}

export async function assignInstructor(courseId: string, instructorId: string) {
  return apiRequest(`/api/admin/courses/${courseId}/assign-instructor`, {
    method: 'PUT',
    body: JSON.stringify({ instructorId })
  });
}

// ==================== ATTENDANCE ====================

export const attendanceApi = {
  getSummary: () => apiRequest('/api/attendance/reports/summary'),
  getCourseAttendance: (courseId: string) => apiRequest(`/api/attendance/course/${courseId}`),
  getStudentAttendance: (studentId: string) => apiRequest(`/api/attendance/student/${studentId}`),
  mark: (data: any) => apiRequest('/api/attendance/mark', { method: 'POST', body: data }),
  update: (id: string, data: any) => apiRequest(`/api/attendance/${id}`, { method: 'PUT', body: data }),
};

// ==================== GRADES & EXAMS ====================

export const gradeApi = {
  list: (params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/grades${query ? `?${query}` : ''}`);
  },
  getCourseGrades: (id: string) => apiRequest(`/api/admin/grades/course/${id}`),
  export: (data: any) => apiRequest('/api/admin/grades/export', { method: 'POST', body: data }),
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

export async function setFee(data: SetFeeData) {
  return apiRequest('/api/admin/fees/set', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function getPendingFees() {
  return apiRequest('/api/admin/fees/pending');
}

export interface GetFeeHistoryParams {
  startDate?: string;
  endDate?: string;
  status?: string;
}

export async function getFeeHistory(params: GetFeeHistoryParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.status) queryParams.append('status', params.status);

  const query = queryParams.toString();
  return apiRequest(`/api/admin/fees/history${query ? `?${query}` : ''}`);
}

export async function sendFeeReminder(feeId: string) {
  return apiRequest('/api/admin/fees/reminder', {
    method: 'POST',
    body: JSON.stringify({ feeId })
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

export async function createEvent(data: CreateEventData) {
  return apiRequest('/api/admin/events', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export interface GetEventsParams {
  type?: string;
  startDate?: string;
  endDate?: string;
}

export async function getEvents(params: GetEventsParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.type) queryParams.append('type', params.type);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const query = queryParams.toString();
  return apiRequest(`/api/admin/events${query ? `?${query}` : ''}`);
}

export async function updateEvent(eventId: string, data: Partial<CreateEventData>) {
  return apiRequest(`/api/admin/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteEvent(eventId: string) {
  return apiRequest(`/api/admin/events/${eventId}`, {
    method: 'DELETE'
  });
}

// ==================== ANALYTICS ====================

export async function getAnalyticsOverview() {
  return apiRequest('/api/admin/analytics/overview');
}

export async function getAttendanceAnalytics() {
  return apiRequest('/api/admin/analytics/attendance');
}

export interface GetRevenueAnalyticsParams {
  startDate?: string;
  endDate?: string;
}

export async function getRevenueAnalytics(params: GetRevenueAnalyticsParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const query = queryParams.toString();
  return apiRequest(`/api/admin/analytics/revenue${query ? `?${query}` : ''}`);
}

// ==================== SETTINGS ====================

export async function getSettings() {
  return apiRequest('/api/admin/settings');
}

export interface UpdateSettingsData {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  preferences?: Record<string, any>;
}

export async function updateSettings(data: UpdateSettingsData) {
  return apiRequest('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// ==================== ORGANIZATION FEATURES (NEW) ====================

// Generic CRUD helper for org features
async function orgFeatureRequest(resource: string, method: string = 'GET', data?: any) {
  const options: any = { method };
  if (data) options.body = data;
  return apiRequest(`/api/org-features/${resource}`, options);
}

// Academic Years
export const academicYearApi = {
  list: () => orgFeatureRequest('academic-years'),
  create: (data: any) => orgFeatureRequest('academic-years', 'POST', data),
  get: (id: string) => orgFeatureRequest(`academic-years/${id}`),
  update: (id: string, data: any) => orgFeatureRequest(`academic-years/${id}`, 'PUT', data),
  delete: (id: string) => orgFeatureRequest(`academic-years/${id}`, 'DELETE'),
};

// Departments
export const departmentApi = {
  list: () => orgFeatureRequest('departments'),
  create: (data: any) => orgFeatureRequest('departments', 'POST', data),
  get: (id: string) => orgFeatureRequest(`departments/${id}`),
  update: (id: string, data: any) => orgFeatureRequest(`departments/${id}`, 'PUT', data),
  delete: (id: string) => orgFeatureRequest(`departments/${id}`, 'DELETE'),
};

// Batches
export const batchApi = {
  list: () => orgFeatureRequest('batches'),
  create: (data: any) => orgFeatureRequest('batches', 'POST', data),
  get: (id: string) => orgFeatureRequest(`batches/${id}`),
  update: (id: string, data: any) => orgFeatureRequest(`batches/${id}`, 'PUT', data),
  delete: (id: string) => orgFeatureRequest(`batches/${id}`, 'DELETE'),
};

// Semesters
export const semesterApi = {
  list: () => orgFeatureRequest('semesters'),
  create: (data: any) => orgFeatureRequest('semesters', 'POST', data),
  get: (id: string) => orgFeatureRequest(`semesters/${id}`),
  update: (id: string, data: any) => orgFeatureRequest(`semesters/${id}`, 'PUT', data),
  delete: (id: string) => orgFeatureRequest(`semesters/${id}`, 'DELETE'),
};

// Subjects
export const subjectApi = {
  list: () => orgFeatureRequest('subjects'),
  create: (data: any) => orgFeatureRequest('subjects', 'POST', data),
  get: (id: string) => orgFeatureRequest(`subjects/${id}`),
  update: (id: string, data: any) => orgFeatureRequest(`subjects/${id}`, 'PUT', data),
  delete: (id: string) => orgFeatureRequest(`subjects/${id}`, 'DELETE'),
};

// Test Series
export const testSeriesApi = {
  list: () => orgFeatureRequest('test-series'),
  create: (data: any) => orgFeatureRequest('test-series', 'POST', data),
  get: (id: string) => orgFeatureRequest(`test-series/${id}`),
  update: (id: string, data: any) => orgFeatureRequest(`test-series/${id}`, 'PUT', data),
  delete: (id: string) => orgFeatureRequest(`test-series/${id}`, 'DELETE'),
}

export const schoolGradeApi = {
  listLevels: () => orgFeatureRequest('school-levels'),
  createLevel: (data: any) => orgFeatureRequest('school-levels', 'POST', data),
  updateLevel: (id: string, data: any) => orgFeatureRequest(`school-levels/${id}`, 'PUT', data),
  deleteLevel: (id: string) => orgFeatureRequest(`school-levels/${id}`, 'DELETE'),

  listSections: (gradeLevelId?: string) => orgFeatureRequest(`school-sections${gradeLevelId ? `?grade_level_id=${gradeLevelId}` : ''}`),
  createSection: (data: any) => orgFeatureRequest('school-sections', 'POST', data),
  updateSection: (id: string, data: any) => orgFeatureRequest(`school-sections/${id}`, 'PUT', data),
  deleteSection: (id: string) => orgFeatureRequest(`school-sections/${id}`, 'DELETE'),
}

export const gpaApi = {
  getStats: () => orgFeatureRequest('gpa/stats'),
  getAtRisk: (threshold?: number) => orgFeatureRequest(`gpa/at-risk${threshold ? `?threshold=${threshold}` : ''}`),
  getDepartments: () => orgFeatureRequest('gpa/departments'),
  getStudentGPA: (studentId: string) => orgFeatureRequest(`gpa/student/${studentId}`),
}

export const trainerApi = {
  list: () => orgFeatureRequest('trainers'),
  updateExpertise: (id: string, data: { expertise: string; bio?: string }) => orgFeatureRequest(`trainers/${id}/expertise`, 'PUT', data),
}

export const leaderboardApi = {
  getGlobal: () => orgFeatureRequest('leaderboard'),
  getBadges: (userId: string) => orgFeatureRequest(`leaderboard/badges/${userId}`),
}
