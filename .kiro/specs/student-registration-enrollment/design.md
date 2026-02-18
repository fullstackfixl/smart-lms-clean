# Design Document: Student Registration and Enrollment System

## Overview

This design document specifies the technical implementation for a student registration and course enrollment system within a multi-organization LMS platform. The system leverages the existing MongoDB-based architecture with Express.js backend and React/Next.js frontend. The design focuses on secure student onboarding, organization-scoped course discovery, enrollment management, and progress tracking while maintaining strict multi-tenant data isolation.

## Architecture

### System Components

The system follows a layered architecture pattern consistent with the existing codebase:

1. **API Layer**: Express.js routes handling HTTP requests
2. **Service Layer**: Business logic for registration, enrollment, and progress tracking
3. **Data Layer**: MongoDB models with Mongoose ODM
4. **Authentication Layer**: JWT-based authentication with bcrypt password hashing
5. **Frontend Layer**: Next.js pages and React components

### Technology Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT tokens, bcrypt password hashing
- **Frontend**: Next.js 14, React, TypeScript
- **Validation**: Express middleware, Mongoose schema validation
- **Security**: CSRF protection, rate limiting, input sanitization

## Components and Interfaces

### 1. Registration Service

**Purpose**: Handle student account creation with organization validation

**Interface**:
```typescript
interface RegistrationService {
  validateOrganizationCode(code: string): Promise<Organization>
  registerStudent(data: StudentRegistrationData): Promise<RegistrationResult>
}

interface StudentRegistrationData {
  fullName: string
  email: string
  password: string
  organizationCode: string
}

interface RegistrationResult {
  user: User
  token: string
  organization: Organization
}
```

**Implementation Details**:
- Validates organization code exists and is active
- Checks email uniqueness across the system
- Hashes password using bcrypt (salt rounds: 10)
- Creates user with role "student", status "active"
- Generates JWT token with 7-day expiration
- Returns user data and authentication token

### 2. Course Discovery Service

**Purpose**: Provide organization-scoped course browsing

**Interface**:
```typescript
interface CourseDiscoveryService {
  getPublishedCourses(studentId: ObjectId, organizationId: ObjectId, filters: CourseFilters): Promise<CourseList>
  getCourseDetails(courseId: ObjectId, studentId: ObjectId): Promise<CourseDetails>
  checkEnrollmentStatus(courseId: ObjectId, studentId: ObjectId): Promise<EnrollmentStatus>
}

interface CourseFilters {
  page: number
  limit: number
  category?: string
  level?: string
  search?: string
}

interface CourseList {
  courses: Course[]
  pagination: PaginationInfo
}

interface CourseDetails extends Course {
  sections: Section[]
  isEnrolled: boolean
  enrollmentProgress?: number
}
```

**Implementation Details**:
- Filters courses by organization_id and status='published'
- Checks enrollment status for button state ("Enroll" vs "Resume Course")
- Returns course metadata: thumbnail, instructor, duration, rating
- Implements pagination for performance
- Uses MongoDB indexes on (organization_id, status) for efficient queries

### 3. Enrollment Service

**Purpose**: Manage course enrollment and validation

**Interface**:
```typescript
interface EnrollmentService {
  enrollStudent(courseId: ObjectId, studentId: ObjectId): Promise<Enrollment>
  validateEnrollment(courseId: ObjectId, studentId: ObjectId): Promise<ValidationResult>
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

interface Enrollment {
  _id: ObjectId
  student_id: ObjectId
  course_id: ObjectId
  organization_id: ObjectId
  enrolled_at: Date
  progress: ProgressData
  status: 'active' | 'completed' | 'suspended'
}

interface ProgressData {
  completedLessons: CompletedLesson[]
  totalLessons: number
  completionPercentage: number
  totalTimeSpent: number
  lastAccessedLesson?: ObjectId
}
```

**Implementation Details**:
- Validates student role, organization match, course published status
- Checks for duplicate enrollment using compound unique index (student_id, course_id)
- Creates enrollment record with initial progress: 0%, empty completed_lectures array
- Sets is_completed: false initially
- Enforces multi-tenant isolation by verifying organization_id match

