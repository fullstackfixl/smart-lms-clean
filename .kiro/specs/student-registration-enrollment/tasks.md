# Implementation Plan: Student Registration and Enrollment System

## Overview

This implementation plan breaks down the student registration and enrollment feature into discrete, incremental tasks. The approach follows the existing codebase architecture using Node.js/Express.js for the backend and Next.js/React for the frontend. Each task builds on previous work, with testing integrated throughout to catch errors early.

## Tasks

- [x] 1. Set up student registration API endpoints
  - Create POST /auth/register/student endpoint for student registration
  - Implement organization code validation logic
  - Add email uniqueness check
  - Implement bcrypt password hashing (salt rounds: 10)
  - Create user with role="student", status="active"
  - Generate JWT token with 7-day expiration
  - Return user data and token in response
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3_

- [ ]* 1.1 Write property test for organization code validation
  - **Property 1: Organization Code Validation**
  - **Validates: Requirements 1.1, 2.1, 2.2, 2.3, 8.4**

- [ ]* 1.2 Write property test for email uniqueness
  - **Property 2: Email Uniqueness**
  - **Validates: Requirements 1.2, 8.1**

- [ ]* 1.3 Write property test for password hashing
  - **Property 3: Password Hashing**
  - **Validates: Requirements 1.3, 7.1, 7.2**

- [ ]* 1.4 Write property test for student user creation
  - **Property 4: Student User Creation**
  - **Validates: Requirements 1.4**

- [ ]* 1.5 Write property test for JWT token generation
  - **Property 5: JWT Token Generation**
  - **Validates: Requirements 1.5**

- [ ]* 1.6 Write unit tests for registration edge cases
  - Test missing required fields
  - Test invalid organization code format
  - Test password too short
  - Test malformed email
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Create student registration frontend page
  - Create /register page component in Next.js
  - Implement registration form with fields: Full Name, Email, Password, Organization Code
  - Add organization code validation with real-time feedback
  - Display organization name after code validation
  - Add password strength indicator
  - Implement form submission with error handling
  - Handle auto-login after successful registration
  - Redirect to /student/dashboard after registration
  - _Requirements: 1.6, 2.2, 11.1, 11.2, 11.3, 11.4_

- [ ]* 2.1 Write unit tests for registration form
  - Test form validation
  - Test organization code lookup
  - Test successful registration flow
  - Test error handling
  - _Requirements: 1.1, 1.2, 2.2_

- [x] 3. Checkpoint - Ensure registration flow works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement course discovery API endpoints
  - Create GET /student/courses endpoint for browsing courses
  - Implement organization-scoped filtering (organization_id + status="published")
  - Add pagination support (page, limit parameters)
  - Include enrollment status check for each course
  - Return course data: thumbnail, instructor, duration, rating
  - Add optional filters: category, level, search
  - Optimize with MongoDB indexes on (organization_id, status)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 9.1_

- [ ]* 4.1 Write property test for organization-scoped course discovery
  - **Property 7: Organization-Scoped Course Discovery**
  - **Validates: Requirements 3.1, 9.1**

- [ ]* 4.2 Write property test for course data completeness
  - **Property 8: Course Data Completeness**
  - **Validates: Requirements 3.2, 12.1**

- [ ]* 4.3 Write property test for enrollment status indication
  - **Property 9: Enrollment Status Indication**
  - **Validates: Requirements 3.3, 3.4, 12.2, 12.3**

- [ ]* 4.4 Write unit tests for course discovery
  - Test pagination
  - Test filtering by category and level
  - Test search functionality
  - Test empty results
  - _Requirements: 3.1, 3.2_

- [x] 5. Create GET /student/courses/:id endpoint for course details
  - Implement course existence validation
  - Verify course belongs to student's organization
  - Verify course status is "published"
  - Return course details with sections and lessons
  - Include enrollment status and progress if enrolled
  - Return appropriate errors for validation failures
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 9.3_

- [ ]* 5.1 Write property test for course access validation
  - **Property 10: Course Access Validation**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 9.3**

- [ ]* 5.2 Write unit tests for course details endpoint
  - Test with valid course ID
  - Test with non-existent course
  - Test with course from different organization
  - Test with unpublished course
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6. Build course discovery and details frontend pages
  - Create /courses page with course cards
  - Display course thumbnail, instructor, duration, rating
  - Show "Enroll" or "Resume Course" button based on enrollment status
  - Implement course filtering and search UI
  - Create /courses/[id] page for course details
  - Display course sections and lessons
  - Show enrollment button or progress indicator
  - _Requirements: 3.2, 3.3, 3.4, 12.1, 12.2, 12.3, 12.4_

- [ ]* 6.1 Write unit tests for course components
  - Test course card rendering
  - Test enrollment button state
  - Test course details display
  - _Requirements: 3.2, 3.3_

