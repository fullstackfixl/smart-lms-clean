# Design Document: Instructor Portal UI Redesign

## Overview

This design document outlines the comprehensive redesign of the Smart LMS (Instatute) instructor portal UI. The redesign transforms the current "dark orange glass mess" into an ultra-minimal, spacious, calm, and professional interface that prioritizes clarity, simplicity, and user experience.

The design follows a modern, clean aesthetic inspired by Vercel and Linear, adapted for educational contexts. It implements a robust design system with full light/dark mode support, reusable components, and responsive layouts that work seamlessly across all devices.

### Design Goals

1. **Ultra-minimal aesthetics**: Remove all visual clutter, glassmorphism, excessive glows, and over-the-top animations
2. **Professional simplicity**: Create an interface that feels instantly familiar and joyful to use
3. **Consistent design system**: Establish clear patterns for colors, typography, spacing, and components
4. **Theme flexibility**: Support both light and dark modes with identical layouts
5. **Performance**: Fast-loading pages with optimized assets and code splitting
6. **Accessibility**: WCAG 2.1 AA compliant with full keyboard navigation and screen reader support
7. **Responsive design**: Seamless experience from mobile to desktop

### Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for utility-first styling
- **Components**: Shadcn/UI customized for minimal aesthetic
- **Icons**: Lucide Icons with minimal stroke weight
- **Animations**: Framer Motion for subtle, purposeful motion
- **Theme Management**: next-themes for persistent theme state
- **Font**: Inter for all typography

## Architecture

### Application Structure


```
client/
├── app/
│   ├── (instructor)/              # Instructor portal routes
│   │   ├── layout.tsx            # Shared layout with sidebar
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── courses/
│   │   │   └── page.tsx
│   │   ├── students/
│   │   │   └── page.tsx
│   │   ├── live-classes/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── submissions/
│   │   │   └── page.tsx
│   │   ├── notifications/
│   │   │   └── page.tsx
│   │   └── upload/
│   │       └── page.tsx
│   └── providers.tsx             # Theme and context providers
├── components/
│   ├── instructor/
│   │   ├── InstructorSidebar.tsx
│   │   ├── InstructorHeader.tsx
│   │   ├── StatCard.tsx
│   │   ├── DataTable.tsx
│   │   ├── EmptyState.tsx
│   │   └── ThemeToggle.tsx
│   └── ui/                       # Shadcn/UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dropdown-menu.tsx
│       ├── table.tsx
│       └── ...
├── lib/
│   ├── utils.ts                  # Utility functions
│   └── constants.ts              # Design system constants
└── styles/
    └── globals.css               # Global styles and CSS variables
```

### Routing Architecture

The instructor portal uses Next.js 14 App Router with a route group `(instructor)` to share a common layout. All instructor pages are nested under this group and inherit the shared sidebar layout.

**Route Structure:**
- `/dashboard` - Dashboard overview
- `/courses` - Manage courses
- `/students` - View enrolled students
- `/live-classes` - Schedule and manage live classes
- `/analytics` - Course and student analytics
- `/submissions` - Review student submissions
- `/notifications` - View notifications
- `/upload` - Upload video content

### Layout Hierarchy

```
RootLayout (app/layout.tsx)
└── ThemeProvider (next-themes)
    └── InstructorLayout (app/(instructor)/layout.tsx)
        ├── InstructorSidebar (permanent left navigation)
        └── Main Content Area
            ├── InstructorHeader (page-specific)
            └── Page Content
```

### State Management

The application uses a combination of:
- **React Server Components**: For initial data fetching and static content
- **Client Components**: For interactive elements (theme toggle, modals, forms)
- **next-themes**: For theme state management with localStorage persistence
- **React Context**: For user session and global UI state
- **URL State**: For filters, search, and pagination

## Components and Interfaces

### Design System Constants



