"use client"
 
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from '../../lib/auth-context'
import { cn } from "../../lib/utils"
 
const navigationItems = [
  { name: "Dashboard", href: "/org-admin/dashboard" },
  { name: "Content", href: "/org-admin/content" },
  { name: "Courses", href: "/org-admin/courses" },
  { name: "Learners", href: "/org-admin/users?role=student" },
  { name: "Instructors", href: "/org-admin/users?role=instructor" },
  { name: "Invites", href: "/org-admin/users?tab=invites" },
  { name: "Reports", href: "/org-admin/reports" },
  { name: "Attendance", href: "/org-admin/attendance" },
  { name: "Exams", href: "/org-admin/exams" },
  { name: "Parent Portal", href: "/org-admin/parent-portal" },
  { name: "Settings", href: "/org-admin/settings" },
]
 
export function OrgSidebar() {
  const pathname = usePathname()
  const { organization } = useAuth()
 
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <Link href="/org-admin/dashboard" className="flex flex-col">
          <span className="text-[16px] font-bold text-slate-900 leading-none">
            {organization?.name || "Learnyst"}
          </span>
          <span className="text-[10px] text-blue-600 font-bold uppercase mt-1 tracking-tight">
            Org Admin
          </span>
        </Link>
      </div>
 
      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center h-10 px-3 text-[13px] font-bold transition-all relative group",
                isActive 
                  ? "text-[#3B82F6]" 
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <span>{item.name}</span>
              {isActive && (
                <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#3B82F6]" />
              )}
            </Link>
          )
        })}
      </nav>
 
      {/* Footer / Support */}
      <div className="p-6 border-t border-gray-100">
         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Support Hub</p>
         <button className="mt-2 text-[12px] font-bold text-[#3B82F6] hover:underline">
            Knowledge Base
         </button>
      </div>
    </div>
  )
}
