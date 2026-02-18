# Implementation Plan: Backend Architecture Restructure

## Overview

This implementation plan breaks down the restructuring of the LMS backend into incremental, testable steps. Each task builds on previous work, ensuring the system remains functional throughout the migration. The plan follows the phased approach outlined in the design document, starting with foundational infrastructure and progressively migrating existing code to the new architecture.

## Tasks

- [x] 1. Setup project structure and base infrastructure
  - Create new directory structure following the design
  - Set up base classes (BaseController, BaseService, BaseRepository)
  - Configure testing framework (Jest, fast-check for property tests)
  - Set up test database configuration
  - Create environment configuration files
  - _Requirements: 1.1-1.12, 25.1-25.8_

- [x] 2. Implement custom error classes and global error handler
  - [x] 2.1 Create custom error classes (AppError, ValidationError, AuthenticationError, etc.)
    - Implement error hierarchy with proper status codes and error codes
    - _Requirements: 21.2, 21.3, 21.4, 21.5, 21.6, 21.7_
  
  - [x] 2.2 Create global error handler middleware
    - Implement centralized error logging
    - Format error responses consistently
    - _Requirements: 21.1, 21.2, 21.7_
  
  - [x] 2.3 Write unit tests for error classes and handler
    - Test each error type returns correct status code and format
    - Test error logging includes required context
    - _Requirements: 21.1-21.7_

- [x] 3. Implement middleware pipeline components
  - [x] 3.1 Create rate limiter middleware
    - Implement IP-based rate limiting
    - Support different limits for authenticated vs unauthenticated
    - Return 429 with Retry-After header when exceeded
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_
  
  - [x] 3.2 Create authentication middleware
    - Extract and verify JWT tokens
    - Attach user object to request
    - Support optional authentication
    - _Requirements: 5.2, 5.6_
  
  - [x] 3.3 Create authorization middleware
    - Implement role-based access control
    - Implement permission-based access control
    - _Requirements: 4.5_
  
  - [x] 3.4 Create organization isolation middleware
    - Inject organization_id into request context
    - Support bypass for platform admin routes
    - _Requirements: 19.1, 19.2, 19.5, 19.6_
  
  - [x] 3.5 Create validation middleware
    - Implement body, query, and params validation using Joi
    - Return field-level validation errors
    - _Requirements: 21.2, 25.7_
  
  - [x] 3.6 Write unit tests for middleware components
    - Test rate limiter tracks requests and enforces limits
    - Test auth middleware validates tokens correctly
    - Test authorization checks roles and permissions
    - Test org isolation injects correct context
    - Test validation returns proper error format
    - _Requirements: 2.1-2.9, 20.1-20.5, 21.2_
  
  - [x] 3.7 Write property test for middleware error propagation
    - **Property 1: Middleware Error Propagation**
    - **Validates: Requirements 2.9**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement data access layer (repositories and models)
  - [x] 5.1 Create base repository with organization filtering
    - Implement CRUD operations with automatic organization_id filtering
    - Implement pagination, filtering, and sorting helpers
    - _Requirements: 19.1, 19.2, 19.5_
  
  - [x] 5.2 Create MongoDB models with organization_id field
    - Define schemas for User, Organization, Course, Enrollment, Assessment, Progress, Certificate, Payment, Attendance, Grade, Timetable, LiveClass, Fees
    - Add indexes for organization_id and common query fields
    - _Requirements: 19.4_
  
  - [x] 5.3 Create specific repositories for each model
    - Extend BaseRepository for each entity type
    - Implement entity-specific query methods
    - _Requirements: 19.1, 19.2_
  
  - [x] 5.4 Write unit tests for base repository
    - Test CRUD operations apply organization filter
    - Test pagination, filtering, sorting work correctly
    - _Requirements: 3.7, 3.8, 3.9, 19.1_
  
  - [x] 5.5 Write property test for organization isolation in queries
    - **Property 6: Organization Isolation (Data Layer)**
    - **Validates: Requirements 19.1, 19.2, 19.3**

