/**
 * College Instructor API Service
 * Handles all API calls for college instructor features
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

export async function getCollegeInstructorDashboard(token: string) {
  return apiRequest('/api/college/instructor/dashboard', { token });
}

// ==================== COURSES ====================

export async function getCollegeInstructorCourses(token: string) {
  return apiRequest('/api/college/instructor/courses', { token });
}

export async function getCollegeInstructorCourse(token: string, id: string) {
  return apiRequest(`/api/college/instructor/courses/${id}`, { token });
}

// ==================== STUDENTS ====================

export async function getCollegeInstructorStudents(token: string) {
  return apiRequest('/api/college/instructor/students', { token });
}

export async function getCollegeInstructorStudent(token: string, id: string) {
  return apiRequest(`/api/college/instructor/students/${id}`, { token });
}

// ==================== ATTENDANCE ====================

export async function markCollegeAttendance(token: string, data: { courseId: string; studentId: string; date: Date; status: 'present' | 'absent' | 'late'; notes?: string }) {
  return apiRequest('/api/college/instructor/attendance', { method: 'POST', body: data, token });
}

export async function getCollegeInstructorAttendance(token: string, filters?: { courseId?: string; date?: string; batchId?: string }) {
  const query = new URLSearchParams();
  if (filters?.courseId) query.append('courseId', filters.courseId);
  if (filters?.date) query.append('date', filters.date);
  if (filters?.batchId) query.append('batchId', filters.batchId);
  return apiRequest(`/api/college/instructor/attendance${query.toString() ? `?${query}` : ''}`, { token });
}

export async function getCollegeCourseAttendance(token: string, courseId: string, date?: string) {
  const query = date ? `?date=${date}` : '';
  return apiRequest(`/api/college/instructor/attendance/course/${courseId}${query}`, { token });
}

// ==================== LIVE CLASSES ====================

export async function getCollegeInstructorLiveClasses(token: string) {
  return apiRequest('/api/college/instructor/live-classes', { token });
}

// ==================== QUIZZES ====================

export async function getCollegeInstructorQuizzes(token: string) {
  return apiRequest('/api/college/instructor/quizzes', { token });
}

// ==================== EVENTS ====================

export async function getCollegeInstructorEvents(token: string, upcoming?: boolean) {
  const query = upcoming ? '?upcoming=true' : '';
  return apiRequest(`/api/college/instructor/events${query}`, { token });
}

// ==================== ANALYTICS ====================

export async function getCollegeInstructorAnalytics(token: string) {
  return apiRequest('/api/college/instructor/analytics', { token });
}
