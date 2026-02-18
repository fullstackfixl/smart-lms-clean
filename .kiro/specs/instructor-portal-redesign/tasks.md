# Implementation Plan: Instructor Portal UI Redesign

## Overview

This implementation plan breaks down the instructor portal redesign into discrete, incremental coding tasks. Each task builds on previous work, starting with foundational setup and progressing through component development, page implementation, and testing. The plan follows a bottom-up approach: establish the design system and core components first, then build pages that use those components.

## Tasks

- [ ] 1. Setup design system foundation and theme infrastructure
  - [x] 1.1 Install and configure required dependencies
    - Install next-themes, framer-motion, lucide-react, @fast-check/vitest
    - Configure Tailwind CSS with custom design tokens
    - Setup Inter font with next/font optimization
    - _Requirements: 1.1, 1.8, 2.8_
  
  - [x] 1.2 Create design system constants and utilities
    - Create lib/constants.ts with DESIGN_TOKENS object (colors, spacing, typography, animations)
    - Create lib/utils.ts with cn() utility and helper functions
    - Define TypeScript interfaces for design tokens
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_
  
  - [x] 1.3 Setup theme provider and CSS variables
    - Create app/providers.tsx with ThemeProvider component
    - Configure globals.css with CSS variables for light and dark themes
    - Setup next-themes with localStorage persistence
    - _Requirements: 2.1, 2.7, 2.8_
  
  - [ ] 1.4 Write property test for theme persistence
    - **Property 1: Theme Persistence Round-Trip**
    - **Validates: Requirements 2.7**

- [ ] 2. Build core reusable components
  - [ ] 2.1 Create base Shadcn/UI components
    - Install and configure Shadcn/UI CLI
    - Add button, card, dropdown-menu, table, input, badge components
    - Customize components for minimal aesthetic (remove heavy borders, adjust shadows)
    - _Requirements: 11.7_
  
  - [x] 2.2 Implement ThemeToggle component
    - Create components/instructor/ThemeToggle.tsx
    - Integrate with next-themes useTheme hook
    - Add Sun, Moon, Monitor icons with dropdown menu
    - Display checkmark for active theme
    - _Requirements: 2.5, 2.6, 11.3_
  
  - [ ] 2.3 Write property test for theme switching
    - **Property 2: Theme Switching Correctness**
    - **Validates: Requirements 2.2, 2.3**
  
  - [ ] 2.4 Write property test for component theme support
    - **Property 8: Component Theme Support**
    - **Validates: Requirements 11.10**
  
  - [x] 2.5 Implement EmptyState component
    - Create components/instructor/EmptyState.tsx with TypeScript interface
    - Accept icon, title, subtitle, and optional action props
    - Style with centered layout, 64px icon, proper spacing
    - Support light and dark themes
    - _Requirements: 11.4_
  
  - [ ] 2.6 Write property test for empty state rendering
    - **Property 6: Empty State Rendering Pattern**
    - **Validates: Requirements 4.3, 5.9, 6.8, 7.6, 8.6, 8.9, 10.8, 10.9**
  
  - [x] 2.7 Implement StatCard component
    - Create components/instructor/StatCard.tsx with TypeScript interface
    - Accept label, value, icon, color, and optional trend props
    - Style with card background, colored icon circle, large value text
    - Add hover lift animation with Framer Motion
    - _Requirements: 11.5_
  
  - [ ] 2.8 Write unit tests for StatCard component
    - Test rendering with different color variants
    - Test trend display (up/down arrows)
    - Test hover animation
    - _Requirements: 11.5_

- [ ] 3. Implement DataTable component with responsive behavior
  - [x] 3.1 Create DataTable component with generic TypeScript types
    - Create components/instructor/DataTable.tsx with DataTableProps<T> interface
    - Implement table rendering with columns, data, and actions
    - Add sortable column headers
    - Style with clean borders, no zebra striping, proper padding
    - _Requirements: 11.6_
  
  - [x] 3.2 Add hover states and interactive features
    - Implement row hover with blue-50 background
    - Add row click handler
    - Implement actions dropdown menu
    - _Requirements: 5.6, 5.8_
  
  - [ ] 3.3 Write property test for hover states
    - **Property 4: Interactive Element Hover States**
    - **Validates: Requirements 3.7, 5.6**
  
  - [ ] 3.4 Implement responsive card layout for mobile
    - Add responsive transformation at 768px breakpoint
    - Convert table rows to cards on mobile
    - Display labels inline with values in card layout
    - _Requirements: 12.3_
  
  - [ ] 3.5 Write property test for responsive transformation
    - **Property 10: Data Table Responsive Transformation**
    - **Validates: Requirements 5.10, 6.9, 8.10, 10.10, 12.3**