### 4. Progress Tracking Service

**Purpose**: Track and calculate course completion progress

**Interface**:
```typescript
interface ProgressTrackingService {
  markLectureComplete(enrollmentId: ObjectId, lectureId: ObjectId, timeSpent: number): Promise<UpdatedProgress>
  calculateProgress(enrollment: Enrollment, totalLectures: number): Promise<number>
  checkCourseCompletion(enrollment: Enrollment): Promise<boolean>
}

interface UpdatedProgress {
  completionPercentage: number
  completedLessons: ObjectId[]
  isCompleted: boolean
  totalTimeSpent: number
}
```

**Implementation Details**:
- Adds lectureId to completed_lectures array (prevents duplicates)
- Calculates progress: (completed_lectures.length / total_lectures) * 100
- Marks course complete when progress reaches 100%
- Updates lastAccessedAt timestamp
- Persists changes atomically using MongoDB update operations

## Data Models

### User Model (Extended)

The existing User model already supports the required fields. Key fields for this feature:

```javascript
{
  email: String (unique, indexed)
  password_hash: String (bcrypt hashed)
  name: String
  role: String (enum: ['student', ...])
  organization_id: ObjectId (ref: Organization, indexed)
  organization_code: String (indexed)
  isActive: Boolean (default: true)
  email_verified: Boolean
  created_at: Date
  updated_at: Date
}
```

**Indexes**:
- Compound unique: (email, organization_id) for org users
- Unique: email for platform_admin users
- Single: organization_id, role, is_deleted

### Enrollment Model (Existing)

The existing Enrollment model already contains all required fields:

```javascript
{
  organization_id: ObjectId (ref: Organization, required, indexed)
  student_id: ObjectId (ref: User, required, indexed)
  course_id: ObjectId (ref: Course, required, indexed)
  enrollmentType: String (enum: ['free', 'paid'])
  status: String (enum: ['active', 'completed', 'suspended', 'cancelled'])
  progress: {
    completedLessons: [{
      lessonId: ObjectId (ref: Lesson)
      completedAt: Date
      timeSpent: Number (seconds)
      score: Number
    }]
    totalLessons: Number
    completionPercentage: Number (0-100)
    lastAccessedLesson: ObjectId (ref: Lesson)
    totalTimeSpent: Number (seconds)
    averageScore: Number (0-100)
  }
  payment: { ... }
  enrolledAt: Date
  completedAt: Date
  lastAccessedAt: Date
}
```

**Indexes**:
- Compound unique: (student_id, course_id) - prevents duplicate enrollments
- Compound: (organization_id, student_id)
- Compound: (organization_id, course_id, status)
- Compound: (course_id, status)
- Compound: (student_id, status)

### Course Model (Existing)

The existing Course model supports all required fields:

```javascript
{
  organization_id: ObjectId (ref: Organization, indexed)
  title: String (required)
  description: String
  price: Number (min: 0, default: 0)
  category: String
  level: String (enum: ['beginner', 'intermediate', 'advanced'])
  status: String (enum: ['draft', 'published', 'archived'])
  instructor_id: ObjectId (ref: User)
  thumbnail: String
  duration: Number (minutes)
  rating: {
    average: Number (0-5)
    count: Number
  }
  isPublic: Boolean
  isActive: Boolean
  enrollmentCount: Number
  students: [ObjectId] (ref: User)
}
```

**Indexes**:
- Compound: (organization_id, status) - critical for course discovery
- Compound unique: (organization_id, title)
- Compound: (status, isPublic, isActive)
- Text: (title, description, tags) for search

### Organization Model (Existing)

```javascript
{
  name: String (required)
  slug: String (unique, lowercase)
  code: String (unique, uppercase, 6 chars)
  emailDomains: [String]
  status: String (enum: ['active', 'suspended', 'deleted'])
  isActive: Boolean
  is_deleted: Boolean
}
```

**Indexes**:
- Unique: code (for registration validation)
- Unique: slug
- Compound: (is_deleted, status)


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified several redundant properties that can be consolidated:

