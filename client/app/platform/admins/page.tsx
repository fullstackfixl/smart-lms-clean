"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  ShieldAlert,
  X,
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
  const router = useRouter()
  const [admins, setAdmins] = useState<PlatformAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    if (token) {
      loadAdmins()
    }
  }, [token, page, searchTerm])

  const loadAdmins = async () => {
    setLoading(true)
    try {
      const response = await platformApi.listAdmins(token!, { 
        page, 
        limit: 10,
        search: searchTerm || undefined 
      })
      if (response.success && response.data) {
        const payload = response.data as { admins: PlatformAdmin[], pagination: { pages: number } }
        setAdmins(payload.admins || [])
        setTotalPages(payload.pagination?.pages || 1)
      }
    } catch (error) {
      console.error("Failed to load admins:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Premium Platform Hero */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-[#0B0F1A] border border-slate-100 dark:border-slate-800/50 px-10 py-12 shadow-sm">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
              <Shield className="w-3 h-3" />
              Administrative Core
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Manage System <br /><span className="text-indigo-600">Guardians</span>
            </h1>
            <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
              Control platform-level access and govern administrative permissions. Ensure the integrity and security of your entire educational ecosystem.
            </p>
          </div>
          
          <button
            onClick={() => setShowInviteModal(true)}
            className="h-16 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[14px] font-black shadow-xl shadow-indigo-500/25 transition-all active:scale-95 flex items-center gap-3 self-start lg:self-center"
          >
            <UserPlus className="h-5 w-5" strokeWidth={3} />
            Provision New Guardian
          </button>
        </div>
      </div>

      {/* Intelligence Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <PlatformStat 
          label="Total Administrators" 
          value={admins.length} 
          icon={<Shield className="w-4 h-4" />} 
          color="indigo" 
          trend="SECURE"
        />
        <PlatformStat 
          label="Active Sessions" 
          value={admins.filter(a => a.last_login).length} 
          icon={<ShieldCheck className="w-4 h-4" />} 
          color="emerald" 
          trend="LIVE"
        />
        <PlatformStat 
          label="Access Requests" 
          value="0" 
          icon={<Clock className="w-4 h-4" />} 
          color="amber" 
          trend="0.0%"
        />
      </div>

      {/* Enterprise View Container */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-2">
           <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase tracking-widest text-[11px] opacity-40">Guardian Oversight Stream</h3>
           
           <div className="flex items-center gap-3">
              <div className="relative group min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Intelligence search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 w-full pl-12 pr-4 bg-white dark:bg-[#0B0F1A] border border-slate-100 dark:border-slate-800/50 rounded-2xl text-[13px] font-bold shadow-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/40 transition-all outline-none"
                />
              </div>
           </div>
        </div>

        <div className="bg-white dark:bg-[#0B0F1A] border border-slate-100 dark:border-slate-800/50 rounded-[2.5rem] shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <div className="h-12 w-12 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Core...</p>
              </div>
            ) : admins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-40 text-center">
                <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-8 border border-slate-100 dark:border-slate-800">
                  <User className="h-8 w-8 text-slate-200" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Zero Guardians Found</h3>
                <p className="text-[14px] font-medium text-slate-400 max-w-xs mx-auto leading-relaxed">Your search returned no matching administrators in the current platform core.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Administrator Identity</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Authorized Role</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Commit Date</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Pulse</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                  {admins.map((admin) => (
                    <tr key={admin._id} className="group hover:bg-indigo-50/[0.02] transition-colors cursor-default">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-900 dark:text-white font-black text-lg group-hover:bg-indigo-600 group-hover:text-white transition-all group-hover:rotate-3 shadow-sm group-hover:shadow-lg group-hover:shadow-indigo-500/20 border border-slate-100 dark:border-slate-800">
                            {admin.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight mb-0.5">{admin.name}</div>
                            <div className="flex items-center gap-2">
                               <Mail className="w-3 h-3 text-slate-300" />
                               <span className="text-[11px] text-slate-400 font-bold tracking-tight italic">{admin.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black px-3 py-1.5 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm uppercase tracking-widest">
                          {admin.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-500">
                           <Calendar className="w-3.5 h-3.5 opacity-40" />
                           <span className="text-[12px] font-bold tracking-tight">
                             {new Date(admin.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                           </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2.5">
                           <div className={`w-2 h-2 rounded-full ${admin.last_login ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse' : 'bg-slate-200'}`} />
                           <span className={`text-[11px] font-black uppercase tracking-widest ${admin.last_login ? 'text-emerald-600' : 'text-slate-400'}`}>
                             {admin.last_login ? 'Synchronized' : 'Offline'}
                           </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-600 hover:bg-indigo-500/10 border border-slate-100 dark:border-slate-800 transition-all">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 border border-slate-100 dark:border-slate-800 transition-all">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Premium Pagination */}
          {totalPages > 1 && (
            <div className="px-10 py-8 bg-slate-50/30 dark:bg-slate-900/30 border-t border-slate-50 dark:border-slate-800/30 flex items-center justify-between">
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">
                Cluster Page <span className="text-indigo-600 font-black">{page}</span> of <span className="text-slate-900 dark:text-white">{totalPages}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-5 py-2.5 text-[12px] font-black text-slate-600 dark:text-slate-300 bg-white dark:bg-[#0B0F1A] border border-slate-100 dark:border-slate-800 shadow-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  PREV
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-2 px-5 py-2.5 text-[12px] font-black text-white bg-slate-900 dark:bg-white dark:text-slate-900 shadow-sm rounded-xl hover:scale-105 disabled:opacity-30 transition-all"
                >
                  NEXT
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showInviteModal && (
          <InviteAdminModal 
            onClose={() => setShowInviteModal(false)} 
            onSuccess={() => {
              setShowInviteModal(false)
              loadAdmins()
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function PlatformStat({ label, value, icon, color, trend }: any) {
  const themes: any = {
    blue: "bg-blue-50 text-[#2563EB] border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    red: "bg-red-50 text-red-500 border-red-100",
  }
  
  return (
    <div className="bg-white dark:bg-[#0B0F1A] border border-slate-100 dark:border-slate-800/50 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
         {React.cloneElement(icon, { size: 60 })}
      </div>
      <div className={`p-3 rounded-xl ${themes[color]} w-fit border mb-6 group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
        <div className="flex items-baseline gap-3">
           <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
           {trend && (
             <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 ${trend === 'SECURE' || trend === 'LIVE' ? 'text-emerald-500' : 'text-slate-400'}`}>
                {trend}
             </span>
           )}
        </div>
      </div>
    </div>
  )
}

function InviteAdminModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { token } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    setLoading(true)
    setError("")

    try {
      const response = await platformApi.createAdmin(token, formData)
      if (response.success) {
        onSuccess()
      } else {
        setError(response.error || "Failed to provision administrator")
      }
    } catch (err) {
      setError("Critical failure during security provisioning")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="bg-white dark:bg-[#0B0F1A] rounded-[3.5rem] shadow-2xl p-0 max-w-xl w-full border border-slate-100 dark:border-slate-800/50 overflow-hidden"
      >
        <div className="p-10 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 text-indigo-600 text-[9px] font-black uppercase tracking-widest mb-2">
               Security Protocols
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Provision Guardian</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          {error && (
            <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[13px] font-black flex items-center gap-3">
              <ShieldAlert className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Full Identity
              </label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-14 pl-14 pr-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 text-[14px] font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0B0F1A] focus:border-indigo-500/40 outline-none transition-all shadow-sm"
                  placeholder="Guardian Name"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Network Identifier
              </label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-14 pl-14 pr-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 text-[14px] font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0B0F1A] focus:border-indigo-500/40 outline-none transition-all shadow-sm"
                  placeholder="guardian@platform.com"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Access Credentials
              </label>
              <div className="relative">
                <Shield className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full h-14 pl-14 pr-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 text-[14px] font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0B0F1A] focus:border-indigo-500/40 outline-none transition-all shadow-sm"
                  placeholder="••••••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-14 text-[13px] font-black text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all bg-slate-50 dark:bg-slate-900/50 rounded-2xl"
            >
              ABORT
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] h-14 bg-indigo-600 text-white rounded-2xl text-[14px] font-black hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3 px-8"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  INITIALIZE GUARDIAN
                  <ChevronRight className="w-5 h-5" strokeWidth={3} />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
