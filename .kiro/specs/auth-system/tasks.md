# Implementation Plan: Authentication System

## Overview

This implementation plan breaks down the authentication system into discrete, incremental coding tasks. Each task builds on previous work, with property-based tests integrated throughout to validate correctness early. The plan follows a bottom-up approach: core models → services → middleware → API routes → frontend integration.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create directory structure: `src/models`, `src/services`, `src/middleware`, `src/api/routes`, `src/utils`, `src/config`
  - Install dependencies: express, mongoose, bcrypt, jsonwebtoken, joi, redis, ioredis, nodemailer, twilio, express-rate-limit, cors, helmet
  - Install dev dependencies: jest, supertest, fast-check, mongodb-memory-server, sinon
  - Configure environment variables: JWT_SECRET, MONGODB_URI, REDIS_URL, SENDGRID_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
  - Set up Jest configuration for testing
  - _Requirements: All (foundation)_

- [x] 2. Implement database models
  - [x] 2.1 Create User model with Mongoose schema
    - Define UserSchema with all fields (email, password_hash, name, role, organization_id, parent_link, profile, preferences, verification flags, timestamps)
    - Add compound unique index on email + organization_id
    - Add indexes on role and organization_id
    - Add pre-save hook to update updated_at timestamp
    - _Requirements: 1.6, 1.7, 1.8, 8.1, 8.6, 9.1, 15.2_
  
  - [x] 2.2 Write property test for User model
    - **Property 43: Organization ID storage**
    - **Property 47: Single role assignment**
    - **Validates: Requirements 8.1, 9.1**
  
  - [x] 2.3 Create Organization model with Mongoose schema
    - Define OrganizationSchema with fields (name, slug, address, logo_url, admin_user_id, settings, created_at)
    - Add unique index on slug
    - _Requirements: 1.1, 8.7, 15.2_
  
  - [x] 2.4 Create VerificationCode model with Mongoose schema
    - Define VerificationCodeSchema with fields (user_id, code, type, expires_at, used, created_at)
    - Add indexes on user_id + type
    - Add TTL index on expires_at for automatic expiration
    - _Requirements: 2.1, 2.4, 3.1, 3.4, 7.1, 7.2_
  
  - [x] 2.5 Write property test for VerificationCode expiration
    - **Property 12: Email verification code generation**
    - **Property 18: Phone OTP generation**
    - **Validates: Requirements 2.1, 2.4, 3.1, 3.4**

- [ ] 3. Implement Token Service
  - [x] 3.1 Create TokenService class with JWT generation
    - Implement generateToken(payload, expiresIn) using jsonwebtoken
    - Set default expiration to 24 hours
    - Sign with JWT_SECRET from environment
    - _Requirements: 4.1, 4.4_
  
  - [x] 3.2 Implement JWT verification with Redis blacklist check
    - Implement verifyToken(token) to decode and validate JWT
    - Check Redis blacklist before accepting token
    - Throw error if token is blacklisted or invalid
    - _Requirements: 5.5, 5.7_
  
  - [x] 3.3 Implement token blacklisting for logout
    - Implement blacklistToken(token) to add JWT to Redis
    - Set TTL to token's remaining lifetime (exp - now)
    - _Requirements: 5.4_
  
  - [x] 3.4 Implement token refresh functionality
    - Implement refreshToken(oldToken) to generate new JWT
    - Blacklist old token when issuing new one
    - Preserve user_id, role, organization_id in new token
    - _Requirements: 6.1, 6.3, 6.4_
  
  - [x] 3.5 Implement JWT validation caching in Redis
    - Cache validation results for 5 minutes
    - Use token hash as cache key
    - _Requirements: 5.6, 15.1_
  
  - [ ] 3.6 Write property tests for TokenService
    - **Property 21: JWT generation on successful login**
    - **Property 34: Expired token rejection**
    - **Property 35: Token refresh with valid JWT**
    - **Property 37: Old token invalidation on refresh**
    - **Validates: Requirements 4.1, 4.4, 5.7, 6.1, 6.3, 6.4**

- [ ] 4. Implement Organization Service
  - [ ] 4.1 Create OrganizationService class
    - Implement createOrganization(orgData, adminUserId) to create new org
    - Implement getBySlug(slug) to find org by subdomain
    - Implement isSlugAvailable(slug) to check uniqueness
    - _Requirements: 1.1, 8.7_
  
  - [ ] 4.2 Write property tests for OrganizationService
    - **Property 1: Organization creation on admin signup**
    - **Validates: Requirements 1.1, 8.7**

