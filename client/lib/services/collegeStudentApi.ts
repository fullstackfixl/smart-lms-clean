/**
 * College Student API Service
 * Handles all API calls for college student features
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

export async function getCollegeStudentDashboard(token: string) {
  return apiRequest('/api/college/student/dashboard', { token });
}

// ==================== COURSES ====================

export async function getCollegeStudentCourses(token: string) {
  return apiRequest('/api/college/student/courses', { token });
}

export async function getCollegeStudentCourse(token: string, id: string) {
  return apiRequest(`/api/college/student/courses/${id}`, { token });
}

export async function enrollCollegeCourse(token: string, courseId: string) {
  return apiRequest(`/api/college/student/courses/${courseId}/enroll`, { method: 'POST', token });
}

// ==================== ATTENDANCE ====================

export async function getCollegeStudentAttendance(token: string, course?: string) {
  const query = course ? `?course=${course}` : '';
  return apiRequest(`/api/college/student/attendance${query}`, { token });
}

// ==================== QUIZZES ====================

export async function getCollegeStudentQuizzes(token: string) {
  return apiRequest('/api/college/student/quizzes', { token });
}

// ==================== LIVE CLASSES ====================

export async function getCollegeStudentLiveClasses(token: string) {
  return apiRequest('/api/college/student/live-classes', { token });
}

// ==================== EVENTS ====================

export async function getCollegeStudentEvents(token: string, upcoming?: boolean) {
  const query = upcoming ? '?upcoming=true' : '';
  return apiRequest(`/api/college/student/events${query}`, { token });
}

// ==================== CERTIFICATES ====================

export async function getCollegeStudentCertificates(token: string) {
  return apiRequest('/api/college/student/certificates', { token });
}

// ==================== PROGRESS ====================

export async function getCollegeStudentProgress(token: string) {
  return apiRequest('/api/college/student/progress', { token });
}
