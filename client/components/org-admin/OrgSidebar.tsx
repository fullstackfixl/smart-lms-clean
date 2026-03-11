"use client"
 
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from '../../lib/auth-context'
import { cn } from "../../lib/utils"
 
export function OrgSidebar() {
  const pathname = usePathname()
  const { organization } = useAuth()
  const orgType = organization?.type?.toUpperCase() || 'COLLEGE'

  // Base items common to all
  const navItems = [
    { name: "Dashboard", href: "/org-admin/dashboard" },
    { name: "Courses", href: "/org-admin/courses" },
    { name: "Applications", href: "/org-admin/applications" },
  ]

  // Type-specific extensions
  if (orgType === 'COLLEGE' || orgType === 'UNIVERSITY') {
    navItems.push(
      { name: "Departments", href: "/org-admin/departments" },
      { name: "Programs", href: "/org-admin/programs" },
      { name: "Academic Years", href: "/org-admin/academic-year" },
      { name: "Batches", href: "/org-admin/batches" }
    )
  } else if (orgType === 'SCHOOL') {
    navItems.push(
      { name: "Classes", href: "/org-admin/grade-levels" },
      { name: "Sections", href: "/org-admin/grades-sections" },
      { name: "Homework", href: "/org-admin/homework" },
      { name: "Attendance", href: "/org-admin/attendance" }
    )
  } else if (orgType === 'CORPORATE') {
    navItems.push(
      { name: "Trainers", href: "/org-admin/trainers" },
      { name: "Skills", href: "/org-admin/skills" },
      { name: "Assignments", href: "/org-admin/training-assignments" }
    )
  } else {
    // Institute / Coaching / Others
    navItems.push(
      { name: "Subjects", href: "/org-admin/subjects" },
      { name: "Attendance", href: "/org-admin/attendance" },
      { name: "Batches", href: "/org-admin/batches" }
    )
  }

  // Common management items at the bottom
  navItems.push(
    { name: "Learners", href: "/org-admin/users?role=student" },
    { name: "Instructors", href: "/org-admin/users?role=instructor" },
    { name: "Settings", href: "/org-admin/settings" }
  )

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <Link href="/org-admin/dashboard" className="flex flex-col">
          <span className="text-[16px] font-bold text-slate-900 leading-none">
            {organization?.name || "Learnyst"}
          </span>
          <span className="text-[10px] text-blue-600 font-bold uppercase mt-1 tracking-tight">
            {orgType} ADMIN
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
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
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#3B82F6] rounded-r-full" />
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