**Redundancies Identified**:
1. Organization validation (1.1, 2.1, 8.4) - All test the same behavior
2. Password hashing (1.3, 7.1, 7.2) - All verify bcrypt hashing
3. Organization filtering for courses (3.1, 9.1) - Same multi-tenant isolation
4. Organization validation for course details (4.2, 9.3) - Same access control
5. Organization validation for enrollment (5.2, 9.2) - Same enrollment isolation
6. Status validation for enrollment (5.3, 10.1) - Same published check
7. Duplicate enrollment prevention (5.4, 8.2, 10.2) - Same constraint
8. Role validation for enrollment (5.1, 10.3) - Same role check
9. Organization name display (2.2, 11.2) - Same API response
10. Course data completeness (3.2, 12.1) - Same response structure
11. Enrollment status display (3.3, 3.4, 12.2, 12.3) - Can be combined
12. Dashboard enrollment query (13.1, 13.2) - Same query behavior

**Consolidation Strategy**:
- Combine duplicate properties into single comprehensive tests
- Focus on unique validation value
- Eliminate properties that are subsumed by others

### Core Properties

Property 1: Organization Code Validation
*For any* organization code submitted during registration, the system SHALL validate that the code exists in the database and return the organization name if valid, or return an error if invalid.
**Validates: Requirements 1.1, 2.1, 2.2, 2.3, 8.4**

Property 2: Email Uniqueness
*For any* email address submitted during registration, the system SHALL reject registration if the email already exists in the system.
**Validates: Requirements 1.2, 8.1**

Property 3: Password Hashing
*For any* password submitted during registration, the system SHALL hash the password using bcrypt before storage, and the stored password_hash SHALL match the bcrypt pattern (^$2[aby]$).
**Validates: Requirements 1.3, 7.1, 7.2**

Property 4: Student User Creation
*For any* successful registration, the system SHALL create a user record with role="student", the provided organization_id, and status="active".
**Validates: Requirements 1.4**

Property 5: JWT Token Generation
*For any* successful registration, the system SHALL generate and return a valid JWT token that can be used for authentication.
**Validates: Requirements 1.5**

Property 6: Password Authentication
*For any* login attempt, the system SHALL compare the provided password against the stored bcrypt hash, succeeding for correct passwords and failing for incorrect passwords.
**Validates: Requirements 7.3**

Property 7: Organization-Scoped Course Discovery
*For any* student browsing courses, the system SHALL return only courses where organization_id matches the student's organization_id AND status="published".
**Validates: Requirements 3.1, 9.1**

Property 8: Course Data Completeness
*For any* course returned by the discovery API, the response SHALL include thumbnail, instructor name, duration, and rating fields.
**Validates: Requirements 3.2, 12.1**

Property 9: Enrollment Status Indication
*For any* course and student pair, the system SHALL return isEnrolled=true if an active enrollment exists, and isEnrolled=false otherwise.
**Validates: Requirements 3.3, 3.4, 12.2, 12.3**

Property 10: Course Access Validation
*For any* course details request, the system SHALL verify that: (1) the course exists, (2) the course belongs to the student's organization, and (3) the course status is "published", returning an error if any condition fails.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 9.3**

Property 11: Enrollment Validation
*For any* enrollment attempt, the system SHALL verify that: (1) the user has role="student", (2) the course belongs to the student's organization, (3) the course status is "published", and (4) no existing enrollment exists for this student-course pair, rejecting enrollment if any condition fails.
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 8.2, 9.2, 10.1, 10.2, 10.3**

Property 12: Enrollment Record Initialization
*For any* successful enrollment, the system SHALL create an enrollment record with: student_id, course_id, organization_id, enrolled_at timestamp, progress.completionPercentage=0, progress.completedLessons=[], and status="active".
**Validates: Requirements 5.5**

Property 13: Lecture Completion Tracking
*For any* lecture marked as complete, the system SHALL add the lectureId to the completedLessons array (if not already present) and update the lastAccessedAt timestamp.
**Validates: Requirements 6.1**

