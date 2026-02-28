# Product Requirements Document (PRD): Smart LMS Multi-Tenant SaaS Platform

## 1. Product Overview
Smart LMS is a comprehensive, cloud-native Multi-Tenant Software-as-a-Service (SaaS) Learning Management System (LMS) designed to empower educational institutions—ranging from K-12 schools and colleges to professional coaching centers and online academies. The platform provides a unified infrastructure for managing curriculum, student engagement, administrative operations, and AI-driven pedagogical assistance.

## 2. Vision & Objectives
- **Vision**: To modernize institutional learning by bridging the gap between traditional management and advanced AI-driven personalized education.
- **Objectives**:
  - Provide complete data isolation and branding for every tenant (Institute).
  - Automate administrative overhead (Attendance, Fees, Grading).
  - Enhance student outcomes through AI Tutoring and Gamification.
  - Scale seamlessly from small coaching centers to large universities.

## 3. Target Users
- **K-12 Schools**: Focus on attendance, parent communication, and structured grade levels.
- **Higher Education (Colleges/Universities)**: Complex department structures, credit systems, and live lectures.
- **Professional Institutes**: Skill-based courses, certification, and rapid onboarding.
- **Online Academies**: Global reach, self-paced learning, and AI-generated assessments.

## 4. User Personas
- **Platform Admin (Super Admin)**: Manages organization applications, global system settings, and platform-wide health.
- **Organization Admin**: Configures the specific institute's branding, modules, staff roles, and academic years.
- **Instructor (Teacher/Lecturer)**: Creates courses, manages lessons, generates quizzes (AI-assisted), and monitors student performance.
- **Student**: Consumes course content, interacts with the AI Tutor, takes assessments, and tracks progress via gamification.
- **Parent**: Monitors their child's attendance, grades, and fee status.

## 5. Core Features
- **Course & Curriculum Management**: Structure-based learning with Sections, Lessons, and Multimedia support.
- **Advanced Quiz Engine**: Support for multiple-choice questions, timed attempts, pass thresholds, and result analysis.
- **Live Classroom Integration**: Native support for **Zoom** and **Google Meet** sessions directly within the lesson flow.
- **Gamification System**: Points, badges, and leaderboards to drive student engagement.
- **Academic Administration**: Automated Attendance tracking, Fee management, and Timetable scheduling.
- **Certificate Engine**: Automated generation of branded PDF/HTML certificates upon course completion.
- **Forum & Messaging**: Dedicated communication channels for students and staff.

## 6. Role-Based Features
| Role | Key Capabilities |
| :--- | :--- |
| **Platform Admin** | Org onboarding, License mgmt, System logs, Global dashboard. |
| **Org Admin** | Staff hiring, Template selection, Fee structure, Departmental setup. |
| **Instructor** | Course authoring, AI Quiz gen, Assignment grading, Live class hosting. |
| **Student** | Course enrollment, AI Tutor interaction, Badge collection, Quiz taking. |
| **Parent** | Student progress reports, Fee payment notifications, Attendance alerts. |

## 7. Multi-Tenant Architecture Requirements
- **Tenant Isolation**: Strict data segregation using `organization_id` at the database level.
- **Custom Branding**: Subdomain-based access (`tenant.smartlms.com`) with custom logos and theme tokens.
- **Module Flexibility**: Institutions can enable/disable specific modules (e.g., disable "Fees" for a non-profit academy) using the Organization Template system.

## 8. AI Features
- **AI Quiz Architect**: Leverage LLMs (Groq/Llama/Gemini) to generate high-quality assessments from lesson content or specific prompts.
- **Contextual AI Tutor**: A 24/7 student assistant that "reads" the current lesson content and provides explanations, examples, and remedial help based on the student's performance.
- **Performance Prediction**: (Planned) Predictive analytics to identify at-risk students based on historical engagement data.

## 9. Functional Requirements
- **FR-01**: Secure tenant-specific onboarding via invitation tokens.
- **FR-02**: Multi-channel email delivery (Brevo/Resend) for transactional updates.
- **FR-03**: Real-time notifications for live class starts and assessment results.
- **FR-04**: Bulk import/export for student and staff data.
- **FR-05**: Responsive UI supporting Mobile, Tablet, and Desktop views.

## 10. Non-Functional Requirements
- **NFR-01 (Scalability)**: Support for horizontal scaling of stateless backend services.
- **NFR-02 (Availability)**: 99.9% uptime target for core learning services.
- **NFR-03 (Security)**: MFA for administrative roles and encrypted token-based sessions.
- **NFR-04 (Performance)**: < 2s page load time for course content delivery.

## 11. Constraints
- **Tech Stack**: Must maintain compatibility with Node.js 20+, MongoDB Atlas, and Next.js 15.
- **Database**: Single-cluster multi-tenant model (Shared Schema).
- **Compliance**: Adherence to data privacy standards (GDPR/CCPA frameworks) regarding soft-deletion and record retrieval.

## 12. Success Metrics
- **Tenant Growth**: Number of active organizations onboarded per month.
- **Engagement**: Average hours spent per student and AI Tutor interaction frequency.
- **Adoption**: Percentage of instructors utilizing AI Quiz generation features.
- **Retention**: Renewal rate of institution licenses.

## 13. Roadmap Phases
- **Phase 1 (Complete)**: Foundational multi-tenancy, RBAC, Core Course mgmt, Auth.
- **Phase 2 (Current)**: AI Integrations, Gamification, Live Class stabilization, Advanced Quiz engine.
- **Phase 3 (Next)**: Deep Parent Portal features, Mobile App wrapper, Advanced Financial Analytics, and Gemini-based predictive modeling.

---
**Document Status: FINAL v1.0**
