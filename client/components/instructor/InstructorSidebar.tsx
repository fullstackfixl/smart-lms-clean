"use client"
 
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  BookOpen,
  Video,
  Upload,
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
  Zap,
  Layers,
  Search,
  Target,
  ShieldCheck,
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
}
 
const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/instructor/dashboard', icon: LayoutDashboard, description: 'Executive Overview' },
  { label: 'My Subjects', href: '/instructor/subjects', icon: Book, collegeOnly: true, description: 'Faculty Registry' },
  { label: 'My Courses', href: '/instructor/courses', icon: Layers, description: 'Curriculum Matrix' },
  { label: 'Students', href: '/instructor/students', icon: Users, description: 'Scholar Network' },
  { label: 'Live Classes', href: '/instructor/live-classes', icon: Video, description: 'Stream Uplink' },
  { label: 'Quiz Hub', href: '/instructor/quiz', icon: ClipboardList, description: 'AI Neural Matrix' },
  { label: 'Analytics', href: '/instructor/analytics', icon: BarChart3, description: 'Intelligence Reports' },
  { label: 'Submissions', href: '/instructor/submissions', icon: FileText, description: 'Audit Stream' },
  { label: 'Earnings', href: '/instructor/earnings', icon: Activity, description: 'Fiscal Terminal' },
  { label: 'Messages', href: '/instructor/messages', icon: MessageSquare, description: 'Strategic Uplink' },
  { label: 'Notifications', href: '/instructor/notifications', icon: Bell, description: 'Intelligence Signals' },
  { label: 'Gradebook', href: '/instructor/gradebook', icon: Target, collegeOnly: true, description: 'Mastery Registry' },
  { label: 'Attendance', href: '/instructor/attendance', icon: Calendar, collegeOnly: true, description: 'Participation Logs' },
]
 
export function InstructorSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
 
  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white border-r border-gray-200">
      {/* Header / Logo */}
      <div className="flex h-16 items-center border-b border-gray-100 px-6">
        <Link href="/instructor/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Instatute<span className="text-blue-600">.</span>
          </span>
        </Link>
      </div>

      {/* Primary Navigation */}
      <nav className="mt-6 flex-1 space-y-1 px-3">
        {navItems.filter(item => !item.collegeOnly || user?.organizationType === 'COLLEGE').map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-slate-600 hover:bg-gray-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-4 w-4 stroke-[1.5]",
                isActive ? "text-blue-600" : "text-slate-500 group-hover:text-slate-900"
              )} />
              {item.label}
              {isActive && (
                <div className="absolute -left-3 h-4 w-1 rounded-r-full bg-blue-600" />
              )}
            </Link>
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
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">Instatute</span>
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