- [ ] 5. Implement Verification Service
  - [ ] 5.1 Create VerificationService class with email verification
    - Implement sendEmailVerification(userId, email) to generate 6-digit code
    - Set expiration to 15 minutes from creation
    - Queue email sending asynchronously
    - Store code in VerificationCode collection
    - _Requirements: 2.1, 2.4, 2.7_
  
  - [ ] 5.2 Implement email verification validation
    - Implement verifyEmail(userId, code) to validate code
    - Check if code exists, not used, and not expired
    - Mark email_verified = true on User model
    - Mark code as used
    - _Requirements: 2.2, 2.3_
  
  - [ ] 5.3 Implement phone OTP sending
    - Implement sendPhoneOTP(userId, phone) to generate 6-digit OTP
    - Set expiration to 10 minutes from creation
    - Send via Twilio SMS API
    - Store OTP in VerificationCode collection
    - _Requirements: 3.1, 3.4_
  
  - [ ] 5.4 Implement phone OTP validation
    - Implement verifyPhone(userId, otp) to validate OTP
    - Check if OTP exists, not used, and not expired
    - Mark phone_verified = true on User model
    - _Requirements: 3.2, 3.3_
  
  - [ ] 5.5 Implement verification code resend with invalidation
    - Implement resendVerification(userId, type) to generate new code
    - Mark all previous codes of same type as used
    - Apply rate limiting (3 attempts per 15 minutes)
    - _Requirements: 2.5, 3.5_
  
  - [ ] 5.6 Implement parent-student linking code generation
    - Implement generateLinkingCode(studentId) to create unique code
    - Set expiration to 7 days
    - Store in VerificationCode with type 'parent_link'
    - _Requirements: 10.1_
  
  - [ ] 5.7 Implement parent-student linking validation
    - Implement linkParentToStudent(parentId, linkingCode) to validate code
    - Verify both users in same organization
    - Add student_id to parent's parent_link array
    - _Requirements: 10.2, 10.3, 10.6_
  
  - [ ] 5.8 Write property tests for VerificationService
    - **Property 13: Verification code validation**
    - **Property 14: Invalid verification code handling**
    - **Property 15: Verification code invalidation on resend**
    - **Property 19: OTP resend rate limiting**
    - **Property 50: Linking code generation**
    - **Property 52: Invalid linking code handling**
    - **Property 55: Same-organization linking validation**
    - **Validates: Requirements 2.2, 2.3, 2.5, 3.2, 3.3, 3.5, 10.1, 10.2, 10.3, 10.6**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement Authentication Service
  - [ ] 7.1 Create AuthenticationService class with registration logic
    - Implement register(userData, organizationId) for user registration
    - Validate input with Joi schemas (role-specific)
    - Check email uniqueness within organization
    - Hash password with bcrypt (10 rounds)
    - Create User document
    - If org_admin: call OrganizationService.createOrganization
    - Trigger email verification
    - If phone provided: trigger phone OTP
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7, 1.8, 1.9, 1.10_
  
  - [ ] 7.2 Write property tests for registration
    - **Property 6: Email uniqueness within organization**
    - **Property 7: Required fields validation**
    - **Property 8: Role-specific field collection**
    - **Property 9: Input validation before account creation**
    - **Property 10: Password hashing**
    - **Property 11: Role auto-assignment**
    - **Validates: Requirements 1.6, 1.7, 1.8, 1.9, 1.10, 9.4, 9.5, 9.6, 9.7**
  
  - [ ] 7.3 Implement login authentication logic
    - Implement login(email, password, organizationId) for user login
    - Find user by email + organization_id
    - Validate password with bcrypt.compare
    - If MFA enabled: require OTP verification
    - Generate JWT with TokenService
    - Return token and user profile (without password_hash)
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.7_
  
  - [ ]* 7.4 Write property tests for authentication
    - **Property 22: Generic error for invalid credentials**
    - **Property 23: Bcrypt password validation**
    - **Property 24: Login response structure**
    - **Property 26: MFA requirement**
    - **Validates: Requirements 4.2, 4.3, 4.5, 4.7**
  
  - [ ] 7.5 Implement logout functionality
    - Implement logout(token) to invalidate JWT
    - Call TokenService.blacklistToken
    - _Requirements: 5.4_
  
  - [ ] 7.6 Implement password reset initiation
    - Implement forgotPassword(email, organizationId) to start reset flow
    - Generate unique reset token with 1-hour expiration
    - Send reset token via email
    - Store token in VerificationCode collection
    - _Requirements: 7.1, 7.2_
  
  - [ ] 7.7 Implement password reset completion
    - Implement resetPassword(resetToken, newPassword) to update password
    - Validate reset token (exists, not used, not expired)
    - Validate new password complexity
    - Hash new password with bcrypt
    - Update user's password_hash
    - Invalidate all existing JWTs for that user
    - _Requirements: 7.3, 7.4, 7.5, 7.6_
  
  - [ ]* 7.8 Write property tests for password reset
    - **Property 38: Reset token generation**
    - **Property 39: Password update with valid token**
    - **Property 40: JWT invalidation on password reset**
    - **Property 41: Invalid reset token handling**
    - **Property 42: Password complexity enforcement**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

