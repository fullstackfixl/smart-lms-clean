# Design Document: Platform Admin Management

## Overview

The platform admin management system provides a comprehensive solution for managing multi-tenant organizations with lifecycle management, soft delete enforcement, real-time analytics, and robust security controls. The system is built on a Node.js/Express backend with MongoDB/Mongoose for data persistence, and a Next.js/TypeScript frontend for the administrative interface.

The design emphasizes:
- **Data integrity**: Soft delete implementation ensures no data loss while maintaining logical isolation
- **Real-time accuracy**: Dashboard analytics are always fetched from the API, eliminating stale data
- **Security-first**: Comprehensive role-based access control with automated security testing
- **Consistency**: All UI mutations trigger server-side operations and refetch data to maintain synchronization

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│  ┌──────────────────┐         ┌─────────────────────────┐  │
│  │ Platform         │         │ Organization            │  │
│  │ Dashboard        │         │ Management UI           │  │
│  │ (Analytics)      │         │ (CRUD Operations)       │  │
│  └────────┬─────────┘         └──────────┬──────────────┘  │
│           │                              │                  │
└───────────┼──────────────────────────────┼──────────────────┘
            │                              │
            │ HTTP/REST                    │ HTTP/REST
            │                              │
┌───────────┼──────────────────────────────┼──────────────────┐
│           │         Backend Layer        │                  │
│  ┌────────▼─────────┐         ┌─────────▼──────────────┐   │
│  │ Analytics        │         │ Organization           │   │
│  │ Controller       │         │ Controller             │   │
│  └────────┬─────────┘         └─────────┬──────────────┘   │
│           │                              │                  │
│  ┌────────▼─────────┐         ┌─────────▼──────────────┐   │
│  │ Analytics        │         │ Organization           │   │
│  │ Service          │         │ Service                │   │
│  └────────┬─────────┘         └─────────┬──────────────┘   │
│           │                              │                  │
│  ┌────────▼──────────────────────────────▼──────────────┐   │
│  │         Authentication Middleware                    │   │
│  │         (JWT Validation, Role Checking)              │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────┼──────────────────────────────┼──────────────────┘
            │                              │
            │ Mongoose ODM                 │
            │                              │
┌───────────▼──────────────────────────────▼──────────────────┐
│                     MongoDB Database                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Organizations│  │    Users     │  │   Courses    │      │
│  │  Collection  │  │  Collection  │  │  Collection  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Analytics Flow**: Dashboard → Analytics Controller → Analytics Service → Database Aggregation → Response
2. **Mutation Flow**: UI Action → Organization Controller → Organization Service → Database Update → Refetch → UI Update
3. **Authentication Flow**: Request → Auth Middleware → JWT Validation → Role Check → Controller

### Soft Delete Strategy

All queries for organizations, users, and courses must filter by `is_deleted: false`. This is enforced at the service layer to ensure consistency across all operations.

## Components and Interfaces

### Backend Components

#### 1. Organization Model (Mongoose Schema)

```javascript
{
  name: String,
  description: String,
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active'
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  created_at: Date,
  updated_at: Date,
  settings: Object,
  admin_count: Number,  // Denormalized for performance
  user_count: Number    // Denormalized for performance
}
```

#### 2. User Model Enhancement

```javascript
{
  // ... existing fields
  organization_id: ObjectId,
  role: String,  // 'platform_admin', 'organization_admin', 'instructor', 'student'
  // ... existing fields
}
```

#### 3. Course Model Enhancement

```javascript
{
  // ... existing fields
  organization_id: ObjectId,
  // ... existing fields
}
```

#### 4. PlatformOrganizationController

**Endpoints:**

- `POST /api/platform/organizations` - Create organization
- `GET /api/platform/organizations` - List organizations (paginated, filtered)
- `GET /api/platform/organizations/:id` - Get single organization
- `PUT /api/platform/organizations/:id` - Update organization
- `PATCH /api/platform/organizations/:id/suspend` - Suspend organization
- `PATCH /api/platform/organizations/:id/activate` - Activate organization
- `DELETE /api/platform/organizations/:id` - Soft delete organization

**Methods:**

