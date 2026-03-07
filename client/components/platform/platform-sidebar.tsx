"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, LayoutGroup } from "framer-motion"
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Shield,
  Settings,
  GraduationCap,
  BookOpen,
  Users,
  UserCheck,
  Briefcase,
  PieChart,
  LogOut,
  ChevronRight,
  ExternalLink
} from "lucide-react"
import { useAuth } from '../../lib/auth-context'

interface NavItem {
  name: string
  href: string
  icon: any
  adminOnly?: boolean
}

interface NavGroup {
  group: string
  items: NavItem[]
}

const navigationGroups: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { name: "Dashboard", href: "/platform/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    group: "Learning",
    items: [
      { name: "Courses", href: "/platform/courses", icon: BookOpen },
      { name: "Instructors", href: "/platform/users?role=instructor", icon: Briefcase },
    ]
  },
  {
    group: "Organizations",
    items: [
      { name: "Organizations", href: "/platform/organizations", icon: Building2 },
      { name: "Applications", href: "/platform/applications", icon: ClipboardList },
    ]
  },
  {
    group: "People",
    items: [
      { name: "Users", href: "/platform/users", icon: Users },
      { name: "Roles", href: "/platform/config/roles", icon: UserCheck },
    ]
  },
  {
    group: "Insights",
    items: [
      { name: "Analytics", href: "/platform/analytics", icon: PieChart },
    ]
  },
  {
    group: "System",
    items: [
      { name: "Admins", href: "/platform/admins", icon: Shield, adminOnly: true },
      { name: "Settings", href: "/platform/settings", icon: Settings, adminOnly: true },
    ]
  }
]

export function PlatformSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const isAdmin = user?.role === 'platform_admin'
  
  const getInitials = (name: string | undefined | null) => {
    if (!name) return '??'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const initials = getInitials(user?.name)

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[280px] bg-[#111827] text-slate-400 border-r border-white/5 flex flex-col shadow-2xl">
      {/* Brand Logo Section */}
      <div className="h-24 flex items-center px-8 border-b border-white/5">
        <Link href="/platform/dashboard" className="flex items-center gap-4 group">
          <div className="w-11 h-11 rounded-2xl bg-[#2563EB] flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
            <GraduationCap className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-[17px] font-black text-white tracking-tight leading-none group-hover:text-blue-400 transition-colors">
              Smart LMS
            </span>
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mt-2.5 leading-none opacity-80">
              PLATFORM
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-5 py-8 space-y-10 overflow-y-auto scrollbar-hide">
        <LayoutGroup>
          {navigationGroups.map((group) => {
            const filteredItems = group.items.filter(item => !item.adminOnly || isAdmin)
            if (filteredItems.length === 0) return null

            return (
              <div key={group.group} className="space-y-4">
                <h3 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 opacity-40">
                  {group.group}
                </h3>
                <div className="space-y-1.5">
                  {filteredItems.map((item) => {
                    const isExact = pathname === item.href
                    const isSubPath = item.href !== "/platform/dashboard" && pathname.startsWith(item.href + "/")
                    const isActive = isExact || isSubPath
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-[14px] font-extrabold transition-all duration-300 group relative ${
                          isActive
                            ? "bg-blue-600/10 text-white shadow-[inset_0_0_0_1px_rgba(37,99,235,0.3)]"
                            : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]"
                        }`}
                      >
                        {isActive && (
                          <motion.div 
                            layoutId="sidebar-active-pill"
                            className="absolute left-0 w-1.5 h-6 bg-blue-500 rounded-r-full"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <Icon 
                          className={`w-5 h-5 transition-all duration-300 ${isActive ? "text-blue-500 scale-110" : "text-slate-500 group-hover:text-slate-300"}`} 
                          strokeWidth={isActive ? 2.5 : 2} 
                        />
                        <span className="flex-1 tracking-tight">{item.name}</span>
                        {isActive && <ChevronRight className="w-4 h-4 text-blue-500/50" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </LayoutGroup>
      </nav>

      {/* User Session Footer */}
      <div className="p-6 bg-white/[0.02] border-t border-white/5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 px-4 py-4 rounded-[1.75rem] bg-white/[0.03] border border-white/5 group transition-all duration-300 hover:bg-white/[0.05] hover:border-white/10">
            <div className="w-11 h-11 rounded-xl bg-[#2563EB] flex items-center justify-center text-white text-[12px] font-black shadow-lg shadow-blue-500/10 group-hover:scale-105 transition-transform duration-300">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-black text-slate-100 truncate leading-tight">
                {user?.name || 'Platform User'}
              </p>
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.15em] mt-2 opacity-60">
                {user?.role?.replace('_', ' ') || 'Staff'}
              </p>
            </div>
            <button 
              onClick={() => logout()}
              title="Sign Out"
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-rose-500/10 hover:text-rose-500 text-slate-500 transition-all duration-300 border border-transparent hover:border-rose-500/20 group/logout"
            >
              <LogOut className="w-4 h-4 group-hover/logout:-translate-x-0.5 transition-transform" />
            </button>
          </div>
          
          <div className="px-5 py-3 flex items-center justify-between text-[11px] font-black text-slate-500 hover:text-slate-300 transition-colors cursor-pointer group/status">
            <span className="flex items-center gap-2.5 tracking-widest uppercase opacity-70 group-hover/status:opacity-100 transition-opacity">
              <ExternalLink className="w-3.5 h-3.5" />
              Status
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-500/80 uppercase">Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
