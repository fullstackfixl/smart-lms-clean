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
    <div className="flex h-full flex-col bg-[#020617] text-white border-r border-white/5 relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="absolute top-0 left-0 -ml-24 -mt-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 -mr-24 -mb-24 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
 
      {/* Header / Logo */}
      <div className="relative z-10 px-8 py-10">
        <Link href="/instructor/dashboard" className="flex items-center gap-4 group">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-indigo-600 shadow-[0_8px_24px_-8px_rgba(79,70,229,0.5)] group-hover:scale-110 transition-transform duration-500">
            <GraduationCap className="h-7 w-7 text-white" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#020617] rounded-full" />
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl font-black tracking-tight flex items-center gap-1.5">
              Instatute <Zap className="w-4 h-4 fill-white animate-pulse" />
            </span>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Peak Administrator</p>
          </div>
        </Link>
      </div>
 
      {/* User Context */}
      <div className="relative z-10 px-6 py-4">
        <div className="p-1 rounded-[2.2rem] bg-white/5 border border-white/5 backdrop-blur-md">
           <div className="flex items-center gap-4 p-4 rounded-[1.8rem] bg-white/[0.03]">
              <div className="relative h-12 w-12 shrink-0 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-lg">
                {user?.name?.charAt(0) || 'E'}
              </div>
              <div className="min-w-0 flex-1">
                 <p className="truncate text-[14px] font-black tracking-tight">{user?.name || 'Educator'}</p>
                 <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Verified</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
 
      {/* Prime Navigation */}
      <nav className="relative z-10 flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
        <div className="space-y-2">
          {navItems.filter(item => !item.collegeOnly || user?.organizationType === 'COLLEGE').map((item) => {
            const isActive = pathname === item.href || (item.href !== '/instructor/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'group relative flex items-center gap-4 rounded-[1.4rem] px-5 py-4 transition-all duration-300',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-[0_12px_24px_-8px_rgba(79,70,229,0.4)]'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-all duration-500',
                    isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-indigo-400'
                  )}
                  strokeWidth={isActive ? 3 : 2}
                />
                <div className="flex-1">
                   <p className="text-[14px] font-black tracking-tight leading-none mb-1">{item.label}</p>
                   <p className={cn(
                     "text-[9px] font-bold uppercase tracking-widest transition-opacity duration-300",
                     isActive ? "text-white/70" : "text-white/20 group-hover:text-white/40"
                   )}>
                     {item.description}
                   </p>
                </div>
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-white/40" strokeWidth={3} />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
 
      {/* Operational Commands */}
      <div className="relative z-10 p-6 space-y-4">
        <button 
           onClick={() => router.push('/instructor/settings')}
           className="flex w-full items-center gap-4 rounded-[1.4rem] px-6 py-4 text-[13px] font-black text-white/40 transition-all hover:bg-white/5 hover:text-white group"
        >
          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          <span>Console Settings</span>
        </button>
        <button
          onClick={logout}
          className="flex w-full items-center gap-4 rounded-[1.4rem] px-6 py-4 text-[13px] font-black text-rose-500/60 transition-all hover:bg-rose-500/10 hover:text-rose-500 group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Decommission Session</span>
        </button>
      </div>
    </div>
  )
 
  return (
    <>
      <aside className="hidden lg:block w-[320px] h-screen shrink-0 sticky top-0">
        <SidebarContent />
      </aside>
 
      <div className="fixed left-0 right-0 top-0 z-[60] flex items-center justify-between bg-[#020617]/95 backdrop-blur-xl px-6 py-4 lg:hidden border-b border-white/5">
        <Link href="/instructor/dashboard" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-black text-white">Instatute</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-2xl p-3 bg-white/5 text-white/60 hover:text-white transition-all border border-white/5"
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
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md lg:hidden"
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-[70] h-screen w-[320px] lg:hidden overflow-hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