```javascript
class PlatformOrganizationController {
  async createOrganization(req, res)
  async getOrganizations(req, res)  // Supports pagination, search, status filter
  async getOrganization(req, res)
  async updateOrganization(req, res)
  async suspendOrganization(req, res)
  async activateOrganization(req, res)
  async deleteOrganization(req, res)
}
```

#### 5. PlatformAnalyticsController

**Endpoints:**

- `GET /api/platform/analytics/overview` - Get dashboard analytics

**Response Format:**

```javascript
{
  total_organizations: Number,
  active_organizations: Number,
  total_users: Number,
  total_courses: Number,
  growth: {
    organizations: Number,  // Percentage
    users: Number,          // Percentage
    courses: Number         // Percentage
  }
}
```

**Methods:**

```javascript
class PlatformAnalyticsController {
  async getOverview(req, res)
}
```

#### 6. OrganizationService

**Methods:**

```javascript
class OrganizationService {
  async create(data)
  async findAll(filters, pagination)  // Always filters is_deleted: false
  async findById(id)                  // Always filters is_deleted: false
  async update(id, data)
  async suspend(id)
  async activate(id)
  async softDelete(id)                // Sets is_deleted: true
  async countByStatus()
}
```

#### 7. AnalyticsService

**Methods:**

```javascript
class AnalyticsService {
  async getOverviewStats()
  async calculateGrowthPercentages(currentStats, previousStats)
  async getHistoricalStats(daysAgo)
}
```

#### 8. Authentication Middleware Enhancement

**Methods:**

```javascript
// Existing middleware
async function authenticateToken(req, res, next)

// New middleware
async function requirePlatformAdmin(req, res, next) {
  // Verify user.role === 'platform_admin'
  // Verify user's organization is not soft-deleted
}

async function checkOrganizationNotDeleted(req, res, next) {
  // Verify user's organization.is_deleted === false
}
```

### Frontend Components

#### 1. Platform Dashboard Page

**Location:** `client/app/platform/dashboard/page.tsx`

**State:**

```typescript
interface DashboardState {
  analytics: AnalyticsData | null;
  loading: boolean;
  error: string | null;
}

interface AnalyticsData {
  total_organizations: number;
  active_organizations: number;
  total_users: number;
  total_courses: number;
  growth: {
    organizations: number;
    users: number;
    courses: number;
  };
}
```

**Behavior:**
- Fetch analytics on mount using `useEffect`
- Provide `refetchAnalytics()` function via context
- Display loading state while fetching
- Display error state on failure
- Render stat cards with dynamic data

#### 2. Organization Management Page

**Location:** `client/app/platform/organizations/page.tsx`

**State:**

```typescript
interface OrganizationManagementState {
  organizations: Organization[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  filters: {
    search: string;
    status: 'all' | 'active' | 'suspended' | 'deleted';
  };
  loading: boolean;
  error: string | null;
}

interface Organization {
  _id: string;
  name: string;
  description: string;
  status: 'active' | 'suspended' | 'deleted';
  created_at: string;
  admin_count: number;
  user_count: number;
}
```

**Methods:**

```typescript
async function fetchOrganizations()
async function createOrganization(data: CreateOrgData)
async function updateOrganization(id: string, data: UpdateOrgData)
async function suspendOrganization(id: string)
async function activateOrganization(id: string)
async function deleteOrganization(id: string)
function handleSearch(query: string)
function handleFilterChange(status: string)
function handlePageChange(page: number)
```

**Behavior:**
- All mutations call API endpoint
- Wait for API response
- Refetch organization list on success
- Show toast notification
- Trigger analytics refetch via context

#### 3. Organization Table Component

**Location:** `client/components/platform/OrganizationTable.tsx`

**Props:**

```typescript
interface OrganizationTableProps {
  organizations: Organization[];
  onEdit: (id: string) => void;
  onSuspend: (id: string) => void;
  onActivate: (id: string) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}
```

**Features:**
- Sortable columns
- Status badge with color coding
- Action dropdown menu
- Responsive design

#### 4. Analytics Context

**Location:** `client/contexts/AnalyticsContext.tsx`

**Purpose:** Provide global analytics refetch capability

