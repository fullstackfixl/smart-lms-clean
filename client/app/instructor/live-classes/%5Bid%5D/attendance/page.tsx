"use client"
 
import React, { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    Users, Calendar, Clock, CheckCircle, XCircle,
    Loader2, ChevronLeft, ShieldAlert, Edit2, Save,
    User, Mail, Activity, ArrowLeft, MoreVertical,
    CheckCircle2, AlertCircle, Database, Globe,
    ArrowUpRight, Sparkles, Filter, ShieldCheck
} from "lucide-react"
import { Button } from "../../../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card"
import { Badge } from "../../../../../components/ui/badge"
import { toast } from "sonner"
import { API_URL } from "../../../../../lib/config"
import { cn } from "../../../../../lib/utils"
import { 
  SimpleCard, 
  SimpleBadge,
  FlatTable,
  FlatTableHead,
  FlatTableRow,
  FlatTableCell
} from "../../../../../components/platform/ui-standard"
 
const getToken = () =>
    typeof window !== "undefined"
        ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
        : null
 
export default function InstructorAttendancePage() {
    const { id } = useParams()
    const router = useRouter()
    const [attendance, setAttendance] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [classInfo, setClassInfo] = useState<any>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
 
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const classRes = await fetch(`${API_URL}/live-classes/${id}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                credentials: "include"
            })
            const classData = await classRes.json()
            if (classData.success) {
                setClassInfo(classData.data)
            }
 
            const attRes = await fetch(`${API_URL}/attendance/class/${id}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                credentials: "include"
            })
            const attData = await attRes.json()
            if (attData.success) {
                setAttendance(attData.data)
            }
        } catch {
            toast.error("Telemetry link failure")
        } finally {
            setLoading(false)
        }
    }, [id])
 
    useEffect(() => {
        fetchData()
    }, [fetchData])
 
    const handleOverride = async (attId: string, newStatus: string) => {
        try {
            const r = await fetch(`${API_URL}/attendance/${attId}/override`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ status: newStatus })
            })
            const data = await r.json()
            if (data.success) {
                toast.success("Registry updated")
                setEditingId(null)
                setAttendance(prev => prev.map(a => a._id === attId ? { ...a, status: newStatus } : a))
            } else {
                toast.error(data.message)
            }
        } catch {
            toast.error("Registry override failure")
        }
    }
 
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[75vh] gap-10">
                <div className="relative">
                    <div className="absolute -inset-8 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="h-24 w-24 border-[8px] border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-2xl" />
                </div>
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.45em] animate-pulse italic text-center">Synchronizing Participation Matrix...</p>
            </div>
        )
    }
 
    if (!classInfo) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center space-y-8">
                <div className="w-24 h-24 rounded-[2.5rem] bg-rose-50 flex items-center justify-center border border-rose-100 shadow-sm text-rose-500">
                    <ShieldAlert className="h-12 w-12" strokeWidth={3} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Node Not Found</h2>
                    <p className="text-slate-400 font-bold italic opacity-70">The requested live session registry could not be located.</p>
                </div>
                <Button onClick={() => router.back()} className="h-16 px-10 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all">
                    <ArrowLeft className="w-4 h-4 stroke-[3]" />
                    Retract Link
                </Button>
            </div>
        )
    }
 
    const presentCount = attendance.filter(a => a.status === 'present').length
    const absentCount = attendance.filter(a => a.status === 'absent').length
 
    return (
        <div className="max-w-[1600px] mx-auto p-8 lg:p-12 space-y-16 pb-32 animate-in fade-in duration-1000">
            
            {/* ─── Hero Header ────────────────────────────────────────── */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
                <div className="relative overflow-hidden rounded-[4rem] bg-white border border-slate-200/60 p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)]">
                    <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-indigo-50/50 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-0 p-12 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                        <Users className="w-80 h-80 -ml-20 -mb-20 rotate-12 text-indigo-600" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
                        <div className="space-y-10 max-w-2xl">
                            <div className="flex flex-wrap items-center gap-4">
                                <button
                                    onClick={() => router.back()}
                                    className="h-12 px-6 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm"
                                >
                                    <ChevronLeft className="h-4 w-4 stroke-[3]" />
                                    Back
                                </button>
                                <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-[0.25em] border border-indigo-100/50 shadow-sm">
                                    <Activity className="w-4 h-4" />
                                    Session Telemetry
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h1 className="text-6xl lg:text-7xl font-black text-slate-900 tracking-[-0.04em] leading-none uppercase">
                                    Attendance <br />
                                    <span className="text-indigo-600">Registry.</span>
                                </h1>
                                <div className="flex items-center gap-4 p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100 backdrop-blur-sm shadow-inner w-fit">
                                   <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-500 shadow-sm">
                                      <Calendar className="w-5 h-5" />
                                   </div>
                                   <div className="space-y-1">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Active Session</p>
                                      <p className="text-xl font-black text-slate-900 tracking-tight leading-none truncate max-w-sm">{classInfo.title}</p>
                                   </div>
                                </div>
                            </div>
                        </div>
 
                        {/* Macro Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-lg shrink-0">
                            <StatCard label="Total Joined" value={attendance.length} color="slate" icon={<Users />} />
                            <StatCard label="Present" value={presentCount} color="emerald" icon={<CheckCircle />} />
                            <StatCard label="Absent" value={absentCount} color="rose" icon={<XCircle />} />
                        </div>
                    </div>
                </div>
            </div>
 
            {/* ─── Participation Table ─────────────────────────────────────── */}
            <SimpleCard className="border-slate-100 shadow-sm relative overflow-hidden group/records rounded-[4rem] bg-white">
                <div className="absolute top-0 right-0 p-20 opacity-[0.015] pointer-events-none group-hover/records:opacity-[0.03] transition-opacity duration-1000">
                    <Database className="w-[40rem] h-[40rem] text-indigo-600" />
                </div>
                
                <div className="p-10 lg:p-14 space-y-12 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 border-b border-slate-50 pb-10">
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Participation Records</h3>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic opacity-70">Real-time engagement telemetry from live session</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="px-6 py-2.5 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-3 shadow-sm">
                              <ShieldCheck className="w-4 h-4" />
                              Secure Link Verified
                           </div>
                        </div>
                    </div>
 
                    <div className="overflow-hidden rounded-[2.5rem] border border-slate-50 shadow-inner bg-slate-50/20">
                        <FlatTable>
                            <FlatTableHead>
                                <FlatTableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-slate-100">
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Scholar Profile</th>
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Join Context</th>
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Exit Context</th>
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Session Weight</th>
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Registry Actions</th>
                                </FlatTableRow>
                            </FlatTableHead>
                            <tbody>
                                {attendance.length === 0 ? (
                                    <FlatTableRow className="border-none">
                                        <FlatTableCell colSpan={6} className="px-10 py-32 text-center text-slate-300">
                                            <div className="space-y-6">
                                                <div className="w-20 h-20 rounded-[2rem] bg-slate-50/50 flex items-center justify-center mx-auto border border-dashed border-slate-200">
                                                   <Users className="w-8 h-8 opacity-20" />
                                                </div>
                                                <div className="space-y-1">
                                                   <p className="text-[15px] font-black uppercase tracking-widest italic opacity-40">No records in registry</p>
                                                   <p className="text-[11px] font-bold italic opacity-30">Scholars will be logged as they establish a session link.</p>
                                                </div>
                                            </div>
                                        </FlatTableCell>
                                    </FlatTableRow>
                                ) : (
                                    attendance.map((att, idx) => (
                                        <FlatTableRow key={att._id} className="hover:bg-slate-50 transition-colors border-slate-50 group/row last:border-0">
                                            <FlatTableCell className="px-10 py-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-14 w-14 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg shadow-sm group-hover/row:rotate-6 group-hover/row:scale-110 transition-all duration-500">
                                                        {att.studentId?.name?.charAt(0) || "S"}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[15px] font-black text-slate-900 tracking-tight leading-none uppercase">{att.studentId?.name}</p>
                                                        <p className="text-[11px] font-bold text-slate-400 italic leading-none truncate max-w-[180px]">{att.studentId?.email}</p>
                                                    </div>
                                                </div>
                                            </FlatTableCell>
                                            <FlatTableCell className="px-10 py-8 text-center">
                                                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50/50 border border-slate-100 text-[13px] font-black text-slate-600 tabular-nums shadow-inner">
                                                   <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                                   {new Date(att.joinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </FlatTableCell>
                                            <FlatTableCell className="px-10 py-8 text-center text-[13px] font-black text-slate-400 tabular-nums">
                                                {att.leaveTime ? (
                                                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50/50 border border-slate-100 text-[13px] font-black text-slate-600 tabular-nums shadow-inner">
                                                     <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                                                     {new Date(att.leaveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                  </div>
                                                ) : <span className="italic opacity-50 text-[11px] tracking-widest uppercase">ACTIVE HUB</span>}
                                            </FlatTableCell>
                                            <FlatTableCell className="px-10 py-8 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                   <span className="text-lg font-black text-slate-900 tabular-nums leading-none tracking-tighter">{att.duration}</span>
                                                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">MINUTES</p>
                                                </div>
                                            </FlatTableCell>
                                            <FlatTableCell className="px-10 py-8 text-center">
                                                {editingId === att._id ? (
                                                    <select
                                                        className="h-10 px-4 rounded-xl bg-white border border-indigo-200 text-xs font-black uppercase tracking-widest text-indigo-600 shadow-lg shadow-indigo-500/10 focus:ring-4 focus:ring-indigo-500/5 outline-none cursor-pointer"
                                                        value={att.status}
                                                        onChange={(e) => handleOverride(att._id, e.target.value)}
                                                    >
                                                        <option value="present">PRESENT</option>
                                                        <option value="absent">ABSENT</option>
                                                    </select>
                                                ) : (
                                                    <SimpleBadge 
                                                       variant={att.status === 'present' ? 'green' : 'red'}
                                                       className="h-9 px-4 text-[9px] font-black uppercase tracking-[0.2em] shadow-sm rounded-full"
                                                    >
                                                        {att.status}
                                                    </SimpleBadge>
                                                )}
                                            </FlatTableCell>
                                            <FlatTableCell className="px-10 py-8 text-right">
                                                {editingId === att._id ? (
                                                    <Button 
                                                       variant="ghost" 
                                                       size="sm" 
                                                       onClick={() => setEditingId(null)}
                                                       className="h-10 px-6 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        Retract
                                                    </Button>
                                                ) : (
                                                    <button
                                                        onClick={() => setEditingId(att._id)}
                                                        className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white hover:border-indigo-100 transition-all shadow-sm group/btn"
                                                    >
                                                        <Edit2 className="h-5 w-5 stroke-[2.5] group-hover/btn:rotate-12 transition-transform" />
                                                    </button>
                                                )}
                                            </FlatTableCell>
                                        </FlatTableRow>
                                    ))
                                )}
                            </tbody>
                        </FlatTable>
                    </div>
                </div>
            </SimpleCard>
        </div>
    )
}
 
function StatCard({ label, value, color, icon }: any) {
    const colors: any = {
      slate: "text-slate-900 border-slate-100 bg-white",
      emerald: "text-emerald-600 border-emerald-100 bg-emerald-50/30",
      rose: "text-rose-600 border-rose-100 bg-rose-50/30"
    }

    return (
        <div className={cn("p-8 rounded-[2.5rem] border shadow-xl relative overflow-hidden group/stat transition-all hover:scale-105 duration-500", colors[color])}>
           <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover/stat:rotate-12 group-hover/stat:scale-125 transition-transform duration-1000">
              {React.cloneElement(icon, { size: 48, strokeWidth: 2.5 })}
           </div>
           <div className="relative z-10 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 leading-none">{label}</p>
              <p className="text-4xl font-black tracking-tighter leading-none tabular-nums">{value}</p>
              <div className="flex items-center gap-2">
                 <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", color === 'emerald' ? "bg-emerald-500" : color === 'rose' ? "bg-rose-500" : "bg-slate-400")} />
                 <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Live Status</p>
              </div>
           </div>
        </div>
    )
}