```typescript
// lib/constants.ts
export const DESIGN_TOKENS = {
  colors: {
    light: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      border: '#E5E7EB', // gray-200
      primary: '#2563EB', // blue-600
      primaryHover: '#1D4ED8', // blue-700
      success: '#10B981', // green-500
      warning: '#F59E0B', // amber-500
      error: '#EF4444', // red-500
      textPrimary: '#0F172A', // slate-900
      textSecondary: '#334155', // slate-700
      textTertiary: '#64748B', // slate-500
      hoverBg: '#EFF6FF', // blue-50
    },
    dark: {
      background: '#0F172A', // slate-900
      surface: '#1E293B', // slate-800
      border: '#334155', // slate-700
      primary: '#3B82F6', // blue-500
      primaryHover: '#2563EB', // blue-600
      success: '#10B981', // green-500
      warning: '#F59E0B', // amber-500
      error: '#EF4444', // red-500
      textPrimary: '#F1F5F9', // slate-100
      textSecondary: '#CBD5E1', // slate-300
      textTertiary: '#94A3B8', // slate-400
      hoverBg: '#1E293B', // slate-800
    },
  },
  spacing: {
    sectionGap: '2.5rem', // 40px
    containerPadding: '1.5rem', // 24px
    cardPadding: '1.5rem', // 24px
    elementGap: '1rem', // 16px
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    headingWeight: 700,
    bodyWeight: 400,
    labelWeight: 500,
  },
  borderRadius: {
    default: '0.375rem', // 6px (rounded-md)
    large: '0.5rem', // 8px (rounded-lg)
  },
  shadows: {
    card: '0 1px 3px rgba(0, 0, 0, 0.05)',
    hover: '0 4px 6px rgba(0, 0, 0, 0.07)',
  },
  animations: {
    fadeIn: {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
    },
    hoverLift: {
      scale: 1.02,
      transition: { duration: 0.2 },
    },
  },
} as const;

export const SIDEBAR_WIDTH = 280;
export const MOBILE_BREAKPOINT = 768;
```

### Core Component Interfaces

```typescript
// components/instructor/types.ts

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'instructor';
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
}

export interface Course {
  id: string;
  title: string;
  thumbnail?: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'Draft' | 'Published' | 'Archived';
  price: number;
  createdAt: Date;
}

export interface LiveClass {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  scheduledAt: Date;
  duration: number; // minutes
  status: 'Scheduled' | 'Live' | 'Completed';
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  enrolledAt: Date;
  progress: number; // 0-100
  lastActive: Date;
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  assignmentTitle: string;
  submittedAt: Date;
  status: 'Pending' | 'Graded';
  grade?: number;
}

export interface Notification {
  id: string;
  type: 'course' | 'student' | 'system';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}
```

### InstructorSidebar Component



**Purpose**: Permanent left navigation panel with logo, user info, navigation items, and theme toggle.

**Component Structure**:
```typescript
interface InstructorSidebarProps {
  user: User;
  activeRoute: string;
  onNavigate?: (href: string) => void;
}

export function InstructorSidebar({ user, activeRoute, onNavigate }: InstructorSidebarProps) {
  // Implementation
}
```

**Visual Design**:
- Fixed position on left, 280px width
- Background: white (light) / #1E293B (dark)
- Border-right: 1px solid gray-200 (light) / slate-700 (dark)
- Logo section at top with 24px padding
- User section below logo with avatar, name, email, and dropdown
- Navigation items with icons, labels, and active state highlighting
- Logout button at bottom
- Mobile: transforms to overlay with backdrop

**Navigation Items**:
```typescript
const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Manage Courses', href: '/courses', icon: BookOpen },
  { label: 'Students', href: '/students', icon: Users },
  { label: 'Live Classes', href: '/live-classes', icon: Video },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Submissions', href: '/submissions', icon: FileText },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Upload Content', href: '/upload', icon: Upload },
];
```

**Active State**:
- Background: #2563EB (primary blue)
- Text: white
- Icon: white
- Border-left: 4px solid darker blue

**Hover State**:
- Background: blue-50 (light) / slate-700 (dark)
- Smooth transition 200ms

### InstructorHeader Component

**Purpose**: Page-specific header with title and action buttons.

**Component Structure**:
```typescript
interface InstructorHeaderProps {
  title: string;
  actions?: React.ReactNode;
  subtitle?: string;
}

export function InstructorHeader({ title, actions, subtitle }: InstructorHeaderProps) {
  // Implementation
}
```