- [ ] 4. Build InstructorSidebar component
  - [x] 4.1 Create sidebar structure and navigation
    - Create components/instructor/InstructorSidebar.tsx with TypeScript interface
    - Implement logo section at top
    - Add user avatar section with name, email, and dropdown
    - Create navigation items array with icons and labels
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 11.1_
  
  - [x] 4.2 Implement active and hover states
    - Add active route highlighting with blue background and white text
    - Implement hover states with background color change
    - Add smooth transitions
    - _Requirements: 3.6, 3.7_
  
  - [ ] 4.3 Write property test for active navigation highlighting
    - **Property 5: Active Navigation Highlighting**
    - **Validates: Requirements 3.6**
  
  - [x] 4.4 Add theme toggle to user dropdown
    - Integrate ThemeToggle component in user avatar dropdown
    - Add "Appearance" menu item with theme options
    - _Requirements: 2.5, 3.9_
  
  - [x] 4.5 Implement responsive mobile overlay
    - Add mobile breakpoint detection
    - Transform sidebar to overlay with backdrop on mobile
    - Add hamburger menu button trigger
    - Implement slide-in animation with Framer Motion
    - _Requirements: 3.8, 12.1, 12.2_
  
  - [ ] 4.6 Write property test for responsive sidebar transformation
    - **Property 9: Responsive Sidebar Transformation**
    - **Validates: Requirements 3.8, 12.1, 12.2**

- [ ] 5. Create shared instructor layout
  - [x] 5.1 Implement instructor layout component
    - Create app/(instructor)/layout.tsx
    - Integrate InstructorSidebar component
    - Setup main content area with proper spacing
    - Add ErrorBoundary wrapper
    - _Requirements: 3.1, 3.10_
  
  - [x] 5.2 Create InstructorHeader component
    - Create components/instructor/InstructorHeader.tsx
    - Accept title, subtitle, and actions props
    - Style with large bold title and right-aligned actions
    - _Requirements: 11.2_
  
  - [ ] 5.3 Write unit tests for layout components
    - Test sidebar rendering with user data
    - Test header rendering with different prop combinations
    - Test responsive behavior
    - _Requirements: 11.1, 11.2_

- [ ] 6. Checkpoint - Verify design system and core components
  - Ensure all tests pass, verify theme switching works correctly, check responsive behavior at different breakpoints. Ask the user if questions arise.

- [ ] 7. Implement Dashboard page
  - [x] 7.1 Create dashboard page structure
    - Create app/(instructor)/dashboard/page.tsx
    - Add welcome message with instructor name
    - Setup grid layout for metric cards
    - _Requirements: 4.1, 4.6_
  
  - [x] 7.2 Implement dashboard metrics section
    - Fetch dashboard metrics data (server component)
    - Render 4 StatCard components (Total Courses, Total Students, Total Lectures, Completion Rate)
    - Apply correct colors (blue, green, purple, orange)
    - Add trend indicators
    - _Requirements: 4.2_
  
  - [x] 7.3 Add upcoming live classes section
    - Fetch upcoming live classes data
    - Implement conditional rendering (EmptyState vs class list)
    - Style class list items with proper spacing
    - Add "Schedule Live Class" button
    - _Requirements: 4.3, 4.4_
  
  - [x] 7.4 Create quick actions section
    - Create 4 action cards (Create Course, Upload Content, View Submissions, Schedule Class)
    - Add icons and labels
    - Implement click handlers for navigation
    - Add hover lift animation
    - _Requirements: 4.10_
  
  - [ ] 7.5 Write unit tests for dashboard page
    - Test rendering with mock data
    - Test empty state display
    - Test metric card rendering
    - Test quick action navigation
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 8. Implement Manage Courses page
  - [x] 8.1 Create courses page structure
    - Create app/(instructor)/courses/page.tsx
    - Add InstructorHeader with "My Courses" title and "Create Course" button
    - Setup filter bar with search and dropdowns
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 8.2 Implement course data table
    - Fetch courses data (server component)
    - Render DataTable with course columns (thumbnail, title, category, level, status, price, created date)
    - Add status badges with correct colors
    - Implement actions menu (Edit, Duplicate, View Analytics, Delete)
    - _Requirements: 5.5, 5.6, 5.7, 5.8_
  
  - [x] 8.3 Add empty state for no courses
    - Implement conditional rendering
    - Display EmptyState with book icon and "Create Course" CTA
    - _Requirements: 5.9_
  
  - [ ] 8.4 Write unit tests for courses page
    - Test table rendering with mock courses
    - Test empty state display
    - Test filter functionality
    - Test actions menu
    - _Requirements: 5.1, 5.2, 5.5, 5.9_

