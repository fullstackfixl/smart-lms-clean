# Implementation Plan: Platform Admin Management

## Overview

This implementation plan breaks down the platform admin management feature into discrete, incremental coding tasks. The approach follows a bottom-up strategy: starting with data models and services, then building controllers and routes, followed by frontend components, and finally comprehensive testing. Each task builds on previous work to ensure no orphaned code.

## Tasks

- [x] 1. Enhance data models for soft delete and organization management
  - Update Organization model schema to include status and is_deleted fields
  - Update User model to ensure organization_id reference
  - Update Course model to ensure organization_id reference
  - Add indexes for performance on is_deleted and status fields
  - _Requirements: 1.1, 1.6, 2.1_

- [x] 1.1 Write property test for organization model
  - **Property 1: Organization creation defaults**
  - **Validates: Requirements 1.1**

- [x] 2. Implement OrganizationService with soft delete support
  - [x] 2.1 Create OrganizationService class with CRUD methods
    - Implement create() method with default values (status="active", is_deleted=false)
    - Implement findAll() with automatic is_deleted=false filtering
    - Implement findById() with automatic is_deleted=false filtering
    - Implement update() method
    - _Requirements: 1.1, 1.2, 2.2_

  - [x] 2.2 Implement status transition methods
    - Implement suspend() method to set status="suspended"
    - Implement activate() method to set status="active"
    - Implement softDelete() method to set is_deleted=true
    - _Requirements: 1.3, 1.4, 1.5, 2.1_

  - [x] 2.3 Implement query methods with organization filtering
    - Implement countByStatus() method
    - Implement search() method with name filtering
    - Ensure all queries filter is_deleted=false by default
    - _Requirements: 2.2, 4.2_

  - [x] 2.4 Write property tests for OrganizationService
    - **Property 2: Organization update persistence**
    - **Property 3: Organization suspension state transition**
    - **Property 4: Suspend-activate round trip**
    - **Property 5: Soft delete behavior**
    - **Property 7: Organization query filtering**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 2.1, 2.2**

- [-] 3. Implement AnalyticsService for dashboard statistics
  - [x] 3.1 Create AnalyticsService class
    - Implement getOverviewStats() to count organizations (is_deleted=false)
    - Implement counting for active organizations (status="active", is_deleted=false)
    - Implement user counting with organization join (exclude soft-deleted orgs)
    - Implement course counting with organization join (exclude soft-deleted orgs)
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [-] 3.2 Implement growth calculation methods
    - Implement getHistoricalStats() to fetch previous period data
    - Implement calculateGrowthPercentages() with division-by-zero handling
    - _Requirements: 3.6_

  - [x] 3.3 Write property tests for AnalyticsService
    - **Property 11: Analytics counting accuracy**
    - **Property 12: Growth percentage calculation**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6**

- [-] 4. Enhance authentication middleware for soft delete and platform admin
  - [x] 4.1 Update authenticateToken middleware
    - Add check for user's organization is_deleted status
    - Reject authentication if organization is soft-deleted
    - _Requirements: 2.3, 5.6_

  - [x] 4.2 Create requirePlatformAdmin middleware
    - Verify user.role === 'platform_admin'
    - Return 403 for non-platform-admin roles
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 4.3 Add token expiration handling
    - Verify JWT expiration in authenticateToken
    - Return 401 for expired tokens
    - _Requirements: 5.5_

  - [ ] 4.4 Write unit tests for authentication middleware
    - Test soft-deleted organization rejection
    - Test platform admin role verification
    - Test expired token handling
    - _Requirements: 2.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 5. Implement PlatformOrganizationController
  - [x] 5.1 Create controller with CRUD endpoints
    - Implement createOrganization() - POST /api/platform/organizations
    - Implement getOrganizations() with pagination, search, and status filtering - GET /api/platform/organizations
    - Implement getOrganization() - GET /api/platform/organizations/:id
    - Implement updateOrganization() - PUT /api/platform/organizations/:id
    - Return updated organization data in all mutation responses
    - _Requirements: 1.1, 1.2, 4.1, 4.2, 4.3, 6.1, 6.2, 6.6, 6.7_

  - [x] 5.2 Implement status transition endpoints
    - Implement suspendOrganization() - PATCH /api/platform/organizations/:id/suspend
    - Implement activateOrganization() - PATCH /api/platform/organizations/:id/activate
    - Implement deleteOrganization() - DELETE /api/platform/organizations/:id
    - Return updated organization data in responses
    - _Requirements: 1.3, 1.4, 1.5, 6.3, 6.4, 6.5, 6.7_

  - [ ] 5.3 Add error handling to all endpoints
    - Handle validation errors (400)
    - Handle not found errors (404)
    - Handle authorization errors (403)
    - Return consistent error response format
    - _Requirements: 6.8_

  - [ ] 5.4 Write unit tests for PlatformOrganizationController
    - Test each endpoint with valid inputs
    - Test error conditions
    - Test response formats
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.7, 6.8_

