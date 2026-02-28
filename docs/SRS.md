# Software Requirements Specification (SRS): Smart LMS Phase 3

## 1. Introduction
This SRS provides a high-fidelity technical specification for the Smart LMS Multi-Tenant SaaS Platform. It is derived from a direct analysis of the core implementation and production-ready models.

## 2. Functional Requirements (FR)

### 2.1 Multi-Tenancy & Academic Structure
- **FR-01 (Tenant Isolation)**: Every data entity MUST be scoped to an `organization_id`. The system shall enforce this via `tenantIsolation` and `orgIsolation` middlewares at the routing layer.
- **FR-02 (Academic Context)**: The system shall support multiple academic years and semesters. It MUST enforce a singleton "Current" academic year per organization via pre-save hooks.
- **FR-03 (Organizational Archetypes)**: Supporting Schools, Colleges, and Online Academies through the `OrgTemplate` system, which dynamically enables/disables module access.

### 2.2 Pedagogical & Assessment Engine
- **FR-04 (Course Architecture)**: Hierarchical content delivery supporting Sections, Lessons, and Multimedia.
- **FR-05 (Advanced Quiz Engine)**: Support for timed assessments, attempt limits (1-10), and pass thresholds (0-100%).
- **FR-06 (AI-Assisted Assessment)**: Automated generation of MCQ arrays from lesson content using the Groq/Llama 3.3 model (`aiService.js`).
- **FR-07 (Rubric-Based Grading)**: Support for multi-criteria rubric scoring for assignments and manual grading tasks (`Grade.js`).
- **FR-08 (Weighted GPA Calculation)**: Automated calculation of weighted current percentages and letter grades (A-F) based on assignment categories.

### 2.3 Live Learning & Engagement
- **FR-09 (Meeting Orchestration)**: Native integration with Jitsi (Dynamic UUID rooms), Zoom, and Google Meet.
- **FR-10 (Auto-Attendance)**: Real-time participant tracking in live classes with automated synchronization to the central Attendance module.
- **FR-11 (AI Tutor Context)**: A persistent AI Chatbot (`LessonChat.js`) utilizing lesson content snippets to provide contextual student support.

### 2.4 Financial & Administrative Operations
- **FR-12 (Installment-Based Billing)**: Fee management supporting multi-stage installments, overdue tracking, and partial payments.
- **FR-13 (Automated Late Fees)**: Calculation of late penalties using fixed-rate, percentage-based, or daily-accruing logic (`Fee.js`).
- **FR-14 (Transaction Multi-Channel)**: Integration with Razorpay, Stripe, and support for manual Cash/Bank entries.

## 3. Non-Functional Requirements (NFR)

### 3.1 Security & Data Integrity
- **NFR-01 (Stateless Auth)**: JWT-based authentication with 24-hour token expiration and secure cookie storage.
- **NFR-02 (MFA)**: Mandatory OTP verification for administrative and high-privilege roles.
- **NFR-03 (Soft-Delete Integrity)**: All primary entities must utilize `is_deleted` flags to prevent accidental permanent data loss.

### 3.2 Performance & Reliability
- **NFR-04 (API Latency)**: Targeted <300ms response time for index-optimized queries (e.g., `findByOrganization`).
- **NFR-05 (Concurrent Capacity)**: Backend designed to support high-concurrency websocket connections via `socketService.js`.
- **NFR-06 (Email Reliability)**: Multi-channel SMTP/API fallback (Brevo -> Resend -> NodeMailer).

## 4. API & Integration Standards
- **Standard-01**: RESTful resource naming convention (e.g., `/api/organizations/:id/courses`).
- **Standard-02**: Consistent response schema: `{ success: boolean, data?: any, error?: { message: string, code: string } }`.
- **Standard-03**: Rate limiting enforcement for public and authentication-sensitive endpoints.

---
**Technical Specification Approved for Implementation Phase.**
