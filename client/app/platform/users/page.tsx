"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Plus, Search, Shield, ShieldCheck, Loader2, X, Eye, EyeOff, UserPlus } from "lucide-react"
import { useAuth } from '../../../lib/auth-context'
import { API_URL } from '../../../lib/config'
import { toast } from "sonner"

const getToken = () =>
  typeof window !== "undefined"
    ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
    : null

async function apiFetch(path: string, options?: RequestInit) {
  const r = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  })
  return r.json()
}

interface StaffMember {
  _id: string
  name: string
  email: string
  status: string
  createdAt: string
}

export default function UsersPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "platform_admin"
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    if (isAdmin) loadStaff()
    else setLoading(false)
  }, [isAdmin])

  const loadStaff = async () => {
    setLoading(true)
    try {
      const data = await apiFetch("/platform/staff")
      if (data.success) setStaff(data.data || [])
    } catch { }
    finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("All fields are required")
      return
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    setCreating(true)
    try {
      const data = await apiFetch("/platform/staff/create", {
        method: "POST",
        body: JSON.stringify(form),
      })
      if (data.success) {
        toast.success("Platform staff created successfully!")
        setShowModal(false)
        setForm({ name: "", email: "", password: "" })
        loadStaff()
      } else {
        toast.error(data.message || "Failed to create staff")
      }
    } catch {
      toast.error("Failed to create staff")
    } finally {
      setCreating(false)
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active"
    try {
      const data = await apiFetch(`/platform/staff/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      })
      if (data.success) {
        toast.success(`Staff ${newStatus === "active" ? "activated" : "suspended"}`)
        loadStaff()
      } else {
        toast.error(data.message || "Failed to update status")
      }
    } catch {
      toast.error("Failed to update status")
    }
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-50 mb-1">Platform Users</h1>
          <p className="text-sm text-gray-400">
            {isAdmin ? "Manage platform staff and view activity" : "View platform team members"}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500"
          >
            <UserPlus className="h-4 w-4" />
            Create Staff
          </button>
        )}
      </motion.div>

      {/* Stats */}
      {isAdmin && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: "Total Staff", value: staff.length, color: "text-indigo-400", bg: "bg-indigo-500/10" },
            { label: "Active", value: staff.filter(s => s.status === "active").length, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Suspended", value: staff.filter(s => s.status !== "active").length, color: "text-orange-400", bg: "bg-orange-500/10" },
          ].map((stat, i) => (
            <div key={i} className={`${stat.bg} rounded-xl p-4 border border-white/5`}>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Staff Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-slate-800/50 bg-slate-900/80 backdrop-blur-sm overflow-hidden shadow-lg"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
          </div>
        ) : !isAdmin ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Shield className="h-12 w-12 text-slate-700 mb-3" />
            <h3 className="text-base font-semibold text-slate-300 mb-1">Staff View Only</h3>
            <p className="text-sm text-slate-500">Only Platform Admins can manage staff accounts.</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="h-12 w-12 text-slate-700 mb-3" />
            <h3 className="text-base font-semibold text-slate-300 mb-1">No Staff Members</h3>
            <p className="text-sm text-slate-500 mb-4">Create your first platform staff member.</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              + Create Staff
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s._id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold">
                        {s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-200">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">{s.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => toggleStatus(s._id, s.status)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${s.status === 'active' ? 'text-orange-400 hover:bg-orange-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                    >
                      {s.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Create Staff Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[70]"
            >
              <div className="bg-slate-900 border border-slate-800/50 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-400" />
                    Create Platform Staff
                  </h2>
                  <button onClick={() => setShowModal(false)} className="p-1 text-slate-500 hover:text-white transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Full Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Email Address</label>
                    <input
                      type="email"
                      placeholder="staff@example.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Password</label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        placeholder="Min 6 characters"
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        className="w-full h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 px-4 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      />
                      <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/15 p-3">
                    <p className="text-[11px] text-indigo-300/70">
                      <strong className="text-indigo-300">Role: Platform Staff</strong> — Can view orgs, approve applications, review courses. Cannot access admin settings or create other admins.
                    </p>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-slate-800/50 flex justify-end gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-50 transition-all"
                  >
                    {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                    Create Staff
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
