"use client"

import React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  GraduationCap, LayoutDashboard, BookOpen, Award, Trophy,
  Calendar, Clock, BarChart3, Settings, LogOut,
  Menu, X, Video, FileText, Users, CreditCard,
  ClipboardList, UserCheck, Home, Sparkles, Upload,
  FileQuestion, MessageSquare, TrendingUp,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getDashboardRoute } from "@/lib/role-redirect"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles?: string[]
  module?: string
  badge?: string
}

const navItems: NavItem[] = [
  // Student
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard, roles: ["student"] },
  { label: "My Courses", href: "/student/courses", icon: BookOpen, roles: ["student"] },
  { label: "Quizzes", href: "/student/quizzes", icon: ClipboardList, roles: ["student"] },
  { label: "Certificates", href: "/student/certificates", icon: Award, roles: ["student"] },
  { label: "Leaderboard", href: "/student/leaderboard", icon: Trophy, roles: ["student"], module: "LEADERBOARDS" },
  { label: "Timetable", href: "/student/timetable", icon: Clock, roles: ["student"], module: "TIMETABLE" },
  { label: "Events", href: "/student/events", icon: Calendar, roles: ["student"], module: "EVENTS" },
  { label: "Grades", href: "/student/grades", icon: BarChart3, roles: ["student"], module: "GRADES_SECTIONS" },
  { label: "Profile", href: "/student/profile", icon: Users, roles: ["student"] },

  // Instructor
  { label: "Course Manager", href: "/instructor/courses", icon: FileText, roles: ["instructor"], module: "COURSES" },
  { label: "Upload Lessons", href: "/instructor/upload", icon: Upload, roles: ["instructor"], module: "COURSES" },
  { label: "Create Quiz", href: "/instructor/quiz", icon: FileQuestion, roles: ["instructor"], module: "EXAMS" },
  { label: "Attendance", href: "/instructor/attendance", icon: UserCheck, roles: ["instructor"], module: "ATTENDANCE" },
  { label: "Grade Entry", href: "/instructor/grades", icon: BarChart3, roles: ["instructor"], module: "GRADES_SECTIONS" },
  { label: "Live Classes", href: "/instructor/live-classes", icon: Video, roles: ["instructor"], module: "LIVE_CLASSES" },
  { label: "Analytics", href: "/instructor/analytics", icon: TrendingUp, roles: ["instructor"], module: "REPORTS" },
  { label: "Messages", href: "/instructor/messages", icon: MessageSquare, roles: ["instructor"] },

  // Org Admin
  { label: "User Management", href: "/admin/users", icon: Users, roles: ["org_admin"] },
  { label: "Academic Year", href: "/admin/academic-year", icon: Calendar, roles: ["org_admin"], module: "ACADEMIC_YEAR" },
  { label: "Departments", href: "/admin/departments", icon: Home, roles: ["org_admin"], module: "DEPARTMENTS" },
  { label: "Semesters", href: "/admin/semesters", icon: Clock, roles: ["org_admin"], module: "SEMESTERS" },
  { label: "Subjects", href: "/admin/subjects", icon: BookOpen, roles: ["org_admin"], module: "SUBJECTS" },
  { label: "Batches", href: "/admin/batches", icon: LayoutDashboard, roles: ["org_admin"], module: "BATCHES" },
  { label: "Course Management", href: "/admin/courses", icon: FileText, roles: ["org_admin"], module: "COURSES" },
  { label: "Public Catalog", href: "/admin/catalog", icon: BookOpen, roles: ["org_admin"], module: "PUBLIC_CATALOG" },
  { label: "Certificates", href: "/admin/certificates", icon: Award, roles: ["org_admin"], module: "CERTIFICATES" },
  { label: "Attendance Management", href: "/admin/attendance", icon: UserCheck, roles: ["org_admin"], module: "ATTENDANCE" },
  { label: "Grade Management", href: "/admin/grades", icon: BarChart3, roles: ["org_admin"], module: "GRADES_SECTIONS" },
  { label: "GPA Reports", href: "/admin/gpa-reports", icon: BarChart3, roles: ["org_admin"], module: "GPA_REPORTS" },
  { label: "Test Series", href: "/admin/test-series", icon: FileQuestion, roles: ["org_admin"], module: "TEST_SERIES" },
  { label: "Exams", href: "/admin/exams", icon: ClipboardList, roles: ["org_admin"], module: "EXAMS" },
  { label: "Parent Portal", href: "/admin/parent-portal", icon: Users, roles: ["org_admin"], module: "PARENT_PORTAL" },
  { label: "Fees Management", href: "/admin/fees", icon: CreditCard, roles: ["org_admin"], module: "FEES" },
  { label: "Course Sales", href: "/admin/sales", icon: TrendingUp, roles: ["org_admin"], module: "COURSE_SALES" },
  { label: "Coupons", href: "/admin/coupons", icon: Sparkles, roles: ["org_admin"], module: "COUPONS" },
  { label: "Timetable", href: "/admin/timetable", icon: Clock, roles: ["org_admin"], module: "TIMETABLE" },
  { label: "Events", href: "/admin/events", icon: Calendar, roles: ["org_admin"], module: "EVENTS" },
  { label: "Trainers", href: "/admin/trainers", icon: Users, roles: ["org_admin"], module: "TRAINERS" },
  { label: "Reports", href: "/admin/reports", icon: BarChart3, roles: ["org_admin"], module: "REPORTS" },
  { label: "Student Analytics", href: "/admin/student-analytics", icon: TrendingUp, roles: ["org_admin"], module: "STUDENT_ANALYTICS" },
  { label: "Leaderboard", href: "/admin/leaderboard", icon: Trophy, roles: ["org_admin"], module: "LEADERBOARDS" },
  { label: "Branding Settings", href: "/admin/branding", icon: Sparkles, roles: ["org_admin"] },
  { label: "Organization Settings", href: "/admin/settings", icon: Settings, roles: ["org_admin"] },

  // Platform Admin
  { label: "Organization Management", href: "/platform/organizations", icon: Home, roles: ["platform_admin"] },
  { label: "Subscription Management", href: "/platform/subscriptions", icon: CreditCard, roles: ["platform_admin"] },
  { label: "Revenue Analytics", href: "/platform/revenue", icon: TrendingUp, roles: ["platform_admin"] },
  { label: "Global Analytics", href: "/platform/analytics", icon: BarChart3, roles: ["platform_admin"] },
  { label: "System Configuration", href: "/platform/config", icon: Settings, roles: ["platform_admin"] },
]

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const filteredItems = navItems.filter((item) => {
    // Role check
    const hasRole = !item.roles || (user?.role && item.roles.includes(user.role))
    if (!hasRole) return false

    // Module check for org-scoped users
    if (item.module && user?.role !== 'platform_admin') {
      const isEnabled = user?.modulesEnabled?.includes(item.module)
      if (!isEnabled) return false
    }

    return true
  })

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-5">
        <Link href={user?.role ? getDashboardRoute(user.role) : "/login"} className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
            <div className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold text-foreground">
                Insta<span className="text-primary">tute</span>
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">Learning Platform</span>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:block"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {/* User Profile Card */}
      {user && !collapsed && (
        <div className="mx-4 mt-4 rounded-xl border border-border/50 bg-gradient-to-br from-card to-muted/30 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-base font-bold text-primary-foreground shadow-md">
              {user.name?.charAt(0) || "U"}
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-green-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-xs capitalize text-muted-foreground">
                {user.role?.replace("_", " ")}
              </p>
            </div>
          </div>
          {user.role === "student" && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-foreground">Learning Streak</span>
              </div>
              <span className="text-xs font-bold text-primary">0 days</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-0.5">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className={cn(
                  "relative z-10 h-[18px] w-[18px] shrink-0 transition-transform duration-200",
                  isActive ? "scale-110" : "group-hover:scale-105"
                )} />
                {!collapsed && (
                  <span className="relative z-10">{item.label}</span>
                )}
                {item.badge && !collapsed && (
                  <span className="relative z-10 ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer Actions */}
      <div className="border-t border-border/50 p-4">
        <div className="flex flex-col gap-1">
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary/80 hover:text-foreground",
              pathname === "/dashboard/settings" && "bg-secondary text-foreground"
            )}
          >
            <Settings className="h-[18px] w-[18px]" />
            {!collapsed && <span>Settings</span>}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-[18px] w-[18px]" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden h-screen shrink-0 border-r border-border/50 bg-card transition-all duration-300 lg:block",
          collapsed ? "w-[72px]" : "w-72"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-border/50 bg-card/95 px-4 py-3 backdrop-blur-lg lg:hidden">
        <Link href={user?.role ? getDashboardRoute(user.role) : "/login"} className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-base font-bold text-foreground">
            Insta<span className="text-primary">tute</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-screen w-72 border-r border-border/50 bg-card shadow-2xl lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