- [ ] 8. Implement middleware stack
  - [ ] 8.1 Create subdomain resolution middleware
    - Extract subdomain from req.hostname
    - Resolve subdomain to organization_id using OrganizationService
    - Attach req.organizationId for downstream use
    - Handle main site (no subdomain) as null organization
    - _Requirements: 8.3_
  
  - [ ] 8.2 Create JWT authentication middleware
    - Extract token from Authorization header
    - Validate token with TokenService.verifyToken
    - Attach decoded payload to req.user
    - Return 401 if token invalid or missing
    - _Requirements: 4.1, 5.5, 5.7_
  
  - [ ] 8.3 Create role authorization middleware
    - Create authorize(...allowedRoles) factory function
    - Check if req.user.role is in allowedRoles
    - Return 403 if insufficient permissions
    - _Requirements: 9.3_
  
  - [ ] 8.4 Create rate limiting middleware
    - Configure loginLimiter: 5 attempts per 15 minutes
    - Configure otpLimiter: 3 attempts per 15 minutes
    - Configure generalLimiter: 100 requests per 15 minutes
    - _Requirements: 3.5, 4.8, 11.5_
  
  - [ ] 8.5 Create input validation middleware
    - Create validate(schema) factory function
    - Validate req.body against Joi schema
    - Return 400 with validation errors if invalid
    - _Requirements: 1.9, 11.1_
  
  - [ ] 8.6 Create HTTPS enforcement middleware
    - Check if req.protocol === 'https'
    - Reject HTTP requests with 403
    - _Requirements: 4.6, 11.7_
  
  - [ ] 8.7 Create CORS configuration middleware
    - Configure CORS with whitelist of allowed origins
    - Reject requests from non-whitelisted origins
    - _Requirements: 11.6_
  
  - [ ]* 8.8 Write property tests for middleware
    - **Property 25: HTTPS enforcement**
    - **Property 27: Login rate limiting**
    - **Property 45: Subdomain routing**
    - **Property 49: Role-based endpoint authorization**
    - **Property 58: General rate limiting**
    - **Property 59: CORS whitelist enforcement**
    - **Validates: Requirements 4.6, 4.8, 8.3, 9.3, 11.5, 11.6, 11.7**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement Joi validation schemas
  - [ ] 10.1 Create registration validation schemas
    - Define orgAdminRegistrationSchema with organization fields
    - Define studentRegistrationSchema with class_grade, dob
    - Define parentRegistrationSchema with student_code
    - Define instructorRegistrationSchema with expertise, invite_code
    - Define supportStaffRegistrationSchema with department, invite_code
    - All schemas include email, password, name validation
    - Password regex: min 8 chars, uppercase, lowercase, number
    - _Requirements: 1.7, 1.8, 1.9, 7.6, 11.4_
  
  - [ ] 10.2 Create authentication validation schemas
    - Define loginSchema with email and password
    - Define verifyEmailSchema with user_id and code
    - Define verifyPhoneSchema with user_id and otp
    - Define forgotPasswordSchema with email
    - Define resetPasswordSchema with reset_token and new_password
    - Define refreshTokenSchema (no body, token in header)
    - _Requirements: 4.1, 7.1_
  
  - [ ] 10.3 Create parent-student linking validation schemas
    - Define generateLinkingCodeSchema with student_id
    - Define linkParentSchema with parent_id and linking_code
    - _Requirements: 10.1, 10.2_