```typescript
interface AnalyticsContextValue {
  refetchAnalytics: () => Promise<void>;
}
```

## Data Models

### Organization Document

```javascript
{
  _id: ObjectId,
  name: "Example University",
  description: "A leading educational institution",
  status: "active",
  is_deleted: false,
  created_at: ISODate("2024-01-15T10:00:00Z"),
  updated_at: ISODate("2024-01-15T10:00:00Z"),
  settings: {
    max_users: 1000,
    features: ["courses", "live_classes", "assessments"]
  },
  admin_count: 5,
  user_count: 450
}
```

### User Document (Enhanced)

```javascript
{
  _id: ObjectId,
  email: "admin@example.edu",
  name: "John Doe",
  role: "organization_admin",
  organization_id: ObjectId("..."),
  // ... other fields
}
```

### Query Patterns

**Get Active Organizations:**
```javascript
db.organizations.find({ is_deleted: false })
```

**Get Active Organizations by Status:**
```javascript
db.organizations.find({ 
  is_deleted: false, 
  status: "active" 
})
```

**Get Users (excluding soft-deleted orgs):**
```javascript
db.users.aggregate([
  {
    $lookup: {
      from: "organizations",
      localField: "organization_id",
      foreignField: "_id",
      as: "org"
    }
  },
  {
    $match: {
      "org.is_deleted": false
    }
  }
])
```

