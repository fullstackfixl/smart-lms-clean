const PLATFORM_PERMISSION_CATALOG = [
  {
    key: 'global_visibility',
    title: 'Global Visibility',
    description: 'Read access across every tenant for debugging, support, and governance.',
    permissions: [
      'View all organizations',
      'View all instructors',
      'View all students',
      'View all courses',
      'View all quizzes',
      'View all live classes',
      'View all assignments',
      'View all attendance records',
      'View all certificates',
      'View all discussions',
      'View all analytics',
      'View platform as organization'
    ]
  },
  {
    key: 'organization_governance',
    title: 'Organization Governance',
    description: 'Provision, suspend, and manage tenant-level services.',
    permissions: [
      'Create organization',
      'Edit organization',
      'Suspend organization',
      'Delete organization',
      'Assign organization admin',
      'Change organization type',
      'Toggle organization services'
    ]
  },
  {
    key: 'role_permission_engine',
    title: 'Role & Permission Engine',
    description: 'Define custom roles and selectively enable or disable capabilities.',
    permissions: [
      'Create custom roles',
      'Create Course',
      'Create Quiz',
      'Create Assignment',
      'Start Live Class',
      'Mark Attendance',
      'Grade Assignment',
      'Issue Certificate',
      'Enable / Disable permission globally'
    ]
  },
  {
    key: 'user_governance',
    title: 'User Governance',
    description: 'Manage users globally across organizations and academic structures.',
    permissions: [
      'Create user',
      'Edit user',
      'Delete user',
      'Suspend user',
      'Reset password',
      'Force logout',
      'Assign role',
      'Move user between organizations',
      'Assign Instructor → Org → Course → Batch',
      'Assign Student → Org → Program → Batch'
    ]
  },
  {
    key: 'academic_structure',
    title: 'Program / Course Infrastructure',
    description: 'Control the reusable academic hierarchy used by organizations.',
    permissions: [
      'Create program templates',
      'Define course structures',
      'Define batch rules',
      'Define grading policies',
      'Define certificate rules'
    ]
  },
  {
    key: 'marketplace',
    title: 'Marketplace Control',
    description: 'Govern course listings, instructor visibility, and revenue share.',
    permissions: [
      'Approve course listing',
      'Reject courses',
      'Feature courses',
      'Ban instructors',
      'Set revenue share'
    ]
  },
  {
    key: 'observability',
    title: 'Activity & Audit',
    description: 'Track platform events and cross-tenant operations in real time.',
    permissions: [
      'View activity logs',
      'View audit logs',
      'View real-time platform feed',
      'Inspect who created / deleted / graded / changed permissions'
    ]
  },
  {
    key: 'analytics',
    title: 'Global Analytics',
    description: 'Monitor platform health, usage, and engagement at scale.',
    permissions: [
      'View total organizations',
      'View total students',
      'View total instructors',
      'View total courses',
      'View total live classes',
      'View total quizzes',
      'View total assignments',
      'View active users',
      'View top organizations',
      'View top instructors',
      'View most enrolled courses'
    ]
  },
  {
    key: 'profiles_moderation',
    title: 'Profiles & Moderation',
    description: 'Inspect identities and maintain platform quality.',
    permissions: [
      'View instructor profiles',
      'View student profiles',
      'Delete inappropriate course',
      'Delete discussions',
      'Ban instructor',
      'Suspend student',
      'Remove course from marketplace'
    ]
  },
  {
    key: 'certificate_authority',
    title: 'Certificate Authority',
    description: 'Own the certification lifecycle from templates to revocation.',
    permissions: [
      'Create certificate templates',
      'Approve certificates',
      'Revoke certificates',
      'Track issued certificates'
    ]
  },
  {
    key: 'system_configuration',
    title: 'System Configuration',
    description: 'Control platform-wide infrastructure and integration settings.',
    permissions: [
      'Email service',
      'Video provider',
      'Storage limits',
      'API keys',
      'Authentication settings',
      'File upload limits'
    ]
  },
  {
    key: 'data_governance',
    title: 'Data Governance',
    description: 'Export, archive, and recover enterprise data safely.',
    permissions: [
      'Export organization data',
      'Backup database',
      'Restore data',
      'Archive courses',
      'Delete inactive accounts'
    ]
  }
];

