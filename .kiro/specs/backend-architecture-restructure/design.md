# Design Document: Backend Architecture Restructure

## Overview

This design document outlines the restructuring of an existing Learning Management System (LMS) backend from its current monolithic structure to a well-defined layered architecture. The restructuring maintains the existing Node.js/Express/MongoDB technology stack while implementing clear separation of concerns, standardized middleware pipelines, and consistent RESTful API design patterns.

### Goals

1. Implement a clear layered architecture with defined boundaries between components
2. Establish a standardized middleware pipeline for all requests
3. Standardize all API endpoints to follow RESTful design principles
4. Enforce organization-level data isolation across all operations
5. Maintain simple, readable code that follows the "human kid written" principle
6. Ensure all existing functionality continues to work after restructuring

### Non-Goals

1. Changing the technology stack (Node.js/Express/MongoDB remains)
2. Migrating to microservices architecture
3. Adding new features beyond the restructuring scope
4. Changing database schema (organization_id field already exists)

## Architecture

### High-Level Architecture


The system follows a monolithic architecture with clear module boundaries:

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│              (Web, Mobile, Third-party Apps)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       API Gateway Layer                      │
│                  (Rate Limiting, Routing)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Middleware Pipeline                      │
│  Auth → Authorization → Organization Isolation → Validation  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Controller Layer                       │
│         (HTTP Request/Response, Input Validation)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│              (Business Logic, Orchestration)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│              (Database Queries, ORM Operations)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB Database                        │
│              (Organization-Isolated Collections)             │
└─────────────────────────────────────────────────────────────┘

         ┌──────────────────────────────────────┐
         │      Supporting Services             │
         ├──────────────────────────────────────┤
         │  • File Service (S3/Local Storage)   │
         │  • Payment Service (Gateway API)     │
         │  • Notification Service (Email/SMS)  │
         │  • Background Jobs (Bull Queues)     │
         │  • WebSocket Server (Real-time)      │
         │  • AI Service (ML Models)            │
         └──────────────────────────────────────┘
```

### Request Flow


Every request follows this standardized flow:

1. **API Gateway**: Receives request, applies rate limiting, logs request
2. **Auth Middleware**: Validates JWT token, extracts user context
3. **Authorization Middleware**: Checks user roles and permissions
4. **Organization Isolation Middleware**: Injects organization_id filter
5. **Controller**: Validates input, calls service layer
6. **Service Layer**: Executes business logic, orchestrates operations
7. **Data Access Layer**: Performs database queries with organization filter
8. **Response**: Returns through the same pipeline in reverse

### Directory Structure

The restructured codebase will follow this organization:

```
backend/
├── src/
│   ├── api/
│   │   ├── gateway/
│   │   │   ├── rateLimiter.js
│   │   │   └── router.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── authorization.middleware.js
│   │   │   ├── orgIsolation.middleware.js
│   │   │   ├── validation.middleware.js
│   │   │   └── errorHandler.middleware.js
│   │   └── routes/
│   │       ├── auth.routes.js
│   │       ├── course.routes.js
│   │       ├── enrollment.routes.js
│   │       ├── assessment.routes.js
│   │       ├── progress.routes.js
│   │       ├── payment.routes.js
│   │       ├── attendance.routes.js
│   │       ├── gradebook.routes.js
│   │       ├── timetable.routes.js
│   │       ├── liveClass.routes.js
│   │       ├── fees.routes.js
│   │       ├── parent.routes.js
│   │       ├── ai.routes.js
│   │       └── platform.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── course.controller.js
│   │   ├── enrollment.controller.js
│   │   ├── assessment.controller.js
│   │   ├── progress.controller.js
│   │   ├── payment.controller.js
│   │   ├── attendance.controller.js
│   │   ├── gradebook.controller.js
│   │   ├── timetable.controller.js
│   │   ├── liveClass.controller.js
│   │   ├── fees.controller.js
│   │   ├── parent.controller.js
│   │   ├── ai.controller.js
│   │   └── platform.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── course.service.js
│   │   ├── enrollment.service.js
│   │   ├── assessment.service.js
│   │   ├── progress.service.js
│   │   ├── payment.service.js
│   │   ├── attendance.service.js
│   │   ├── gradebook.service.js
│   │   ├── timetable.service.js
│   │   ├── liveClass.service.js
│   │   ├── fees.service.js
│   │   ├── parent.service.js
│   │   ├── ai.service.js
│   │   ├── platform.service.js
│   │   ├── file.service.js
│   │   ├── notification.service.js
│   │   └── websocket.service.js
│   ├── data/
│   │   ├── repositories/
│   │   │   ├── base.repository.js
│   │   │   ├── user.repository.js
│   │   │   ├── course.repository.js
│   │   │   ├── enrollment.repository.js
│   │   │   ├── assessment.repository.js
│   │   │   ├── progress.repository.js
│   │   │   ├── payment.repository.js
│   │   │   ├── attendance.repository.js
│   │   │   ├── grade.repository.js
│   │   │   ├── timetable.repository.js
│   │   │   ├── liveClass.repository.js
│   │   │   ├── fees.repository.js
│   │   │   └── organization.repository.js
│   │   └── models/
│   │       ├── user.model.js
│   │       ├── course.model.js
│   │       ├── enrollment.model.js
│   │       ├── assessment.model.js
│   │       ├── progress.model.js
│   │       ├── payment.model.js
│   │       ├── attendance.model.js
│   │       ├── grade.model.js
│   │       ├── timetable.model.js
│   │       ├── liveClass.model.js
│   │       ├── fees.model.js
│   │       └── organization.model.js
│   ├── jobs/
│   │   ├── queue.js
│   │   ├── processors/
│   │   │   ├── certificate.processor.js
│   │   │   ├── email.processor.js
│   │   │   └── notification.processor.js
│   │   └── schedulers/
│   │       └── reminder.scheduler.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── errors.js
│   │   ├── validators.js
│   │   └── helpers.js
│   ├── config/
│   │   ├── database.js
│   │   ├── jwt.js
│   │   ├── storage.js
│   │   └── environment.js
│   └── app.js
├── tests/
│   ├── unit/
│   ├── integration/
│   └── property/
├── .env
├── .env.example
├── package.json
└── README.md
```

## Components and Interfaces


### 1. API Gateway Layer

**Purpose**: Entry point for all requests, handles rate limiting and routing.

**Interface**:
```javascript
// rateLimiter.js
function createRateLimiter(options) {
  // Returns Express middleware
  // options: { windowMs, max, keyGenerator }
}

