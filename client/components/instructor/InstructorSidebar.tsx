"use client"
 
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Video,
  Settings,
  LogOut,
  GraduationCap,
  Users,
  Menu,
  X,
  FileText,
  Bell,
  BarChart3,
  Calendar,
  ClipboardList,
  Book,
  ChevronRight,
  Layers,
  Target,
  Activity,
  MessageSquare,
} from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { cn } from '../../lib/utils'
 
interface NavItem {
  label: string
  href: string
  icon: any
  collegeOnly?: boolean
  description?: string
  section?: 'core' | 'academics' | 'engagement' | 'reports'
}
 
const navItems: NavItem[] = [
  { section: 'core', label: 'Dashboard', href: '/instructor/dashboard', icon: LayoutDashboard, description: 'Overview' },
  { section: 'core', label: 'Courses', href: '/instructor/courses', icon: Layers, description: 'Create & manage' },
  { section: 'core', label: 'Students', href: '/instructor/students', icon: Users, description: 'Progress & engagement' },
  { section: 'core', label: 'Live Classes', href: '/instructor/live-classes', icon: Video, description: 'Schedule & host' },

  { section: 'academics', label: 'My Subjects', href: '/instructor/subjects', icon: Book, collegeOnly: true, description: 'College academics' },
  { section: 'academics', label: 'Gradebook', href: '/instructor/gradebook', icon: Target, collegeOnly: true, description: 'Marks & grading' },
  { section: 'academics', label: 'Attendance', href: '/instructor/attendance', icon: Calendar, collegeOnly: true, description: 'Track attendance' },

  { section: 'engagement', label: 'Quizzes', href: '/instructor/quiz', icon: ClipboardList, description: 'Assessments' },
  { section: 'engagement', label: 'Submissions', href: '/instructor/submissions', icon: FileText, description: 'Review work' },
  { section: 'engagement', label: 'Messages', href: '/instructor/messages', icon: MessageSquare, description: 'Communicate' },
  { section: 'engagement', label: 'Notifications', href: '/instructor/notifications', icon: Bell, description: 'Updates' },

  { section: 'reports', label: 'Analytics', href: '/instructor/analytics', icon: BarChart3, description: 'Performance' },
  { section: 'reports', label: 'Earnings', href: '/instructor/earnings', icon: Activity, description: 'Payouts' },
]
 
export function InstructorSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout, organization } = useAuth()
 
  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white border-r border-gray-200">
      {/* Header / Logo */}
      <div className="flex h-16 items-center border-b border-gray-100 px-6">
        <Link href="/instructor/dashboard" className="flex items-center gap-3">
          {organization?.branding?.logo || (organization as any)?.logo_url ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={(organization?.branding?.logo || (organization as any)?.logo_url) as string}
                alt="Organization logo"
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
          )}
          <span className="text-xl font-black tracking-tight text-slate-900">
            {organization?.name || 'SmartLMS'}
          </span>
        </Link>
      </div>

      {/* Primary Navigation */}
      <nav className="mt-6 flex-1 space-y-6 px-3 overflow-y-auto custom-scrollbar pb-6">
        {(['core', 'academics', 'engagement', 'reports'] as const).map((section) => {
          const items = navItems
            .filter((i) => i.section === section)
            .filter((i) => !i.collegeOnly || String(user?.organizationType || '').toUpperCase() === 'COLLEGE')
          if (!items.length) return null

          const title =
            section === 'core' ? 'Teaching' :
            section === 'academics' ? 'College' :
            section === 'engagement' ? 'Engagement' :
            'Reports'

          return (
            <div key={section} className="space-y-2">
              <div className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {title}
              </div>
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-150",
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-4 w-4 stroke-[2]",
                          isActive ? "text-blue-700" : "text-slate-400 group-hover:text-slate-700"
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all",
                          isActive && "opacity-100 text-blue-300"
                        )}
                      />
                      {isActive && (
                        <div className="absolute -left-3 h-6 w-1 rounded-r-full bg-blue-600" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-gray-100 p-4 space-y-1">
        <Link
          href="/instructor/settings"
          className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50 hover:text-slate-900"
        >
          <Settings className="mr-3 h-4 w-4 stroke-[1.5]" />
          Settings
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut className="mr-3 h-4 w-4 stroke-[1.5]" />
          Log out
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:block w-[220px] h-screen shrink-0 sticky top-0">
        <SidebarContent />
      </aside>

      <div className="fixed left-0 right-0 top-0 z-[60] flex items-center justify-between bg-white px-6 py-4 lg:hidden border-b border-gray-200">
        <Link href="/instructor/dashboard" className="flex items-center gap-3">
          {organization?.branding?.logo || (organization as any)?.logo_url ? (
            <div className="h-10 w-10 rounded-lg bg-white border border-gray-200 overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={(organization?.branding?.logo || (organization as any)?.logo_url) as string}
                alt="Organization logo"
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
          )}
          <span className="text-xl font-bold text-slate-900">{organization?.name || 'SmartLMS'}</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 bg-gray-50 text-slate-600 hover:text-slate-900 border border-gray-200"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -220 }}
              animate={{ x: 0 }}
              exit={{ x: -220 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-[70] h-screen w-[220px] lg:hidden overflow-hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