- [x] 6. Implement service layer
  - [x] 6.1 Create authentication service
    - Implement register, login, logout, forgot-password, reset-password
    - Implement JWT token generation and validation
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 6.2 Create course service
    - Implement course CRUD operations
    - Implement section and lesson management
    - Implement publish functionality
    - _Requirements: 6.1-6.11_
  
  - [x] 6.3 Create enrollment service
    - Implement enrollment creation and management
    - Implement course listing for students
    - _Requirements: 7.1-7.5_
  
  - [x] 6.4 Create assessment service
    - Implement quiz CRUD operations
    - Implement quiz submission and scoring
    - _Requirements: 8.1-8.7_
  
  - [x] 6.5 Create progress and certificate service
    - Implement progress tracking
    - Implement automatic certificate generation
    - Implement certificate verification
    - _Requirements: 9.1-9.7_
  
  - [x] 6.6 Create payment service
    - Implement payment creation and verification
    - Implement webhook handling
    - Implement refund processing
    - _Requirements: 10.1-10.5_
  
  - [x] 6.7 Create attendance service
    - Implement attendance marking (single and bulk)
    - Implement attendance reporting
    - _Requirements: 11.1-11.5_
  
  - [x] 6.8 Create gradebook service
    - Implement grade management
    - Implement grade analytics and export
    - _Requirements: 12.1-12.5_
  
  - [x] 6.9 Create timetable service
    - Implement timetable CRUD operations
    - Implement conflict detection
    - _Requirements: 13.1-13.6_
  
  - [x] 6.10 Create live class service
    - Implement live class scheduling and management
    - Implement join URL generation
    - Implement recording management
    - _Requirements: 14.1-14.6_
  
  - [x] 6.11 Create fees service
    - Implement fee structure management
    - Implement payment tracking
    - Implement reminder functionality
    - _Requirements: 15.1-15.6_
  
  - [x] 6.12 Create parent portal service
    - Implement child linking
    - Implement child data access (progress, attendance, grades, fees)
    - _Requirements: 16.1-16.6_
  
  - [x] 6.13 Create AI service
    - Implement quiz generation
    - Implement topic explanation
    - Implement performance prediction
    - _Requirements: 17.1, 17.2, 17.3_
  
  - [x] 6.14 Create gamification service
    - Implement points management
    - Implement leaderboard generation
    - Implement badge management
    - _Requirements: 17.4, 17.5, 17.6_
  
  - [x] 6.15 Create platform administration service
    - Implement organization management
    - Implement platform analytics
    - _Requirements: 18.1-18.6_
  
  - [x] 6.16 Write unit tests for service layer
    - Test business logic for each service
    - Test permission checks work correctly
    - Test error conditions are handled properly
    - _Requirements: 5.1-18.6_
  
  - [x] 6.17 Write property test for resource creation with org context
    - **Property 8: Resource Creation with Organization Context**
    - **Validates: Requirements 6.1, 19.5**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement controller layer
  - [x] 8.1 Create authentication controller
    - Implement HTTP handlers for auth endpoints
    - Add input validation
    - _Requirements: 5.1-5.7_
  
  - [x] 8.2 Create course controller
    - Implement HTTP handlers for course endpoints
    - Add input validation
    - _Requirements: 6.1-6.11_
  
  - [x] 8.3 Create enrollment controller
    - Implement HTTP handlers for enrollment endpoints
    - _Requirements: 7.1-7.5_
  
  - [x] 8.4 Create assessment controller
    - Implement HTTP handlers for assessment endpoints
    - _Requirements: 8.1-8.7_
  
  - [x] 8.5 Create progress and certificate controller
    - Implement HTTP handlers for progress and certificate endpoints
    - _Requirements: 9.1-9.7_
  
  - [x] 8.6 Create payment controller
    - Implement HTTP handlers for payment endpoints
    - _Requirements: 10.1-10.5_
  
  - [x] 8.7 Create attendance controller
    - Implement HTTP handlers for attendance endpoints
    - _Requirements: 11.1-11.5_
  
  - [x] 8.8 Create gradebook controller
    - Implement HTTP handlers for gradebook endpoints
    - _Requirements: 12.1-12.5_
  
  - [x] 8.9 Create timetable controller
    - Implement HTTP handlers for timetable endpoints
    - _Requirements: 13.1-13.6_
  
  - [x] 8.10 Create live class controller
    - Implement HTTP handlers for live class endpoints
    - _Requirements: 14.1-14.6_
  
  - [x] 8.11 Create fees controller
    - Implement HTTP handlers for fees endpoints
    - _Requirements: 15.1-15.6_
  
  - [x] 8.12 Create parent portal controller
    - Implement HTTP handlers for parent portal endpoints
    - _Requirements: 16.1-16.6_
  
  - [x] 8.13 Create AI and gamification controller
    - Implement HTTP handlers for AI and gamification endpoints
    - _Requirements: 17.1-17.6_
  
  - [x] 8.14 Create platform administration controller
    - Implement HTTP handlers for platform admin endpoints
    - _Requirements: 18.1-18.6_
  
  - [x] 8.15 Write unit tests for controllers
    - Test request/response handling
    - Test input validation
    - Test error responses
    - _Requirements: 3.5, 21.2_
  
  - [x] 8.16 Write property test for validation error responses
    - **Property 12: Validation Error Responses**
    - **Validates: Requirements 21.2**