**Visual Design**:
- Flex container with space-between alignment
- Title: text-3xl font-bold text-slate-900 (light) / slate-100 (dark)
- Subtitle: text-base text-slate-500 (light) / slate-400 (dark)
- Actions: right-aligned button group
- Bottom margin: 32px

### StatCard Component

**Purpose**: Display key metrics on dashboard with icon, label, value, and optional trend.

**Component Structure**:
```typescript
interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
  // Implementation
}
```

**Visual Design**:
- Card with white background (light) / slate-800 (dark)
- Border: 1px solid gray-200 (light) / slate-700 (dark)
- Shadow: 0 1px 3px rgba(0,0,0,0.05)
- Padding: 24px
- Border-radius: rounded-lg
- Icon: colored circle background (blue-100, green-100, etc.) with colored icon
- Label: text-sm text-slate-500 (light) / slate-400 (dark)
- Value: text-3xl font-bold text-slate-900 (light) / slate-100 (dark)
- Trend: small badge with arrow icon and percentage
- Hover: scale 1.02 transform with smooth transition

### EmptyState Component

**Purpose**: Display when no data is available with icon, title, subtitle, and optional CTA.

**Component Structure**:
```typescript
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  // Implementation
}
```

**Visual Design**:
- Centered container with flex column layout
- Icon: 64px size, stroke-1, text-slate-400
- Title: text-xl font-bold text-slate-900 (light) / slate-100 (dark)
- Subtitle: text-base text-slate-500 (light) / slate-400 (dark)
- Action button: primary blue button with white text
- Vertical spacing: 16px between elements
- Padding: 64px vertical

### DataTable Component

**Purpose**: Display tabular data with sorting, actions, and responsive behavior.

**Component Structure**:
```typescript
interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
}

export function DataTable<T>({ columns, data, onRowClick, actions }: DataTableProps<T>) {
  // Implementation
}
```

**Visual Design**:
- Table with clean borders, no zebra striping
- Header: text-sm font-semibold text-slate-700 (light) / slate-300 (dark)
- Header background: gray-50 (light) / slate-800 (dark)
- Row hover: blue-50 (light) / slate-700 (dark)
- Cell padding: 16px vertical, 12px horizontal
- Border: 1px solid gray-200 (light) / slate-700 (dark)
- Actions column: right-aligned with dropdown menu
- Responsive: converts to card layout on mobile (<768px)

### ThemeToggle Component

**Purpose**: Toggle between light, dark, and system themes.

**Component Structure**:
```typescript
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // Implementation
}
```

**Visual Design**:
- Dropdown menu with three options: Light, Dark, System
- Each option has an icon (Sun, Moon, Monitor)
- Current theme is highlighted with checkmark
- Integrated into user avatar dropdown in sidebar
- Smooth theme transition without layout shift

## Data Models

### Course Model



```typescript
interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'Draft' | 'Published' | 'Archived';
  price: number;
  currency: string;
  instructorId: string;
  createdAt: Date;
  updatedAt: Date;
  lectureCount: number;
  studentCount: number;
  duration: number; // total minutes
}
```

**Status Badge Styling**:
- Draft: gray background, gray text
- Published: green background, green text
- Archived: orange background, orange text

### LiveClass Model

```typescript
interface LiveClass {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  courseName: string;
  instructorId: string;
  scheduledAt: Date;
  duration: number; // minutes
  status: 'Scheduled' | 'Live' | 'Completed' | 'Cancelled';
  meetingLink?: string;
  recordingLink?: string;
  attendeeCount?: number;
  maxAttendees?: number;
}
```

**Status Badge Styling**:
- Scheduled: blue background, blue text
- Live: green background, green text with pulsing dot
- Completed: gray background, gray text
- Cancelled: red background, red text

### Student Model

```typescript
interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  enrolledCourses: string[]; // course IDs
  enrolledAt: Date;
  lastActive: Date;
  totalProgress: number; // 0-100 average across all courses
  courseProgress: Record<string, number>; // courseId -> progress percentage
}
```

