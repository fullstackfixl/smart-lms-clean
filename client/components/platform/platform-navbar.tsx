"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Bell, ChevronDown, Settings, LogOut } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function PlatformNavbar() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = () => {
    logout()
  }

  const initials = (user as any)?.name
    ? (user as any).name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "PA"

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search organizations, users..."
              className="w-full h-10 pl-10 pr-4 bg-slate-900/50 border border-slate-800/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-slate-950" />
          </motion.button>

          {/* Profile Dropdown */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800/50 rounded-xl transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                {initials}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </motion.button>

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
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-800/50 rounded-xl shadow-xl overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-slate-800/50">
                      <p className="text-sm font-medium text-slate-200">{user?.name || (user as any)?.full_name || "Platform Admin"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{user?.email || "platform@admin.com"}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setProfileOpen(false)
                          router.push("/platform/settings")
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-all"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
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