- [x] 9. Implement routes with middleware pipeline
  - [x] 9.1 Create authentication routes
    - Define routes with /auth/ prefix
    - Apply appropriate middleware (rate limiting, optional auth for /auth/me)
    - _Requirements: 4.7, 4.8, 4.9, 5.1-5.7_
  
  - [x] 9.2 Create organization-scoped API routes
    - Define routes with /api/ prefix
    - Apply full middleware pipeline (rate limit → auth → authorization → org isolation)
    - _Requirements: 4.1, 4.2, 4.3, 6.1-17.6_
  
  - [x] 9.3 Create platform administration routes
    - Define routes with /platform/ prefix
    - Apply middleware with platform admin check
    - _Requirements: 4.4, 4.5, 18.1-18.6_
  
  - [x] 9.4 Create payment routes
    - Define routes with /payments/ prefix
    - Apply appropriate middleware
    - _Requirements: 4.6, 10.1-10.5_
  
  - [x] 9.5 Write integration tests for route middleware pipeline
    - Test middleware executes in correct order
    - Test auth is enforced on /api/ routes
    - Test platform admin is enforced on /platform/ routes
    - _Requirements: 2.1-2.9, 4.1-4.9_
  
  - [x] 9.6 Write property test for authentication enforcement
    - **Property 5: Authentication Enforcement**
    - **Validates: Requirements 4.2**
  
  - [x] 9.7 Write property test for platform admin authorization
    - **Property 7: Platform Admin Authorization**
    - **Validates: Requirements 4.5**

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement supporting services
  - [x] 11.1 Create file service
    - Implement file upload with validation
    - Implement file storage (local and S3 support)
    - Implement file retrieval with access control
    - Implement file deletion
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.6_
  
  - [x] 11.2 Create notification service
    - Implement email sending (queue-based)
    - Implement SMS sending (queue-based)
    - Implement push notification sending
    - _Requirements: 1.7_
  
  - [x] 11.3 Create WebSocket service
    - Implement WebSocket connection handling with JWT auth
    - Implement organization-scoped rooms
    - Implement real-time message delivery
    - Implement chat message handling
    - _Requirements: 23.1-23.6_
  
  - [x] 11.4 Set up background job processing
    - Configure Bull queues with Redis
    - Create job processors for certificates, emails, notifications
    - Implement retry logic with exponential backoff
    - _Requirements: 22.1-22.6_
  
  - [x] 11.5 Write unit tests for supporting services
    - Test file validation rejects invalid files
    - Test file storage creates unique identifiers
    - Test notification queueing works correctly
    - Test WebSocket authentication
    - Test background job processing and retries
    - _Requirements: 22.1-24.6_
  
  - [x] 11.6 Write property test for file upload validation
    - **Property 14: File Upload Validation**
    - **Validates: Requirements 24.1**
  
  - [x] 11.7 Write property test for file storage
    - **Property 15: File Storage with Unique Identifiers**
    - **Validates: Requirements 24.2**
  
  - [x] 11.8 Write property test for file access control
    - **Property 16: File Access Control**
    - **Validates: Requirements 24.3, 24.4**
  
  - [x] 11.9 Write property test for WebSocket organization isolation
    - **Property 17: WebSocket Organization Isolation**
    - **Validates: Requirements 23.6**

- [x] 12. Implement comprehensive property-based tests
  - [x] 12.1 Write property test for response format consistency
    - **Property 2: Response Format Consistency**
    - **Validates: Requirements 3.4**
  
  - [x] 12.2 Write property test for query parameter support
    - **Property 3: Query Parameter Support**
    - **Validates: Requirements 3.7, 3.8, 3.9, 6.3**
  
  - [x] 12.3 Write property test for error response format
    - **Property 4: Error Response Format**
    - **Validates: Requirements 3.10, 21.7**
  
  - [x] 12.4 Write property test for organization isolation (end-to-end)
    - **Property 6: Organization Isolation**
    - **Validates: Requirements 4.3, 6.2, 6.4, 19.1, 19.2, 19.3**
  
  - [x] 12.5 Write property test for resource update with permissions
    - **Property 9: Resource Update with Permission Verification**
    - **Validates: Requirements 6.5, 6.10**
  
  - [x] 12.6 Write property test for resource deletion with permissions
    - **Property 10: Resource Deletion with Permission Verification**
    - **Validates: Requirements 6.6, 6.11**
  
  - [x] 12.7 Write property test for nested resource creation
    - **Property 11: Nested Resource Creation**
    - **Validates: Requirements 6.8, 6.9**
  
  - [x] 12.8 Write property test for not found error responses
    - **Property 13: Not Found Error Responses**
    - **Validates: Requirements 21.5**

- [x] 13. Write integration tests for complete flows
  - [x] 13.1 Write integration test for authentication flow
    - Test register → login → access protected resource → logout
    - _Requirements: 5.1-5.7_
  
  - [x] 13.2 Write integration test for course management flow
    - Test create course → add sections → add lessons → publish → enroll student
    - _Requirements: 6.1-7.5_
  
  - [x] 13.3 Write integration test for assessment flow
    - Test create quiz → student takes quiz → submit answers → view results
    - _Requirements: 8.1-8.7_
  
  - [x] 13.4 Write integration test for payment flow
    - Test create payment → verify payment → grant access → refund
    - _Requirements: 10.1-10.5_
  
  - [x] 13.5 Write integration test for live class flow
    - Test schedule class → join class → record session → access recording
    - _Requirements: 14.1-14.6_

- [x] 14. Final checkpoint and validation
  - Run all tests (unit, property, integration)
  - Verify all API endpoints work correctly
  - Verify organization isolation is enforced everywhere
  - Verify error handling is consistent
  - Verify logging is comprehensive
  - Check code quality (linting, formatting, documentation)
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout the restructuring
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- The implementation follows the phased migration strategy from the design document
- All existing functionality must continue working throughout the migration