- [ ] 6. Implement PlatformAnalyticsController
  - [x] 6.1 Create controller with analytics endpoint
    - Implement getOverview() - GET /api/platform/analytics/overview
    - Call AnalyticsService.getOverviewStats()
    - Return formatted response with counts and growth percentages
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 6.2 Write unit tests for PlatformAnalyticsController
    - Test analytics endpoint returns correct structure
    - Test with various database states
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 7. Set up platform admin routes
  - Create /api/platform/organizations routes file
  - Apply requirePlatformAdmin middleware to all routes
  - Wire up all PlatformOrganizationController endpoints
  - Create /api/platform/analytics routes file
  - Wire up PlatformAnalyticsController endpoints
  - Register routes in main app
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 8. Checkpoint - Ensure backend tests pass
  - Run all backend unit tests
  - Run all backend property tests
  - Verify all endpoints are accessible with platform admin token
  - Ask the user if questions arise

- [ ] 9. Implement AnalyticsContext for frontend
  - Create AnalyticsContext with refetchAnalytics function
  - Create AnalyticsProvider component
  - Implement state management for analytics data
  - Implement fetch function calling GET /platform/analytics/overview
  - _Requirements: 3.7, 3.8_

- [ ] 10. Implement Platform Dashboard page
  - [ ] 10.1 Create dashboard page component
    - Set up page at client/app/platform/dashboard/page.tsx
    - Use AnalyticsContext to fetch data on mount
    - Display loading state while fetching
    - Display error state on failure
    - _Requirements: 3.7_

  - [ ] 10.2 Create stat cards for analytics display
    - Create StatCard component for each metric
    - Display total organizations count
    - Display active organizations count
    - Display total users count
    - Display total courses count
    - Display growth percentages for each metric
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ] 10.3 Write unit tests for dashboard page
    - Test data fetching on mount
    - Test loading and error states
    - Test stat card rendering
    - _Requirements: 3.7_

- [ ] 11. Implement Organization Management page
  - [ ] 11.1 Create organization management page component
    - Set up page at client/app/platform/organizations/page.tsx
    - Implement state management for organizations list, pagination, and filters
    - Fetch organizations on mount with GET /api/platform/organizations
    - _Requirements: 4.1_

  - [ ] 11.2 Implement search and filter functionality
    - Add search input with debouncing
    - Add status filter dropdown (all, active, suspended, deleted)
    - Update API calls when search or filter changes
    - _Requirements: 4.2, 4.3_

  - [ ] 11.3 Implement pagination
    - Add pagination controls
    - Update API calls when page changes
    - Display current page and total pages
    - _Requirements: 4.1_

  - [ ] 11.4 Write unit tests for organization management page
    - Test search functionality
    - Test filter functionality
    - Test pagination
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 12. Implement OrganizationTable component
  - [ ] 12.1 Create table component
    - Create component at client/components/platform/OrganizationTable.tsx
    - Display organization name, status badge, created date, admin count, user count
    - Implement sortable columns
    - _Requirements: 4.4, 4.5_

  - [ ] 12.2 Add action buttons and handlers
    - Add Edit, Suspend, Activate, Delete action buttons
    - Implement onClick handlers that call API endpoints
    - Wait for API response before updating UI
    - _Requirements: 4.6, 4.7_

  - [ ] 12.3 Implement refetch and notification logic
    - After successful API response, refetch organization list
    - Display toast notification for success/failure
    - Trigger analytics refetch via context
    - _Requirements: 4.8, 4.9, 3.8_

  - [ ] 12.4 Write property tests for OrganizationTable
    - **Property 16: Organization data rendering completeness**
    - **Property 17: UI action triggers API calls**
    - **Property 18: UI refetch after API response**
    - **Property 19: Toast notification on API response**
    - **Validates: Requirements 4.4, 4.5, 4.7, 4.8, 4.9**

