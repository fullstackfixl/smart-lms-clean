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
  Settings,
  ClipboardList,
  History,
  ShieldCheck
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', href: '/platform/dashboard', icon: LayoutDashboard },
  { name: 'Organizations', href: '/platform/organizations', icon: Building2 },
  { name: 'Courses', href: '/platform/courses', icon: FileText },
  { name: 'Users & Roles', href: '/platform/users', icon: Users },
  { name: 'Staff Management', href: '/platform/staff', icon: ShieldCheck },
  { name: 'Analytics', href: '/platform/analytics', icon: BarChart3 },
  { name: 'Reports', href: '/platform/reports', icon: ClipboardList },
  { name: 'Audit Logs', href: '/platform/audit-logs', icon: History },
  { name: 'Billing', href: '/platform/billing', icon: CreditCard },
  { name: 'Settings', href: '/platform/settings', icon: Settings },
]

export function PlatformSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] border-r border-gray-200 bg-white z-50">
      <div className="flex h-16 items-center px-6">
        <span className="text-xl font-bold tracking-tight text-slate-900">
          Insta<span className="text-blue-500">tute</span>
        </span>
      </div>
      
      <nav className="mt-4 space-y-0.5 px-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                isActive 
                  ? "text-blue-600 relative" 
                  : "text-slate-600 hover:bg-gray-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "mr-3 h-4 w-4 stroke-[1.5]",
                isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
              )} />
              {item.name}
              {isActive && (
                <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-blue-500/80 rounded-full mt-1" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="absolute bottom-0 w-full p-4">
        <div className="rounded-md border border-gray-100 bg-gray-50/50 p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform</p>
          <div className="mt-1 flex items-center text-xs font-medium text-slate-600">
            Enterprise Edition
          </div>
        </div>
      </div>
    </aside>
  )
}