- [x] 7. Checkpoint - Ensure course discovery works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement course enrollment API endpoint
  - Create POST /student/enroll/:courseId endpoint
  - Validate user has role="student"
  - Verify course belongs to student's organization
  - Verify course status is "published"
  - Check for existing enrollment (prevent duplicates)
  - Create enrollment record with initial values:
    - student_id, course_id, organization_id
    - enrolled_at: current timestamp
    - progress.completionPercentage: 0
    - progress.completedLessons: []
    - status: "active"
  - Return enrollment data
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.2, 10.1, 10.2, 10.3_

- [ ]* 8.1 Write property test for enrollment validation
  - **Property 11: Enrollment Validation**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 8.2, 9.2, 10.1, 10.2, 10.3**

- [ ]* 8.2 Write property test for enrollment record initialization
  - **Property 12: Enrollment Record Initialization**
  - **Validates: Requirements 5.5**

- [ ]* 8.3 Write unit tests for enrollment endpoint
  - Test successful enrollment
  - Test enrollment with non-student role
  - Test enrollment in course from different organization
  - Test enrollment in unpublished course
  - Test duplicate enrollment attempt
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 9. Implement enrollment frontend integration
  - Add enrollment button click handler
  - Call POST /student/enroll/:courseId API
  - Handle success: show success message, update button to "Resume Course"
  - Handle errors: display appropriate error messages
  - Update course list to reflect enrollment status
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 9.1 Write unit tests for enrollment UI
  - Test enrollment button click
  - Test success handling
  - Test error handling
  - _Requirements: 5.1, 5.4_

- [x] 10. Implement progress tracking API endpoint
  - Create PATCH /student/progress/lecture/:lectureId endpoint
  - Validate student is enrolled in the course containing the lecture
  - Add lectureId to completedLessons array (if not already present)
  - Calculate progress percentage: (completedLessons.length / totalLessons) * 100
  - Update lastAccessedAt timestamp
  - Check if progress reaches 100%, set status="completed" and completedAt
  - Persist changes to database
  - Return updated progress data
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 10.1 Write property test for lecture completion tracking
  - **Property 13: Lecture Completion Tracking**
  - **Validates: Requirements 6.1**

- [ ]* 10.2 Write property test for progress calculation
  - **Property 14: Progress Calculation**
  - **Validates: Requirements 6.2**

- [ ]* 10.3 Write property test for course completion detection
  - **Property 15: Course Completion Detection**
  - **Validates: Requirements 6.3**

- [ ]* 10.4 Write property test for progress persistence
  - **Property 16: Progress Persistence**
  - **Validates: Requirements 6.4**

- [ ]* 10.5 Write unit tests for progress tracking
  - Test marking first lecture complete
  - Test marking all lectures complete
  - Test marking already completed lecture
  - Test progress calculation with various completion states
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 11. Create student dashboard page
  - Create /student/dashboard page component
  - Implement GET /student/enrollments API endpoint
  - Query enrollments for current student
  - Display enrolled courses with progress indicators
  - Show course thumbnail, title, progress percentage
  - Add "Continue Learning" button linking to course
  - Handle empty state (no enrollments)
  - _Requirements: 13.1, 13.2_

- [ ]* 11.1 Write property test for dashboard enrollment query
  - **Property 17: Dashboard Enrollment Query**
  - **Validates: Requirements 13.1, 13.2**

- [ ]* 11.2 Write unit tests for dashboard
  - Test with multiple enrollments
  - Test with no enrollments
  - Test progress display
  - _Requirements: 13.1, 13.2_

- [x] 12. Implement password authentication for login
  - Update POST /auth/login endpoint to use bcrypt.compare
  - Verify password against stored hash
  - Return success for correct password
  - Return error for incorrect password
  - Generate JWT token on successful login
  - _Requirements: 7.3_

- [ ]* 12.1 Write property test for password authentication
  - **Property 6: Password Authentication**
  - **Validates: Requirements 7.3**

- [ ]* 12.2 Write unit tests for login
  - Test login with correct credentials
  - Test login with incorrect password
  - Test login with non-existent email
  - _Requirements: 7.3_

- [x] 13. Add error handling and validation middleware
  - Create validation middleware for registration inputs
  - Create validation middleware for enrollment inputs
  - Add error response formatting
  - Implement rate limiting for registration and login
  - Add request logging for debugging
  - _Requirements: All error handling requirements_

- [ ]* 13.1 Write unit tests for error handling
  - Test validation errors (400)
  - Test authentication errors (401)
  - Test authorization errors (403)
  - Test not found errors (404)
  - Test conflict errors (409)
  - _Requirements: All error handling requirements_

- [x] 14. Final checkpoint - End-to-end testing
  - Test complete flow: registration → login → course discovery → enrollment → progress tracking
  - Test multi-tenant isolation (students from different organizations)
  - Test concurrent enrollment attempts
  - Verify all database constraints are enforced
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- The implementation uses the existing codebase architecture and patterns
- All API endpoints follow RESTful conventions
- Frontend uses Next.js 14 with React and TypeScript
- Backend uses Node.js, Express.js, MongoDB, and Mongoose