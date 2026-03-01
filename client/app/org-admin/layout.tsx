"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { useAuth } from '../../lib/auth-context'
import { adminApi } from '../../lib/api'
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
  ChevronDown,
  Library,
  Layers,
  Book,
  FileSpreadsheet,
  History,
  TableProperties,
  HeartHandshake,
  ClipboardCheck,
  ShieldCheck,
  Trophy,
  Group,
  Palette,
  ShoppingCart,
  Award,
  TrendingUp,
  Tag,
  Globe
} from "lucide-react"

// ──────────────────────────────────────────────────────────────
// MODULE CONFIG — single source of truth per specification
// ──────────────────────────────────────────────────────────────
const MODULE_CONFIG: Record<string, { label: string; path: string; icon: any }> = {
  // SCHOOL
  ACADEMIC_YEAR: { label: "Academic Year", path: "/org-admin/academic-year", icon: History },
  GRADES_SECTIONS: { label: "Grades & Sections", path: "/org-admin/grades-sections", icon: TableProperties },
  ATTENDANCE: { label: "Attendance", path: "/org-admin/attendance", icon: Calendar },
  EXAMS: { label: "Exams", path: "/org-admin/exams", icon: GraduationCap },
  PARENT_PORTAL: { label: "Parent Portal", path: "/org-admin/parent-portal", icon: HeartHandshake },
  REPORTS: { label: "Reports", path: "/org-admin/reports", icon: BarChart3 },
  // COLLEGE
  DEPARTMENTS: { label: "Departments", path: "/org-admin/departments", icon: Library },
  SEMESTERS: { label: "Semesters", path: "/org-admin/semesters", icon: Layers },
  SUBJECTS: { label: "Subjects", path: "/org-admin/subjects", icon: Book },
  GPA_REPORTS: { label: "GPA Reports", path: "/org-admin/gpa-reports", icon: FileSpreadsheet },
  // INSTITUTE
  BATCHES: { label: "Batches", path: "/org-admin/batches", icon: Group },
  TEST_SERIES: { label: "Test Series", path: "/org-admin/test-series", icon: ClipboardCheck },
  TRAINERS: { label: "Trainers", path: "/org-admin/trainers", icon: ShieldCheck },
  LEADERBOARDS: { label: "Leaderboards", path: "/org-admin/leaderboards", icon: Trophy },
  // ONLINE_ACADEMY
  PUBLIC_CATALOG: { label: "Public Catalog", path: "/org-admin/catalog", icon: Globe },
  COUPONS: { label: "Coupons", path: "/org-admin/coupons", icon: Tag },
  COURSE_SALES: { label: "Course Sales", path: "/org-admin/sales", icon: ShoppingCart },
  CERTIFICATES: { label: "Certificates", path: "/org-admin/certificates", icon: Award },
  STUDENT_ANALYTICS: { label: "Student Analytics", path: "/org-admin/analytics", icon: TrendingUp },
  // COMMON (always shown as dynamic if enabled)
  COURSES: { label: "Courses", path: "/org-admin/courses", icon: BookOpen },
  TIMETABLE: { label: "Timetable", path: "/org-admin/timetable", icon: Clock },
  EVENTS: { label: "Events", path: "/org-admin/events", icon: CalendarDays },
  FEES: { label: "Fees", path: "/org-admin/fees", icon: DollarSign },
  LIVE_CLASSES: { label: "Live Classes", path: "/org-admin/live-classes", icon: UserCheck },
}

// These items always appear regardless of org type
const STATIC_NAV = [
  { name: "Dashboard", href: "/org-admin/dashboard", icon: LayoutDashboard },
  { name: "User Management", href: "/org-admin/users", icon: Users },
]

// These always appear at the bottom
const STATIC_BOTTOM_NAV = [
  { name: "Branding Settings", href: "/org-admin/settings", icon: Palette },
  { name: "Org Settings", href: "/org-admin/settings", icon: Settings },
]

