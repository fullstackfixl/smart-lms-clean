/**
 * Organization Admin API Service
 * Handles all API calls for organization admin features
 */

const API_BASE_URL = 'http://localhost:5000';

// Helper to get CSRF token
let csrfToken: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/csrf-token`, {
      credentials: 'include'
    });
    const data = await response.json();
    csrfToken = data.token;
    if (!csrfToken) {
      throw new Error('CSRF token not found in response')
    }
    return csrfToken;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    throw error;
  }
}

// Helper to make authenticated requests
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers as Record<string, string> || {})
  };

  // Add CSRF token for state-changing operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET')) {
    const csrf = await getCsrfToken();
    headers['X-CSRF-Token'] = csrf;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  // Handle 403 CSRF errors - retry once with new token
  if (response.status === 403) {
    csrfToken = null; // Clear cached token
    const newCsrf = await getCsrfToken();
    headers['X-CSRF-Token'] = newCsrf;
    
    const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include'
    });
    
    if (!retryResponse.ok) {
      throw new Error(`API request failed: ${retryResponse.statusText}`);
    }
    
    return retryResponse.json();
  }

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

export async function getAttendanceSummary() {
  return apiRequest('/api/admin/attendance/summary');
}

export async function getStudentAttendance(studentId: string) {
  return apiRequest(`/api/admin/attendance/student/${studentId}`);
}

export async function getInstructorAttendance(instructorId: string) {
  return apiRequest(`/api/admin/attendance/instructor/${instructorId}`);
}

// ==================== GRADES ====================

export interface GetGradesParams {
  courseId?: string;
  studentId?: string;
  minGrade?: number;
  maxGrade?: number;
}

export async function getGrades(params: GetGradesParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.courseId) queryParams.append('courseId', params.courseId);
  if (params.studentId) queryParams.append('studentId', params.studentId);
  if (params.minGrade) queryParams.append('minGrade', params.minGrade.toString());
  if (params.maxGrade) queryParams.append('maxGrade', params.maxGrade.toString());
  
  const query = queryParams.toString();
  return apiRequest(`/api/admin/grades${query ? `?${query}` : ''}`);
}

export async function getCourseGrades(courseId: string) {
  return apiRequest(`/api/admin/grades/course/${courseId}`);
}

export async function exportGrades(courseId?: string, format: 'json' | 'csv' = 'json') {
  return apiRequest('/api/admin/grades/export', {
    method: 'POST',
    body: JSON.stringify({ courseId, format })
  });
}

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
