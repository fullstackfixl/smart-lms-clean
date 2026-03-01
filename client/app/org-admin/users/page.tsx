"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Trash2, Loader2, AlertCircle,
  Mail, UserCheck, Users, GraduationCap, X, Send, Shield,
  RefreshCw, Clock, CheckCircle2, Plus
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { API_URL } from "@/lib/config"
import { toast } from "sonner"

interface OrgUser {
  _id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
  profile?: { fullName?: string; phone?: string }
}

interface Invite {
  _id: string
  email: string
  role: string
  expires_at: string
  created_at: string
}

type RoleFilter = "all" | "student" | "instructor" | "org_admin" | "parent"
type StatusFilter = "all" | "active" | "inactive"
type Tab = "users" | "invites"

const ROLE_COLORS: Record<string, string> = {
  org_admin: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  instructor: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  student: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  parent: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
}

function displayName(user: OrgUser) {
  return user.profile?.fullName || user.name || user.email.split("@")[0]
}

function initials(user: OrgUser) {
  const nm = displayName(user)
  return nm.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

export default function UsersPage() {
  const { token } = useAuth()
  const [users, setUsers] = useState<OrgUser[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [tab, setTab] = useState<Tab>("users")
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [resendingId, setResendingId] = useState<string | null>(null)

  const [showInvite, setShowInvite] = useState(false)
  const [inviteRole, setInviteRole] = useState<"instructor" | "student">("instructor")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)

  const loadData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (roleFilter !== "all") params.set("role", roleFilter)
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (searchTerm) params.set("search", searchTerm)

      const [usersRes, invitesRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/users/invites`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const usersJson = await usersRes.json()
      const invitesJson = await invitesRes.json()

      if (usersJson.success) setUsers(usersJson.data?.users || usersJson.data || [])
      else toast.error(usersJson.message || "Failed to load users")

      if (invitesJson.success) setInvites(invitesJson.data?.invites || [])
    } catch {
      toast.error("Network error — could not load data")
    } finally {
      setLoading(false)
    }
  }, [token, roleFilter, statusFilter, searchTerm])

  useEffect(() => { loadData() }, [loadData])

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return toast.error("Email is required")
    setInviting(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/users/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: inviteEmail.trim().toLowerCase(), role: inviteRole }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Invitation sent to ${inviteEmail}! 📧`)
        setShowInvite(false)
        setInviteEmail("")
        loadData()
      } else {
        toast.error(json.message || "Failed to send invitation")
      }
    } catch {
      toast.error("Network error — could not send invitation")
    } finally {
      setInviting(false)
    }
  }

  async function handleResendInvite(inviteId: string) {
    setResendingId(inviteId)
    try {
      const res = await fetch(`${API_URL}/api/admin/users/resend-invite/${inviteId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) toast.success("Invitation resent! 📧")
      else toast.error(json.message || "Failed to resend")
    } catch {
      toast.error("Network error")
    } finally {
      setResendingId(null)
    }
  }

  async function handleToggleStatus(userId: string, isActive: boolean) {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: !isActive }),
      })
      const json = await res.json()
      if (json.success) { toast.success(`User ${!isActive ? "activated" : "deactivated"}`); loadData() }
      else toast.error(json.message || "Failed to update status")
    } catch { toast.error("Network error") }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) { toast.success("User deleted"); loadData() }
      else toast.error(json.message || "Failed to delete")
    } catch { toast.error("Network error") }
  }

  const filtered = users.filter((u) => {
    const name = displayName(u).toLowerCase()
    const q = searchTerm.toLowerCase()
    return name.includes(q) || u.email.toLowerCase().includes(q)
  })

  const activeCount = users.filter((u) => u.status === "active").length
  const stats = [
    { label: "Total Users", value: users.length, icon: Users, color: "from-indigo-500 to-purple-600" },
    { label: "Instructors", value: users.filter((u) => u.role === "instructor").length, icon: GraduationCap, color: "from-purple-500 to-pink-500" },
    { label: "Students", value: users.filter((u) => u.role === "student").length, icon: UserCheck, color: "from-blue-500 to-cyan-500" },
    { label: "Active", value: activeCount, icon: Shield, color: "from-emerald-500 to-teal-500" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-1">
            User Management
          </h1>
          <p className="text-slate-400">All users in your organization — invite, manage, and monitor</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all"
        >
          <Mail className="w-5 h-5" />
          Invite User
        </motion.button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-slate-900/80 border border-slate-800/50 rounded-2xl p-5 flex items-center gap-4"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["users", "invites"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
              : "bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50"
              }`}
          >
            {t === "users" ? `Users (${users.length})` : `Pending Invites (${invites.length})`}
          </button>
        ))}
      </div>

      {/* === USERS TAB === */}
      {tab === "users" && (
        <>
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/80 border border-slate-800/50 rounded-2xl p-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadData()}
                  className="w-full h-11 pl-10 pr-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                className="h-11 px-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              >
                <option value="all">All Roles</option>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
                <option value="org_admin">Org Admin</option>
                <option value="parent">Parent</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="h-11 px-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </motion.div>

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/80 border border-slate-800/50 rounded-2xl overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="w-12 h-12 text-slate-600 mb-4" />
                <p className="text-slate-400 font-medium mb-1">No users found</p>
                <p className="text-slate-500 text-sm">Invite someone to get started.</p>
                <button
                  onClick={() => setShowInvite(true)}
                  className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-500 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Invite First User
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/40">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filtered.map((user, idx) => (
                        <motion.tr
                          key={user._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25 + idx * 0.04 }}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {initials(user)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-200">{displayName(user)}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${ROLE_COLORS[user.role] || "bg-slate-500/10 text-slate-400"}`}>
                              {user.role.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleStatus(user._id, user.status === "active")}
                              className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium transition-colors ${user.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                : "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20"
                                }`}
                            >
                              {user.status === "active" ? "● Active" : "○ Inactive"}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                            {(() => {
                              const raw = (user as any).createdAt || (user as any).created_at || (user as any).joinedAt
                              if (!raw) return <span className="text-slate-600">—</span>
                              const d = new Date(raw)
                              return isNaN(d.getTime()) ? <span className="text-slate-600">—</span> : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleDelete(user._id)}
                              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/50">
                  <p className="text-sm text-slate-400">
                    Showing <span className="font-medium text-slate-300">{filtered.length}</span> of{" "}
                    <span className="font-medium text-slate-300">{users.length}</span> users
                  </p>
                  <button onClick={loadData} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    ↻ Refresh
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}

      {/* === INVITES TAB === */}
      {tab === "invites" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/80 border border-slate-800/50 rounded-2xl overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
          ) : invites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mb-4" />
              <p className="text-slate-400 font-medium">No pending invitations</p>
              <p className="text-slate-500 text-sm mt-1">All invitations have been accepted.</p>
              <button
                onClick={() => setShowInvite(true)}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-500 transition-colors"
              >
                <Mail className="w-4 h-4" /> Send New Invite
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/40">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Expires</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {invites.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0">
                              <Clock className="w-4 h-4 text-slate-400" />
                            </div>
                            <span className="text-sm text-slate-200">{inv.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${ROLE_COLORS[inv.role] || "bg-slate-500/10 text-slate-400"}`}>
                            {inv.role.charAt(0).toUpperCase() + inv.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {new Date(inv.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleResendInvite(inv._id)}
                            disabled={resendingId === inv._id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-xs font-medium transition-all ml-auto disabled:opacity-50"
                          >
                            {resendingId === inv._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            Resend
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-slate-800/50 flex items-center justify-between">
                <p className="text-sm text-slate-400">{invites.length} pending invitation{invites.length !== 1 ? "s" : ""}</p>
                <button onClick={loadData} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">↻ Refresh</button>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* === INVITE MODAL === */}
      <AnimatePresence>
        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-slate-900 border border-slate-700/60 rounded-2xl p-7 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-100">Invite User</h3>
                  <p className="text-sm text-slate-400 mt-0.5">They'll receive a secure email to set up their account</p>
                </div>
                <button onClick={() => setShowInvite(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSendInvite} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Select Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["instructor", "student"] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setInviteRole(role)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${inviteRole === role
                          ? role === "instructor"
                            ? "border-purple-500/60 bg-purple-500/10 text-purple-400"
                            : "border-blue-500/60 bg-blue-500/10 text-blue-400"
                          : "border-slate-700/50 bg-slate-800/30 text-slate-500 hover:border-slate-600"
                          }`}
                      >
                        {role === "instructor" ? <GraduationCap className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="colleague@school.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60 outline-none transition-all"
                  />
                </div>

                <div className="flex items-start gap-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
                  <Mail className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400">
                    An invitation link will be emailed to them. They'll click it to create a password and join your organization as a{" "}
                    <span className="font-semibold text-slate-300">{inviteRole}</span>.
                  </p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowInvite(false)}
                    className="flex-1 h-12 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {inviting ? "Sending…" : "Send Invitation"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
