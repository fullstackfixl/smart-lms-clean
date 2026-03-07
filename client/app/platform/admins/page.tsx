"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Shield, 
  Plus, 
  Search, 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Calendar,
  MoreVertical,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  User
} from "lucide-react"
import { platformApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"

interface PlatformAdmin {
  _id: string
  name: string
  email: string
  role: string
  created_at: string
  last_login?: string
}

export default function PlatformAdminsPage() {
  const { token } = useAuth()
  const [admins, setAdmins] = useState<PlatformAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (token) {
      loadAdmins()
    }
  }, [token])

  const loadAdmins = async () => {
    setLoading(true)
    try {
      const response = await platformApi.listAdmins(token!)
      if (response.success) {
        setAdmins(response.data as PlatformAdmin[])
      }
    } catch (error) {
      console.error("Failed to load admins:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAdmins = admins.filter(admin => 
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Administrators</h1>
          <p className="text-slate-500 text-[13px] mt-1 font-medium">Manage platform-level access and administrative permissions.</p>
        </div>
        <button
          className="flex items-center gap-2 px-6 py-2.5 bg-[#2563EB] text-white rounded-lg text-[13px] font-bold hover:bg-[#1d4ed8] transition-all shadow-sm"
        >
          <UserPlus className="h-4 w-4" strokeWidth={2.5} />
          Invite Administrator
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <SmallCard label="Total Administrators" value={admins.length} icon={<Shield className="w-4 h-4 text-blue-600" />} />
        <SmallCard label="Active Sessions" value={admins.filter(a => a.last_login).length} icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />} />
        <SmallCard label="Access Requests" value="0" icon={<Clock className="w-4 h-4 text-amber-600" />} />
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <div className="relative w-full max-w-sm group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-[13px] text-slate-900 placeholder-slate-400 transition-all focus:border-[#2563EB]/30 focus:outline-none focus:ring-4 focus:ring-[#2563EB]/5 font-medium"
            />
          </div>
          <button 
            onClick={loadAdmins}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-[#2563EB] hover:bg-slate-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <RefreshCw className="h-8 w-8 text-[#2563EB] animate-spin opacity-40" />
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-slate-200" />
              </div>
              <h3 className="text-[15px] font-bold text-slate-900 mb-1">No administrators found</h3>
              <p className="text-[13px] text-slate-500">Your search didn't match any current admins.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Administrator</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">System Role</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Added On</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Activity Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdmins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs group-hover:bg-[#2563EB]/5 group-hover:text-[#2563EB] transition-colors">
                          {admin.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-slate-900">{admin.name}</div>
                          <div className="text-[11px] text-slate-400 font-medium">{admin.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm">
                        {admin.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[12px] text-slate-500 font-medium">
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${admin.last_login ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter">
                          {admin.last_login ? 'Active Session' : 'No recent login'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-[#2563EB]/5 transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function SmallCard({ label, value, icon }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
    </div>
  )
}
