# Smart LMS - API Documentation

This document provides a comprehensive reference of the API endpoints available in the Smart LMS backend.

## Base URL
`http://localhost:5000` (Local Development)

---

## 1. Authentication & Profile
**Base Path:** `/auth`

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/login` | Public | Standard login with email/password |
| POST | `/register` | Public | User registration via subdomain |
| GET | `/me` | JWT | Get current authenticated user details |
| POST | `/logout` | JWT | Invalidate current session |
| POST | `/apply-organization` | Public | Submit application for new organization |
| POST | `/forgot-password` | Public | Request password reset email |
| POST | `/reset-password/:token`| Public | Reset password using email token |

---

## 2. Course Management
**Base Path:** `/api/courses`

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/` | Optional | Any | List all published courses (filters: category, search) |
| GET | `/:id` | Optional | Any | Get detailed course info, sections, and lessons |
| POST | `/` | JWT | Org Admin/Instructor | Create a new course (draft by default) |
| PUT | `/:id` | JWT | Org Admin/Instructor | Update course details |
| DELETE | `/:id` | JWT | Org Admin/Instructor | Soft delete a course |
| PATCH | `/:id/publish` | JWT | Org Admin/Instructor | Publish or unpublish a course |
| GET | `/student` | JWT | Student | Get specific courses tailored for student |

---

## 3. Sections & Lessons
**Base Path:** `/api/sections` & `/api/lessons`

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/api/sections/:courseId/sections` | JWT | Instructor | Create a new section |
| GET | `/api/sections/:courseId/sections` | Public | Any | Get all sections for a course |
| PUT | `/api/sections/:courseId/sections/:id` | JWT | Instructor | Update section |
| POST | `/api/lessons/:courseId/sections/:sectionId/lessons` | JWT | Instructor | Add lesson to section |
| GET | `/api/lessons/:lessonId` | JWT | Student | Get lesson content (Video URL, Text, etc.) |
| POST | `/api/lessons/:lessonId/complete` | JWT | Student | Mark lesson as completed |

---

## 4. Enrollments & Payments
**Base Path:** `/api/enrollments`

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/:courseId/enroll` | JWT | Enroll in a free course |
| POST | `/:courseId/payment/create-order` | JWT | Create Razorpay order for paid course |
| POST | `/payment/verify` | JWT | Verify Razorpay payment and enroll |
| GET | `/my` | JWT | Get list of user's own enrollments |
| GET | `/:courseId/enrollments` | JWT | (Instructor) Get list of enrolled students |

---

## 5. Quizzes
**Base Path:** `/api/quizzes`

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/` | JWT | Instructor | Manual quiz creation |
| POST | `/generate-ai` | JWT | Instructor | AI-powered quiz generation (Gemini/Groq) |
| GET | `/:id` | JWT | Any | Get quiz questions (omit correct answers for students) |
| POST | `/:id/submit` | JWT | Student | Submit quiz attempt and get instant score |
| GET | `/:id/submissions` | JWT | Instructor | View all student attempts for a quiz |

---

## 6. College Academic Layer (Premium)
**Integrated into specialized routes**

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/student/transcript` | JWT | Student | Get full academic transcript (CGPA/SGPA) |
| GET | `/student/academic-overview` | JWT | Student | Dashboard stats (Credits, GPA, Attendance) |
| GET | `/student/semesters` | JWT | Student | List available semesters in organization |
| GET | `/instructor/gradebook/:courseId` | JWT | Instructor | View class marksheet |
| POST | `/instructor/gradebook/marks` | JWT | Instructor | Record internal/exam marks for student |

---

## 7. Organizations & Admin
**Base Path:** `/api/organizations` & `/api/admin`

| Method | Endpoint | Auth | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| GET | `/api/organizations/my` | JWT | Org Admin | Get organization profile & settings |
| PUT | `/api/organizations/my` | JWT | Org Admin | Update organization settings |
| GET | `/api/admin/users` | JWT | Platform Admin | List all users across platform |
| GET | `/api/admin/organizations` | JWT | Platform Admin | Manage all organizations |
| POST | `/api/admin/organizations/:id/verify` | JWT | Platform Admin | Verify/Approve pending organization |

---

## 8. Utilities
**Base Path:** `/api`

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| POST | `/upload` | JWT | Upload general files to Cloudinary |
| GET | `/translate` | JWT | Translate text (AI-powered) |
| GET | `/analytics/stats` | JWT | Get high-level platform analytics |

---

> [!NOTE]
> All JWT authenticated requests must include the header `Authorization: Bearer <token>`.
> Most routes return JSON in the format: `{ success: true, data: ..., message: "..." }`.
