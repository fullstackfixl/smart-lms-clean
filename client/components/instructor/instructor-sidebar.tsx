"use client"

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
  ClipboardList
} from "lucide-react"
import { cn } from '../../lib/utils'
import { Button } from '../../components/ui/button'

const navigation = [
  { name: "Dashboard", href: "/instructor/dashboard", icon: LayoutDashboard },
  { name: "Manage Courses", href: "/instructor/courses", icon: BookOpen },
  { name: "Students", href: "/instructor/students", icon: Users },
  { name: "Live Classes", href: "/instructor/live-classes", icon: Video },
  { name: "Quiz Management", href: "/instructor/quiz", icon: ClipboardList },
  { name: "Analytics", href: "/instructor/analytics", icon: BarChart3 },
  { name: "Submissions", href: "/instructor/submissions", icon: FileText },
  { name: "Notifications", href: "/instructor/notifications", icon: Bell },
  { name: "Upload Content", href: "/instructor/upload", icon: Upload },
]

export function InstructorSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-[280px] flex-col border-r bg-white dark:bg-slate-950 dark:border-slate-800">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6 dark:border-slate-800">
        <Link href="/instructor-dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-500">
            <span className="text-sm font-bold text-white">I</span>
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white">Instatute</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t p-3 dark:border-slate-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => {
            // Handle logout
            window.localStorage.removeItem('instatute_token')
            window.sessionStorage.removeItem('instatute_token')
            window.location.href = '/login'
          }}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}
