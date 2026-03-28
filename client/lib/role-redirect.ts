/**
 * Get dashboard route based on user role
 */
export function getDashboardRoute(role: string): string {
  switch (role) {
    case 'student':
      return '/student/dashboard'
    case 'public_student':
      return '/public/dashboard'
    case 'instructor':
      return '/instructor/dashboard'
    case 'org_admin':
    case 'organization_admin':
      return '/org-admin/dashboard'
    case 'platform_admin':
      return '/platform/dashboard'
    case 'platform_staff':
      return '/platform-staff/dashboard'
    case 'parent':
      return '/parent/dashboard'
    case 'support_staff':
      return '/support/dashboard'
    default:
      return '/student/dashboard'
  }
}

/**
 * Redirect to role-based dashboard
 */
export function redirectToDashboard(role: string) {
  if (typeof window !== 'undefined') {
    window.location.href = getDashboardRoute(role)
  }
}
