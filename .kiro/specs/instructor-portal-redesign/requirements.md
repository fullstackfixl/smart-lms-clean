# Requirements Document: Instructor Portal UI Redesign

## Introduction

This document specifies the requirements for completely redesigning the Smart LMS (Instatute) instructor portal UI. The current portal has a "dark orange glass mess" design that needs to be rebuilt from scratch with a focus on ultra-minimal, spacious, calm, and professional aesthetics. The goal is to create the world's cleanest, simplest, most professional LMS instructor dashboard that clones Learnyst's simplicity but elevates it significantly.

The redesign will implement a modern design system using Next.js 14, TypeScript, Tailwind CSS, and Shadcn/UI, with full light/dark mode support and a focus on elegant simplicity that feels instantly familiar and joyful.

## Glossary

- **Instructor_Portal**: The web application interface used by course instructors to manage courses, students, live classes, and content
- **Design_System**: The comprehensive set of design standards, components, and patterns that ensure visual and functional consistency
- **Theme_System**: The mechanism for switching between light and dark color schemes while maintaining identical layout and structure
- **Sidebar**: The permanent left navigation panel containing primary navigation items and user information
- **Empty_State**: A UI pattern displayed when no data is available, consisting of an icon, title, subtitle, and call-to-action button
- **Metric_Card**: A dashboard component displaying a single key performance indicator with an icon, label, and value
- **Data_Table**: A structured display of tabular information with columns, rows, sorting, and action capabilities
- **Live_Class**: A scheduled real-time video session between instructor and students
- **Submission**: Student-submitted work (assignments, projects) requiring instructor review
- **Content_Upload**: The process of adding video lectures and course materials to the platform
- **Shadcn_UI**: A collection of re-usable components built using Radix UI and Tailwind CSS
- **Framer_Motion**: A production-ready motion library for React for animations
- **Next_Themes**: A library for managing theme state in Next.js applications
- **Lucide_Icons**: A collection of simply beautiful open-source icons

## Requirements

### Requirement 1: Design System Foundation

**User Story:** As an instructor, I want a clean and professional interface with consistent visual design, so that I can focus on teaching without visual distractions.

#### Acceptance Criteria

1. THE Design_System SHALL use Inter font family for all text elements
2. THE Design_System SHALL implement a light theme with #FFFFFF pure white background as the default
3. THE Design_System SHALL use #2563EB calm blue as the primary accent color for buttons, links, and active states
4. THE Design_System SHALL use #10B981 soft green for success and published status indicators
5. THE Design_System SHALL use slate-900 for headings, slate-700 for body text, and slate-500 for labels
6. THE Design_System SHALL apply rounded-md border radius to buttons and cards
7. THE Design_System SHALL use subtle shadows (0 1px 3px rgba(0,0,0,0.05)) on card surfaces
8. THE Design_System SHALL maintain 32-40px gaps between major sections and 24px padding within containers
9. THE Design_System SHALL use Lucide icons with minimal stroke weight throughout the interface
10. THE Design_System SHALL implement subtle Framer Motion fade-in animations on page load and hover lift effects (scale 1.02) on interactive elements

### Requirement 2: Theme System with Light and Dark Mode

**User Story:** As an instructor, I want to toggle between light and dark themes, so that I can work comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHEN the application loads, THE Theme_System SHALL default to light mode unless user preference indicates otherwise
2. WHEN a user selects dark mode, THE Theme_System SHALL apply #0F172A dark background, #1E293B card surfaces, and slate-100 text colors
3. WHEN a user selects light mode, THE Theme_System SHALL apply #FFFFFF white background, white card surfaces with border-gray-200, and slate-900/700/500 text colors
4. WHEN theme changes occur, THE Theme_System SHALL maintain identical layout structure and component positioning
5. THE Theme_System SHALL provide a theme toggle control in the top-right avatar dropdown menu under "Appearance"
6. THE Theme_System SHALL offer three theme options: Light, Dark, and System (follows OS preference)
7. WHEN a user selects a theme preference, THE Theme_System SHALL persist the choice in localStorage
8. THE Theme_System SHALL use next-themes library for theme state management
9. WHEN system theme is selected, THE Theme_System SHALL automatically update when OS theme changes
10. THE Theme_System SHALL apply theme transitions smoothly without layout shift or flashing

