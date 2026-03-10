"use client"
 
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from '../../lib/auth-context'
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"
 
export function OrgNavbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
 
  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="h-full px-8 flex items-center justify-between gap-8">
        
        {/* Universal Search */}
        <div className="flex-1 max-w-xl">
           <input 
             type="text"
             placeholder="Search courses, students, instructors..."
             className="w-full h-10 px-4 bg-[#F8FAFC] border border-gray-200 rounded-md text-[13px] text-slate-900 focus:outline-none focus:border-[#3B82F6] transition-all"
           />
        </div>
 
        {/* Administrative Actions */}
        <div className="flex items-center gap-6">
           {/* Notifications Link */}
           <button className="text-[13px] font-bold text-[#3B82F6] hover:underline">
              0 unread
           </button>
 
           {/* Profile Dropdown */}
           <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 group"
              >
                 <span className="text-[13px] font-bold text-slate-700 group-hover:text-slate-900">Admin</span>
                 <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
              </button>
 
              {profileOpen && (
                 <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                    <button 
                      onClick={() => { router.push("/org-admin/settings"); setProfileOpen(false) }}
                      className="w-full text-left px-4 py-2 text-[13px] font-bold text-slate-600 hover:bg-gray-50 hover:text-[#3B82F6]"
                    >
                       Profile
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button 
                      onClick={() => logout()}
                      className="w-full text-left px-4 py-2 text-[13px] font-bold text-rose-500 hover:bg-red-50"
                    >
                       Logout
                    </button>
                 </div>
              )}
           </div>
        </div>
 
      </div>
    </header>
  )
}
