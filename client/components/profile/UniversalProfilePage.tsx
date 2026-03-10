"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
    User, Mail, Phone, MapPin, Calendar, Edit2, Save, X,
    Loader2, AlertCircle, Shield, GraduationCap, BookOpen, Award,
    Camera, Zap, ShieldCheck, Globe, Activity, Star, 
    ArrowUpRight, Target, Database, Layout, Sparkles, Layers,
    CheckCircle2
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { toast } from "sonner"
import { useAuth } from '../../lib/auth-context'
import { API_URL as API } from '../../lib/config'
import { 
  SimpleCard, 
  SimpleBadge 
} from '../../components/platform/ui-standard'
import { cn } from "../../lib/utils"
 
const getToken = () =>
    typeof window !== "undefined"
        ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
        : null
 
const ROLE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
    student: { label: "Student", color: "blue", icon: <GraduationCap className="h-4 w-4" />, description: "Academic Account" },
    instructor: { label: "Instructor", color: "indigo", icon: <BookOpen className="h-4 w-4" />, description: "Faculty Member" },
    org_admin: { label: "Administrator", color: "amber", icon: <Shield className="h-4 w-4" />, description: "Organization Admin" },
    platform_admin: { label: "Platform Admin", color: "rose", icon: <Shield className="h-4 w-4" />, description: "System Administrator" },
    parent: { label: "Parent", color: "emerald", icon: <User className="h-4 w-4" />, description: "Learning Guardian" },
    support: { label: "Support", color: "teal", icon: <User className="h-4 w-4" />, description: "Customer Support" },
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
                    setError(data.message || "Failed to load profile data")
                }
            }
        } catch {
            if (user) {
                const fallback: ProfileData = { name: user.name, email: user.email, role: user.role }
                setProfile(fallback)
                setForm({ name: user.name, phone: "", location: "", bio: "" })
            } else {
                setError("Network connection issue")
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
                toast.success("Profile updated successfully.")
                setEditing(false)
                await fetchProfile()
            } else {
                toast.error(data.message || "Failed to update profile")
            }
        } catch {
            toast.error("Network error during update")
        } finally {
            setSaving(false)
        }
    }
 
    const getInitials = (name: string) =>
        name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "U"
 
    const roleInfo = ROLE_LABELS[role] || ROLE_LABELS.student
 
    const displayName = profile?.name || user?.name || "User"
    const displayEmail = profile?.email || user?.email || "user@platform.com"

    return (
        <div className="space-y-10 pb-20">
            {/* ─── Profile Header ────────────────────────────────────────── */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl opacity-60" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="h-40 w-40 rounded-[2.5rem] border-4 border-white bg-slate-50 overflow-hidden shadow-xl transition-all duration-500 group-hover:scale-105 group-hover:rotate-2">
                                {profile?.avatar ? (
                                    <img src={profile.avatar} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-indigo-600 bg-indigo-50/50">
                                        {getInitials(displayName)}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                                    <Camera className="w-10 h-10 text-white" />
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-white border-2 border-emerald-500 flex items-center justify-center shadow-lg transform rotate-6">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 stroke-[3]" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">{displayName}</h1>
                                <div className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-2",
                                    role === 'instructor' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-blue-50 text-blue-600 border-blue-100"
                                )}>
                                    {roleInfo.icon}
                                    {roleInfo.label}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-bold text-slate-500">{displayEmail}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{roleInfo.description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {!editing ? (
                            <Button
                                onClick={() => setEditing(true)}
                                className="h-14 px-8 bg-slate-900 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest gap-3 shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all"
                            >
                                <Edit2 className="w-4 h-4 stroke-[3]" />
                                Modify Profile
                            </Button>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest gap-3 shadow-xl shadow-indigo-500/20"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Commit Changes
                                </Button>
                                <Button
                                    onClick={() => { setEditing(false); setForm({ name: profile?.name || "", phone: profile?.phone || "", location: profile?.location || "", bio: profile?.bio || "" }) }}
                                    variant="outline"
                                    className="h-14 px-8 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-500 hover:bg-slate-50"
                                >
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Profile Content ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* Account Details */}
                <div className="lg:col-span-8 space-y-10">
                    <SimpleCard className="p-12 border-slate-100 shadow-sm bg-white rounded-[2.5rem] overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.015] pointer-events-none group-hover:opacity-[0.03] transition-opacity">
                            <User className="w-64 h-64" />
                        </div>
                        
                        <div className="space-y-12 relative z-10">
                            <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Account Information</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-70">Personal & professional identity metrics</p>
                            </div>

                            {editing ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-3 sm:col-span-2">
                                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Legal Name</Label>
                                        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-14 rounded-2xl bg-slate-50/50 border-slate-100 font-bold px-6 text-slate-900 focus:ring-4 focus:ring-indigo-500/5" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Phone</Label>
                                        <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1..." className="h-14 rounded-2xl bg-slate-50/50 border-slate-100 font-bold px-6 text-slate-900 focus:ring-4 focus:ring-indigo-500/5" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Primary Location</Label>
                                        <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, Country" className="h-14 rounded-2xl bg-slate-50/50 border-slate-100 font-bold px-6 text-slate-900 focus:ring-4 focus:ring-indigo-500/5" />
                                    </div>
                                    <div className="space-y-3 sm:col-span-2">
                                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Professional Bio</Label>
                                        <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Share your professional journey or instructional approach..." className="min-h-[160px] rounded-[2rem] bg-slate-50/50 border-slate-100 font-bold p-8 resize-none text-slate-900 focus:ring-4 focus:ring-indigo-500/5" />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                                    <IdentityField icon={<User className="text-indigo-600" />} label="Full Identity Name" value={displayName} />
                                    <IdentityField icon={<Mail className="text-emerald-600" />} label="Registered Email" value={displayEmail} />
                                    <IdentityField icon={<Phone className="text-purple-600" />} label="Contact String" value={profile?.phone || "Registry Empty"} />
                                    <IdentityField icon={<MapPin className="text-orange-600" />} label="Operating Location" value={profile?.location || "Not Geographic"} />
                                    
                                    <div className="flex items-center gap-6 group/field">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 transition-all duration-500 group-hover/field:bg-white group-hover/field:border-indigo-100 group-hover/field:text-indigo-600 shadow-sm">
                                            <Calendar className="w-6 h-6 stroke-[2.5]" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-2">Member Since</p>
                                            <p className="text-lg font-black text-slate-900 tracking-tight uppercase">
                                                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "N/A"}
                                            </p>
                                        </div>
                                    </div>

                                    {profile?.bio && (
                                        <div className="sm:col-span-2 p-8 rounded-[2rem] bg-indigo-50/30 border border-indigo-100 relative mt-4 shadow-sm hover:shadow-lg transition-all">
                                            <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center absolute -top-4 -left-4 shadow-xl rotate-3">
                                                <Sparkles className="h-5 w-5" />
                                            </div>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 leading-none italic opacity-70">Instructional Vision & Approach</p>
                                            <p className="text-base font-bold text-slate-600 leading-relaxed italic line-clamp-6">{profile.bio}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </SimpleCard>
                </div>

                {/* Sidebar Metrics */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all duration-1000" />
                        <div className="relative z-10 space-y-10">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-lg">
                                    <Target className="h-6 h-6 text-indigo-400" />
                                </div>
                                <h4 className="text-xl font-black text-white tracking-tight uppercase">Platform Engagement</h4>
                            </div>
                            
                            <div className="space-y-6">
                                {role === "student" && (
                                    <>
                                        <PerformanceStat label="Enrolled Courses" value={profile?.enrollments_count ?? 0} icon={<BookOpen className="text-indigo-400" />} />
                                        <PerformanceStat label="Courses Completed" value={profile?.completed_courses ?? 0} icon={<Award className="text-emerald-400" />} />
                                    </>
                                )}
                                {role === "instructor" && (
                                    <>
                                        <PerformanceStat label="Curriculum Count" value={profile?.courses_count ?? 0} icon={<Layers className="text-indigo-400" />} />
                                        <PerformanceStat label="Account Status" value="PREMIUM" icon={<Activity className="text-orange-400" />} />
                                    </>
                                )}
                                
                                <div className="p-8 rounded-[1.5rem] bg-white/5 border border-white/5 backdrop-blur-md transition-all group-hover:bg-white/10">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 leading-none">Security Status</p>
                                    <p className="text-base text-white font-black leading-tight mb-2">Verified Identity</p>
                                    <p className="text-[11px] text-slate-400 font-medium italic leading-relaxed">Account authenticated via standard system protocols.</p>
                                </div>
                            </div>

                            <Button onClick={() => window.location.href = `/${role}/dashboard`} className="w-full h-16 bg-white text-slate-900 hover:bg-slate-100 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] transition-all">
                                <Layout className="w-5 h-5" />
                                Access Dashboard
                            </Button>
                        </div>
                    </div>

                    <div className="p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm space-y-8">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-60 ml-1">Registry Integrity</h4>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active Link</span>
                                <SimpleBadge variant="green" className="py-1 px-3 h-6 text-[9px] font-black">STABLE</SimpleBadge>
                            </div>
                            <div className="flex items-center justify-between pb-6 border-b border-slate-50">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Verification</span>
                                <SimpleBadge variant="blue" className="py-1 px-3 h-6 text-[9px] font-black">COMPLIANT</SimpleBadge>
                            </div>
                            <div className="flex items-center gap-4 text-slate-300">
                                <Database className="w-5 h-5 opacity-40 text-slate-400" />
                                <p className="text-[10px] font-black uppercase tracking-widest italic text-slate-400">Registry sync complete</p>
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
       <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover/field:bg-white group-hover/field:border-indigo-100 group-hover/field:text-indigo-600 transition-all duration-500 text-slate-300 shadow-sm group-hover/field:shadow-md group-hover/field:rotate-3">
          {React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}
       </div>
       <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-2">{label}</p>
          <p className="text-lg font-black text-slate-900 tracking-tight leading-none truncate uppercase">{value}</p>
       </div>
    </div>
  )
}
 
function PerformanceStat({ label, value, icon }: any) {
  return (
    <div className="p-8 rounded-[1.5rem] bg-white/5 border border-white/5 backdrop-blur-md flex items-center gap-6 hover:bg-white/10 transition-all cursor-default group/stat">
       <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 group-hover/stat:scale-110 group-hover/stat:bg-white/20 transition-all duration-500">
          {React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}
       </div>
       <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none mb-1.5">{label}</p>
          <p className="text-2xl font-black text-white leading-none tracking-tight tabular-nums">{value}</p>
       </div>
    </div>
  )
}