function createAuthenticatedRateLimiter() {
  // Higher limits for authenticated users
}

function createUnauthenticatedRateLimiter() {
  // Lower limits for public endpoints
}
```

**Responsibilities**:
- Apply rate limiting based on IP address and authentication status
- Log all incoming requests
- Route requests to appropriate middleware pipeline
- Return 429 status when rate limit exceeded

### 2. Middleware Pipeline

**Purpose**: Process requests through authentication, authorization, and organization isolation.

**Auth Middleware Interface**:
```javascript
// auth.middleware.js
async function authenticate(req, res, next) {
  // Extract JWT from Authorization header
  // Verify token validity
  // Attach user object to req.user
  // Call next() or return 401
}

function optionalAuth(req, res, next) {
  // Same as authenticate but doesn't fail if no token
}
```

**Authorization Middleware Interface**:
```javascript
// authorization.middleware.js
function requireRole(...roles) {
  // Returns middleware that checks req.user.role
  // Allows request if user has any of the specified roles
  // Returns 403 if unauthorized
}

function requirePermission(permission) {
  // Returns middleware that checks req.user.permissions
  // Returns 403 if user lacks permission
}
```


**Organization Isolation Middleware Interface**:
```javascript
// orgIsolation.middleware.js
function enforceOrgIsolation(req, res, next) {
  // Attach organization_id to req.orgContext
  // Set up query filter for all subsequent DB operations
  // Skip for platform admin routes
}

function bypassOrgIsolation(req, res, next) {
  // Used for platform admin endpoints
  // Sets flag to skip organization filtering
}
```

**Validation Middleware Interface**:
```javascript
// validation.middleware.js
function validateBody(schema) {
  // Returns middleware that validates req.body against Joi schema
  // Returns 400 with field-level errors if validation fails
}

function validateQuery(schema) {
  // Validates req.query parameters
}

function validateParams(schema) {
  // Validates req.params
}
```

### 3. Controller Layer

**Purpose**: Handle HTTP request/response, validate input, delegate to services.

**Base Controller Pattern**:
```javascript
// Base pattern for all controllers
class BaseController {
  constructor(service) {
    this.service = service;
  }

  // Wrap async handlers to catch errors
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Standard response methods
  sendSuccess(res, data, statusCode = 200) {
    res.status(statusCode).json({
      success: true,
      data
    });
  }

