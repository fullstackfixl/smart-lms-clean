"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../../lib/utils'
import { 
  LayoutDashboard, 
  Building2, 
  GraduationCap, 
  Users, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Puzzle, 
  Settings,
  ChevronRight,
  UserCheck
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', href: '/platform/dashboard', icon: LayoutDashboard },
  { name: 'Organizations', href: '/platform/organizations', icon: Building2 },
  { name: 'Courses', href: '/platform/courses', icon: FileText },
  { name: 'Instructors', href: '/platform/instructors', icon: UserCheck },
  { name: 'Users & Roles', href: '/platform/users', icon: Users },
  { name: 'Billing', href: '/platform/billing', icon: CreditCard },
  { name: 'Analytics', href: '/platform/analytics', icon: BarChart3 },
  { name: 'Integrations', href: '/platform/integrations', icon: Puzzle },
  { name: 'Settings', href: '/platform/settings', icon: Settings },
]

export function PlatformSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-100 px-6">
        <span className="text-xl font-bold tracking-tight text-slate-900">
          Smart<span className="text-blue-600">LMS</span>
        </span>
      </div>
      
      <nav className="mt-6 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-slate-600 hover:bg-gray-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-4 w-4 stroke-[1.5]",
                isActive ? "text-blue-600" : "text-slate-500 group-hover:text-slate-900"
              )} />
              {item.name}
              {isActive && (
                <div className="absolute -left-3 h-4 w-1 rounded-r-full bg-blue-600" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="absolute bottom-0 w-full border-t border-gray-100 p-4">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Status</p>
          <div className="mt-2 flex items-center text-xs text-green-600">
            <div className="mr-2 h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Operational
          </div>
        </div>
      </div>
    </aside>
  )
}
