"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Bell, ChevronDown, Settings, LogOut, User, Command } from "lucide-react"
import { useAuth } from '../../lib/auth-context'

export function PlatformNavbar() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = () => {
    logout()
  }

  const getInitials = (name: string | undefined | null) => {
    if (!name) return '??'
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const initials = getInitials(user?.name)

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
      <div className="h-full px-10 flex items-center justify-between gap-10">
        {/* Search Bar Container */}
        <div className="flex-1 max-w-2xl">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
            </div>
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full h-12 pl-12 pr-12 bg-slate-100/50 border-transparent rounded-2xl text-[14px] text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-slate-200 transition-all duration-300 font-semibold"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-40 group-focus-within:opacity-100 transition-opacity duration-300">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-300 bg-white shadow-sm">
                <Command className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] font-black text-slate-500">K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-6">
          {/* Notifications Button */}
          <button className="relative p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all duration-300 group">
            <Bell className="w-6 h-6" />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-blue-500 rounded-full ring-4 ring-white" />
          </button>

          {/* Vertical Divider */}
          <div className="w-[1.5px] h-8 bg-slate-200/60" />

          {/* Profile Dropdown Component */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3.5 p-1.5 pr-4 rounded-2xl hover:bg-slate-50 transition-all duration-300 group border border-transparent hover:border-slate-100 shadow-sm hover:shadow-md"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-[11px] font-black text-white shadow-lg shadow-blue-500/10 group-hover:scale-105 transition-transform duration-300">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-[13px] font-black text-slate-900 leading-none">
                  {user?.name?.split(' ')[0] || "Admin"}
                </span>
                <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter opacity-80">
                  {user?.role === 'platform_admin' ? 'Super Admin' : 'Staff'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-500 ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setProfileOpen(false)}
                    className="fixed inset-0 z-40"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                    className="absolute right-0 mt-3 w-72 bg-white border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2rem] overflow-hidden z-50 p-2"
                  >
                    <div className="px-5 py-4 mb-2 bg-slate-50/50 rounded-2xl">
                      <p className="text-[14px] font-black text-slate-900 truncate">
                        {user?.name || "Platform Admin"}
                      </p>
                      <p className="text-[11px] font-bold text-slate-500 truncate mt-1">
                        {user?.email || "admin@platform.com"}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setProfileOpen(false)
                          router.push("/platform/settings")
                        }}
                        className="w-full flex items-center gap-3.5 px-4 py-3 text-[13px] font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
                      >
                        <User className="w-4 h-4" />
                        Account Profile
                      </button>
                      <button
                        onClick={() => {
                          setProfileOpen(false)
                          router.push("/platform/settings")
                        }}
                        className="w-full flex items-center gap-3.5 px-4 py-3 text-[13px] font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300"
                      >
                        <Settings className="w-4 h-4" />
                        System Settings
                      </button>
                    </div>

                    <div className="h-px bg-slate-100 my-2 mx-2" />
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3.5 px-4 py-3 text-[13px] font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all duration-300"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out session
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
