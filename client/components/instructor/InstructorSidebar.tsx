"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  BookOpen,
  Video,
  Upload,
  Settings,
  LogOut,
  GraduationCap,
  Menu,
  X,
  FileText,
  Bell,
  BarChart3,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/instructor/dashboard', icon: LayoutDashboard },
  { label: 'Manage Courses', href: '/instructor/courses', icon: BookOpen },
  { label: 'Students', href: '/instructor/students', icon: GraduationCap },
  { label: 'Live Classes', href: '/instructor/live-classes', icon: Video },
  { label: 'Analytics', href: '/instructor/analytics', icon: BarChart3 },
  { label: 'Submissions', href: '/instructor/submissions', icon: FileText },
  { label: 'Notifications', href: '/instructor/notifications', icon: Bell },
  { label: 'Upload Content', href: '/instructor/upload', icon: Upload },
]

export function InstructorSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-slate-900/50 backdrop-blur-xl border-r border-slate-800/50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800/50">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-orange-500 shadow-lg shadow-orange-500/20">
          <GraduationCap className="h-6 w-6 text-white" />
          <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-green-500 ring-2 ring-slate-900" />
        </div>
        <div>
          <span className="text-lg font-bold text-slate-100">
            Insta<span className="text-orange-500">tute</span>
          </span>
          <p className="text-[10px] font-medium text-slate-500">Learning Platform</p>
        </div>
      </div>

      {/* User Profile */}
      {user && (
        <div className="mx-4 mt-4 rounded-xl border border-slate-800/50 bg-slate-800/30 p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-orange-500 text-base font-bold text-white shadow-md">
              {user.name?.charAt(0) || 'I'}
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-green-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-100">{user.name}</p>
              <p className="truncate text-xs text-slate-500">Instructor</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-orange-600/20 to-orange-500/10 text-orange-500 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-600/20 to-orange-500/10 border border-orange-500/20"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon
                  className={cn(
                    'relative z-10 h-5 w-5 shrink-0 transition-transform duration-200',
                    isActive ? 'scale-110 text-orange-500' : 'group-hover:scale-105'
                  )}
                />
                <span className="relative z-10">{item.label}</span>
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-l-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-800/50 p-4">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[280px] h-screen shrink-0 sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-slate-800/50 bg-slate-900/95 backdrop-blur-lg px-4 py-3 lg:hidden">
        <Link href="/instructor/dashboard" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-600 to-orange-500 shadow-lg shadow-orange-500/20">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold text-slate-100">
            Insta<span className="text-orange-500">tute</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 z-50 h-screen w-[280px] shadow-2xl lg:hidden"
          >
            <SidebarContent />
          </motion.aside>
        </>
      )}
    </>
  )
}
