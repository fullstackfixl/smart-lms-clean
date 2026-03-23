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
  BookOpen,
  Menu,
  X,
  FileText,
  Bell,
  Calendar,
  ClipboardList,
  Target,
  Award,
  MessageSquare,
  Clock,
  ScrollText,
  TrendingUp,
  User,
  ChevronRight,
  Book,
  Layers,
} from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { useChatUnread } from '../../hooks/useChatUnread'
import { cn } from '../../lib/utils'
import { UserAvatar } from '../ui/UserAvatar'

interface NavItem {
  label: string
  href: string
  icon: any
  collegeOnly?: boolean
  description?: string
  section?: 'learning' | 'academics' | 'engagement' | 'records'
}

const navItems: NavItem[] = [
  { section: 'learning', label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard, description: 'Overview' },
  { section: 'learning', label: 'My Courses', href: '/student/courses', icon: BookOpen, description: 'Enrolled courses' },
  { section: 'learning', label: 'Live Classes', href: '/student/live-classes', icon: Video, description: 'Join sessions' },
  { section: 'learning', label: 'Timetable', href: '/student/timetable', icon: Calendar, collegeOnly: true, description: 'Class schedule' },

  { section: 'academics', label: 'My Subjects', href: '/student/my-subjects', icon: ScrollText, collegeOnly: true, description: 'Subject materials' },
  { section: 'academics', label: 'Assignments', href: '/student/assignments', icon: FileText, description: 'Submit work' },
  { section: 'academics', label: 'Quizzes & Tests', href: '/student/quizzes', icon: ClipboardList, description: 'Assessments' },
  { section: 'academics', label: 'Attendance', href: '/student/attendance', icon: Clock, collegeOnly: true, description: 'Track attendance' },

  { section: 'engagement', label: 'Grades', href: '/student/grades', icon: TrendingUp, description: 'View marks' },
  { section: 'engagement', label: 'Exams', href: '/student/exams', icon: Target, collegeOnly: true, description: 'Exam schedule' },
  { section: 'engagement', label: 'Results', href: '/student/results', icon: Award, collegeOnly: true, description: 'Exam results' },
  { section: 'engagement', label: 'Messages', href: '/student/messages', icon: MessageSquare, description: 'Communicate' },
  { section: 'engagement', label: 'Notifications', href: '/student/notifications', icon: Bell, description: 'Updates' },

  { section: 'records', label: 'Transcript', href: '/student/transcript', icon: ScrollText, collegeOnly: true, description: 'Academic record' },
  { section: 'records', label: 'Certificates', href: '/student/certificates', icon: Award, description: 'Achievements' },
  { section: 'records', label: 'Events', href: '/student/events', icon: Calendar, description: 'College events' },
]

export function StudentSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout, organization } = useAuth()
  const { unreadCount } = useChatUnread()

  // Get student batch info for filtering
  const studentBatch = user?.batchId || user?.profile?.batchId
  const studentProgram = user?.programId || user?.profile?.programId
  const isCollege = String(user?.organizationType || '').toUpperCase() === 'COLLEGE'

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white border-r border-gray-200">
      {/* Header / Logo */}
      <div className="flex h-16 items-center border-b border-gray-100 px-6">
        <Link href="/student/dashboard" className="flex items-center gap-3">
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-slate-900">
              {organization?.name || 'SmartLMS'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Student Portal</span>
          </div>
        </Link>
      </div>

      {/* Student Info Card */}
      {isCollege && studentBatch && (
        <div className="mx-4 mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-lg">
          <div className="flex items-center gap-2">
            <UserAvatar 
              name={user?.profile?.firstName || user?.name} 
              src={user?.profilePicture} 
              size="sm" 
            />
            <span className="text-sm font-semibold text-green-800">{user?.profile?.firstName || user?.name}</span>
          </div>
          <div className="mt-2 text-xs text-green-700 space-y-0.5">
            <p>Batch: {studentBatch?.name || studentBatch?.code || 'N/A'}</p>
            {studentProgram && <p>Program: {studentProgram?.name || studentProgram?.code}</p>}
          </div>
        </div>
      )}

      {/* Primary Navigation */}
      <nav className="mt-4 flex-1 space-y-6 px-3 overflow-y-auto custom-scrollbar pb-6">
        {(['learning', 'academics', 'engagement', 'records'] as const).map((section) => {
          const items = navItems
            .filter((i) => i.section === section)
            .filter((i) => !i.collegeOnly || isCollege)
          if (!items.length) return null

          const title =
            section === 'learning' ? 'My Learning' :
            section === 'academics' ? 'Academics' :
            section === 'engagement' ? 'Activity' :
            'Records'

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
                          ? "bg-green-50 text-green-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "mr-3 h-4 w-4 stroke-[2]",
                          isActive ? "text-green-700" : "text-slate-400 group-hover:text-slate-700"
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.label === 'Messages' && unreadCount > 0 && (
                        <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                      )}
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all",
                          isActive && "opacity-100 text-green-300"
                        )}
                      />
                      {isActive && (
                        <div className="absolute -left-3 h-6 w-1 rounded-r-full bg-green-600" />
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
          href="/student/profile"
          className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50 hover:text-slate-900"
        >
          <UserAvatar 
            name={user?.name} 
            src={user?.profilePicture} 
            size="xs" 
            className="mr-3"
          />
          My Profile
        </Link>
        <Link
          href="/student/settings"
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
        <Link href="/student/dashboard" className="flex items-center gap-3">
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
            <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center">
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