Property 14: Progress Calculation
*For any* enrollment with completed lectures, the progress percentage SHALL equal (completedLessons.length / totalLessons) * 100, rounded to the nearest integer.
**Validates: Requirements 6.2**

Property 15: Course Completion Detection
*For any* enrollment where progress percentage reaches 100%, the system SHALL set status="completed" and record the completedAt timestamp.
**Validates: Requirements 6.3**

Property 16: Progress Persistence
*For any* progress update, querying the enrollment record immediately after the update SHALL return the updated progress values.
**Validates: Requirements 6.4**

Property 17: Dashboard Enrollment Query
*For any* student, querying their enrollments SHALL return all courses where an active enrollment record exists for that student_id.
**Validates: Requirements 13.1, 13.2**

## Error Handling

### Error Categories

1. **Validation Errors** (400 Bad Request)
   - Invalid organization code
   - Duplicate email
   - Missing required fields
   - Invalid password format
   - Invalid course ID

2. **Authentication Errors** (401 Unauthorized)
   - Invalid credentials
   - Expired JWT token
   - Missing authentication token

3. **Authorization Errors** (403 Forbidden)
   - Non-student attempting enrollment
   - Cross-organization access attempt
   - Access to unpublished course

4. **Resource Errors** (404 Not Found)
   - Organization not found
   - Course not found
   - Enrollment not found

5. **Conflict Errors** (409 Conflict)
   - Duplicate enrollment attempt
   - Email already registered

6. **Server Errors** (500 Internal Server Error)
   - Database connection failures
   - Unexpected exceptions

### Error Response Format

All errors follow the standardized response format:

```json
{
  "success": false,
  "error": "Error category",
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Error Handling Strategy

1. **Input Validation**: Validate all inputs at the route handler level before processing
2. **Database Constraints**: Rely on MongoDB unique indexes for duplicate prevention
3. **Transaction Safety**: Use atomic operations for enrollment creation
4. **Graceful Degradation**: Return partial data when possible (e.g., course list with some failures)
5. **Error Logging**: Log all errors with context for debugging
6. **User-Friendly Messages**: Provide clear, actionable error messages to users

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Registration with valid organization code
- Registration with invalid organization code
- Login with correct/incorrect credentials
- Course discovery with no courses
- Enrollment in free vs paid courses
- Progress tracking with single lecture
- Error responses for various failure scenarios

**Property-Based Tests**: Verify universal properties across all inputs
- Use fast-check library for JavaScript/TypeScript
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `Feature: student-registration-enrollment, Property {N}: {property_text}`

### Property-Based Testing Configuration

**Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Test Structure**:
```javascript
import fc from 'fast-check';

// Feature: student-registration-enrollment, Property 1: Organization Code Validation
test('Property 1: Organization code validation', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 6, maxLength: 6 }),
      async (orgCode) => {
        // Test implementation
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage Requirements

1. **Registration Flow**: 
   - Unit tests: 8 tests (valid/invalid scenarios)
   - Property tests: 6 properties (1-6)

2. **Course Discovery**:
   - Unit tests: 6 tests (filtering, pagination, enrollment status)
   - Property tests: 4 properties (7-10)

3. **Enrollment Process**:
   - Unit tests: 8 tests (validation scenarios, payment handling)
   - Property tests: 3 properties (11-12, 17)

4. **Progress Tracking**:
   - Unit tests: 5 tests (lecture completion, percentage calculation)
   - Property tests: 4 properties (13-16)

### Integration Testing

Integration tests verify end-to-end flows:
1. Complete registration → login → course discovery → enrollment → progress tracking
2. Multi-tenant isolation across different organizations
3. Concurrent enrollment attempts (race conditions)
4. Database constraint enforcement

### Performance Testing

Key performance metrics:
- Registration: < 500ms (including bcrypt hashing)
- Course discovery: < 200ms for 50 courses
- Enrollment creation: < 300ms
- Progress update: < 100ms

Performance tests should use realistic data volumes:
- 1000+ organizations
- 10,000+ courses
- 100,000+ students
- 500,000+ enrollments
