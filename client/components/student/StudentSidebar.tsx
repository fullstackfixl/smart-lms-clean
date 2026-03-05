import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
interface NavItem {
  label: string
  href: string
  icon: any
  module?: string
  collegeOnly?: boolean
}
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  Award,
  Trophy,
  Calendar,
  CalendarDays,
  GraduationCap,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Video,
  ClipboardCheck,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from '../../lib/utils'
import { useAuth } from '../../lib/auth-context'

const navItems = [
  { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Browse Courses', href: '/student/available-courses', icon: GraduationCap, module: 'COURSES' },
  { label: 'My Courses', href: '/student/my-courses', icon: BookOpen, module: 'COURSES' },
  { label: 'Live Classes', href: '/student/live-classes', icon: Video },
  { label: 'Quizzes', href: '/student/quizzes', icon: FileQuestion },
  { label: 'Certificates', href: '/student/certificates', icon: Award, module: 'CERTIFICATES' },
  { label: 'Leaderboard', href: '/student/leaderboard', icon: Trophy, module: 'LEADERBOARDS' },
  { label: 'Timetable', href: '/student/timetable', icon: Calendar, module: 'TIMETABLE' },
  { label: 'Attendance', href: '/student/attendance', icon: ClipboardCheck, collegeOnly: true },
  { label: 'Events', href: '/student/events', icon: CalendarDays, module: 'EVENTS' },
  { label: 'Academic Transcript', href: '/student/transcript', icon: GraduationCap, collegeOnly: true },
]

export function StudentSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const filteredItems = navItems.filter(item => {
    if (item.module && !user?.modulesEnabled?.includes(item.module)) {
      return false
    }
    if (item.collegeOnly && user?.organizationType !== 'COLLEGE') {
      return false
    }
    return true
  })

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/50">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800/50">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/20">
          <BookOpen className="h-6 w-6 text-white" />
          <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-blue-500 ring-2 ring-slate-900" />
        </div>
        <div>
          <span className="text-lg font-bold text-slate-100">
            Smart<span className="text-emerald-500">LMS</span>
          </span>
          <p className="text-[10px] font-medium text-slate-500">Learner Portal</p>
        </div>
      </div>

      {/* User Profile */}
      {user && (
        <div className="mx-4 mt-4 rounded-xl border border-slate-800/50 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-base font-bold text-white shadow-md">
              {user.name?.charAt(0) || 'S'}
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-green-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-100">{user.name}</p>
              <p className="truncate text-xs text-emerald-500/80 font-medium">Student</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <div className="flex flex-col gap-1">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 text-emerald-500 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabStudent"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 border border-emerald-500/20"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon
                  className={cn(
                    'relative z-10 h-5 w-5 shrink-0 transition-transform duration-200',
                    isActive ? 'scale-110 text-emerald-500' : 'group-hover:scale-105'
                  )}
                />
                <span className="relative z-10">{item.label}</span>
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-l-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-slate-800/50 p-4">
        <Link
          href="/student/profile"
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
            pathname === '/student/profile'
              ? 'bg-slate-800 text-slate-100'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
          )}
        >
          <User className="h-5 w-5" />
          <span>Profile</span>
        </Link>
        <button
          onClick={() => logout()}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-[60] p-2 rounded-lg bg-white border border-slate-200 shadow-sm"
      >
        <Menu className="h-6 w-6 text-slate-600" />
      </button>

      <aside className="hidden md:block fixed left-0 top-0 h-screen w-[240px] z-50">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", damping: 20, stiffness: 150 }}
              className="md:hidden fixed left-0 top-0 h-screen w-[240px] z-[80]"
            >
              <SidebarContent />
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 -right-12 p-2 rounded-full bg-white shadow-lg md:hidden"
              >
                <X className="h-6 w-6 text-slate-600" />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