- [ ] 9. Implement Live Classes page
  - [x] 9.1 Create live classes page structure
    - Create app/(instructor)/live-classes/page.tsx
    - Add InstructorHeader with "Live Classes" title and "Schedule New Class" button
    - _Requirements: 6.1, 6.2_
  
  - [x] 9.2 Implement live classes data table
    - Fetch live classes data (server component)
    - Render DataTable with class columns (title, course, schedule, duration, status)
    - Add status badges (Live with pulsing dot, Scheduled, Completed)
    - Implement actions (edit, delete, join link)
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [x] 9.3 Add empty state for no classes
    - Implement conditional rendering
    - Display EmptyState with video icon and "Schedule New Class" CTA
    - _Requirements: 6.8_
  
  - [ ] 9.4 Write unit tests for live classes page
    - Test table rendering with mock classes
    - Test status badge rendering
    - Test empty state display
    - _Requirements: 6.1, 6.3, 6.8_

- [ ] 10. Implement Students page
  - [x] 10.1 Create students page structure
    - Create app/(instructor)/students/page.tsx
    - Add InstructorHeader with "Students" title and "Export CSV" button
    - Add course dropdown filter and search input
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 10.2 Implement students data table
    - Fetch students data based on selected course (client component for filtering)
    - Render DataTable with student columns (avatar, name, email, enrollment date, progress, last active)
    - Add progress bars with gradient fill
    - Implement actions (view profile, message)
    - _Requirements: 10.5, 10.6, 10.7_
  
  - [x] 10.3 Add empty states
    - Display "Select a course" empty state when no course selected
    - Display "No students enrolled" empty state when course has no students
    - _Requirements: 10.8, 10.9_
  
  - [ ] 10.4 Write unit tests for students page
    - Test table rendering with mock students
    - Test progress bar rendering
    - Test empty states
    - Test course filter
    - _Requirements: 10.1, 10.5, 10.8, 10.9_

- [ ] 11. Implement Submissions page
  - [x] 11.1 Create submissions page structure
    - Create app/(instructor)/submissions/page.tsx
    - Add InstructorHeader with "Submissions Review" title
    - Add course dropdown filter and search input
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 11.2 Implement submissions data table
    - Fetch submissions data based on selected course
    - Render DataTable with submission columns (student, assignment, submitted date, status, grade)
    - Add status badges (Pending, Graded, Late)
    - Implement actions (view, grade)
    - _Requirements: 8.4, 8.5, 8.6, 8.7_
  
  - [x] 11.3 Add empty states
    - Display "Select a course" empty state when no course selected
    - Display "No submissions found" empty state when course has no submissions
    - _Requirements: 8.8, 8.9_
  
  - [ ] 11.4 Write unit tests for submissions page
    - Test table rendering with mock submissions
    - Test status badge rendering
    - Test empty states
    - _Requirements: 8.1, 8.4, 8.8, 8.9_

