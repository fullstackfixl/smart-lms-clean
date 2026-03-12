"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  BookOpen,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  School,
  Layers,
  ChevronRight,
  FileText,
  Bell,
  BarChart3,
  Clock,
  BookMarked,
  CheckCircle,
  ClipboardList,
} from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { cn } from '../../lib/utils'

interface NavItem {
  label: string
  href: string
  icon: any
  description?: string
  section?: 'core' | 'academics' | 'management' | 'settings'
}

const navItems: NavItem[] = [
  { section: 'core', label: 'Dashboard', href: '/org-admin/dashboard', icon: LayoutDashboard, description: 'Overview' },
  { section: 'core', label: 'Events', href: '/org-admin/events', icon: Calendar, description: 'College events' },

  { section: 'academics', label: 'Departments', href: '/org-admin/departments', icon: Building2, description: 'Academic departments' },
  { section: 'academics', label: 'Programs', href: '/org-admin/programs', icon: Layers, description: 'Academic programs' },
  { section: 'academics', label: 'Subjects', href: '/org-admin/subjects', icon: BookMarked, description: 'Program subjects' },
  { section: 'academics', label: 'Batches', href: '/org-admin/batches', icon: School, description: 'Student batches' },
  { section: 'academics', label: 'Timetable', href: '/org-admin/timetable', icon: Clock, description: 'Class schedules' },
  { section: 'academics', label: 'Attendance', href: '/org-admin/attendance', icon: CheckCircle, description: 'View attendance' },

  { section: 'management', label: 'Students', href: '/org-admin/users?role=student', icon: Users, description: 'Learners' },
  { section: 'management', label: 'Instructors', href: '/org-admin/users?role=instructor', icon: GraduationCap, description: 'Teaching staff' },
  { section: 'management', label: 'Instructor Courses', href: '/org-admin/courses/pending', icon: BookOpen, description: 'Approve courses' },
  { section: 'management', label: 'Applications', href: '/org-admin/applications', icon: FileText, description: 'Pending apps' },
  { section: 'management', label: 'Analytics', href: '/org-admin/analytics', icon: BarChart3, description: 'Reports' },
  { section: 'management', label: 'Notifications', href: '/org-admin/notifications', icon: Bell, description: 'Updates' },

  { section: 'settings', label: 'Settings', href: '/org-admin/settings', icon: Settings, description: 'Configuration' },
]

export function OrgSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout, organization } = useAuth()

  const orgType = organization?.type?.toUpperCase() || 'COLLEGE'
  const isCollege = orgType === 'COLLEGE' || orgType === 'UNIVERSITY'

  const filteredNavItems = navItems.filter(item => {
    // Filter college-only items for non-college orgs
    const collegeOnlyItems = ['Departments', 'Batches', 'Programs', 'Events']
    if (collegeOnlyItems.includes(item.label) && !isCollege) return false
    return true
  })

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white border-r border-gray-200">
      {/* Header / Logo */}
      <div className="flex h-16 items-center border-b border-gray-100 px-6">
        <Link href="/org-admin/dashboard" className="flex items-center gap-3">
          {organization?.branding?.logo || (organization as any)?.logo_url ? (
            <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center">
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
          <div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              {organization?.name || 'Instatute'}
            </span>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
              {orgType} Admin
            </p>
          </div>
        </Link>
      </div>

      {/* Primary Navigation */}
      <nav className="mt-6 flex-1 space-y-6 px-3 overflow-y-auto custom-scrollbar pb-6">
        {(['core', 'academics', 'management', 'settings'] as const).map((section) => {
          const items = filteredNavItems.filter((i) => i.section === section)
          if (!items.length) return null

          const title =
            section === 'core' ? 'Overview' :
            section === 'academics' ? 'Academics' :
            section === 'management' ? 'Management' :
            'System'

          return (
            <div key={section} className="space-y-2">
              <div className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {title}
              </div>
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = pathname.startsWith(item.href.split('?')[0])
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all',
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      )}
                    >
                      <item.icon className={cn(
                        'h-5 w-5 shrink-0',
                        isActive ? 'text-blue-600' : 'text-slate-400'
                      )} />
                      <div className="flex-1">
                        <span>{item.label}</span>
                        {item.description && (
                          <p className="text-[11px] text-slate-400 font-normal leading-tight">
                            {item.description}
                          </p>
                        )}
                      </div>
                      {isActive && (
                        <ChevronRight className="h-4 w-4 text-blue-600" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'Admin'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-gray-100 bg-white px-4 lg:hidden">
        <Link href="/org-admin/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold text-slate-900">
            {organization?.name || 'Admin'}
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:h-full lg:flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden"
            >
              <div className="h-full bg-white shadow-xl">
                <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
                  <Link href="/org-admin/dashboard" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <span className="text-lg font-bold text-slate-900">
                      {organization?.name || 'Admin'}
                    </span>
                  </Link>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="h-[calc(100%-4rem)] overflow-y-auto">
                  <SidebarContent />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}