**Progress Bar Styling**:
- Background: gray-200 (light) / slate-700 (dark)
- Fill: gradient from blue to green based on percentage
- Height: 8px
- Border-radius: rounded-full
- Smooth animation on value change

### Submission Model

```typescript
interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  courseId: string;
  assignmentId: string;
  assignmentTitle: string;
  submittedAt: Date;
  status: 'Pending' | 'Graded' | 'Late';
  grade?: number;
  maxGrade: number;
  feedback?: string;
  attachments: string[]; // file URLs
}
```

**Status Badge Styling**:
- Pending: orange background, orange text
- Graded: green background, green text
- Late: red background, red text

### Notification Model

```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'course' | 'student' | 'system' | 'submission';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  link?: string;
  metadata?: Record<string, any>;
}
```

**Notification Item Styling**:
- Unread: blue-50 background (light) / slate-800 (dark) with blue dot indicator
- Read: white background (light) / slate-900 (dark)
- Hover: blue-100 background (light) / slate-700 (dark)
- Icon: type-specific (BookOpen for course, User for student, Bell for system, FileText for submission)

### Dashboard Metrics Model

```typescript
interface DashboardMetrics {
  totalCourses: number;
  totalStudents: number;
  totalLectures: number;
  completionRate: number; // 0-100
  trends: {
    courses: { value: number; direction: 'up' | 'down' };
    students: { value: number; direction: 'up' | 'down' };
    lectures: { value: number; direction: 'up' | 'down' };
    completionRate: { value: number; direction: 'up' | 'down' };
  };
}
```

## Page Implementations

### Dashboard Page

**Route**: `/dashboard`

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│ Welcome back, [Instructor Name]                     │
├─────────────────────────────────────────────────────┤
│ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐            │
│ │ Total│  │ Total│  │ Total│  │Compl.│            │
│ │Course│  │Stude.│  │Lectu.│  │ Rate │            │
│ └──────┘  └──────┘  └──────┘  └──────┘            │
├─────────────────────────────────────────────────────┤
│ Upcoming Live Classes                               │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Empty State or Class List]                     │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Quick Actions                                       │
│ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐            │
│ │Create│  │Upload│  │ View │  │Sched.│            │
│ │Course│  │Conte.│  │Submi.│  │Class │            │
│ └──────┘  └──────┘  └──────┘  └──────┘            │
└─────────────────────────────────────────────────────┘
```

**Components**:
- InstructorHeader with welcome message
- Grid of 4 StatCards (2x2 on mobile)
- Upcoming Live Classes section with EmptyState or list
- Quick Actions grid with 4 action cards

**Data Fetching**:
```typescript
async function getDashboardData() {
  const metrics = await fetchDashboardMetrics();
  const upcomingClasses = await fetchUpcomingLiveClasses({ limit: 5 });
  return { metrics, upcomingClasses };
}
```

### Manage Courses Page

**Route**: `/courses`

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│ My Courses                    [Create Course Button]│
├─────────────────────────────────────────────────────┤
│ [Search] [Category▼] [Level▼] [Status▼]            │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Course │ Category │ Level │ Status │ Price │... │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ [Course Data Rows]                              │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Components**:
- InstructorHeader with "My Courses" title and "Create Course" button
- Filter bar with search input and dropdown filters
- DataTable with course columns
- EmptyState when no courses exist

**Table Columns**:
1. Course (thumbnail + title)
2. Category
3. Level
4. Status (badge)
5. Price
6. Created Date
7. Actions (dropdown menu)

**Actions Menu**:
- Edit
- Duplicate
- View Analytics
- Archive/Unarchive
- Delete

### Live Classes Page

**Route**: `/live-classes`

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│ Live Classes              [Schedule New Class Button]│
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Class │ Course │ Schedule │ Duration │ Status │ │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ [Live Class Data Rows]                          │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Components**:
- InstructorHeader with "Live Classes" title and "Schedule New Class" button
- DataTable with live class columns
- EmptyState when no classes exist

**Table Columns**:
1. Class Details (icon + title)
2. Course
3. Schedule (date + time)
4. Duration
5. Status (badge with live indicator)
6. Actions (edit, delete, join link)

### Students Page

**Route**: `/students`

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│ Students                          [Export CSV Button]│
├─────────────────────────────────────────────────────┤
│ [Select Course▼] [Search]                           │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Student │ Email │ Enrolled │ Progress │ Active │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ [Student Data Rows]                             │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Components**:
- InstructorHeader with "Students" title and "Export CSV" button
- Course dropdown filter and search input
- DataTable with student columns
- EmptyState when no course selected or no students

**Table Columns**:
1. Student (avatar + name)
2. Email
3. Enrollment Date
4. Progress (percentage + bar)
5. Last Active
6. Actions (view profile, message)

### Submissions Page

**Route**: `/submissions`

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│ Submissions Review                                   │
├─────────────────────────────────────────────────────┤
│ [Select Course▼] [Search]                           │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Student │ Assignment │ Submitted │ Status │ ... │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ [Submission Data Rows]                          │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Components**:
- InstructorHeader with "Submissions Review" title
- Course dropdown filter and search input
- DataTable with submission columns
- EmptyState when no course selected or no submissions

**Table Columns**:
1. Student (avatar + name)
2. Assignment
3. Submitted Date
4. Status (badge)
5. Grade
6. Actions (view, grade)

### Notifications Page

**Route**: `/notifications`

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│ Notifications                            [Filter▼]  │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Icon] Notification Title              [Time]   │ │
│ │        Notification description                 │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ [More Notification Items]                       │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Components**:
- InstructorHeader with "Notifications" title and filter dropdown
- Notification list with items
- EmptyState when no notifications

**Notification Item**:
- Icon (type-specific)
- Title (bold)
- Description
- Timestamp (relative, e.g., "2 hours ago")
- Unread indicator (blue dot)
- Click to mark as read and navigate

### Upload Content Page

**Route**: `/upload`

**Layout**:
```
┌─────────────────────────────────────────────────────┐
│ Upload Video Lecture                                 │
├─────────────────────────────────────────────────────┤
│ [Select Course▼]                                     │
├─────────────────────────────────────────────────────┤
│ Upload Steps:                                        │
│ 1. Select the course                                 │
│ 2. Choose or drag video file                         │
│ 3. Add lecture title and description                 │
│ 4. Upload and process                                │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ │     Drag and drop video file here               │ │
│ │     or click to browse                          │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Components**:
- InstructorHeader with "Upload Video Lecture" title
- Course dropdown selector
- Step-by-step guide list
- Drag-and-drop file upload area
- Progress bar during upload
- Success/error messages

