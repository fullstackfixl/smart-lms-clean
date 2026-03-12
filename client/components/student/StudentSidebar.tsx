"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  LogOut,
  Menu,
  X,
  Video,
  Users,
  Zap,
  ChevronRight,
  Book,
  ClipboardCheck,
  FileSpreadsheet
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from '../../lib/utils'
import { useAuth } from '../../lib/auth-context'

const navGroups = [
  {
    label: "Learning",
    items: [
      { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
      { label: 'My Subjects', href: '/student/subjects', icon: Book, collegeOnly: true },
      { label: 'Browse Courses', href: '/student/available-courses', icon: GraduationCap, module: 'COURSES' },
      { label: 'My Courses', href: '/student/my-courses', icon: BookOpen, module: 'COURSES' },
      { label: 'Live Classes', href: '/student/live-classes', icon: Video },
      { label: 'Quizzes', href: '/student/quizzes', icon: FileQuestion },
    ]
  },
  {
    label: "Progress",
    items: [
      { label: 'Certificates', href: '/student/certificates', icon: Award, module: 'CERTIFICATES' },
      { label: 'Leaderboard', href: '/student/leaderboard', icon: Trophy, module: 'LEADERBOARDS' },
      { label: 'Attendance', href: '/student/attendance', icon: Users },
      { label: 'Exams', href: '/student/exams', icon: ClipboardCheck, collegeOnly: true },
      { label: 'Results', href: '/student/results', icon: FileSpreadsheet, collegeOnly: true },
      { label: 'Transcript', href: '/student/transcript', icon: GraduationCap, collegeOnly: true },
    ]
  },
  {
    label: "Schedule",
    items: [
      { label: 'Timetable', href: '/student/timetable', icon: Calendar, module: 'TIMETABLE' },
      { label: 'Events', href: '/student/events', icon: CalendarDays, module: 'EVENTS' },
    ]
  },
]

export function StudentSidebar() {
  const pathname = usePathname()
  const { user, logout, organization } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const isItemVisible = (item: any) => {
    if (item.module && !user?.modulesEnabled?.includes(item.module)) return false
    if (item.collegeOnly && String(user?.organizationType || '').toUpperCase() !== 'COLLEGE') return false
    return true
  }

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'S'

  const SidebarContent = () => (
    <div className="flex h-full flex-col" style={{ background: 'linear-gradient(180deg, #0a0f1e 0%, #0d1117 100%)' }}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        {organization?.branding?.logo || (organization as any)?.logo_url ? (
          <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={(organization?.branding?.logo || (organization as any)?.logo_url) as string}
              alt="Organization logo"
              className="h-full w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25 shrink-0">
            <Zap className="h-5 w-5 text-white" fill="white" />
          </div>
        )}
        <div>
          <span className="text-[15px] font-bold tracking-tight text-white">
            {organization?.name ? (
              <>
                {organization.name}
              </>
            ) : (
              <>
                Smart<span className="text-emerald-400">LMS</span>
              </>
            )}
          </span>
          <p className="text-[10px] font-medium text-slate-500 -mt-0.5">Learner Portal</p>
        </div>
      </div>

      {/* User Avatar Card */}
      {user && (
        <div className="mx-3 mt-4 rounded-xl p-3" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(20,184,166,0.05) 100%)', border: '1px solid rgba(16,185,129,0.12)' }}>
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-md shrink-0">
              {initials}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#0a0f1e]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-slate-100">{user.name}</p>
              <p className="text-[10px] font-medium text-emerald-400/80">Student</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scroll-thin">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(isItemVisible)
          if (visibleItems.length === 0) return null
          return (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">{group.label}</p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/student/dashboard' && pathname.startsWith(item.href))
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                        isActive
                          ? 'text-emerald-400'
                          : 'text-slate-500 hover:text-slate-200 hover:bg-white/4'
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeStudent"
                          className="absolute inset-0 rounded-xl"
                          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(20,184,166,0.08) 100%)', border: '1px solid rgba(16,185,129,0.2)' }}
                          transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                        />
                      )}
                      <Icon className={cn('relative z-10 h-4 w-4 shrink-0 transition-all', isActive ? 'text-emerald-400 scale-110' : 'group-hover:scale-105')} />
                      <span className="relative z-10">{item.label}</span>
                      {isActive && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-l-full" />
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
      <div className="border-t border-white/5 p-3 space-y-0.5">
        <Link
          href="/student/profile"
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all',
            pathname === '/student/profile'
              ? 'bg-white/6 text-slate-100'
              : 'text-slate-500 hover:bg-white/4 hover:text-slate-200'
          )}
          onClick={() => setIsMobileOpen(false)}
        >
          <User className="h-4 w-4" />
          <span>Profile</span>
        </Link>
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-500 transition-all hover:bg-red-500/8 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-[60] p-2 rounded-lg bg-slate-900 border border-slate-800 shadow-sm"
      >
        <Menu className="h-5 w-5 text-slate-400" />
      </button>

      <aside className="hidden md:block fixed left-0 top-0 h-screen w-[220px] z-50">
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
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            />
            <motion.aside
              initial={{ x: -220 }}
              animate={{ x: 0 }}
              exit={{ x: -220 }}
              transition={{ type: "spring", damping: 22, stiffness: 160 }}
              className="md:hidden fixed left-0 top-0 h-screen w-[220px] z-[80]"
            >
              <SidebarContent />
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 -right-11 p-2 rounded-full bg-slate-800 shadow-lg"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