**Get Courses (excluding soft-deleted orgs):**
```javascript
db.courses.aggregate([
  {
    $lookup: {
      from: "organizations",
      localField: "organization_id",
      foreignField: "_id",
      as: "org"
    }
  },
  {
    $match: {
      "org.is_deleted": false
    }
  }
])
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Organization Lifecycle Properties

Property 1: Organization creation defaults
*For any* valid organization data, creating an organization should result in a persisted record with status="active" and is_deleted=false
**Validates: Requirements 1.1**

Property 2: Organization update persistence
*For any* organization and any valid update data, updating the organization should result in the changes being persisted to the database and retrievable via subsequent queries
**Validates: Requirements 1.2**

Property 3: Organization suspension state transition
*For any* organization with status="active", suspending it should result in status="suspended" being persisted to the database
**Validates: Requirements 1.3**

Property 4: Suspend-activate round trip
*For any* organization, suspending then activating it should restore the status to "active"
**Validates: Requirements 1.4**

Property 5: Soft delete behavior
*For any* organization, deleting it should set is_deleted=true without removing the record from the database, and the record should still be retrievable with explicit is_deleted queries
**Validates: Requirements 1.5, 2.1**

Property 6: Status value constraints
*For any* attempt to set organization status, only the values "active", "suspended", and "deleted" should be accepted, and any other value should be rejected
**Validates: Requirements 1.6**

### Soft Delete Enforcement Properties

Property 7: Organization query filtering
*For any* GET query for organizations (without explicit is_deleted parameter), the results should never include organizations where is_deleted=true
**Validates: Requirements 2.2**

Property 8: Soft-deleted organization authentication rejection
*For any* user whose organization has is_deleted=true, authentication attempts should fail regardless of correct credentials
**Validates: Requirements 2.3, 5.6**

Property 9: Course exclusion from soft-deleted organizations
*For any* query for courses (without explicit organization filter), the results should never include courses belonging to organizations where is_deleted=true
**Validates: Requirements 2.4, 7.4**

Property 10: User exclusion from soft-deleted organizations
*For any* query for users (without explicit organization filter), the results should never include users belonging to organizations where is_deleted=true
**Validates: Requirements 2.5, 7.3**

### Analytics Accuracy Properties

Property 11: Analytics counting accuracy
*For any* database state, the analytics endpoint should return counts that exactly match: (1) total organizations with is_deleted=false, (2) organizations with status="active" and is_deleted=false, (3) users whose organization has is_deleted=false, and (4) courses whose organization has is_deleted=false
**Validates: Requirements 3.2, 3.3, 3.4, 3.5**

Property 12: Growth percentage calculation
*For any* two sets of analytics data representing different time periods, the growth percentage should be calculated as ((current - previous) / previous) * 100, with special handling for division by zero
**Validates: Requirements 3.6**

Property 13: Dashboard refetch after mutation
*For any* organization mutation (create, update, suspend, activate, delete), the dashboard should automatically trigger a refetch of analytics data from the API
**Validates: Requirements 3.8**

### UI Behavior Properties

Property 14: Organization search filtering
*For any* search query string, the displayed organization results should only include organizations whose name contains the search query (case-insensitive)
**Validates: Requirements 4.2**

Property 15: Organization status filtering
*For any* status filter selection (active, suspended, deleted), the displayed organization results should only include organizations with that exact status value
**Validates: Requirements 4.3**

Property 16: Organization data rendering completeness
*For any* organization displayed in the UI, the rendered output should contain the status badge, created date, admin count, and user count
**Validates: Requirements 4.4, 4.5**

Property 17: UI action triggers API calls
*For any* organization action button click (create, edit, suspend, activate, delete), the UI should make the corresponding API call before updating any local state
**Validates: Requirements 4.7**

Property 18: UI refetch after API response
*For any* successful API response from an organization mutation, the UI should refetch the organization list from the server before displaying the updated data
**Validates: Requirements 4.8**

Property 19: Toast notification on API response
*For any* API response (success or error) from an organization mutation, the UI should display a toast notification indicating the outcome
**Validates: Requirements 4.9**

### Security and Authorization Properties

Property 20: Platform admin access
*For any* valid platform admin token, requests to platform admin routes should succeed and return the requested data
**Validates: Requirements 5.1**

Property 21: Non-platform-admin rejection
*For any* token with role other than "platform_admin" (organization_admin, instructor, student), requests to platform admin routes should fail with HTTP 403 Forbidden
**Validates: Requirements 5.2, 5.3, 5.4**

Property 22: Expired token rejection
*For any* expired JWT token, requests to any protected route should fail with HTTP 401 Unauthorized
**Validates: Requirements 5.5**

### API Consistency Properties

Property 23: Mutation response includes updated data
*For any* organization mutation endpoint (create, update, suspend, activate, delete), the response should include the complete updated organization object
**Validates: Requirements 6.7**

Property 24: Error responses include appropriate status codes
*For any* error condition (validation error, not found, unauthorized, forbidden), the API should return the appropriate HTTP status code (400, 404, 401, 403) and a descriptive error message
**Validates: Requirements 6.8**

### Data Integrity Properties

Property 25: Referential integrity preservation
*For any* organization status change, all related user and course records should maintain valid organization_id references and remain queryable through their relationships
**Validates: Requirements 7.1, 7.2**

Property 26: Reactivation restores access
*For any* organization with status="suspended", activating it should result in all users from that organization being able to successfully authenticate
**Validates: Requirements 7.5**

## Error Handling

### Backend Error Handling

**Validation Errors (400 Bad Request):**
- Missing required fields in organization creation/update
- Invalid status values
- Invalid data types
- Empty or whitespace-only organization names

**Authentication Errors (401 Unauthorized):**
- Missing JWT token
- Expired JWT token
- Invalid JWT signature
- User from soft-deleted organization attempting login

**Authorization Errors (403 Forbidden):**
- Non-platform-admin attempting to access platform routes
- Organization admin attempting to access other organizations

**Not Found Errors (404 Not Found):**
- Organization ID does not exist
- Organization is soft-deleted (treated as not found)

**Server Errors (500 Internal Server Error):**
- Database connection failures
- Unexpected exceptions
- Data corruption

**Error Response Format:**
```javascript
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "Human-readable error message",
    details: {} // Optional additional context
  }
}
```

### Frontend Error Handling

**Network Errors:**
- Display toast notification: "Network error. Please check your connection."
- Retry mechanism for failed requests
- Loading state management

**API Errors:**
- Parse error response from backend
- Display toast notification with error message
- Log errors to console for debugging
- Maintain UI state (don't clear forms on error)

**Validation Errors:**
- Display inline validation messages
- Highlight invalid fields
- Prevent form submission until valid

**Authentication Errors:**
- Redirect to login page
- Clear stored tokens
- Display message: "Session expired. Please log in again."

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library Selection:**
- Backend (Node.js): Use **fast-check** library for property-based testing
- Frontend (TypeScript): Use **fast-check** library for property-based testing

**Test Configuration:**
- Each property test must run a minimum of 100 iterations
- Each property test must include a comment tag referencing the design document property
- Tag format: `// Feature: platform-admin-management, Property {number}: {property_text}`

