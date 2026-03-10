"use client"
 
import { useState, useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  Save, 
  RefreshCw, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  ShieldCheck, 
  Zap, 
  Check, 
  X,
  Settings2,
  Database,
  ChevronDown,
  Sparkles
} from "lucide-react"
import { platformApi } from '../../../../../lib/api'
import { useRouter, useParams } from "next/navigation"
import { useAuth } from '../../../../../lib/auth-context'
import { cn } from "../../../../../lib/utils"
 
interface Organization {
  _id: string
  name: string
  email: string
  phone?: string
  plan: 'basic' | 'premium'
  address?: {
    street?: string
    city?: string
    state?: string
    country?: string
    zipCode?: string
  }
}
 
function EditContent() {
  const router = useRouter()
  const params = useParams()
  const { token } = useAuth()
  const id = params.id as string
 
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    plan: "basic" as 'basic' | 'premium',
    address: { street: "", city: "", state: "", country: "", zipCode: "" }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
 
  useEffect(() => { loadOrganization() }, [id, token])
 
  const loadOrganization = async () => {
    if (!token) return
    setLoading(true)
    try {
      const response = await platformApi.getOrg(token, id)
      if (response.success && response.data) {
        const org = response.data as any
        setFormData({
          name: org.name || "",
          email: org.email || "",
          phone: org.phone || "",
          plan: org.plan || "basic",
          address: {
            street: org.address?.street || "",
            city: org.address?.city || "",
            state: org.address?.state || "",
            country: org.address?.country || "",
            zipCode: org.address?.zipCode || ""
          }
        })
      }
    } catch { setError("Identity synchronization failure") } finally { setLoading(false) }
  }
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    setError("")
    try {
      const response = await platformApi.updateOrg(token, id, formData)
      if (response.success) router.push(`/platform/organizations/${id}`)
      else setError(response.error || "Configuration update failure")
    } catch { setError("Critical system failure during reconfiguration") } finally { setSaving(false) }
  }
 
  if (loading) return (
     <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-white">
        <div className="h-16 w-16 border-[6px] border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
     </div>
  )
 
  return (
    <div className="max-w-[1200px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Reconfig Hero ────────────────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[4rem] bg-[#020617] p-12 lg:p-20 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[100px]" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="space-y-6 text-white">
              <div className="flex items-center gap-4">
                 <button onClick={() => router.push(`/platform/organizations/${id}`)} className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all border border-white/10">
                    <ArrowLeft className="w-5 h-5" />
                 </button>
                 <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] border border-white/20">
                    <Settings2 className="w-3.5 h-3.5" />
                    System Reconfiguration
                 </div>
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter leading-none">
                Modify <span className="text-indigo-400">Identity.</span>
              </h1>
              <p className="text-[17px] font-medium text-slate-400 max-w-lg opacity-80 italic">
                Awaiting executive updates for the institutional parameters of {formData.name}.
              </p>
            </div>
            
            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl max-w-xs w-full text-center">
               <Database className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
               <p className="text-white/40 text-[11px] font-black uppercase tracking-widest leading-relaxed">Cluster ID: {id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Reconfig Form ────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-12">
        {error && (
          <div className="p-8 rounded-[2rem] bg-rose-50 border border-rose-100 text-rose-600 text-[14px] font-black flex items-center gap-4 animate-in slide-in-from-top-4">
            <ShieldCheck className="w-6 h-6 shrink-0" /> {error}
          </div>
        )}
 
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
           
           {/* Section: Core Parameters */}
           <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 lg:p-14 shadow-sm space-y-10">
              <div className="space-y-2">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-serif italic">// Core Parameters</h3>
                 <p className="text-3xl font-black text-slate-900 tracking-tight">Institutional DNA</p>
              </div>
 
              <div className="space-y-8">
                 <LogicInput 
                    label="Executive Identity" 
                    placeholder="Institutional Name" 
                    icon={<Building2 className="w-4 h-4" />} 
                    value={formData.name} 
                    onValueChange={(v: string) => setFormData({ ...formData, name: v })} 
                 />
                 <LogicInput 
                    label="Strategic Uplink (Email)" 
                    placeholder="admin@institution.edu" 
                    icon={<Mail className="w-4 h-4" />} 
                    value={formData.email} 
                    onValueChange={(v: string) => setFormData({ ...formData, email: v })} 
                 />
                 <div className="grid grid-cols-2 gap-8">
                    <LogicInput 
                       label="Response Line" 
                       placeholder="+1-000-0000" 
                       icon={<Phone className="w-4 h-4" />} 
                       value={formData.phone} 
                       onValueChange={(v: string) => setFormData({ ...formData, phone: v })} 
                    />
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Active Protocol</label>
                       <div className="relative group">
                          <select
                            value={formData.plan}
                            onChange={(e) => setFormData({ ...formData, plan: e.target.value as 'basic' | 'premium' })}
                            className="w-full h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 px-6 text-[14px] font-black appearance-none cursor-pointer focus:bg-white focus:ring-[10px] focus:ring-indigo-500/5 transition-all outline-none"
                          >
                             <option value="basic">Standard Protocol</option>
                             <option value="premium">Enterprise Protocol</option>
                          </select>
                          <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 pointer-events-none group-focus-within:text-indigo-500" />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
 
           {/* Section: Spatial Parameters */}
           <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 lg:p-14 shadow-sm space-y-10">
              <div className="space-y-2">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-serif italic">// Spatial configuration</h3>
                 <p className="text-3xl font-black text-slate-900 tracking-tight">Geographic Nexus</p>
              </div>
 
              <div className="space-y-8">
                 <LogicInput 
                    label="Primary Vector (Street)" 
                    placeholder="Operational Address" 
                    icon={<MapPin className="w-4 h-4" />} 
                    value={formData.address.street} 
                    onValueChange={(v: string) => setFormData({ ...formData, address: { ...formData.address, street: v } })} 
                 />
                 <div className="grid grid-cols-2 gap-8">
                    <LogicInput 
                       label="Regional Sector (City)" 
                       placeholder="City" 
                       value={formData.address.city} 
                       onValueChange={(v: string) => setFormData({ ...formData, address: { ...formData.address, city: v } })} 
                    />
                    <LogicInput 
                       label="Territory (State)" 
                       placeholder="State" 
                       value={formData.address.state} 
                       onValueChange={(v: string) => setFormData({ ...formData, address: { ...formData.address, state: v } })} 
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <LogicInput 
                       label="Nexus Code (ZIP)" 
                       placeholder="ZIP" 
                       value={formData.address.zipCode} 
                       onValueChange={(v: string) => setFormData({ ...formData, address: { ...formData.address, zipCode: v } })} 
                    />
                    <LogicInput 
                       label="Global Entity (Country)" 
                       placeholder="Country" 
                       icon={<Globe className="w-4 h-4" />} 
                       value={formData.address.country} 
                       onValueChange={(v: string) => setFormData({ ...formData, address: { ...formData.address, country: v } })} 
                    />
                 </div>
              </div>
           </div>
 
        </div>
 
        <div className="flex gap-6 items-center justify-end px-4">
           <button
              type="button"
              onClick={() => router.push(`/platform/organizations/${id}`)}
              className="h-20 px-12 text-[14px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
           >
              ABORT CHANGES
           </button>
           <button
              type="submit"
              disabled={saving}
              className="h-20 px-16 bg-[#020617] text-white rounded-[2rem] text-[16px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 disabled:opacity-30"
           >
              {saving ? <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" /> : <><Save className="h-6 w-6 text-indigo-500" /> Commit Updates</>}
           </button>
        </div>
      </form>
    </div>
  )
}
 
function LogicInput({ label, placeholder, icon, value, onValueChange }: any) {
  return (
    <div className="space-y-3 flex-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
      <div className="relative group">
        {icon && <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors pointer-events-none">{icon}</div>}
        <input
          required
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 px-6 text-[14px] font-black focus:ring-[10px] focus:ring-indigo-500/5 focus:bg-white transition-all outline-none",
            icon && "pl-14"
          )}
        />
      </div>
    </div>
  )
}
 
export default function EditOrganizationPage() {
  return (
    <Suspense fallback={
       <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
          <div className="h-16 w-16 border-[6px] border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
       </div>
    }>
       <EditContent />
    </Suspense>
  )
}
