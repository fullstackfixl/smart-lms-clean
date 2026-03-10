"use client"
 
import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    User, Mail, Phone, MapPin, Calendar, Edit2, Save, X,
    Loader2, AlertCircle, Shield, GraduationCap, BookOpen, Award,
    Camera, Zap, ShieldCheck, Globe, Activity, Star, 
    ArrowUpRight, Target, Database, Layout, Sparkles
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { toast } from "sonner"
import { useAuth } from '../../lib/auth-context'
import { API_URL as API } from '../../lib/config'
import { cn } from "../../lib/utils"
 
const getToken = () =>
    typeof window !== "undefined"
        ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
        : null
 
const ROLE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
    student: { label: "Scholar", color: "blue", icon: <GraduationCap className="h-4 w-4" />, description: "Academic Identity" },
    instructor: { label: "Instructor", color: "indigo", icon: <BookOpen className="h-4 w-4" />, description: "Faculty Authority" },
    org_admin: { label: "Org Administrator", color: "amber", icon: <Shield className="h-4 w-4" />, description: "Institutional Governance" },
    platform_admin: { label: "Platform Direct", color: "rose", icon: <Shield className="h-4 w-4" />, description: "System Sovereignty" },
    parent: { label: "Guardian", color: "emerald", icon: <User className="h-4 w-4" />, description: "Support Network" },
    support: { label: "Support Operative", color: "teal", icon: <User className="h-4 w-4" />, description: "Operational Flux" },
}
 
const profileEndpoint = (role: string) => role === "student" ? "/student/profile" : "/api/users/profile"
const profileUpdateMethod = (role: string) => role === "student" ? "PATCH" : "PUT"
 
interface ProfileData {
    _id?: string
    name: string
    email: string
    phone?: string
    location?: string
    bio?: string
    avatar?: string
    role?: string
    created_at?: string
    enrollments_count?: number
    completed_courses?: number
    courses_count?: number
}
 
interface Props {
    role: string
}
 