- [ ] 12. Implement Notifications page
  - [x] 12.1 Create notifications page structure
    - Create app/(instructor)/notifications/page.tsx
    - Add InstructorHeader with "Notifications" title and filter dropdown
    - _Requirements: 7.1, 7.2_
  
  - [x] 12.2 Implement notifications list
    - Fetch notifications data (server component)
    - Render notification items with icon, title, description, timestamp
    - Add unread indicator (blue dot)
    - Implement click to mark as read and navigate
    - _Requirements: 7.3, 7.4, 7.5_
  
  - [x] 12.3 Add empty state for no notifications
    - Display EmptyState with bell icon and "You're all caught up!" message
    - _Requirements: 7.6_
  
  - [ ] 12.4 Write unit tests for notifications page
    - Test notification list rendering
    - Test unread indicator
    - Test empty state display
    - Test filter functionality
    - _Requirements: 7.1, 7.3, 7.6_

- [ ] 13. Implement Upload Content page
  - [x] 13.1 Create upload page structure
    - Create app/(instructor)/upload/page.tsx
    - Add InstructorHeader with "Upload Video Lecture" title
    - Add course dropdown selector
    - Display step-by-step guide list
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [x] 13.2 Implement drag-and-drop upload area
    - Create drag-and-drop zone with dashed border
    - Add file input with click to browse
    - Implement drag over highlight effect
    - _Requirements: 9.4, 9.5_
  
  - [x] 13.3 Add file validation and upload handling
    - Validate file type (video formats only)
    - Validate file size (check against limit)
    - Display error messages for invalid files
    - Implement upload progress bar
    - Display success/error messages after upload
    - _Requirements: 9.6, 9.7, 9.8, 9.9_
  
  - [ ] 13.4 Write property test for file upload validation
    - **Property 7: File Upload Validation**
    - **Validates: Requirements 9.7**
  
  - [ ] 13.5 Write unit tests for upload page
    - Test drag-and-drop interactions
    - Test file validation
    - Test progress display
    - Test success/error messages
    - _Requirements: 9.1, 9.4, 9.6, 9.7, 9.8, 9.9_

- [ ] 14. Checkpoint - Verify all pages are functional
  - Ensure all pages render correctly, test navigation between pages, verify data fetching and display, check responsive behavior on mobile. Ask the user if questions arise.

- [ ] 15. Implement error handling and loading states
  - [ ] 15.1 Create ErrorBoundary component
    - Create components/ErrorBoundary.tsx
    - Implement error catching and fallback UI
    - Add reload button
    - _Requirements: Error Handling section_
  
  - [ ] 15.2 Create loading skeleton components
    - Create skeleton loaders for tables, cards, and lists
    - Match skeleton layout to actual content
    - Add pulse animation
    - _Requirements: 13.2_
  
  - [ ] 15.3 Add error handling to API calls
    - Create lib/api.ts with fetchWithErrorHandling utility
    - Implement error handling for network, 4xx, 5xx, timeout errors
    - Add retry logic with exponential backoff
    - _Requirements: Error Handling section_
  
  - [ ] 15.4 Create ErrorMessage component
    - Create components/ErrorMessage.tsx
    - Display error icon, title, message, and retry button
    - Style with red color scheme
    - _Requirements: Error Handling section_
  
  - [ ] 15.5 Write unit tests for error handling
    - Test ErrorBoundary catches errors
    - Test error message display
    - Test retry functionality
    - _Requirements: Error Handling section_

- [ ] 16. Add animations and polish
  - [ ] 16.1 Implement page transition animations
    - Add Framer Motion to page components
    - Implement fade-in animation on page load
    - Add exit animations
    - _Requirements: 1.10, 4.7_
  
  - [ ] 16.2 Add hover animations to interactive elements
    - Apply scale 1.02 transform to cards and buttons on hover
    - Add smooth transitions (200ms duration)
    - _Requirements: 1.10, 4.10_
  
  - [ ] 16.3 Implement notification slide-in animation
    - Add slide-in from right animation for toast notifications
    - Add exit animation
    - _Requirements: Animation Strategy section_
  
  - [ ] 16.4 Write unit tests for animations
    - Test animation variants are applied
    - Test hover animations trigger
    - _Requirements: 1.10_

