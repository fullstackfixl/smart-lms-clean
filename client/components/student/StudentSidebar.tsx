"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  Flame,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn, getInitials } from "@/lib/utils"

interface StudentSidebarProps {
  user: {
    name: string
    email: string
    avatar?: string
    streak: number
  }
}

const navItems = [
  { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Browse Courses', href: '/student/available-courses', icon: GraduationCap },
  { label: 'My Courses', href: '/student/my-courses', icon: BookOpen },
  { label: 'Quizzes', href: '/student/quizzes', icon: FileQuestion },
  { label: 'Certificates', href: '/student/certificates', icon: Award },
  { label: 'Leaderboard', href: '/student/leaderboard', icon: Trophy },
  { label: 'Timetable', href: '/student/timetable', icon: Calendar },
  { label: 'Events', href: '/student/events', icon: CalendarDays },
  { label: 'Grades', href: '/student/grades', icon: GraduationCap },
  { label: 'Profile', href: '/student/profile', icon: User },
  { label: 'Settings', href: '/student/settings', icon: Settings },
]

export function StudentSidebar({ user }: StudentSidebarProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-black/50 backdrop-blur-md border-r border-slate-700/50">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <div>
            <span className="text-lg font-bold text-white block leading-tight">
              Smart LMS
            </span>
            <span className="text-xs text-slate-400">
              Learning Platform
            </span>
          </div>
        </div>
      </div>

      {/* User Card */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-900/70 backdrop-blur-sm border border-slate-700/50">
          <Avatar className="h-12 w-12 border-2 border-purple-500">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-base">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {user.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-xs px-2 py-0">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />
                Student
              </Badge>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Flame className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-xs font-semibold text-purple-400">
                {user.streak} day streak
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative",
                isActive
                  ? "bg-purple-500/10 text-purple-400"
                  : "text-slate-300 hover:bg-slate-800/50 hover:text-purple-400"
              )}
              onClick={() => setIsMobileOpen(false)}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r-full" />
              )}
              <Icon className={cn("h-5 w-5", isActive && "text-purple-500")} strokeWidth={1.5} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700/50">
        <button
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all w-full"
        >
          <LogOut className="h-5 w-5" strokeWidth={1.5} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-black/50 backdrop-blur-md border border-slate-700/50 shadow-lg"
      >
        <Menu className="h-6 w-6 text-white" />
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-0 h-screen w-[280px]">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed left-0 top-0 h-screen w-[280px] z-50"
            >
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800/50"
              >
                <X className="h-5 w-5 text-white" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