**Example Property Test Structure:**

```javascript
// Feature: platform-admin-management, Property 5: Soft delete behavior
test('soft delete sets is_deleted without removing record', async () => {
  await fc.assert(
    fc.asyncProperty(
      organizationArbitrary(),
      async (org) => {
        const created = await OrganizationService.create(org);
        await OrganizationService.softDelete(created._id);
        
        // Should not appear in normal queries
        const normalQuery = await OrganizationService.findById(created._id);
        expect(normalQuery).toBeNull();
        
        // Should still exist with explicit query
        const explicitQuery = await Organization.findById(created._id);
        expect(explicitQuery).not.toBeNull();
        expect(explicitQuery.is_deleted).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Focus

Unit tests should focus on:
- Specific examples that demonstrate correct behavior
- Edge cases (empty strings, null values, boundary conditions)
- Error conditions (invalid inputs, missing fields)
- Integration points between components
- Middleware behavior (authentication, authorization)

Avoid writing too many unit tests for scenarios that property tests already cover. Property tests handle comprehensive input coverage through randomization.

### Test Organization

**Backend Tests:**
- `tests/unit/services/OrganizationService.test.js` - Service layer unit tests
- `tests/unit/services/AnalyticsService.test.js` - Analytics service unit tests
- `tests/unit/middleware/auth.test.js` - Authentication middleware tests
- `tests/property/OrganizationLifecycle.property.test.js` - Lifecycle properties
- `tests/property/SoftDelete.property.test.js` - Soft delete properties
- `tests/property/Analytics.property.test.js` - Analytics properties
- `tests/property/Security.property.test.js` - Security properties
- `tests/integration/PlatformOrganization.integration.test.js` - End-to-end API tests

**Frontend Tests:**
- `tests/unit/components/OrganizationTable.test.tsx` - Component unit tests
- `tests/unit/pages/OrganizationManagement.test.tsx` - Page unit tests
- `tests/property/UIBehavior.property.test.tsx` - UI behavior properties
- `tests/integration/Dashboard.integration.test.tsx` - Dashboard integration tests

### Security Test Suite

A comprehensive security test suite must be implemented to validate all 6 security requirements:

```javascript
describe('Platform Admin Security Tests', () => {
  // Test 1: Platform admin can access all organizations
  test('platform admin token grants access to platform routes', async () => {
    const token = generatePlatformAdminToken();
    const response = await request(app)
      .get('/api/platform/organizations')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
  });

  // Test 2: Organization admin cannot access platform routes
  test('organization admin token is rejected on platform routes', async () => {
    const token = generateOrgAdminToken();
    const response = await request(app)
      .get('/api/platform/organizations')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  // Test 3: Instructor token must fail on platform routes
  test('instructor token is rejected on platform routes', async () => {
    const token = generateInstructorToken();
    const response = await request(app)
      .get('/api/platform/organizations')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  // Test 4: Student token must fail on platform routes
  test('student token is rejected on platform routes', async () => {
    const token = generateStudentToken();
    const response = await request(app)
      .get('/api/platform/organizations')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
  });

  // Test 5: Expired token returns 401
  test('expired token returns 401 unauthorized', async () => {
    const token = generateExpiredToken();
    const response = await request(app)
      .get('/api/platform/organizations')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(401);
  });

  // Test 6: Deleted organization users cannot login
  test('users from soft-deleted organizations cannot authenticate', async () => {
    const org = await createOrganization();
    const user = await createUser({ organization_id: org._id });
    await OrganizationService.softDelete(org._id);
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'correct_password' });
    expect(response.status).toBe(401);
  });
});
```

### Test Coverage Goals

- Backend service layer: 90%+ code coverage
- Backend controllers: 85%+ code coverage
- Frontend components: 80%+ code coverage
- All 26 correctness properties: 100% implementation
- All 6 security tests: 100% passing