  sendError(res, message, statusCode = 400) {
    res.status(statusCode).json({
      success: false,
      error: message
    });
  }
}
```

**Example Controller Interface**:
```javascript
// course.controller.js
class CourseController extends BaseController {
  async createCourse(req, res) {
    // Extract data from req.body
    // Call service.createCourse()
    // Return 201 with created course
  }

  async getCourses(req, res) {
    // Extract pagination/filters from req.query
    // Call service.getCourses()
    // Return 200 with courses array
  }

  async getCourseById(req, res) {
    // Extract id from req.params
    // Call service.getCourseById()
    // Return 200 with course or 404
  }

  async updateCourse(req, res) {
    // Extract id and updates
    // Call service.updateCourse()
    // Return 200 with updated course
  }

  async deleteCourse(req, res) {
    // Extract id
    // Call service.deleteCourse()
    // Return 204
  }
}
```


### 4. Service Layer

**Purpose**: Implement business logic, orchestrate operations, coordinate between repositories.

**Base Service Pattern**:
```javascript
// Base pattern for all services
class BaseService {
  constructor(repository) {
    this.repository = repository;
  }

  // Common business logic methods
  async validateOwnership(resourceId, userId) {
    // Check if user owns/has access to resource
  }

  async checkPermissions(userId, action, resource) {
    // Verify user can perform action on resource
  }
}
```

**Example Service Interface**:
```javascript
// course.service.js
class CourseService extends BaseService {
  async createCourse(courseData, userId, organizationId) {
    // Validate course data
    // Check user permissions
    // Create course via repository
    // Return created course
  }

  async getCourses(filters, pagination, organizationId) {
    // Apply organization filter
    // Build query from filters
    // Fetch courses via repository
    // Return paginated results
  }

  async getCourseById(courseId, organizationId) {
    // Fetch course via repository
    // Verify belongs to organization
    // Return course or throw NotFoundError
  }

  async updateCourse(courseId, updates, userId, organizationId) {
    // Verify course exists and belongs to org
    // Check user permissions
    // Update via repository
    // Return updated course
  }

  async deleteCourse(courseId, userId, organizationId) {
    // Verify course exists and belongs to org
    // Check user permissions
    // Check for dependencies (enrollments, etc.)
    // Delete via repository
  }

  async publishCourse(courseId, userId, organizationId) {
    // Verify course is complete
    // Update status to published
    // Trigger notifications
  }
}
```


### 5. Data Access Layer

**Purpose**: Execute database queries, handle ORM operations, enforce organization isolation.

**Base Repository Pattern**:
```javascript
// base.repository.js
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data, organizationId) {
    // Add organization_id to data
    // Create document
    // Return created document
  }

  async findById(id, organizationId) {
    // Query with id and organization_id filter
    // Return document or null
  }

  async findAll(filters, pagination, organizationId) {
    // Build query with organization_id filter
    // Apply additional filters
    // Apply pagination
    // Return documents and total count
  }

  async update(id, updates, organizationId) {
    // Find document with id and organization_id
    // Apply updates
    // Return updated document
  }

  async delete(id, organizationId) {
    // Find and delete with id and organization_id
    // Return deleted document
  }

  async count(filters, organizationId) {
    // Count documents with filters and organization_id
  }

  // Helper to build organization filter
  buildOrgFilter(organizationId) {
    return organizationId ? { organization_id: organizationId } : {};
  }
}
```

**Example Repository Interface**:
```javascript
// course.repository.js
class CourseRepository extends BaseRepository {
  async findByInstructor(instructorId, organizationId) {
    // Query courses by instructor_id and organization_id
  }

  async findPublished(filters, pagination, organizationId) {
    // Query published courses with filters
  }

  async findWithEnrollmentCount(courseId, organizationId) {
    // Aggregate query to include enrollment count
  }

  async updateStatus(courseId, status, organizationId) {
    // Update course status field
  }
}
```


### 6. Supporting Services

**File Service Interface**:
```javascript
// file.service.js
class FileService {
  async uploadFile(file, userId, organizationId) {
    // Validate file type and size
    // Generate unique filename
    // Upload to storage (S3 or local)
    // Store metadata in database
    // Return file URL and metadata
  }

  async getFile(fileId, userId, organizationId) {
    // Verify user has access
    // Generate signed URL if using S3
    // Return file URL or stream
  }

