"use client"
 
import { useState, useEffect, use, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  Globe, 
  Database, 
  Target, 
  Layers, 
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Fingerprint
} from "lucide-react"
import { platformApi } from '../../../../lib/api'
import { useRouter } from "next/navigation"
import { useAuth } from '../../../../lib/auth-context'
import { cn } from "../../../../lib/utils"
 
interface Organization {
  _id: string
  name: string
  email: string
  phone?: string
  plan: 'basic' | 'premium'
  status: 'active' | 'suspended'
  slug: string
  code: string
  created_at: string
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
  userCount?: number
  limits?: {
    maxUsers: number
    maxCourses: number
    maxStorage: number
  }
  usage?: {
    users: number
    courses: number
    storage: number
  }
}
 
function DetailContent({ id }: { id: string }) {
  const router = useRouter()
  const { token } = useAuth()
 
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
 
  useEffect(() => { loadOrganization() }, [id, token])
 
  const loadOrganization = async () => {
    if (!token) return
    setLoading(true)
    try {
      const response = await platformApi.getOrg(token, id)
      if (response.success && response.data) setOrganization(response.data as any)
    } catch { console.error("Telemetry failure") } finally { setLoading(false) }
  }
 
  const handleStatusToggle = async () => {
    if (!organization || !token) return
    setActionLoading(true)
    try {
      const newStatus = organization.status === 'active' ? 'suspended' : 'active'
      const response = await platformApi.updateOrgStatus(token, id, newStatus)
      if (response.success) await loadOrganization()
    } catch { console.error("Protocol error") } finally { setActionLoading(false) }
  }
 
  const handleDelete = async () => {
    if (!token) return
    setActionLoading(true)
    try {
      const response = await platformApi.deleteOrg(token, id)
      if (response.success) router.push('/platform/organizations')
    } catch { console.error("Decommission error") } finally { setActionLoading(false) }
  }
 
  if (loading) return (
     <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="h-16 w-16 border-[6px] border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em] animate-pulse">Syncing Audit Stream</p>
     </div>
  )
 
  if (!organization) return (
     <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8">
        <div className="w-24 h-24 rounded-[3rem] bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
           <ShieldAlert className="w-10 h-10 text-slate-200" />
        </div>
        <div className="space-y-2">
           <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Registry Missing</h3>
           <p className="text-[16px] font-medium text-slate-400 italic opacity-80">This institutional cluster is not identified in the global registry.</p>
        </div>
        <button onClick={() => router.push('/platform/organizations')} className="h-14 px-8 bg-[#020617] text-white rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
           ABORT TO NEXUS
        </button>
     </div>
  )
 
  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Audit Hero ────────────────────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[4rem] bg-[#020617] p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-indigo-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 p-12 opacity-[0.05]">
              <Fingerprint className="w-80 h-80 -ml-20 -mb-20 rotate-12" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-8 max-w-2xl text-white">
              <div className="flex items-center gap-4">
                 <button onClick={() => router.push('/platform/organizations')} className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/20 transition-all border border-white/10 group-hover:scale-110">
                    <ArrowLeft className="w-6 h-6" />
                 </button>
                 <div className="h-3 w-px bg-white/10 mx-2" />
                 <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.25em] border border-white/20">
                    <Target className="w-4 h-4" />
                    Institutional Identity
                 </div>
              </div>
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-black text-white tracking-[-0.04em] leading-[0.95]">
                  {organization.name.split(' ').map((word, i) => (
                    <span key={i} className={i === 0 ? "" : "text-indigo-400"}> {word} </span>
                  ))}
                </h1>
                <p className="text-[19px] font-medium text-slate-400 leading-relaxed max-w-xl opacity-90">
                  Comprehensive audit stream for {organization.name}. Monitor operational thresholds, connectivity logs, and administrative integrity across the institutional cluster.
                </p>
              </div>
            </div>
 
            <div className="flex flex-col gap-4 w-full max-w-sm">
                <button
                  onClick={handleStatusToggle}
                  disabled={actionLoading}
                  className={cn(
                    "h-20 w-full rounded-[2.2rem] text-[15px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-4",
                    organization.status === 'active' ? "bg-rose-600/10 text-rose-500 border border-rose-500/20 hover:bg-rose-600 hover:text-white" : "bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white"
                  )}
                >
                  {actionLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : organization.status === 'active' ? <><XCircle className="w-6 h-6" /> SUSPEND OPERATIONS</> : <><CheckCircle className="w-6 h-6" /> ACTIVATE CLUSTER</>}
                </button>
                <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => router.push(`/platform/organizations/${id}/edit`)} className="h-16 bg-white/10 text-white rounded-2xl border border-white/10 font-black text-[13px] uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                      <Edit className="w-4 h-4" /> RECONFIG
                   </button>
                   <button onClick={() => setShowDeleteModal(true)} className="h-16 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 font-black text-[13px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4" /> DECOMMISSION
                   </button>
                </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Metrics Cluster ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <StatsBlock label="Scholar Saturation" value={organization.usage?.users || 0} limit={organization.limits?.maxUsers || 1000} icon={<Users className="w-5 h-5" />} color="indigo" />
         <StatsBlock label="Curriculum Nodes" value={organization.usage?.courses || 0} limit={organization.limits?.maxCourses || 50} icon={<Layers className="w-5 h-5" />} color="emerald" />
         <StatsBlock label="Storage Allocation" value={organization.usage?.storage || 0} limit={organization.limits?.maxStorage || 500} icon={<Database className="w-5 h-5" />} color="blue" suffix="GB" />
      </div>
 
      {/* ─── Detail Surface ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         
         <div className="lg:col-span-12 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               
               {/* Institutional Profile */}
               <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 lg:p-14 shadow-sm space-y-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                     <Building2 className="w-40 h-40" />
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] font-serif italic">// Institutional Profile</h3>
                     <p className="text-3xl font-black text-slate-900 tracking-tight">Executive Identity</p>
                  </div>
 
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 relative z-10">
                     <InfoItem label="Primary Nexus" value={organization.name} icon={<Building2 className="w-4 h-4 text-indigo-500" />} />
                     <InfoItem label="Uplink Protocol" value={organization.email} icon={<Mail className="w-4 h-4 text-emerald-500" />} />
                     <InfoItem label="Operational Since" value={new Date(organization.created_at).toLocaleDateString()} icon={<Calendar className="w-4 h-4 text-blue-500" />} />
                     <InfoItem label="Identity Slug" value={organization.slug} icon={<Globe className="w-4 h-4 text-rose-500" />} />
                  </div>
 
                  <div className="pt-10 border-t border-slate-50 space-y-6">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Physical Presence</h4>
                     <div className="flex gap-4">
                        <MapPin className="w-5 h-5 text-slate-200 shrink-0" />
                        <p className="text-[15px] font-bold text-slate-500 leading-relaxed italic">
                           {organization.address ? (
                             `${organization.address.street || ''} ${organization.address.city || ''}, ${organization.address.state || ''} ${organization.address.zipCode || ''} ${organization.address.country || ''}`
                           ) : "No spatial configuration specified for this entity."}
                        </p>
                     </div>
                  </div>
               </div>
 
               {/* Connectivity & Logic */}
               <div className="bg-[#020617] rounded-[3.5rem] border border-white/5 p-12 lg:p-14 shadow-2xl space-y-12 text-white relative overflow-hidden group">
                  <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
                  
                  <div className="space-y-2 relative z-10">
                     <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] font-serif italic">// Logic configuration</h3>
                     <p className="text-3xl font-black text-white tracking-tight">Strategic Protocols</p>
                  </div>
 
                  <div className="space-y-8 relative z-10">
                     <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 space-y-6 group/item hover:bg-white/[0.08] transition-all">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Master Signature Code</p>
                        <div className="flex items-center justify-between">
                           <code className="text-2xl font-black font-mono tracking-tighter text-white">{organization.code}</code>
                           <button onClick={() => { navigator.clipboard.writeText(organization.code); }} className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all border border-white/10">
                              <Copy className="w-4 h-4 text-white/40" />
                           </button>
                        </div>
                     </div>
 
                     <div className="p-8 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between group/item">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Plan Tier</p>
                           <p className="text-xl font-black text-white uppercase italic tracking-tight">{organization.plan} PROTOCOL</p>
                        </div>
                        <ShieldCheck className="w-10 h-10 text-indigo-400 group-hover/item:scale-110 transition-transform" />
                     </div>
                  </div>
 
                  <div className="pt-6 relative z-10">
                     <div className="flex items-center gap-4 text-emerald-400 p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                        <span className="text-[12px] font-black uppercase tracking-widest">Node status: PEAK OPERATIONAL</span>
                     </div>
                  </div>
               </div>
 
            </div>
         </div>
      </div>
 
      {/* ─── Decommission Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[110] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[4rem] shadow-2xl p-16 max-w-lg w-full border border-slate-100 text-center space-y-10"
            >
              <div className="w-24 h-24 rounded-full bg-rose-50 flex items-center justify-center mx-auto border border-rose-100 shadow-inner">
                <ShieldAlert className="h-10 w-10 text-rose-500" strokeWidth={3} />
              </div>
              <div className="space-y-4">
                 <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Confirm Shutdown</h3>
                 <p className="text-[17px] font-medium text-slate-400 italic opacity-80 leading-relaxed max-w-sm mx-auto">
                    Authorization requested for the final deactivation of <strong>{organization.name}</strong>. This institutional cluster will be phased out immediately.
                 </p>
              </div>
              <div className="flex flex-col gap-4">
                 <button onClick={handleDelete} className="w-full h-20 bg-rose-600 text-white rounded-[2rem] text-[16px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-102 transition-all active:scale-95">
                    INITIATE SHUTDOWN
                 </button>
                 <button onClick={() => setShowDeleteModal(false)} className="w-full h-16 text-[13px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                    ABORT SEQUENCE
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
 
function StatsBlock({ label, value, limit, icon, color, suffix = "" }: any) {
  const percentage = Math.min((value / limit) * 100, 100)
  const colors: any = {
    indigo: "text-indigo-600 stroke-indigo-600 bg-indigo-50 border-indigo-100",
    emerald: "text-emerald-600 stroke-emerald-600 bg-emerald-50 border-emerald-100",
    blue: "text-blue-600 stroke-blue-600 bg-blue-50 border-blue-100"
  }
  const barColors: any = {
    indigo: "bg-indigo-600",
    emerald: "bg-emerald-600",
    blue: "bg-blue-600"
  }
  
  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group overflow-hidden relative">
       <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
          {icon}
       </div>
       <div className="relative z-10 space-y-8">
          <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-700 shadow-sm group-hover:scale-110 group-hover:rotate-6", colors[color])}>
             {icon}
          </div>
          <div className="space-y-6">
             <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{label}</p>
                <div className="flex items-baseline gap-3">
                   <p className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">{value}{suffix}</p>
                   <span className="text-[11px] font-black text-slate-400 italic">/ {limit}{suffix}</span>
                </div>
             </div>
             <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                   <span>Saturation Index</span>
                   <span>{percentage.toFixed(0)}%</span>
                </div>
                <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100/50 shadow-inner">
                   <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className={cn("h-full rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]", barColors[color])} />
                </div>
             </div>
          </div>
       </div>
    </div>
  )
}
 
function InfoItem({ label, value, icon }: any) {
  return (
    <div className="space-y-2 group/info">
       <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
          {icon}
          {label}
       </div>
       <p className="text-[17px] font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors uppercase italic truncate">{value || 'N/A'}</p>
    </div>
  )
}
 
export default function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  return (
    <Suspense fallback={
       <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
          <div className="h-16 w-16 border-[6px] border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
       </div>
    }>
       <DetailContent id={unwrappedParams.id} />
    </Suspense>
  )
}