- [ ] 17. Implement accessibility features
  - [ ] 17.1 Add ARIA labels and roles
    - Add aria-label to all interactive elements without visible text
    - Add aria-describedby for additional context
    - Use semantic HTML elements (nav, main, article, section)
    - Add role attributes where needed
    - _Requirements: 14.1, 14.5_
  
  - [ ] 17.2 Implement keyboard navigation
    - Ensure all interactive elements are keyboard accessible
    - Add visible focus indicators (2px blue ring)
    - Implement skip navigation link
    - Add keyboard shortcuts for common actions
    - _Requirements: 14.2_
  
  - [ ] 17.3 Add focus management for modals
    - Implement focus trap in modal dialogs
    - Return focus to trigger element on close
    - _Requirements: Accessibility section_
  
  - [ ] 17.4 Add ARIA live regions for dynamic content
    - Add aria-live="polite" to success/error messages
    - Announce loading states to screen readers
    - _Requirements: 14.6_
  
  - [ ] 17.5 Write accessibility tests
    - Use jest-axe to test for accessibility violations
    - Test keyboard navigation flows
    - Test focus management
    - _Requirements: 14.1, 14.2, 14.6_

- [ ] 18. Optimize performance
  - [ ] 18.1 Implement code splitting
    - Add dynamic imports for heavy components (modals, charts)
    - Configure loading states for dynamic imports
    - _Requirements: 13.4_
  
  - [ ] 18.2 Optimize images
    - Use Next.js Image component for all images
    - Configure lazy loading and blur placeholders
    - Optimize image sizes for different viewports
    - _Requirements: 13.5, 13.9_
  
  - [ ] 18.3 Optimize font loading
    - Configure Inter font with next/font
    - Use font-display: swap
    - Preload critical fonts
    - _Requirements: 13.7_
  
  - [ ] 18.4 Write performance tests
    - Test bundle size is within limits
    - Test lazy loading works correctly
    - Test font loading doesn't cause layout shift
    - _Requirements: 13.4, 13.5, 13.7_

- [ ] 19. Migration and cleanup
  - [ ] 19.1 Identify and document existing instructor pages
    - List all files in client/app/(instructor)/ directory
    - List all files in client/app/instructor/ directory
    - Document current functionality and API integrations
    - _Requirements: 15.1, 15.2_
  
  - [ ] 19.2 Update routing structure
    - Ensure new pages use Next.js 14 App Router conventions
    - Update any hardcoded route references
    - Test navigation between all pages
    - _Requirements: 15.6_
  
  - [ ] 19.3 Remove deprecated styles and components
    - Remove glassmorphism effects from old components
    - Remove glow effects and excessive animations
    - Update color schemes to new design system
    - Remove old icon libraries, use Lucide exclusively
    - _Requirements: 15.7, 15.8, 15.9_
  
  - [ ] 19.4 Verify API compatibility
    - Test all API endpoints with new pages
    - Ensure no breaking changes to backend contracts
    - Update API call signatures if needed
    - _Requirements: 15.5, 15.10_

- [ ] 20. Final checkpoint and testing
  - [ ] 20.1 Run full test suite
    - Execute all unit tests
    - Execute all property-based tests (100 iterations each)
    - Execute accessibility tests
    - Review test coverage reports
  
  - [ ] 20.2 Manual testing checklist
    - Test all pages in light and dark themes
    - Test responsive behavior on mobile, tablet, desktop
    - Test keyboard navigation on all pages
    - Test with screen reader (VoiceOver or NVDA)
    - Test all user flows (create course, upload content, grade submission, etc.)
  
  - [ ] 20.3 Performance audit
    - Run Lighthouse audit on all pages
    - Check bundle sizes
    - Verify loading times
    - Test on slow network connections
  
  - [ ] 20.4 Final review and deployment preparation
    - Review all code for consistency
    - Update documentation
    - Prepare deployment checklist
    - Ask the user if any issues or questions arise

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples, edge cases, and integration points
- The implementation follows a bottom-up approach: design system → components → pages → polish
- All components must support both light and dark themes
- All pages must be fully responsive (mobile, tablet, desktop)
- Accessibility is built in from the start, not added later