  async deleteFile(fileId, userId, organizationId) {
    // Verify ownership
    // Delete from storage
    // Delete metadata from database
  }
}
```

**Payment Service Interface**:
```javascript
// payment.service.js
class PaymentService {
  async createPayment(paymentData, userId, organizationId) {
    // Validate payment data
    // Create payment intent with gateway
    // Store transaction in database
    // Return payment details
  }

  async verifyPayment(transactionId, organizationId) {
    // Query payment gateway
    // Update transaction status
    // Trigger enrollment/access grant
    // Return verification result
  }

  async processWebhook(webhookData) {
    // Verify webhook signature
    // Update transaction status
    // Trigger appropriate actions
  }

  async refundPayment(transactionId, userId, organizationId) {
    // Verify refund eligibility
    // Process refund with gateway
    // Update transaction status
    // Revoke access if needed
  }
}
```

**Notification Service Interface**:
```javascript
// notification.service.js
class NotificationService {
  async sendEmail(to, subject, body, organizationId) {
    // Queue email job
    // Return job ID
  }

  async sendSMS(to, message, organizationId) {
    // Queue SMS job
    // Return job ID
  }

  async sendPushNotification(userId, title, body, organizationId) {
    // Queue push notification job
    // Also send via WebSocket if user online
    // Return job ID
  }

  async sendBulkNotifications(userIds, notification, organizationId) {
    // Queue bulk notification job
    // Return job ID
  }
}
```


**WebSocket Service Interface**:
```javascript
// websocket.service.js
class WebSocketService {
  async handleConnection(socket, token) {
    // Authenticate socket connection
    // Store socket in connection map
    // Join organization room
  }

  async handleDisconnection(socket) {
    // Remove from connection map
    // Update user status
  }

  async sendToUser(userId, event, data) {
    // Find user's socket
    // Emit event with data
  }

  async sendToOrganization(organizationId, event, data) {
    // Emit to all sockets in organization room
  }

  async handleChatMessage(socket, message) {
    // Validate message
    // Store in database
    // Broadcast to recipients
  }
}
```

**AI Service Interface**:
```javascript
// ai.service.js
class AIService {
  async generateQuiz(topic, difficulty, questionCount) {
    // Call ML model API
    // Parse and validate questions
    // Return quiz data
  }

  async explainTopic(topic, level) {
    // Call ML model API
    // Return explanation text
  }

  async predictPerformance(userId, courseId, organizationId) {
    // Fetch user progress data
    // Call prediction model
    // Return prediction results
  }
}
```

### 7. Background Job Processing

**Queue Interface**:
```javascript
// queue.js
class JobQueue {
  constructor(queueName) {
    this.queue = new Bull(queueName, {
      redis: config.redis
    });
  }

  async addJob(jobData, options = {}) {
    // Add job to queue
    // Return job ID
  }