const DEFAULT_FEATURE_TOGGLES = {
  liveClasses: true,
  assignments: true,
  quizzes: true,
  attendance: true,
  certificates: true,
  discussionForums: true,
  aiTutor: true,
  marketplace: true,
  analytics: true,
  gamification: true,
  messaging: true,
  webinars: false,
  advanced_analytics: true,
  ai_tools: true
};

const ORGANIZATION_TYPES = [
  { value: 'college', label: 'College' },
  { value: 'school', label: 'School' },
  { value: 'institute', label: 'Institute' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'coaching', label: 'Coaching' }
];

const ORGANIZATION_SERVICE_FLAGS = [
  { key: 'liveClasses', label: 'Live Classes' },
  { key: 'quizzes', label: 'Quiz System' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'certificates', label: 'Certificates' },
  { key: 'discussionForums', label: 'Discussion Forums' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'aiTutor', label: 'AI Tutor' }
];

const PLATFORM_SIDEBAR_SECTIONS = [
  { label: 'Dashboard', href: '/platform/dashboard' },
  { label: 'Organizations', href: '/platform/organizations' },
  { label: 'Users', href: '/platform/users' },
  { label: 'Roles & Permissions', href: '/platform/config/roles' },
  { label: 'Courses', href: '/platform/courses' },
  { label: 'Marketplace', href: '/platform/billing' },
  { label: 'Feature Toggles', href: '/platform/settings' },
  { label: 'Activity Feed', href: '/platform/audit-logs' },
  { label: 'Analytics', href: '/platform/analytics' },
  { label: 'Moderation', href: '/platform/reports' },
  { label: 'Certificates', href: '/platform/certificates' },
  { label: 'Audit Logs', href: '/platform/audit-logs' },
  { label: 'System Settings', href: '/platform/settings' }
];

const PLATFORM_PERMISSION_KEYS = PLATFORM_PERMISSION_CATALOG.flatMap(group => group.permissions);

const ROLE_PERMISSION_MATRIX = {
  platform_admin: PLATFORM_PERMISSION_KEYS,
  platform_staff: [
    'View all organizations',
    'View all instructors',
    'View all students',
    'View all courses',
    'View all quizzes',
    'View all live classes',
    'View all assignments',
    'View all attendance records',
    'View all certificates',
    'View all discussions',
    'View all analytics',
    'View platform as organization',
    'View activity logs',
    'View audit logs',
    'View real-time platform feed',
    'View total organizations',
    'View total students',
    'View total instructors',
    'View total courses',
    'View active users'
  ],
  org_admin: [
    'Create organization',
    'Edit organization',
    'Toggle organization services',
    'Create user',
    'Edit user',
    'Assign role',
    'Create Course',
    'Create Quiz',
    'Create Assignment',
    'Start Live Class',
    'Mark Attendance',
    'Grade Assignment',
    'Issue Certificate'
  ],
  instructor: [
    'Create Course',
    'Create Quiz',
    'Create Assignment',
    'Start Live Class',
    'Mark Attendance',
    'Grade Assignment'
  ],
  student: [
    'View all courses',
    'View all quizzes',
    'View all live classes',
    'View all assignments',
    'View all certificates'
  ]
};

module.exports = {
  PLATFORM_PERMISSION_CATALOG,
  DEFAULT_FEATURE_TOGGLES,
  ORGANIZATION_TYPES,
  ORGANIZATION_SERVICE_FLAGS,
  PLATFORM_SIDEBAR_SECTIONS,
  PLATFORM_PERMISSION_KEYS,
  ROLE_PERMISSION_MATRIX
};