## Responsive Design Strategy

### Breakpoints



```typescript
const breakpoints = {
  sm: '640px',   // Small devices (phones)
  md: '768px',   // Medium devices (tablets)
  lg: '1024px',  // Large devices (laptops)
  xl: '1280px',  // Extra large devices (desktops)
  '2xl': '1536px', // 2X large devices (large desktops)
};
```

### Mobile Adaptations (<768px)

**Sidebar**:
- Transforms to overlay with backdrop
- Triggered by hamburger menu button in header
- Slides in from left with animation
- Closes on backdrop click or navigation

**DataTable**:
- Converts to card layout
- Each row becomes a card with vertical layout
- Labels displayed inline with values
- Actions moved to card footer

**StatCards**:
- Stack vertically with full width
- Maintain same visual design
- Reduce padding slightly (16px instead of 24px)

**Header**:
- Title font size reduced (text-2xl instead of text-3xl)
- Action buttons may stack or use icon-only variants
- Hamburger menu button added on left

**Filters and Search**:
- Stack vertically with full width
- Dropdowns expand to full width
- Search input full width

### Tablet Adaptations (768px - 1024px)

**Sidebar**:
- Remains visible but can be collapsed to icon-only mode
- Width reduces to 240px

**StatCards**:
- 2x2 grid layout
- Slightly reduced padding

**DataTable**:
- Remains table layout
- Some columns may be hidden (show on hover/expand)
- Horizontal scroll if needed

### Desktop Optimizations (>1024px)

**Sidebar**:
- Full 280px width
- All features visible

**Content Area**:
- Maximum width constraint (1400px) with centered layout
- Generous padding (40px)