export function UniversalProfilePage({ role }: Props) {
    const { user } = useAuth()
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [form, setForm] = useState({ name: "", phone: "", location: "", bio: "" })
 
    const fetchProfile = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const endpoint = profileEndpoint(role)
            const r = await fetch(`${API}${endpoint}`, {
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                credentials: "include"
            })
            const data = await r.json()
 
            if (data.success && data.data) {
                const raw = data.data.user || data.data
                const p: ProfileData = {
                    _id: raw._id,
                    name: raw.name || `${raw.profile?.firstName || ""} ${raw.profile?.lastName || ""}`.trim(),
                    email: raw.email,
                    phone: raw.phone || raw.profile?.phone || "",
                    location: raw.location || raw.profile?.location || "",
                    bio: raw.bio || raw.profile?.bio || "",
                    avatar: raw.avatar || raw.profile?.avatar || "",
                    role: raw.role,
                    created_at: raw.created_at || raw.createdAt,
                    enrollments_count: raw.enrollments_count,
                    completed_courses: raw.completed_courses,
                    courses_count: raw.courses_count,
                }
                setProfile(p)
                setForm({ name: p.name, phone: p.phone || "", location: p.location || "", bio: p.bio || "" })
            } else {
                if (user) {
                    const fallback: ProfileData = { name: user.name, email: user.email, role: user.role }
                    setProfile(fallback)
                    setForm({ name: user.name, phone: "", location: "", bio: "" })
                } else {
                    setError(data.message || "Identity link failure")
                }
            }
        } catch {
            if (user) {
                const fallback: ProfileData = { name: user.name, email: user.email, role: user.role }
                setProfile(fallback)
                setForm({ name: user.name, phone: "", location: "", bio: "" })
            } else {
                setError("Neural connection severed")
            }
        } finally {
            setLoading(false)
        }
    }, [role, user])
 
    useEffect(() => { fetchProfile() }, [fetchProfile])
 
    const handleSave = async () => {
        setSaving(true)
        try {
            const endpoint = profileEndpoint(role)
            const method = profileUpdateMethod(role)
            const nameParts = form.name.trim().split(" ")
            const body = role === "student"
                ? form
                : { firstName: nameParts[0] || "", lastName: nameParts.slice(1).join(" ") || "", phone: form.phone, bio: form.bio }
            const r = await fetch(`${API}${endpoint}`, {
                method,
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body)
            })
            const data = await r.json()
            if (data.success) {
                toast.success("Identity profile authorized.")
                setEditing(false)
                await fetchProfile()
            } else {
                toast.error(data.message || "Protocol update failed")
            }
        } catch {
            toast.error("Transmission failure")
        } finally {
            setSaving(false)
        }
    }
 
    const getInitials = (name: string) =>
        name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "I"
 
    const roleInfo = ROLE_LABELS[role] || ROLE_LABELS.student
 
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
                <div className="relative">
                  <div className="h-20 w-20 border-[6px] border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <User className="w-6 h-6 text-indigo-600 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                   <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.3em]">Synchronizing Executive Identity</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic animate-pulse">Establishing secure link...</p>
                </div>
            </div>
        )
    }
 
    if (error && !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
                <div className="h-20 w-20 rounded-[2rem] bg-rose-50 border border-rose-100 flex items-center justify-center">
                   <AlertCircle className="h-10 w-10 text-rose-500" />
                </div>
                <div className="text-center space-y-2">
                   <h3 className="text-2xl font-black text-slate-900 uppercase">Neural Error</h3>
                   <p className="text-[15px] font-medium text-slate-400 italic mb-4">{error}</p>
                   <Button onClick={fetchProfile} className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black">REBOOT LINK</Button>
                </div>
            </div>
        )
    }
 
    const displayName = profile?.name || user?.name || "Anonymous Operative"
    const displayEmail = profile?.email || user?.email || "unknown@instatute.com"
 
    return (
        <div className="max-w-[1200px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
            
            {/* ─── Executive Identity Hero ───────────────────────────────── */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
                <div className="relative overflow-hidden rounded-[4rem] bg-indigo-600 p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(79,70,229,0.3)]">
                    <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-white/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-0 p-12 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                        <ShieldCheck className="w-80 h-80 -ml-20 -mb-20 rotate-12" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
                        <div className="flex flex-col lg:flex-row items-center gap-12">
                           {/* Premium Avatar Cluster */}
                           <div className="relative shrink-0 group/avatar">
                              <div className="absolute -inset-4 bg-white/20 rounded-[3rem] blur-xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-700" />
                              <div className="relative h-44 w-44 rounded-[3rem] border-[6px] border-white/20 bg-white/5 overflow-hidden shadow-2xl transition-transform duration-700 group-hover/avatar:scale-105 group-hover/avatar:-rotate-2">
                                 {profile?.avatar ? (
                                   <img src={profile.avatar} alt={displayName} className="w-full h-full object-cover" />
                                 ) : (
                                   <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white bg-indigo-500">
                                      {getInitials(displayName)}
                                   </div>
                                 )}
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm">
                                    <Camera className="w-10 h-10 text-white" />
                                 </div>
                              </div>
                              <div className="absolute -bottom-2 -right-2 h-12 w-12 rounded-2xl bg-white border-[4px] border-indigo-600 flex items-center justify-center shadow-xl">
                                 <ShieldCheck className="w-6 h-6 text-indigo-600" />
                              </div>
                           </div>
 
                           <div className="text-center lg:text-left space-y-6">
                              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.25em] border border-white/20">
                                 {roleInfo.icon}
                                 {roleInfo.label}
                                 <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse" />
                              </div>
                              <div className="space-y-2">
                                 <h1 className="text-5xl lg:text-6xl font-black text-white tracking-[-0.04em] leading-tight">
                                    {displayName}
                                 </h1>
                                 <p className="text-[17px] font-bold text-indigo-100 opacity-70 tracking-tight">{displayEmail}</p>
                              </div>
                           </div>
                        </div>
 
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-4 min-w-[200px]">
                           {!editing ? (
                             <button
                               onClick={() => setEditing(true)}
                               className="h-16 px-10 bg-white text-indigo-600 rounded-2xl text-[14px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all group"
                             >
                               <Edit2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                               EDIT IDENTITY
                             </button>
                           ) : (
                             <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                                <button
                                  onClick={handleSave}
                                  disabled={saving}
                                  className="h-16 px-10 bg-emerald-500 text-white rounded-2xl text-[14px] font-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                  AUTHORIZE
                                </button>
                                <button
                                  onClick={() => { setEditing(false); setForm({ name: profile?.name || "", phone: profile?.phone || "", location: profile?.location || "", bio: profile?.bio || "" }) }}
                                  className="h-16 px-6 bg-white/10 text-white rounded-2xl text-[14px] font-black border border-white/20 hover:bg-white/20 transition-all"
                                >
                                  ABORT
                                </button>
                             </div>
                           )}
                        </div>
                    </div>
                </div>
            </div>
 
            {/* ─── Information Architecture ─────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
               
               {/* Identity Parameters */}
               <div className="lg:col-span-8 space-y-12">
                  <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-12 opacity-[0.02]">
                        <User className="w-64 h-64" />
                     </div>
                     
                     <div className="relative z-10 space-y-12">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                           <h3 className="text-[22px] font-black text-slate-900 tracking-tight">Identity Parameters</h3>
                           <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest italic">// Encrypted scholastic data</p>
                        </div>
 
                        {editing ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                             <div className="space-y-4 sm:col-span-2">
                                <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Legal Designation</Label>
                                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-16 rounded-xl bg-slate-50 border-none font-bold text-lg px-6 focus:ring-[8px] focus:ring-indigo-500/5 placeholder-slate-200" />
                             </div>
                             <div className="space-y-4">
                                <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Telephonic Uplink</Label>
                                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91..." className="h-16 rounded-xl bg-slate-50 border-none font-bold text-lg px-6 focus:ring-[8px] focus:ring-indigo-500/5 placeholder-slate-200" />
                             </div>
                             <div className="space-y-4">
                                <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Geospatial Context</Label>
                                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, State" className="h-16 rounded-xl bg-slate-50 border-none font-bold text-lg px-6 focus:ring-[8px] focus:ring-indigo-500/5 placeholder-slate-200" />
                             </div>
                             <div className="space-y-4 sm:col-span-2">
                                <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Professional Manifest (Bio)</Label>
                                <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Define your instructional ethos..." className="min-h-[160px] rounded-2xl bg-slate-50 border-none font-bold text-lg p-8 focus:ring-[8px] focus:ring-indigo-500/5 resize-none placeholder-slate-200" />
                             </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                             <IdentityField icon={<User color="#4F46E5" />} label="Designation" value={displayName} />
                             <IdentityField icon={<Mail color="#10B981" />} label="Digital Pulse" value={displayEmail} />
                             {profile?.phone && <IdentityField icon={<Phone color="#8B5CF6" />} label="Uplink" value={profile.phone} />}
                             {profile?.location && <IdentityField icon={<MapPin color="#F59E0B" />} label="Coordinate" value={profile.location} />}
                             
                             {profile?.created_at && (
                               <div className="flex items-center gap-6 group/field">
                                  <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover/field:bg-indigo-50 group-hover/field:border-indigo-100 transition-all duration-500">
                                     <Calendar className="w-6 h-6 text-slate-400 group-hover/field:text-indigo-600" />
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 leading-none mb-1.5">Consensus Registry</p>
                                     <p className="text-[17px] font-black text-slate-900 tracking-tight uppercase">
                                       ACTIVE SINCE {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                     </p>
                                  </div>
                               </div>
                             )}
 
                             {profile?.bio && (
                               <div className="sm:col-span-2 p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 relative group/bio">
                                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center absolute -top-4 -left-4 shadow-lg group-hover/bio:rotate-12 transition-transform">
                                     <Sparkles className="h-5 w-5 text-indigo-600 fill-indigo-600" />
                                  </div>
                                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 leading-none">// Professional ethos manifest</p>
                                  <p className="text-[16px] font-bold text-slate-600 leading-relaxed italic opacity-90">{profile.bio}</p>
                               </div>
                             )}
                          </div>
                        )}
                     </div>
                  </div>
               </div>
 
               {/* Strategic Insights Sidebar */}
               <div className="lg:col-span-4 space-y-12">
                  <div className="bg-[#020617] rounded-[4rem] p-12 shadow-[0_64_128px_-32px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                     <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[28rem] h-[28rem] bg-indigo-500/10 rounded-full blur-[100px] group-hover:bg-indigo-500/20 transition-all duration-[2000ms]" />
                     <div className="relative z-10 space-y-12">
                        <div className="flex items-center gap-4">
                           <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                              <Target className="h-7 w-7 text-indigo-400 animate-pulse" />
                           </div>
                           <h4 className="text-2xl font-black text-white tracking-tight">Identity Logic</h4>
                        </div>
                        
                        <div className="space-y-8">
                           {role === "student" && (
                              <div className="grid grid-cols-1 gap-6">
                                 <PerformanceStat label="Curriculum Streams" value={profile?.enrollments_count ?? 0} icon={<BookOpen className="text-blue-400" />} />
                                 <PerformanceStat label="Mastery Achieved" value={profile?.completed_courses ?? 0} icon={<Award className="text-emerald-400" />} />
                              </div>
                           )}
                           {role === "instructor" && (
                              <div className="grid grid-cols-1 gap-6">
                                 <PerformanceStat label="Curriculum Assets" value={profile?.courses_count ?? 0} icon={<Layers className="text-indigo-400" />} />
                                 <PerformanceStat label="Global Influence" value="PEAK" icon={<Activity className="text-amber-400" />} />
                              </div>
                           )}
                           
                           <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 backdrop-blur-xl group/node cursor-default">
                              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 leading-none">Security Protocol</p>
                              <p className="text-[15px] text-white/90 font-bold leading-relaxed mb-1">Authenticated Pulse</p>
                              <p className="text-[13px] text-white/40 font-medium italic leading-relaxed">Identity confirmed via neural encryption. All parameters synchronized with global registry.</p>
                           </div>
                        </div>
 
                        <button className="w-full h-20 bg-white text-[#020617] rounded-[2rem] text-[15px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                           <Layout className="w-6 h-6" />
                           ACCESS CONSOLE
                        </button>
                     </div>
                  </div>
 
                  <div className="p-12 rounded-[3.5rem] bg-white border border-slate-100 shadow-sm space-y-10">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic opacity-60 ml-1">// System health diagnostics</h4>
                     <div className="space-y-8">
                        <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                           <span className="text-[14px] font-black text-slate-900">IDENT DATA SYNC</span>
                           <span className="text-[14px] font-black text-emerald-600">HEALTHY</span>
                        </div>
                        <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                           <span className="text-[14px] font-black text-slate-900">NEURAL LINK</span>
                           <span className="text-[14px] font-black text-indigo-600">100% SECURE</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-300">
                           <Database className="w-5 h-5 opacity-40" />
                           <p className="text-[10px] font-black uppercase tracking-widest italic animate-pulse">Establishing scholastic uplink...</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
        </div>
    )
}
 
function IdentityField({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-6 group/field">
       <div className="h-16 w-16 rounded-[1.6rem] bg-slate-50 border border-slate-100 flex items-center justify-center group-hover/field:bg-indigo-50 group-hover/field:border-indigo-100 transition-all duration-500 shadow-sm group-hover/field:scale-110 group-hover/field:rotate-6">
          {icon}
       </div>
       <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 leading-none mb-2">{label}</p>
          <p className="text-[20px] font-black text-slate-900 tracking-tight leading-none truncate uppercase">{value}</p>
       </div>
    </div>
  )
}
 
function PerformanceStat({ label, value, icon }: any) {
  return (
    <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 backdrop-blur-xl flex items-center gap-6 hover:bg-white/10 transition-all cursor-default">
       <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
          {React.cloneElement(icon, { size: 28, strokeWidth: 3 })}
       </div>
       <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none mb-1.5">{label}</p>
          <p className="text-[28px] font-black text-white leading-none tracking-tighter">{value}</p>
       </div>
    </div>
  )
}