- [ ] 11. Implement API routes
  - [ ] 11.1 Create POST /auth/register endpoint
    - Apply subdomain resolution middleware
    - Apply input validation middleware (role-specific schema)
    - Apply rate limiting middleware (generalLimiter)
    - Call AuthenticationService.register
    - Return 201 with user data and verification message
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 12.1_
  
  - [ ] 11.2 Create POST /auth/verify-email endpoint
    - Apply input validation middleware
    - Call VerificationService.verifyEmail
    - Return 200 with success message
    - _Requirements: 2.2, 12.2_
  
  - [ ] 11.3 Create POST /auth/verify-phone endpoint
    - Apply input validation middleware
    - Apply rate limiting middleware (otpLimiter)
    - Call VerificationService.verifyPhone
    - Return 200 with success message
    - _Requirements: 3.2, 12.3_
  
  - [ ] 11.4 Create POST /auth/login endpoint
    - Apply subdomain resolution middleware
    - Apply input validation middleware
    - Apply rate limiting middleware (loginLimiter)
    - Call AuthenticationService.login
    - Return 200 with token and user profile
    - _Requirements: 4.1, 12.4_
  
  - [ ] 11.5 Create POST /auth/logout endpoint
    - Apply JWT authentication middleware
    - Call AuthenticationService.logout
    - Return 200 with success message
    - _Requirements: 5.4, 12.5_
  
  - [ ] 11.6 Create POST /auth/forgot-password endpoint
    - Apply subdomain resolution middleware
    - Apply input validation middleware
    - Call AuthenticationService.forgotPassword
    - Return 200 with success message
    - _Requirements: 7.1, 12.6_
  
  - [ ] 11.7 Create POST /auth/reset-password endpoint
    - Apply input validation middleware
    - Call AuthenticationService.resetPassword
    - Return 200 with success message
    - _Requirements: 7.3, 12.7_
  
  - [ ] 11.8 Create POST /auth/refresh-token endpoint
    - Apply JWT authentication middleware
    - Call TokenService.refreshToken
    - Return 200 with new token
    - _Requirements: 6.1, 12.8_
  
  - [ ] 11.9 Create GET /auth/me endpoint
    - Apply JWT authentication middleware
    - Query User model by req.user.user_id
    - Return 200 with user profile (without password_hash)
    - _Requirements: 12.9_
  
  - [ ] 11.10 Create POST /auth/link-parent endpoint
    - Apply JWT authentication middleware
    - Apply input validation middleware
    - Call VerificationService.linkParentToStudent
    - Return 200 with success message
    - _Requirements: 10.2, 12.10_
  
  - [ ] 11.11 Create POST /auth/resend-verification endpoint
    - Apply input validation middleware
    - Apply rate limiting middleware (otpLimiter)
    - Call VerificationService.resendVerification
    - Return 200 with success message
    - _Requirements: 2.5, 12.11_
  
  - [ ]* 11.12 Write integration tests for all API endpoints
    - Test happy paths for all endpoints
    - Test error scenarios (invalid input, unauthorized access)
    - Test rate limiting behavior
    - Test multi-tenant data isolation
    - Use supertest for HTTP testing
    - Use mongodb-memory-server for isolated database
    - Mock external services (SendGrid, Twilio)

- [ ] 12. Implement multi-tenancy data isolation
  - [ ] 12.1 Add organization filtering to all User queries
    - Update all User.find() calls to include organization_id filter
    - Except for platform_admin queries (allow cross-org access)
    - _Requirements: 8.2, 8.5_
  
  - [ ]* 12.2 Write property tests for multi-tenancy
    - **Property 44: Query filtering by organization**
    - **Property 46: Platform admin cross-org access**
    - **Validates: Requirements 8.2, 8.5**

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement security features
  - [ ] 14.1 Add input sanitization middleware
    - Install and configure express-mongo-sanitize
    - Install and configure xss-clean
    - Apply to all routes
    - _Requirements: 11.2, 11.3_
  
  - [ ] 14.2 Add Helmet security headers
    - Configure Helmet middleware for security headers
    - Apply to all routes
    - _Requirements: 4.6_
  
  - [ ]* 14.3 Write security tests
    - **Property 56: Input sanitization**
    - **Property 57: Parameterized queries**
    - Test XSS attack prevention
    - Test NoSQL injection prevention
    - **Validates: Requirements 11.2, 11.3**

