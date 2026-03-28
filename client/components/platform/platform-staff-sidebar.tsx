"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../../lib/utils'
import {
  LayoutDashboard,
  Building2,
  FileText,
  GraduationCap,
  Users,
  BarChart3
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', href: '/platform-staff/dashboard', icon: LayoutDashboard },
  { name: 'Applications', href: '/platform-staff/applications', icon: GraduationCap },
  { name: 'Organizations', href: '/platform-staff/organizations', icon: Building2 },
  { name: 'Courses', href: '/platform-staff/courses', icon: FileText },
  { name: 'Users', href: '/platform-staff/users', icon: Users },
  { name: 'Analytics', href: '/platform-staff/analytics', icon: BarChart3 },
]

export function PlatformStaffSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] border-r border-slate-200 bg-white z-50">
      <div className="flex h-16 items-center px-6 border-b border-slate-100">
        <span className="text-[18px] font-extrabold tracking-tight text-slate-900">
          Platform<span className="text-orange-500">Staff</span>
        </span>
      </div>

      <nav className="mt-3 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group relative flex items-center rounded-lg px-3 py-2.5 text-[13px] font-semibold transition-colors duration-150',
                isActive
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-[18px] w-[18px] stroke-[1.75]',
                  isActive ? 'text-orange-700' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              {item.name}
              {isActive && <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-orange-500" />}
            </Link>
          )
        })}
      </nav>

      <div className="absolute bottom-0 w-full p-4">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform</p>
          <div className="mt-1 flex items-center text-xs font-medium text-slate-600">
            Staff Workspace
          </div>
        </div>
      </div>
    </aside>
  )
}