  async process(processor) {
    // Register job processor
    // Handle retries and failures
  }
}
```

**Example Processor**:
```javascript
// certificate.processor.js
async function processCertificateGeneration(job) {
  const { userId, courseId, organizationId } = job.data;
  
  // Fetch user and course data
  // Generate certificate PDF
  // Upload to storage
  // Store certificate record
  // Send notification to user
  
  return { certificateId, url };
}
```

## Data Models


All data models include `organization_id` field for organization-level isolation (except Organization model itself).

### User Model

```javascript
{
  _id: ObjectId,
  organization_id: ObjectId,
  email: String (unique within organization),
  password: String (hashed),
  first_name: String,
  last_name: String,
  role: String (enum: ['student', 'instructor', 'admin', 'parent', 'platform_admin']),
  permissions: [String],
  profile_picture: String (URL),
  status: String (enum: ['active', 'inactive', 'suspended']),
  created_at: Date,
  updated_at: Date
}
```

### Organization Model

```javascript
{
  _id: ObjectId,
  name: String,
  domain: String (unique),
  status: String (enum: ['active', 'inactive', 'suspended']),
  subscription_plan: String,
  settings: {
    timezone: String,
    currency: String,
    features: [String]
  },
  created_at: Date,
  updated_at: Date
}
```

### Course Model

```javascript
{
  _id: ObjectId,
  organization_id: ObjectId,
  title: String,
  description: String,
  instructor_id: ObjectId,
  category: String,
  level: String (enum: ['beginner', 'intermediate', 'advanced']),
  status: String (enum: ['draft', 'published', 'archived']),
  thumbnail: String (URL),
  price: Number,
  sections: [{
    _id: ObjectId,
    title: String,
    order: Number,
    lessons: [{
      _id: ObjectId,
      title: String,
      type: String (enum: ['video', 'text', 'quiz', 'assignment']),
      content: String,
      duration: Number,
      order: Number,
      resources: [String]
    }]
  }],
  created_at: Date,
  updated_at: Date
}
```

### Enrollment Model

```javascript
{
  _id: ObjectId,
  organization_id: ObjectId,
  user_id: ObjectId,
  course_id: ObjectId,
  status: String (enum: ['active', 'completed', 'dropped']),
  enrolled_at: Date,
  completed_at: Date,
  progress_percentage: Number
}
```

### Assessment Model

```javascript
{
  _id: ObjectId,
  organization_id: ObjectId,
  course_id: ObjectId,
  lesson_id: ObjectId,
  title: String,
  type: String (enum: ['quiz', 'assignment', 'exam']),
  questions: [{
    _id: ObjectId,
    question_text: String,
    type: String (enum: ['multiple_choice', 'true_false', 'short_answer']),
    options: [String],
    correct_answer: String,
    points: Number
  }],
  passing_score: Number,
  time_limit: Number,
  attempts_allowed: Number,
  created_at: Date
}
```


### Progress Model

```javascript
{
  _id: ObjectId,
  organization_id: ObjectId,
  user_id: ObjectId,
  course_id: ObjectId,
  completed_lessons: [ObjectId],
  quiz_scores: [{
    quiz_id: ObjectId,
    score: Number,
    attempted_at: Date
  }],
  last_accessed: Date,
  completion_percentage: Number
}
```

### Certificate Model

```javascript
{
  _id: ObjectId,
  organization_id: ObjectId,
  user_id: ObjectId,
  course_id: ObjectId,
  unique_id: String (for verification),
  issued_at: Date,
  certificate_url: String,
  metadata: {
    course_title: String,
    user_name: String,
    completion_date: Date,
    grade: String
  }
}
```

### Payment Model

```javascript
{
  _id: ObjectId,
  organization_id: ObjectId,
  user_id: ObjectId,
  course_id: ObjectId,
  amount: Number,
  currency: String,
  status: String (enum: ['pending', 'completed', 'failed', 'refunded']),
  payment_method: String,
  transaction_id: String,
  gateway_response: Object,
  created_at: Date,
  updated_at: Date
}
```

### Attendance Model

```javascript
{
  _id: ObjectId,
  organization_id: ObjectId,
  user_id: ObjectId,
  class_id: ObjectId,
  date: Date,
  status: String (enum: ['present', 'absent', 'late', 'excused']),
  marked_by: ObjectId,
  notes: String,
  created_at: Date
}
```

### Grade Model

```javascript
{
  _id: ObjectId,
  organization_id: ObjectId,
  user_id: ObjectId,
  course_id: ObjectId,
  assessment_id: ObjectId,
  score: Number,
  max_score: Number,
  grade: String,
  feedback: String,
  graded_by: ObjectId,
  graded_at: Date
}
```

### Timetable Model

```javascript
{
  _id: ObjectId,
  organization_id: ObjectId,
  course_id: ObjectId,
  instructor_id: ObjectId,
  day_of_week: Number (0-6),
  start_time: String,
  end_time: String,
  room: String,
  recurring: Boolean,
  start_date: Date,
  end_date: Date
}
```

### LiveClass Model

```javascript
{
  _id: ObjectId,
  organization_id: ObjectId,
  course_id: ObjectId,
  instructor_id: ObjectId,
  title: String,
  scheduled_at: Date,
  duration: Number,
  meeting_url: String,
  recording_url: String,
  status: String (enum: ['scheduled', 'live', 'completed', 'cancelled']),
  participants: [ObjectId]
}
```

### Fees Model

```javascript
{
  _id: ObjectId,
  organization_id: ObjectId,
  student_id: ObjectId,
  fee_type: String,
  amount: Number,
  due_date: Date,
  status: String (enum: ['pending', 'paid', 'overdue', 'waived']),
  paid_amount: Number,
  paid_at: Date,
  payment_id: ObjectId
}
```

## Correctness Properties


A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Middleware Error Propagation

*For any* request that encounters an error in any middleware, the system should halt processing immediately and return an appropriate error response without executing subsequent middleware or controllers.

**Validates: Requirements 2.9**

### Property 2: Response Format Consistency

*For any* successful API response, the response body should be valid JSON with a consistent structure containing a success field and data field.

**Validates: Requirements 3.4**

### Property 3: Query Parameter Support

*For any* GET endpoint that returns collections, the system should support pagination (limit, offset), filtering (field-based query params), and sorting (sort, order params), and the results should correctly reflect these parameters.

**Validates: Requirements 3.7, 3.8, 3.9, 6.3**

### Property 4: Error Response Format

*For any* error response, the system should return a JSON object containing success: false, an error message, an HTTP status code appropriate to the error type, and a unique error_code for tracking.

**Validates: Requirements 3.10, 21.7**

### Property 5: Authentication Enforcement

*For any* request to an endpoint with /api/ prefix (excluding public endpoints), the system should reject requests without valid JWT tokens with a 401 Unauthorized error.

**Validates: Requirements 4.2**

### Property 6: Organization Isolation

*For any* authenticated request to organization-scoped endpoints, the system should only return or modify resources that belong to the user's organization, and attempts to access resources from other organizations should result in a 403 Forbidden error or 404 Not Found error.

**Validates: Requirements 4.3, 6.2, 6.4, 19.1, 19.2, 19.3**

### Property 7: Platform Admin Authorization

*For any* request to an endpoint with /platform/ prefix, the system should reject requests from users without platform_admin role with a 403 Forbidden error.

**Validates: Requirements 4.5**

### Property 8: Resource Creation with Organization Context

*For any* resource creation request (POST to /api/*), the system should automatically set the organization_id field to match the authenticated user's organization, regardless of what organization_id value (if any) is provided in the request body.

**Validates: Requirements 6.1, 19.5**

### Property 9: Resource Update with Permission Verification

*For any* resource update request (PUT/PATCH to /api/*/:id), the system should verify that: (1) the resource exists, (2) the resource belongs to the user's organization, (3) the user has permission to update the resource, and should return appropriate errors (404, 403) if any check fails.

**Validates: Requirements 6.5, 6.10**

### Property 10: Resource Deletion with Permission Verification

*For any* resource deletion request (DELETE to /api/*/:id), the system should verify that: (1) the resource exists, (2) the resource belongs to the user's organization, (3) the user has permission to delete the resource, and should return appropriate errors (404, 403) if any check fails.

**Validates: Requirements 6.6, 6.11**

### Property 11: Nested Resource Creation

*For any* nested resource creation request (POST to /api/*/parent_id/children), the system should verify the parent resource exists and belongs to the user's organization before creating the child resource, and the child should inherit the organization_id from the parent.

**Validates: Requirements 6.8, 6.9**

### Property 12: Validation Error Responses

*For any* request with invalid input data, the system should return a 400 Bad Request error with field-level error messages indicating which fields failed validation and why.

**Validates: Requirements 21.2**

### Property 13: Not Found Error Responses

*For any* request for a specific resource by ID that doesn't exist or doesn't belong to the user's organization, the system should return a 404 Not Found error with a clear message.

**Validates: Requirements 21.5**

### Property 14: File Upload Validation

*For any* file upload request, the system should validate the file type against an allowed list and the file size against a maximum limit, rejecting invalid files with a 400 Bad Request error before storing anything.

**Validates: Requirements 24.1**

### Property 15: File Storage with Unique Identifiers

*For any* valid file upload, the system should store the file with a unique identifier, store metadata in the database with organization_id, and return a reference that can be used to retrieve the file later.

**Validates: Requirements 24.2**

### Property 16: File Access Control

*For any* file retrieval request, the system should verify that: (1) the file exists, (2) the file belongs to the user's organization or the user has explicit permission to access it, and should return 403 Forbidden or 404 Not Found if access is denied.

**Validates: Requirements 24.3, 24.4**

### Property 17: WebSocket Organization Isolation

*For any* WebSocket message or notification, the system should only deliver messages to users within the same organization as the sender, preventing cross-organization communication.

**Validates: Requirements 23.6**

## Error Handling


### Error Handling Strategy

The system implements a centralized error handling approach with custom error classes and a global error handler middleware.

### Custom Error Classes

```javascript
// errors.js
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, fields = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.fields = fields;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class RateLimitError extends AppError {
  constructor(retryAfter) {
    super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}
```

### Global Error Handler

```javascript
// errorHandler.middleware.js
function errorHandler(err, req, res, next) {
  // Log error with context
  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    errorCode: err.errorCode,
    userId: req.user?.id,
    organizationId: req.user?.organization_id,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Don't expose internal errors to clients
  if (!err.isOperational) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      error_code: 'INTERNAL_ERROR'
    });
  }

  // Send operational errors to client
  const response = {
    success: false,
    error: err.message,
    error_code: err.errorCode
  };

  // Add field-level errors for validation errors
  if (err instanceof ValidationError) {
    response.fields = err.fields;
  }

  // Add retry-after for rate limit errors
  if (err instanceof RateLimitError) {
    res.set('Retry-After', err.retryAfter);
  }

  res.status(err.statusCode).json(response);
}
```

### Error Handling in Layers

**Controller Layer**:
- Catches errors from service layer
- Wraps in appropriate error classes
- Passes to error handler middleware

**Service Layer**:
- Throws custom error classes for business logic violations
- Validates business rules
- Propagates repository errors

**Repository Layer**:
- Throws NotFoundError when resources don't exist
- Throws database-specific errors
- Handles connection errors

## Testing Strategy


The testing strategy employs a dual approach combining unit tests for specific scenarios and property-based tests for universal correctness properties.

### Testing Approach

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Authentication flows (register, login, logout, password reset)
- Specific API endpoint behaviors
- Error conditions and edge cases
- Middleware ordering and execution
- Background job processing
- WebSocket connection handling

**Property-Based Tests**: Verify universal properties across all inputs
- Organization isolation across all endpoints
- Authentication enforcement
- Permission verification
- Query parameter handling (pagination, filtering, sorting)
- Error response formats
- File access control
- Resource creation/update/deletion patterns

### Property-Based Testing Configuration

**Library**: Use `fast-check` for JavaScript/Node.js property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: backend-architecture-restructure, Property N: [property description]`