**StatCards**:
- 4-column grid layout
- Full padding and spacing

**DataTable**:
- All columns visible
- Optimal column widths
- Smooth hover effects

## Theme Implementation

### CSS Variables

```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 11%;
  --card-foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;
}
```

### Theme Provider Setup

```typescript
// app/providers.tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
```

### Theme Toggle Implementation

```typescript
// components/instructor/ThemeToggle.tsx
'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <span className="text-sm text-slate-700 dark:text-slate-300">
          Appearance
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
          {theme === 'light' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
          {theme === 'dark' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
          {theme === 'system' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Animation Strategy

### Page Transitions

```typescript
// Framer Motion variants for page load
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
};

// Usage in page component
<motion.div
  initial="initial"
  animate="animate"
  exit="exit"
  variants={pageVariants}
  transition={pageTransition}
>
  {/* Page content */}
</motion.div>
```

### Interactive Element Animations

```typescript
// Hover lift effect for cards and buttons
const hoverLift = {
  scale: 1.02,
  transition: { duration: 0.2, ease: 'easeInOut' },
};

// Usage
<motion.div whileHover={hoverLift}>
  {/* Card or button content */}
</motion.div>
```

### Loading States

```typescript
// Skeleton loader animation
const skeletonPulse = {
  animate: {
    opacity: [0.5, 1, 0.5],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

// Usage
<motion.div
  className="h-4 bg-gray-200 dark:bg-slate-700 rounded"
  {...skeletonPulse}
/>
```

### Notification Animations

```typescript
// Slide in from right for notifications
const notificationVariants = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 100, opacity: 0 },
};

// Usage in notification toast
<motion.div
  variants={notificationVariants}
  initial="initial"
  animate="animate"
  exit="exit"
  transition={{ duration: 0.3 }}
>
  {/* Notification content */}
</motion.div>
```

## Performance Optimization

### Code Splitting

```typescript
// Dynamic imports for heavy components
const CreateCourseModal = dynamic(
  () => import('@/components/instructor/CreateCourseModal'),
  { ssr: false, loading: () => <LoadingSpinner /> }
);

const AnalyticsChart = dynamic(
  () => import('@/components/instructor/AnalyticsChart'),
  { ssr: false }
);
```

### Image Optimization

```typescript
// Using Next.js Image component
import Image from 'next/image';

<Image
  src={course.thumbnail}
  alt={course.title}
  width={120}
  height={80}
  className="rounded-md object-cover"
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### Font Optimization

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

### Data Fetching Strategy

```typescript
// Server Components for initial data
async function CoursesPage() {
  const courses = await fetchCourses(); // Server-side fetch
  return <CoursesList initialData={courses} />;
}

// Client Components for interactive features
'use client';
function CoursesList({ initialData }) {
  const [courses, setCourses] = useState(initialData);
  // Client-side filtering, sorting, etc.
}
```

## Accessibility Features

### Keyboard Navigation

- All interactive elements accessible via Tab key
- Visible focus indicators (2px blue ring)
- Skip navigation link to main content
- Escape key closes modals and dropdowns
- Arrow keys navigate dropdown menus
- Enter/Space activate buttons and links

### Screen Reader Support

```typescript
// ARIA labels and roles
<button
  aria-label="Create new course"
  aria-describedby="create-course-description"
>
  <Plus className="h-4 w-4" />
  Create Course
</button>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {successMessage}
</div>

// Semantic HTML
<nav aria-label="Instructor navigation">
  <ul role="list">
    {navItems.map(item => (
      <li key={item.href}>
        <a href={item.href} aria-current={isActive ? 'page' : undefined}>
          {item.label}
        </a>
      </li>
    ))}
  </ul>
</nav>
```

### Color Contrast

All text meets WCAG 2.1 AA standards:
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+): 3:1 contrast ratio
- Interactive elements: 3:1 contrast ratio

### Focus Management

```typescript
// Trap focus in modals
import { useFocusTrap } from '@/hooks/useFocusTrap';

function Modal({ isOpen, onClose, children }) {
  const modalRef = useFocusTrap(isOpen);
  
  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
```

## Error Handling

### Error Boundaries

