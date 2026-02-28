# Technical Level Specification (TLS): Smart LMS

## 1. Technology Stack
- **Runtime**: Node.js v20+
- **Framework**: Express.js (Backend) / Next.js 15 App Router (Frontend)
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Auth**: JWT (jsonwebtoken), bcryptjs, Speakeasy (MFA)
- **AI**: Groq SDK (Llama 3.3), Google Generative AI (Gemini)
- **Email**: Brevo API, Resend API, NodeMailer
- **Streaming**: Socket.io (Real-time events)
- **UI**: Tailwind CSS, Shadcn UI, Framer Motion

## 2. Backend Architecture
The backend follows a **Controller-Service-Repository** pattern built on a `BaseService` abstraction to ensure consistency across 40+ modules.

### Core Pattern:
- **Routes**: Define endpoints and apply middleware (Auth, Isolation).
- **Controllers**: Handle HTTP semantics, validate inputs using `Joi`/`Zod`.
- **Services**: Contain business logic, interact with multiple repositories.
- **Models**: Mongoose schemas with pre/post hooks for data integrity.

## 3. Frontend Architecture
- **Dynamic Subdomains**: Uses Next.js middleware to extract `subdomain` from the hostname and inject it into the application context.
- **State Management**: React Context for Auth, SWR/React Query for server-state synchronization.
- **Component System**: Atomic design using Radix UI primitives via Shadcn.

## 4. Database Design
- **Single Collection Multi-tenancy**: All entities (Courses, Users, Quizzes) contain a mandatory `organization_id`.
- **Soft Deletion**: Universal `is_deleted: boolean` flag with query-level filtering in Mongoose middleware.
- **Schema Validation**: Strict typing for nested arrays (e.g., `attendance_records` inside `Attendance`).

## 5. Authentication Flow
```
[ User ] --(Login: email, pwd)--> [ Auth Route ]
                                      |
                                [ Bcrypt Compare ]
                                      |
[ Token ] <--(JWT + Cookie)-- [ Sign JWT (userId, orgId) ]
    |
    +--> [ Subsequent Request ] --(Auth Header)--> [ Auth Middleware ]
                                                        |
                                                 [ Verify & Populate req.user ]
```

## 6. Authorization Flow
- **Middleware Logic**: `requireRole(['instructor', 'org_admin'])` checks `req.user.role`.
- **Tenant Isolation**: `tenantIsolation.js` ensures `organization_id` in the query matches `req.user.organization_id`.

```javascript
// Tenant Isolation Enforcement
const tenantIsolation = (req, res, next) => {
  if (req.user.role === 'platform_admin') return next();
  req.orgFilter = { organization_id: req.user.organization_id };
  next();
};
```

## 7. Organization Template Engine
Dynamically configures the platform experience based on `OrgTemplate`:
- **Modules**: `['attendance', 'fees', 'ai_tutor']`
- **Widgets**: Dashboard components specific to the template (e.g., "Daily Attendance Chart" for Schools).

## 8. Quiz Engine Logic
```
[ Instructor ] --(Create Quiz)--> [ validation Hook ]
                                       |
                                [ Org Consistency Check ]
                                       |
[ Student ] --(Submit Attempt)--> [ Scoring Logic ]
                                       |
[ Result ] <--(Grade Model)--- [ Pass/Fail Calculation ]
```

## 9. AI Integration Flow (Gemini/Groq)
```
[ Context: Lesson Content ] --(Extraction)--> [ AIService ]
                                                  |
[ Prompt Engineering ] <------------------- [ System Persona ]
      |
[ AI Provider (Groq/Gemini) ] --(JSON Output)--> [ Auto-Parser ]
                                                   |
[ UI: AI Quiz / Tutor Chat ] <---------------- [ Formatted Result ]
```

## 10. Email Service Architecture
- **Adapter Pattern**: `EmailService` routes through a priority-based chain:
  1. **Brevo API** (High Deliverability)
  2. **Resend** (Fallback for custom domains)
  3. **SMTP** (Third fallback / Local dev)

## 11. Logging & Monitoring
- **Internal**: Custom `logger.js` using Winston/Morgan for request and error tracking.
- **Audit Logs**: `AuditLog.js` model captures critical state changes (e.g., Role changes, Fee deletions).

## 12. Deployment Architecture
- **CI/CD**: GitHub Actions deploying to **Render** (Backend) and **Vercel** (Frontend).
- **VPC**: Database access restricted to application IP ranges via MongoDB Atlas Network Access.

## 13. Scalability Plan
- **Horizontal**: Stateless backend nodes allow for infinite scaling via load balancer.
- **Database**: Readiness for MongoDB Sharding by `organization_id` as tenant volume increases.
- **Caching**: Future implementation of Redis for `OrgTemplate` and `Session` caching.

---
**Technical Level Specification Approved for Production Architecture.**