export default function OrgAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, token, organization } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [enabledModules, setEnabledModules] = useState<string[]>([]
  )
  const [orgType, setOrgType] = useState("")

  useEffect(() => {
    // Prefer org data from auth context (populated on login)
    if (organization?.modulesEnabled?.length) {
      setEnabledModules(organization.modulesEnabled)
      setOrgType(organization.type || "")
      return
    }
    // Fallback: fetch from API if org not in context (e.g. page refresh)
    const fetchModules = async () => {
      if (!token) return
      try {
        const response = await adminApi.getModules(token)
        if (response.success) {
          const data = response.data as any
          setEnabledModules(data.modulesEnabled)
          setOrgType(data.organizationType)
        }
      } catch (error) {
        console.error("Failed to fetch modules:", error)
      }
    }
    fetchModules()
  }, [token, organization])

  // Build dynamic nav from enabled modules
  const dynamicNav = enabledModules
    .map(key => {
      const config = MODULE_CONFIG[key]
      if (!config) return null
      return { name: config.label, href: config.path, icon: config.icon }
    })
    .filter(Boolean) as { name: string; href: string; icon: any }[]

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
              {/* static core items */}
              {STATIC_NAV.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <motion.button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
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

              {/* dynamic module items */}
              {dynamicNav.length > 0 && (
                <>
                  <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                    {orgType ? orgType.replace(/_/g, " ") : "Modules"}
                  </p>
                  {dynamicNav.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                      <motion.button
                        key={item.name}
                        onClick={() => router.push(item.href)}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                          ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 shadow-lg shadow-indigo-500/20"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          }`}
                      >
                        <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                        <span>{item.name}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeNavDyn"
                            className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400"
                          />
                        )}
                      </motion.button>
                    )
                  })}
                </>
              )}

              {/* static bottom items */}
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Settings</p>
              {STATIC_BOTTOM_NAV.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <motion.button
                    key={item.name}
                    onClick={() => router.push(item.href)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                      ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 shadow-lg shadow-indigo-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    <span>{item.name}</span>
                  </motion.button>
                )
              })}
            </nav>

            {/* User Profile */}
            <div className="p-3 border-t border-slate-800/50">
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/30">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.substring(0, 2).toUpperCase() || "OA"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{user?.name || "Org Admin"}</p>
                  <p className="text-xs text-slate-500 truncate">{orgType || "Organization"}</p>
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
                    {STATIC_NAV.map((item) => {
                      const isActive = pathname === item.href
                      const Icon = item.icon
                      return (
                        <button
                          key={item.name}
                          onClick={() => { router.push(item.href); setSidebarOpen(false) }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                            ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                            }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </button>
                      )
                    })}
                    {dynamicNav.length > 0 && (
                      <>
                        <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                          {orgType ? orgType.replace(/_/g, " ") : "Modules"}
                        </p>
                        {dynamicNav.map((item) => {
                          const isActive = pathname === item.href
                          const Icon = item.icon
                          return (
                            <button
                              key={item.name}
                              onClick={() => { router.push(item.href); setSidebarOpen(false) }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400"
                                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                                }`}
                            >
                              <Icon className="w-5 h-5" />
                              <span>{item.name}</span>
                            </button>
                          )
                        })}
                      </>
                    )}
                    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Settings</p>
                    {STATIC_BOTTOM_NAV.map((item) => {
                      const isActive = pathname === item.href
                      const Icon = item.icon
                      return (
                        <button
                          key={item.name}
                          onClick={() => { router.push(item.href); setSidebarOpen(false) }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
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
                      {user?.name?.substring(0, 2).toUpperCase() || "OA"}
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
                          <p className="text-sm font-medium text-slate-200">{user?.name || "Org Admin"}</p>
                          <p className="text-xs text-slate-500">{user?.email || "admin@org.com"}</p>
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
