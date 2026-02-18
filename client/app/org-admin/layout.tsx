"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserCheck,
  Calendar,
  GraduationCap,
  DollarSign,
  Clock,
  CalendarDays,
  BarChart3,
  Settings,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/org-admin/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/org-admin/users", icon: Users },
  { name: "Courses", href: "/org-admin/courses", icon: BookOpen },
  { name: "Enrollments", href: "/org-admin/enrollments", icon: UserCheck },
  { name: "Attendance", href: "/org-admin/attendance", icon: Calendar },
  { name: "Grades", href: "/org-admin/grades", icon: GraduationCap },
  { name: "Fees", href: "/org-admin/fees", icon: DollarSign },
  { name: "Timetable", href: "/org-admin/timetable", icon: Clock },
  { name: "Events", href: "/org-admin/events", icon: CalendarDays },
  { name: "Reports", href: "/org-admin/reports", icon: BarChart3 },
  { name: "Settings", href: "/org-admin/settings", icon: Settings },
]

export default function OrgAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <ProtectedRoute allowedRoles={["org_admin"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/50 hidden lg:block">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Smart LMS
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <motion.button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 shadow-lg shadow-indigo-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400"
                    />
                  )}
                </motion.button>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="p-3 border-t border-slate-800/50">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/30">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                OA
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">Org Admin</p>
                <p className="text-xs text-slate-500 truncate">admin@org.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800/50 lg:hidden"
            >
              <div className="flex flex-col h-full">
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      Smart LMS
                    </span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          router.push(item.href)
                          setSidebarOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-slate-200"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search users, courses..."
                  className="w-full h-10 pl-10 pr-4 bg-slate-900/50 border border-slate-800/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-slate-800/50 rounded-xl transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    OA
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800/50 rounded-xl shadow-xl overflow-hidden"
                    >
                      <div className="p-3 border-b border-slate-800/50">
                        <p className="text-sm font-medium text-slate-200">Org Admin</p>
                        <p className="text-xs text-slate-500">admin@org.com</p>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => router.push("/org-admin/settings")}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-all"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </button>
                        <button
                          onClick={() => router.push("/login")}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
    </ProtectedRoute>
  )
}