- [ ] 13. Implement Create/Edit Organization modal
  - Create modal component for organization creation and editing
  - Add form with name, description, and settings fields
  - Implement validation
  - Call POST or PUT endpoint on submit
  - Refetch organization list and analytics on success
  - Display toast notification
  - _Requirements: 1.1, 1.2, 4.7, 4.8, 4.9_

- [ ] 14. Checkpoint - Ensure frontend tests pass
  - Run all frontend unit tests
  - Run all frontend property tests
  - Manually test UI flows
  - Ask the user if questions arise

- [ ] 15. Implement comprehensive security test suite
  - [ ] 15.1 Write security tests for platform admin access
    - **Test 1**: Platform admin can access all organizations
    - **Test 2**: Organization admin cannot access platform routes
    - **Test 3**: Instructor token must fail on platform routes
    - **Test 4**: Student token must fail on platform routes
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 15.2 Write security tests for authentication
    - **Test 5**: Expired token returns 401
    - **Test 6**: Deleted organization users cannot login
    - _Requirements: 5.5, 5.6_

  - [ ] 15.3 Write property tests for security
    - **Property 20: Platform admin access**
    - **Property 21: Non-platform-admin rejection**
    - **Property 22: Expired token rejection**
    - **Property 8: Soft-deleted organization authentication rejection**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

- [ ] 16. Implement property tests for soft delete cascading
  - [ ] 16.1 Write property tests for course exclusion
    - **Property 9: Course exclusion from soft-deleted organizations**
    - **Validates: Requirements 2.4, 7.4**

  - [ ] 16.2 Write property tests for user exclusion
    - **Property 10: User exclusion from soft-deleted organizations**
    - **Validates: Requirements 2.5, 7.3**

  - [ ] 16.3 Write property tests for data integrity
    - **Property 25: Referential integrity preservation**
    - **Property 26: Reactivation restores access**
    - **Validates: Requirements 7.1, 7.2, 7.5**

- [ ] 17. Implement property tests for UI behavior
  - [ ] 17.1 Write property tests for filtering
    - **Property 14: Organization search filtering**
    - **Property 15: Organization status filtering**
    - **Validates: Requirements 4.2, 4.3**

  - [ ] 17.2 Write property test for dashboard refetch
    - **Property 13: Dashboard refetch after mutation**
    - **Validates: Requirements 3.8**

- [ ] 18. Implement property tests for API consistency
  - [ ] 18.1 Write property tests for mutation responses
    - **Property 23: Mutation response includes updated data**
    - **Validates: Requirements 6.7**

  - [ ] 18.2 Write property tests for error handling
    - **Property 24: Error responses include appropriate status codes**
    - **Validates: Requirements 6.8**

- [ ] 19. Implement integration tests
  - [ ] 19.1 Write end-to-end API integration tests
    - Test complete organization lifecycle (create → suspend → activate → delete)
    - Test analytics accuracy after mutations
    - Test soft delete cascading to users and courses
    - _Requirements: All requirements_

  - [ ] 19.2 Write frontend integration tests
    - Test dashboard analytics display and refetch
    - Test organization management UI flows
    - Test error handling and notifications
    - _Requirements: 3.7, 3.8, 4.1-4.10_

- [ ] 20. Final checkpoint - Comprehensive testing and validation
  - Run all unit tests (backend and frontend)
  - Run all property tests (backend and frontend)
  - Run all integration tests
  - Verify all 6 security tests pass
  - Verify all 26 correctness properties are implemented and passing
  - Manually test complete user flows
  - Ask the user if questions arise

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100+ iterations each
- Unit tests validate specific examples and edge cases
- Security tests are critical for validating access control policies
- All mutations must trigger refetch to maintain UI-server synchronization