**Example Property Test Structure**:

```javascript
// tests/property/organization-isolation.test.js
const fc = require('fast-check');
const request = require('supertest');
const app = require('../../src/app');

describe('Property 6: Organization Isolation', () => {
  // Feature: backend-architecture-restructure, Property 6: Organization Isolation
  it('should prevent cross-organization resource access', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          org1: organizationArbitrary(),
          org2: organizationArbitrary(),
          user1: userArbitrary(),
          user2: userArbitrary(),
          resource: courseArbitrary()
        }),
        async ({ org1, org2, user1, user2, resource }) => {
          // Setup: Create two organizations and users
          await setupOrganization(org1);
          await setupOrganization(org2);
          user1.organization_id = org1.id;
          user2.organization_id = org2.id;
          await createUser(user1);
          await createUser(user2);
          
          // Create resource in org1
          resource.organization_id = org1.id;
          const created = await createResource(resource, user1);
          
          // Attempt to access from org2
          const token2 = generateToken(user2);
          const response = await request(app)
            .get(`/api/courses/${created.id}`)
            .set('Authorization', `Bearer ${token2}`);
          
          // Should return 403 or 404, never the resource
          expect([403, 404]).toContain(response.status);
          expect(response.body.data).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Organization

```
tests/
├── unit/
│   ├── middleware/
│   │   ├── auth.test.js
│   │   ├── authorization.test.js
│   │   └── orgIsolation.test.js
│   ├── services/
│   │   ├── auth.service.test.js
│   │   ├── course.service.test.js
│   │   └── payment.service.test.js
│   ├── repositories/
│   │   ├── course.repository.test.js
│   │   └── user.repository.test.js
│   └── controllers/
│       ├── auth.controller.test.js
│       └── course.controller.test.js
├── integration/
│   ├── auth-flow.test.js
│   ├── course-management.test.js
│   ├── enrollment-flow.test.js
│   └── payment-flow.test.js
└── property/
    ├── organization-isolation.test.js
    ├── authentication-enforcement.test.js
    ├── permission-verification.test.js
    ├── query-parameters.test.js
    ├── error-responses.test.js
    ├── file-access-control.test.js
    └── resource-operations.test.js
