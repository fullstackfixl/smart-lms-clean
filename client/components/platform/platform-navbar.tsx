"use client"
 
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Bell, ChevronDown, Settings, LogOut, User, Menu } from "lucide-react"
import { useAuth } from '../../lib/auth-context'
import { cn } from "../../lib/utils"
 
export function PlatformNavbar() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
 
  return (
    <header className="sticky top-0 z-50 h-20 bg-white border-b border-gray-100 px-6 md:px-10 lg:px-12 flex items-center justify-between gap-8 transition-all duration-150">
      
      {/* Search Explorer */}
      <div className="flex-1 max-w-xl group">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-[#3B82F6] transition-colors" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search across organizations, users, metrics..."
            className="w-full h-11 pl-11 pr-4 bg-[#F8FAFC] border border-gray-100 rounded-md text-[13.5px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#3B82F6] focus:bg-white focus:border-[#3B82F6] transition-all"
          />
        </div>
      </div>
 
      {/* Right Controls */}
      <div className="flex items-center gap-6">
        
        {/* Signals */}
        <button className="relative p-2 text-slate-400 hover:text-[#3B82F6] hover:bg-blue-50/50 rounded-md transition-all group">
          <Bell className="w-5.5 h-5.5" strokeWidth={1.5} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>
 
        <div className="w-[1px] h-6 bg-gray-100" />
 
        {/* Identity Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 p-1 rounded-md hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 active:scale-95"
          >
            <div className="w-9 h-9 rounded-md bg-[#3B82F6] flex items-center justify-center text-[10px] font-bold text-white transition-transform duration-300">
               {user?.name?.slice(0, 2).toUpperCase() || "PA"}
            </div>
            <div className="hidden sm:flex flex-col items-start pr-2">
              <span className="text-[13.5px] font-bold text-slate-900 leading-none tracking-tight">
                {user?.name || "Admin"}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-80">
                {user?.role === 'platform_admin' ? 'Super Admin' : 'Staff'}
              </span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-slate-300 transition-transform duration-300", profileOpen && "rotate-180")} strokeWidth={1.5} />
          </button>
 
          {profileOpen && (
            <>
              <div 
                onClick={() => setProfileOpen(false)}
                className="fixed inset-0 z-40"
              />
              <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-200 rounded-md overflow-hidden z-50 p-1.5">
                <div className="px-4 py-3 mb-1 bg-[#F8FAFC] rounded-sm">
                   <p className="text-[13.5px] font-bold text-slate-900">{user?.name || "Admin"}</p>
                   <p className="text-[10px] text-slate-400 mt-0.5 truncate">{user?.email || "admin@platform.com"}</p>
                </div>
                
                <div className="space-y-0.5">
                   <NavbarOption 
                    label="Account Settings" 
                    icon={<User className="w-4 h-4" />} 
                    onClick={() => { setProfileOpen(false); router.push("/platform/settings"); }} 
                   />
                   <NavbarOption 
                    label="System Config" 
                    icon={<Settings className="w-4 h-4" />} 
                    onClick={() => { setProfileOpen(false); router.push("/platform/settings"); }} 
                   />
                </div>
 
                <div className="h-px bg-gray-100 my-1.5 mx-1" />
                
                <button
                  onClick={() => { logout(); setProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-bold text-red-500 hover:bg-red-50 rounded-sm transition-all text-left"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.5} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
 
function NavbarOption({ label, icon, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13.5px] font-bold text-slate-600 hover:text-[#3B82F6] hover:bg-blue-50/50 rounded-sm transition-all text-left"
    >
      <div className="w-4 h-4 opacity-70">{icon}</div>
      <span>{label}</span>
    </button>
  )
}