### Requirement 3: Shared Layout with Sidebar Navigation

**User Story:** As an instructor, I want a consistent navigation sidebar across all pages, so that I can easily access different sections of the portal.

#### Acceptance Criteria

1. THE Sidebar SHALL be permanently visible on the left side with 280px width on desktop viewports
2. THE Sidebar SHALL display the Instatute logo (orange icon + text) at the top
3. THE Sidebar SHALL display user avatar, name, and email in the top section with a dropdown menu
4. THE Sidebar SHALL include navigation items: Dashboard, Manage Courses, Students, Live Classes, Analytics, Submissions, Notifications, Upload Content
5. THE Sidebar SHALL display a Logout option at the bottom
6. WHEN a navigation item is active, THE Sidebar SHALL highlight it with blue background (#2563EB) and white text
7. WHEN a navigation item is hovered, THE Sidebar SHALL apply hover state with darker blue (#1D4ED8)
8. WHEN viewport width is below tablet breakpoint, THE Sidebar SHALL transform into an overlay that can be toggled
9. THE Sidebar SHALL include the theme toggle control within the user avatar dropdown menu
10. THE Sidebar SHALL maintain consistent styling in both light and dark themes

### Requirement 4: Dashboard Page

**User Story:** As an instructor, I want a dashboard overview of my teaching activities, so that I can quickly understand my current status and take action.

#### Acceptance Criteria

1. THE Dashboard SHALL display a welcome message "Welcome back, [instructor_name]" in large, bold typography
2. THE Dashboard SHALL display four Metric_Cards in a row showing: Total Courses (blue), Total Students (green), Total Lectures (purple), and Completion Rate (orange)
3. WHEN no live classes are scheduled, THE Dashboard SHALL display an Empty_State with a calendar icon, "No upcoming classes" title, "Schedule your first live class" subtitle, and a blue "Schedule Live Class" button
4. WHEN live classes are scheduled, THE Dashboard SHALL display an "Upcoming Live Classes" section with class details
5. THE Dashboard SHALL include a "Quick Actions" section with cards for common tasks (Create Course, Upload Content, View Submissions, Schedule Class)
6. THE Dashboard SHALL use generous spacing (32-40px gaps) between sections
7. THE Dashboard SHALL apply subtle fade-in animation when the page loads
8. THE Dashboard SHALL be fully responsive, stacking Metric_Cards vertically on mobile viewports
9. THE Dashboard SHALL maintain identical layout structure in both light and dark themes
10. WHEN Quick Action cards are hovered, THE Dashboard SHALL apply scale 1.02 transform with smooth transition

### Requirement 5: Manage Courses Page

**User Story:** As an instructor, I want to view and manage all my courses in a clean table, so that I can efficiently organize my teaching content.

#### Acceptance Criteria

1. THE Manage_Courses_Page SHALL display "My Courses" as the page header in large, bold typography
2. THE Manage_Courses_Page SHALL include a blue "Create Course" button in the top-right corner
3. THE Manage_Courses_Page SHALL provide a search input field for filtering courses by name
4. THE Manage_Courses_Page SHALL provide filter dropdowns for Category, Level, and Status
5. THE Manage_Courses_Page SHALL display courses in a Data_Table with columns: Course (with thumbnail), Category, Level, Status (badge), Price, Created Date, Actions
6. WHEN a table row is hovered, THE Data_Table SHALL apply blue-50 background color
7. THE Data_Table SHALL use clean styling with no zebra striping and subtle borders
8. THE Data_Table SHALL include an Actions menu (three dots) with options: Edit, Duplicate, Delete, View Analytics
9. WHEN no courses exist, THE Manage_Courses_Page SHALL display an Empty_State with a book icon, "No courses yet" title, "Create your first course to get started" subtitle, and a blue "Create Course" button
10. THE Manage_Courses_Page SHALL be fully responsive, converting the table to card layout on mobile viewports

### Requirement 6: Live Classes Page

**User Story:** As an instructor, I want to schedule and manage live classes, so that I can conduct real-time sessions with my students.

#### Acceptance Criteria

1. THE Live_Classes_Page SHALL display "Live Classes" as the page header in large, bold typography
2. THE Live_Classes_Page SHALL include a blue "Schedule New Class" button in the top-right corner
3. THE Live_Classes_Page SHALL display classes in a Data_Table with columns: Class Details (icon + title), Course, Schedule (date/time), Duration, Status (badge), Actions
4. WHEN a class status is "Live", THE Data_Table SHALL display a green badge with "Live" text
5. WHEN a class status is "Scheduled", THE Data_Table SHALL display a blue badge with "Scheduled" text
6. WHEN a class status is "Completed", THE Data_Table SHALL display a gray badge with "Completed" text
7. THE Data_Table SHALL include Actions with edit and delete icons
8. WHEN no classes exist, THE Live_Classes_Page SHALL display an Empty_State with a video icon, "No live classes scheduled" title, "Schedule your first live class" subtitle, and a blue "Schedule New Class" button
9. THE Live_Classes_Page SHALL be fully responsive, converting the table to card layout on mobile viewports
10. WHEN a table row is hovered, THE Data_Table SHALL apply blue-50 background color

### Requirement 7: Notifications Page

**User Story:** As an instructor, I want to view all my notifications in one place, so that I can stay informed about important updates.

#### Acceptance Criteria

1. THE Notifications_Page SHALL display "Notifications" as the page header in large, bold typography
2. THE Notifications_Page SHALL include a filter dropdown in the top-right corner with options: All, Unread, Course Updates, Student Activity, System
3. WHEN notifications exist, THE Notifications_Page SHALL display them in a list with icon, title, description, and timestamp
4. WHEN a notification is unread, THE Notifications_Page SHALL display a blue dot indicator
5. WHEN a notification is clicked, THE Notifications_Page SHALL mark it as read and navigate to the relevant page
6. WHEN no notifications exist, THE Notifications_Page SHALL display an Empty_State with a bell icon, "No notifications" title, and "You're all caught up!" subtitle
7. THE Notifications_Page SHALL be fully responsive with consistent spacing on all viewports
8. THE Notifications_Page SHALL apply subtle fade-in animation when notifications load
9. THE Notifications_Page SHALL maintain identical layout structure in both light and dark themes
10. WHEN notification items are hovered, THE Notifications_Page SHALL apply blue-50 background color

### Requirement 8: Submissions Review Page

**User Story:** As an instructor, I want to review student submissions, so that I can provide feedback and grades.

#### Acceptance Criteria

1. THE Submissions_Page SHALL display "Submissions Review" as the page header in large, bold typography
2. THE Submissions_Page SHALL include a course dropdown filter in the top section
3. THE Submissions_Page SHALL include a search input field for filtering submissions by student name
4. WHEN a course is selected, THE Submissions_Page SHALL display submissions in a Data_Table with columns: Student, Assignment, Submitted Date, Status (badge), Grade, Actions
5. WHEN submission status is "Pending", THE Data_Table SHALL display an orange badge with "Pending" text
6. WHEN submission status is "Graded", THE Data_Table SHALL display a green badge with "Graded" text
7. THE Data_Table SHALL include Actions with view and grade icons
8. WHEN no course is selected, THE Submissions_Page SHALL display an Empty_State with a document icon, "Select a course to view submissions" title, and "Choose a course from the dropdown above" subtitle
9. WHEN a course is selected but has no submissions, THE Submissions_Page SHALL display an Empty_State with a document icon, "No submissions found" title, and "Students haven't submitted any work yet" subtitle
10. THE Submissions_Page SHALL be fully responsive, converting the table to card layout on mobile viewports

### Requirement 9: Upload Content Page

**User Story:** As an instructor, I want to upload video lectures easily, so that I can add content to my courses.

#### Acceptance Criteria

1. THE Upload_Content_Page SHALL display "Upload Video Lecture" as the page header in large, bold typography
2. THE Upload_Content_Page SHALL include a course dropdown to select the target course
3. THE Upload_Content_Page SHALL display a step-by-step guide list with numbered steps explaining the upload process
4. THE Upload_Content_Page SHALL include a drag-and-drop area with dashed border for file selection
5. WHEN a file is dragged over the drop area, THE Upload_Content_Page SHALL highlight the area with blue border
6. WHEN a file is dropped or selected, THE Upload_Content_Page SHALL display upload progress with a progress bar
7. THE Upload_Content_Page SHALL validate file type and size before upload
8. WHEN upload is complete, THE Upload_Content_Page SHALL display a success message with green checkmark
9. WHEN upload fails, THE Upload_Content_Page SHALL display an error message with red icon and retry option
10. THE Upload_Content_Page SHALL be fully responsive with consistent spacing on all viewports

### Requirement 10: Students Page

**User Story:** As an instructor, I want to view students enrolled in my courses, so that I can track enrollment and export data.

#### Acceptance Criteria

1. THE Students_Page SHALL display "Students" as the page header in large, bold typography
2. THE Students_Page SHALL include an "Export CSV" button in the top-right corner
3. THE Students_Page SHALL include a course dropdown filter in the top section
4. THE Students_Page SHALL include a search input field for filtering students by name or email
5. WHEN a course is selected, THE Students_Page SHALL display students in a Data_Table with columns: Student (avatar + name), Email, Enrollment Date, Progress (percentage), Last Active, Actions
6. THE Data_Table SHALL display progress as a percentage with a visual progress bar
7. THE Data_Table SHALL include Actions with view profile and message icons
8. WHEN no course is selected, THE Students_Page SHALL display an Empty_State with a person icon, "Select a course to view students" title, and "Choose a course from the dropdown above" subtitle
9. WHEN a course is selected but has no students, THE Students_Page SHALL display an Empty_State with a person icon, "No students enrolled" title, and "Share your course to get students" subtitle
10. THE Students_Page SHALL be fully responsive, converting the table to card layout on mobile viewports

### Requirement 11: Reusable Component Library

**User Story:** As a developer, I want reusable UI components, so that I can maintain consistency and accelerate development.

#### Acceptance Criteria

1. THE Component_Library SHALL include an InstructorSidebar component with props for active route and user data
2. THE Component_Library SHALL include an InstructorHeader component with props for title and action buttons
3. THE Component_Library SHALL include a ThemeToggle component that integrates with next-themes
4. THE Component_Library SHALL include an EmptyState component with props for icon, title, subtitle, and CTA button
5. THE Component_Library SHALL include a StatCard component with props for label, value, icon, and color
6. THE Component_Library SHALL include a DataTable component with props for columns, data, and actions
7. THE Component_Library SHALL use Shadcn/UI base components customized for minimal aesthetic
8. THE Component_Library SHALL implement TypeScript interfaces for all component props
9. THE Component_Library SHALL include JSDoc comments documenting component usage
10. THE Component_Library SHALL ensure all components support both light and dark themes

### Requirement 12: Responsive Design

**User Story:** As an instructor, I want the portal to work seamlessly on all devices, so that I can manage my courses from anywhere.

#### Acceptance Criteria

1. WHEN viewport width is below 768px, THE Instructor_Portal SHALL transform the Sidebar into a mobile overlay
2. WHEN viewport width is below 768px, THE Instructor_Portal SHALL display a hamburger menu button to toggle the Sidebar
3. WHEN viewport width is below 768px, THE Data_Table components SHALL transform into card layouts
4. WHEN viewport width is below 768px, THE Metric_Cards SHALL stack vertically with full width
5. THE Instructor_Portal SHALL use Tailwind CSS responsive breakpoints (sm, md, lg, xl, 2xl)
6. THE Instructor_Portal SHALL maintain touch-friendly tap targets (minimum 44x44px) on mobile devices
7. THE Instructor_Portal SHALL ensure text remains readable without horizontal scrolling on all viewport sizes
8. THE Instructor_Portal SHALL optimize image sizes for mobile viewports
9. THE Instructor_Portal SHALL maintain consistent spacing ratios across all breakpoints
10. THE Instructor_Portal SHALL test responsive behavior on common devices (iPhone, iPad, Android phones/tablets)

### Requirement 13: Performance and Loading States

**User Story:** As an instructor, I want the portal to load quickly and provide feedback during operations, so that I have a smooth experience.

#### Acceptance Criteria

1. WHEN a page loads, THE Instructor_Portal SHALL display content within 2 seconds on standard broadband connections
2. WHEN data is loading, THE Instructor_Portal SHALL display skeleton loaders matching the expected content layout
3. WHEN an action is processing, THE Instructor_Portal SHALL display a loading spinner or progress indicator
4. THE Instructor_Portal SHALL implement code splitting for each page route
5. THE Instructor_Portal SHALL lazy load images below the fold
6. THE Instructor_Portal SHALL prefetch navigation routes on hover
7. THE Instructor_Portal SHALL optimize font loading to prevent layout shift
8. THE Instructor_Portal SHALL minimize JavaScript bundle size through tree shaking
9. THE Instructor_Portal SHALL use Next.js Image component for automatic optimization
10. THE Instructor_Portal SHALL implement proper caching headers for static assets

### Requirement 14: Accessibility Compliance

**User Story:** As an instructor with accessibility needs, I want the portal to be fully accessible, so that I can use it effectively with assistive technologies.

#### Acceptance Criteria

1. THE Instructor_Portal SHALL provide proper ARIA labels for all interactive elements
2. THE Instructor_Portal SHALL support full keyboard navigation with visible focus indicators
3. THE Instructor_Portal SHALL maintain color contrast ratios of at least 4.5:1 for normal text and 3:1 for large text
4. THE Instructor_Portal SHALL provide alt text for all meaningful images
5. THE Instructor_Portal SHALL use semantic HTML elements (nav, main, article, section, header, footer)
6. THE Instructor_Portal SHALL announce dynamic content changes to screen readers using ARIA live regions
7. THE Instructor_Portal SHALL ensure form inputs have associated labels
8. THE Instructor_Portal SHALL provide skip navigation links for keyboard users
9. THE Instructor_Portal SHALL support browser zoom up to 200% without breaking layout
10. THE Instructor_Portal SHALL test with screen readers (NVDA, JAWS, VoiceOver)

### Requirement 15: Migration from Existing Implementation

**User Story:** As a developer, I want to replace the existing instructor portal pages, so that the new design system is fully implemented.

#### Acceptance Criteria

1. THE Migration SHALL identify all existing instructor pages in client/app/(instructor)/ directory
2. THE Migration SHALL identify all existing instructor pages in client/app/instructor/ directory
3. THE Migration SHALL create new page implementations using the new Design_System
4. THE Migration SHALL preserve all existing functionality while updating the UI
5. THE Migration SHALL maintain existing API integrations and data fetching logic
6. THE Migration SHALL update routing to use Next.js 14 App Router conventions
7. THE Migration SHALL remove deprecated glassmorphism and glow effects from all components
8. THE Migration SHALL replace existing color schemes with the new Design_System palette
9. THE Migration SHALL update all icon usage to Lucide icons
10. THE Migration SHALL ensure no breaking changes to backend API contracts
