import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  { label: 'Events', href: '/student/events', icon: CalendarDays, module: 'EVENTS' },
]

export function StudentSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const filteredItems = navItems.filter(item => {
    if (item.module) {
      return user?.modulesEnabled?.includes(item.module)
    }
    return true
  })

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#F5F5F5] border-r border-slate-200 shadow-sm">
      {/* Brand */}
      <div className="p-6">
        <Link href="/student/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#4CAF50] flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">Smart LMS</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group",
                isActive
                  ? "bg-[#4CAF50] text-white shadow-md shadow-green-500/20"
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              )}
              onClick={() => setIsMobileOpen(false)}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-white" : "text-[#FFC107] group-hover:text-[#FFB300]"
                )}
                strokeWidth={2}
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-200 bg-[#FAFAFA]">
        <Link
          href="/student/profile"
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all mb-1",
            pathname === '/student/profile' ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-200"
          )}
        >
          <User className="h-5 w-5 text-slate-400" strokeWidth={2} />
          <span>Profile</span>
        </Link>
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all w-full text-left"
        >
          <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-500" strokeWidth={2} />
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
