"use client"

import { motion } from "framer-motion"
import { Users, Plus, Search, Filter } from "lucide-react"

export default function UsersPage() {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-gray-50 mb-2">Users</h1>
          <p className="text-lg text-gray-400">Manage platform users across all organizations</p>
        </div>
        <button className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:scale-105">
          <Plus className="h-5 w-5" strokeWidth={2} />
          Add User
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-slate-800/50 bg-slate-900/80 backdrop-blur-sm p-6 shadow-lg shadow-black/20"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search users..."
              className="h-10 w-full rounded-xl border border-slate-800/50 bg-slate-900/50 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-500 transition-all focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button className="flex h-10 items-center gap-2 rounded-xl border border-slate-800/50 bg-slate-800/30 px-4 text-sm font-medium text-gray-300 transition-colors hover:bg-slate-800/50">
            <Filter className="h-4 w-4" strokeWidth={1.5} />
            Filters
          </button>
        </div>

        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Users className="mx-auto h-16 w-16 text-gray-600 mb-4" strokeWidth={1.5} />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Users list coming soon</h3>
            <p className="text-gray-500">Connect to API to display users</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