- [ ] 15. Implement session management
  - [ ] 15.1 Add inactivity timeout tracking
    - Store last activity timestamp in Redis for each session
    - Update timestamp on every authenticated request
    - Check if 30 minutes elapsed since last activity
    - Auto-logout (blacklist token) if timeout exceeded
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ]* 15.2 Write property tests for session management
    - **Property 28: Session creation with timeout**
    - **Property 29: Inactivity timer reset**
    - **Property 30: Auto-logout on timeout**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ] 16. Implement frontend web application (Next.js)
  - [ ] 16.1 Set up Next.js project structure
    - Create pages: /login, /register, /forgot-password, /reset-password
    - Set up React Hook Form and Zod for validation
    - Create AuthContext for global auth state
    - Configure axios for API calls
    - _Requirements: 13.1, 13.5_
  
  - [ ] 16.2 Create registration page with dynamic fields
    - Add role selector dropdown
    - Conditionally render role-specific fields
    - Implement client-side validation with Zod
    - Submit to POST /auth/register
    - _Requirements: 13.2, 13.3_
  
  - [ ] 16.3 Create email/phone verification UI
    - Display verification code input after registration
    - Submit to POST /auth/verify-email or POST /auth/verify-phone
    - Add resend verification button
    - _Requirements: 13.4_
  
  - [ ] 16.4 Create login page
    - Email and password inputs
    - Client-side validation
    - Submit to POST /auth/login
    - Store JWT in httpOnly cookie
    - Redirect to role-based dashboard on success
    - _Requirements: 13.6, 13.8_
  
  - [ ] 16.5 Implement inactivity auto-logout timer
    - Track user activity (mouse, keyboard events)
    - Reset timer on activity
    - Trigger logout after 30 minutes of inactivity
    - _Requirements: 13.7_
  
  - [ ] 16.6 Create forgot password and reset password pages
    - Forgot password: email input, submit to POST /auth/forgot-password
    - Reset password: token from URL, new password input, submit to POST /auth/reset-password
    - _Requirements: 13.1_
  
  - [ ]* 16.7 Write property tests for frontend validation
    - **Property 60: Dynamic form fields by role**
    - **Property 61: Client-side validation**
    - **Property 63: Role-based redirect**
    - **Property 65: HttpOnly cookie storage**
    - **Validates: Requirements 13.2, 13.3, 13.6, 13.8**

- [ ] 17. Implement mobile application (React Native/Expo)
  - [ ] 17.1 Set up React Native/Expo project
    - Create screens: Login, Register, ForgotPassword, ResetPassword
    - Set up React Hook Form and Zod for validation
    - Configure axios for API calls
    - Set up AsyncStorage with encryption (expo-secure-store)
    - _Requirements: 14.1, 14.2_
  
  - [ ] 17.2 Create registration and login screens
    - Same functionality as web (dynamic fields, validation)
    - Store JWT in encrypted AsyncStorage
    - _Requirements: 14.2_
  
  - [ ] 17.3 Implement biometric authentication
    - Use expo-local-authentication for biometrics
    - Offer biometric login option if device supports it
    - Store encrypted credentials for biometric login
    - _Requirements: 14.3_
  
  - [ ] 17.4 Implement push notifications for verification
    - Configure Expo push notifications
    - Trigger notification when verification code is sent
    - _Requirements: 14.4_
  
  - [ ] 17.5 Implement inactivity auto-logout for mobile
    - Track app state (foreground/background)
    - Track user interactions
    - Trigger logout after 30 minutes of inactivity
    - _Requirements: 14.5_
  
  - [ ]* 17.6 Write property tests for mobile features
    - **Property 66: Encrypted token storage**
    - **Property 67: Biometric login availability**
    - **Property 68: Push notification on verification**
    - **Property 69: Mobile inactivity auto-logout**
    - **Validates: Requirements 14.2, 14.3, 14.4, 14.5**

- [ ] 18. Final integration and testing
  - [ ] 18.1 Run all property tests (100 iterations each)
    - Verify all 69 correctness properties pass
    - Fix any failures discovered
    - _Requirements: All_
  
  - [ ] 18.2 Run integration tests for complete workflows
    - Test org admin signup → org creation → login
    - Test student signup → email verification → login
    - Test parent signup → student linking → login
    - Test instructor invite → signup → login
    - Test password reset flow
    - _Requirements: All_
  
  - [ ] 18.3 Run security tests
    - Test XSS prevention
    - Test NoSQL injection prevention
    - Test rate limiting
    - Test CORS enforcement
    - Test HTTPS enforcement
    - _Requirements: 11.1, 11.2, 11.3, 11.5, 11.6, 11.7_
  
  - [ ]* 18.4 Run performance tests
    - Test 100 concurrent logins
    - Verify response times under load
    - Test JWT validation caching effectiveness
    - _Requirements: 15.1, 15.4, 15.5_

- [ ] 19. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100 iterations
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- Security tests validate protection against common attacks
- Checkpoints ensure incremental validation throughout implementation
