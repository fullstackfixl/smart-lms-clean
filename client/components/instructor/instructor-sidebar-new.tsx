"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Video,
  BarChart3,
  FileText,
  Bell,
  Upload,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { ThemeToggle } from "./theme-toggle"
import { cn, getInitials } from '../../lib/utils'
import { SIDEBAR_WIDTH } from '../../lib/constants'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'instructor'
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

interface InstructorSidebarProps {
  user: User
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/instructor-dashboard', icon: LayoutDashboard },
  { label: 'Manage Courses', href: '/instructor-courses', icon: BookOpen },
  { label: 'Students', href: '/instructor-students', icon: Users },
  { label: 'Live Classes', href: '/instructor-live-classes', icon: Video },
  { label: 'Analytics', href: '/instructor-analytics', icon: BarChart3 },
  { label: 'Submissions', href: '/instructor-submissions', icon: FileText },
  { label: 'Quiz Management', href: '/instructor/quiz', icon: FileText },
  { label: 'Notifications', href: '/instructor-notifications', icon: Bell },
  { label: 'Upload Content', href: '/instructor-upload', icon: Upload },
]

/**
 * InstructorSidebar component - Permanent left navigation panel
 * Features:
 * - 280px width on desktop
 * - Logo at top
 * - User avatar section with dropdown
 * - Navigation items with icons and active states
 * - Theme toggle in user dropdown
 * - Logout button at bottom
 * - Mobile: transforms to overlay with backdrop
 * - Full light/dark theme support
 */
export function InstructorSidebar({ user }: InstructorSidebarProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleLogout = () => {
    // Implement logout logic
    console.log('Logout clicked')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">I</span>
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Instatute
          </span>
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Appearance</DropdownMenuLabel>
            <div className="px-2 py-1">
              <ThemeToggle />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700"
              )}
              onClick={() => setIsMobileOpen(false)}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all w-full"
        >
          <LogOut className="h-5 w-5" />
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
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg"
      >
        <Menu className="h-6 w-6 text-slate-900 dark:text-slate-100" />
      </button>

      {/* Desktop Sidebar */}
      <aside
        className="hidden md:block fixed left-0 top-0 h-screen"
        style={{ width: `${SIDEBAR_WIDTH}px` }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: -SIDEBAR_WIDTH }}
              animate={{ x: 0 }}
              exit={{ x: -SIDEBAR_WIDTH }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed left-0 top-0 h-screen z-50"
              style={{ width: `${SIDEBAR_WIDTH}px` }}
            >
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-slate-700"
              >
                <X className="h-5 w-5 text-slate-900 dark:text-slate-100" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