```typescript
// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Something went wrong
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### API Error Handling

```typescript
// lib/api.ts
export async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

### User-Facing Error Messages

```typescript
// components/ErrorMessage.tsx
interface ErrorMessageProps {
  title: string;
  message: string;
  retry?: () => void;
}

export function ErrorMessage({ title, message, retry }: ErrorMessageProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-4">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
            {title}
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            {message}
          </p>
          {retry && (
            <button
              onClick={retry}
              className="mt-3 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```



## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

The following properties define the correctness criteria for the instructor portal redesign. Each property is universally quantified and references the specific requirements it validates.

### Property 1: Theme Persistence Round-Trip

*For any* theme selection (light, dark, or system), when a user selects a theme, stores it, and then retrieves it from localStorage, the retrieved theme SHALL be identical to the selected theme.

**Validates: Requirements 2.7**

### Property 2: Theme Switching Correctness

*For any* theme selection (light, dark, or system), when a user switches to that theme, all UI elements SHALL apply the correct color scheme defined in the design system for that theme without exceptions.

**Validates: Requirements 2.2, 2.3**

### Property 3: Layout Stability During Theme Changes

*For any* page in the instructor portal, when the theme changes from light to dark or dark to light, the layout dimensions (width, height, positioning) of all major structural elements (sidebar, header, content area, cards) SHALL remain identical before and after the theme change.

**Validates: Requirements 2.4**

### Property 4: Interactive Element Hover States

*For any* interactive element (navigation items, table rows, buttons, cards), when the element receives a hover event, the element SHALL apply the appropriate hover styling (background color change, scale transform, or other defined hover effect) as specified in the design system.

**Validates: Requirements 3.7, 5.6**

### Property 5: Active Navigation Highlighting

