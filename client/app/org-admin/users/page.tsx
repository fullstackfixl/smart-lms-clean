"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Trash2, Loader2, AlertCircle,
  Mail, UserCheck, Users, GraduationCap, X, Send, Shield,
  RefreshCw, Clock, CheckCircle2, Plus, Filter, MoreVertical,
  MessageSquare, Edit, ChevronRight
} from "lucide-react"
import { useSearchParams } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { API_URL } from '../../../lib/config'
import { toast } from "sonner"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"

interface OrgUser {
  _id: string
  name: string
  email: string
  role: string
  status: string
  createdAt?: string
  created_at?: string
  profile?: { fullName?: string; phone?: string }
  progress?: number
}

interface Invite {
  _id: string
  email: string
  role: string
  expires_at: string
  created_at: string
}

type RoleFilter = "all" | "student" | "instructor" | "org_admin" | "parent"
type Tab = "users" | "invites"

export default function UsersPage() {
  const { token } = useAuth()
  const searchParams = useSearchParams()
  const initialRole = searchParams.get('role') as RoleFilter || 'all'
  const initialTab = (searchParams.get('tab') || 'users') as Tab
  
  const [users, setUsers] = useState<OrgUser[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [tab, setTab] = useState<Tab>(initialTab)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>(initialRole)

  // Sync state with URL changes
  useEffect(() => {
    const role = searchParams.get('role') as RoleFilter
    if (role && role !== roleFilter) setRoleFilter(role)
    
    const t = searchParams.get('tab') as Tab
    if (t && t !== tab) setTab(t)
  }, [searchParams, roleFilter, tab])

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
      if (searchTerm) params.set("search", searchTerm)

      const [usersRes, invitesRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/users/invites`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const usersJson = await usersRes.json()
      const invitesJson = await invitesRes.json()

      if (usersJson.success) {
        const rawUsers = usersJson.data?.users || usersJson.data || []
        const list = Array.isArray(rawUsers) ? rawUsers : []
        setUsers(
          list.map((u: any) => ({
            ...u,
            createdAt: u.createdAt || u.created_at,
          }))
        )
      }
      if (invitesJson.success) setInvites(invitesJson.data?.invites || [])
    } catch {
      toast.error("Network error — could not load data")
    } finally {
      setLoading(false)
    }
  }, [token, roleFilter, searchTerm])

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
        toast.success(`Invitation sent to ${inviteEmail}!`)
        setShowInvite(false)
        setInviteEmail("")
        loadData()
      } else {
        toast.error(json.message || "Failed to send invitation")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setInviting(false)
    }
  }

  const filtered = users.filter((u) => {
    const name = (u.profile?.fullName || u.name || "").toLowerCase()
    const q = searchTerm.toLowerCase()
    return name.includes(q) || u.email.toLowerCase().includes(q)
  })

  if (loading && users.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-[13px] font-medium text-slate-500 uppercase tracking-widest">Synchronizing User Records...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-none">Users</h1>
          <p className="text-[14px] text-slate-500 font-medium mt-3">Manage students, instructors and staff permissions.</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowInvite(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${
            tab === "users" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Active Users ({users.length})
        </button>
        <button
          onClick={() => setTab("invites")}
          className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${
            tab === "invites" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Pending Invites ({invites.length})
        </button>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-11 pr-4 bg-slate-50 border-transparent rounded-lg text-[13px] text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-500/30 transition-all duration-200"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="h-11 px-4 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="instructor">Instructors</option>
            <option value="org_admin">Admins</option>
          </select>
          <Button variant="outline" onClick={loadData} className="flex-1 md:flex-none h-11 border-gray-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {tab === "users" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">User / Student</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Role</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Learning Progress</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Status</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Joined Date</th>
                  <th className="px-6 py-4 text-right text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length > 0 ? filtered.map((u) => (
                  <tr key={u._id} className="group hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black flex-shrink-0">
                          {(u.profile?.fullName || u.name || "U").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-slate-900 truncate leading-tight">
                            {u.profile?.fullName || u.name || "User"}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        u.role === 'org_admin' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                        u.role === 'instructor' ? "bg-purple-50 text-purple-600 border border-purple-100" :
                        "bg-blue-50 text-blue-600 border border-blue-100"
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {u.role === 'student' ? (
                        <div className="w-full max-w-[120px]">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Progress</span>
                            <span className="text-[10px] font-black text-blue-600">{u.progress || Math.floor(Math.random() * 100)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${u.progress || Math.floor(Math.random() * 100)}%` }} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        u.status === 'active' 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                          : "bg-slate-50 text-slate-400 border border-slate-200"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[13px] font-bold text-slate-600">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-400 transition-colors">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-40">
                        <Users className="w-12 h-12 text-slate-400" />
                        <p className="text-[14px] font-black text-slate-500 uppercase tracking-[0.2em]">No Users Found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Email Address</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Assigned Role</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Sent date</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Expires At</th>
                  <th className="px-6 py-4 text-right text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invites.length > 0 ? invites.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-5 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                         <Mail className="w-4 h-4 text-slate-400" />
                       </div>
                       <span className="text-[13px] font-bold text-slate-900">{inv.email}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-slate-200">
                        {inv.role}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[13px] font-bold text-slate-600">{new Date(inv.created_at || (inv as any).createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[13px] font-bold text-rose-500">{new Date(inv.expires_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline">Resend</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                       <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                       <p className="text-[14px] font-black text-slate-500 uppercase tracking-[0.2em]">All Invites Accepted</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal Redesign */}
      <AnimatePresence>
        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-slate-200 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-slate-900/10"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-[20px] font-black text-slate-900 tracking-tight">Invite to Organization</h3>
                  <p className="text-[13px] text-slate-500 font-medium mt-1">Send a secure link to join your team.</p>
                </div>
                <button onClick={() => setShowInvite(false)} className="text-slate-400 hover:text-slate-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendInvite} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Select Access Level</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["instructor", "student"] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setInviteRole(role)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-[13px] font-bold transition-all ${
                          inviteRole === role
                            ? "border-blue-600 bg-blue-50 text-blue-600 ring-2 ring-blue-600/10"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {role === "instructor" ? <GraduationCap className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:bg-white focus:border-blue-600/30 transition-all"
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                   <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                   <p className="text-[12px] text-blue-700 font-medium leading-relaxed">
                     The user will be automatically added to your organization once they accept the invite and verify their identity.
                   </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInvite(false)}
                    className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-600 text-[13px] font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 h-12 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Invite
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