```

### Test Data Generators (Arbitraries)

Property-based tests require generators for random test data:

```javascript
// tests/arbitraries/index.js
const fc = require('fast-check');

function organizationArbitrary() {
  return fc.record({
    name: fc.string({ minLength: 3, maxLength: 50 }),
    domain: fc.domain(),
    status: fc.constantFrom('active', 'inactive', 'suspended')
  });
}

function userArbitrary() {
  return fc.record({
    email: fc.emailAddress(),
    password: fc.string({ minLength: 8, maxLength: 50 }),
    first_name: fc.string({ minLength: 1, maxLength: 30 }),
    last_name: fc.string({ minLength: 1, maxLength: 30 }),
    role: fc.constantFrom('student', 'instructor', 'admin', 'parent')
  });
}

function courseArbitrary() {
  return fc.record({
    title: fc.string({ minLength: 5, maxLength: 100 }),
    description: fc.string({ minLength: 10, maxLength: 500 }),
    level: fc.constantFrom('beginner', 'intermediate', 'advanced'),
    price: fc.nat({ max: 10000 })
  });
}

function paginationArbitrary() {
  return fc.record({
    limit: fc.integer({ min: 1, max: 100 }),
    offset: fc.nat({ max: 1000 })
  });
}
```

### Integration Testing

Integration tests verify end-to-end flows:

1. **Authentication Flow**: Register → Login → Access Protected Resource → Logout
2. **Course Management Flow**: Create Course → Add Sections → Add Lessons → Publish → Enroll Student
3. **Assessment Flow**: Create Quiz → Student Takes Quiz → Submit Answers → View Results
4. **Payment Flow**: Create Payment → Verify Payment → Grant Access → Refund
5. **Live Class Flow**: Schedule Class → Join Class → Record Session → Access Recording

### Testing Database

Use a separate test database with the same schema:
- Reset database before each test suite
- Use transactions for test isolation where possible
- Clean up test data after each test
- Use in-memory MongoDB for faster tests

### Continuous Integration

All tests must pass before merging:
- Unit tests: Fast feedback (< 1 minute)
- Property tests: Comprehensive coverage (< 5 minutes)
- Integration tests: End-to-end validation (< 10 minutes)

## Implementation Notes

### Migration Strategy

The restructuring will be done incrementally to minimize disruption:

1. **Phase 1: Setup New Structure**
   - Create new directory structure
   - Set up base classes and interfaces
   - Configure testing framework

2. **Phase 2: Migrate Data Layer**
   - Create repository classes
   - Migrate models to new structure
   - Add organization_id filters

3. **Phase 3: Migrate Service Layer**
   - Create service classes
   - Move business logic from controllers
   - Add permission checks

4. **Phase 4: Migrate Controller Layer**
   - Simplify controllers to handle HTTP only
   - Add input validation
   - Wire to services

5. **Phase 5: Implement Middleware Pipeline**
   - Create middleware components
   - Configure middleware order
   - Add to routes

6. **Phase 6: Migrate Routes**
   - Restructure routes to match API design
   - Apply middleware pipeline
   - Update URL patterns

7. **Phase 7: Add Supporting Services**
   - Implement file service
   - Implement notification service
   - Set up background jobs
   - Configure WebSocket server

8. **Phase 8: Testing and Validation**
   - Write property-based tests
   - Write integration tests
   - Validate all endpoints
   - Performance testing

### Code Style Guidelines

**Naming Conventions**:
- Files: kebab-case (e.g., `course.service.js`)
- Classes: PascalCase (e.g., `CourseService`)
- Functions: camelCase (e.g., `getCourseById`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)

**Function Length**:
- Keep functions under 20 lines where practical
- Extract complex logic into helper functions
- Use descriptive function names

**Async/Await**:
- Always use async/await for asynchronous operations
- Never use callbacks
- Always handle errors with try/catch

**Comments**:
- Use JSDoc for all public functions
- Include parameter types and return types
- Document complex business logic

**Error Handling**:
- Always throw custom error classes
- Never throw raw strings
- Include context in error messages

### Environment Configuration

Required environment variables:

```
# Server
NODE_ENV=development|production|test
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/lms
MONGODB_TEST_URI=mongodb://localhost:27017/lms_test

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Storage
STORAGE_TYPE=local|s3
STORAGE_PATH=./uploads
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Payment Gateway
PAYMENT_GATEWAY_API_KEY=your-key
PAYMENT_GATEWAY_SECRET=your-secret

# Email
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email
EMAIL_PASSWORD=your-password

# Redis (for Bull queues)
REDIS_URL=redis://localhost:6379

# AI Service
AI_SERVICE_URL=http://localhost:5000
AI_SERVICE_API_KEY=your-key
```

This design provides a clear roadmap for restructuring the LMS backend while maintaining all existing functionality and adding robust testing to ensure correctness.
