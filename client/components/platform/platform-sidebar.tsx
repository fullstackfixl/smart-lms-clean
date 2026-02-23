"use client"

import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  BarChart3,
  Shield,
  Settings,
  GraduationCap,
  BookOpen,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/platform/dashboard", icon: LayoutDashboard },
  { name: "Organizations", href: "/platform/organizations", icon: Building2 },
  { name: "Applications", href: "/platform/applications", icon: ClipboardList },
  { name: "Courses", href: "/platform/courses", icon: BookOpen },
  { name: "Analytics", href: "/platform/analytics", icon: BarChart3 },
  { name: "Platform Admins", href: "/platform/admins", icon: Shield },
  { name: "Settings", href: "/platform/settings", icon: Settings },
]

export function PlatformSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[260px] bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/50">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-base font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Smart LMS
              </span>
              <p className="text-[10px] text-slate-500 font-medium">Platform Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/platform" && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <motion.button
                key={item.name}
                onClick={() => router.push(item.href)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative ${isActive
                  ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl"
                    style={{ boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" }}
                  />
                )}
                <Icon className="w-5 h-5 relative z-10" strokeWidth={isActive ? 2.5 : 2} />
                <span className="relative z-10">{item.name}</span>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 relative z-10"
                  />
                )}
              </motion.button>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-slate-800/50">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/30">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              PA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">Platform Admin</p>
              <p className="text-xs text-slate-500 truncate">platform@admin.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