*For any* navigation item in the sidebar, when that navigation item corresponds to the current active route, the navigation item SHALL display with blue background (#2563EB) and white text, and all other navigation items SHALL NOT display with active styling.

**Validates: Requirements 3.6**

### Property 6: Empty State Rendering Pattern

*For any* data-driven component (course list, live classes list, student list, submissions list, notifications list), when the component's data source is empty or no filter selection has been made, the component SHALL render an EmptyState component with appropriate icon, title, subtitle, and optional call-to-action button instead of rendering an empty table or list.

**Validates: Requirements 4.3, 5.9, 6.8, 7.6, 8.6, 8.9, 10.8, 10.9**

### Property 7: File Upload Validation

*For any* file selected for upload in the Upload Content page, when the file is validated before upload, the system SHALL reject files that do not meet the specified criteria (file type, file size limits) and SHALL display an appropriate error message indicating why the file was rejected.

**Validates: Requirements 9.7**

### Property 8: Component Theme Support

*For any* reusable component in the component library (InstructorSidebar, InstructorHeader, StatCard, DataTable, EmptyState, ThemeToggle), when the theme changes between light and dark modes, the component SHALL render correctly with appropriate colors and styling for the active theme without requiring component remounting or prop changes.

**Validates: Requirements 11.10**

### Property 9: Responsive Sidebar Transformation

*For any* viewport width, when the viewport width crosses the mobile breakpoint threshold (768px), the sidebar SHALL transform between its desktop state (permanently visible, 280px width) and mobile state (overlay with backdrop) appropriately based on whether the viewport is above or below the breakpoint.

**Validates: Requirements 3.8, 12.1, 12.2**

### Property 10: Data Table Responsive Transformation

*For any* DataTable component, when the viewport width is below the mobile breakpoint (768px), the table SHALL transform from table layout to card layout, and when the viewport width is at or above the mobile breakpoint, the table SHALL display in table layout.

**Validates: Requirements 5.10, 6.9, 8.10, 10.10, 12.3**

## Error Handling

### Client-Side Error Handling

**Error Boundaries**: Wrap all major page sections in error boundaries to catch and handle React component errors gracefully. Display user-friendly error messages with retry options instead of crashing the entire application.

**API Error Handling**: Implement consistent error handling for all API calls:
- Network errors: Display "Unable to connect" message with retry button
- 4xx errors: Display specific error message from API response
- 5xx errors: Display "Server error" message with retry button
- Timeout errors: Display "Request timed out" message with retry button

**Form Validation Errors**: Display inline validation errors next to form fields with clear, actionable messages. Use red color scheme for error states while maintaining accessibility contrast ratios.

**File Upload Errors**: Provide specific error messages for upload failures:
- File too large: "File size exceeds maximum limit of X MB"
- Invalid file type: "Only video files (.mp4, .mov, .avi) are supported"
- Upload failed: "Upload failed. Please try again"
- Network interrupted: "Upload interrupted. Resume upload?"

### User Feedback Patterns

**Loading States**: Display skeleton loaders that match the expected content layout during data fetching. Use subtle pulse animation to indicate loading progress.

**Success Messages**: Display green toast notifications for successful actions (course created, content uploaded, submission graded) that auto-dismiss after 3 seconds.

**Error Messages**: Display red toast notifications or inline error messages for failed actions that require user dismissal or action.

**Confirmation Dialogs**: Require explicit confirmation for destructive actions (delete course, remove student, cancel live class) with clear descriptions of consequences.

### Offline Handling

**Network Detection**: Detect when the user goes offline and display a persistent banner at the top of the page indicating offline status.

**Graceful Degradation**: When offline, disable actions that require network connectivity and display appropriate messaging. Allow viewing of cached data when available.

**Retry Logic**: Implement automatic retry with exponential backoff for failed API requests. Provide manual retry buttons for user-initiated retries.

## Testing Strategy

### Dual Testing Approach

The instructor portal redesign requires both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points:
- Component rendering with specific props
- User interaction flows (click, hover, form submission)
- Edge cases (empty data, maximum data, special characters)
- Error conditions (API failures, validation errors)
- Integration between components

**Property-Based Tests**: Focus on universal properties across all inputs:
- Theme switching and persistence across all theme combinations
- Layout stability across all viewport sizes
- Hover states across all interactive elements
- Empty state rendering across all data-driven components
- File validation across all file types and sizes
- Responsive transformations across all breakpoints

### Property-Based Testing Configuration

**Library Selection**: Use `@fast-check/vitest` for TypeScript/React property-based testing, which integrates seamlessly with Vitest test runner.

**Test Configuration**:
- Minimum 100 iterations per property test to ensure comprehensive input coverage
- Each property test must include a comment tag referencing the design document property
- Tag format: `// Feature: instructor-portal-redesign, Property {number}: {property_text}`

**Example Property Test Structure**:
```typescript
import { test } from 'vitest';
import * as fc from 'fast-check';

// Feature: instructor-portal-redesign, Property 1: Theme Persistence Round-Trip
test('theme selection persists correctly in localStorage', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('light', 'dark', 'system'),
      (theme) => {
        // Store theme
        localStorage.setItem('theme', theme);
        
        // Retrieve theme
        const retrieved = localStorage.getItem('theme');
        
        // Assert round-trip equality
        expect(retrieved).toBe(theme);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Component Tests**: Test each reusable component in isolation:
- Render with various prop combinations
- Test user interactions (clicks, hovers, keyboard navigation)
- Test accessibility features (ARIA labels, keyboard focus)
- Test theme switching behavior

**Page Tests**: Test each page component:
- Render with mock data
- Test empty states
- Test loading states
- Test error states
- Test responsive behavior at key breakpoints

**Integration Tests**: Test component interactions:
- Sidebar navigation updates active route
- Theme toggle updates all components
- Filter changes update table data
- Form submissions trigger API calls

### Testing Tools

- **Test Runner**: Vitest for fast, modern testing
- **Component Testing**: React Testing Library for user-centric tests
- **Property Testing**: @fast-check/vitest for property-based tests
- **Accessibility Testing**: jest-axe for automated accessibility checks
- **Visual Regression**: Chromatic or Percy for visual diff testing
- **E2E Testing**: Playwright for end-to-end user flows

### Test Coverage Goals

- Unit test coverage: >80% for components and utilities
- Property test coverage: 100% of defined correctness properties
- Integration test coverage: All critical user flows
- Accessibility test coverage: All interactive components
- Visual regression coverage: All pages in light and dark themes

