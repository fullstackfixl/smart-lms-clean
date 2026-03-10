"use client"
 
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Video, 
  Calendar, 
  Clock, 
  Link as LinkIcon, 
  BookOpen, 
  Plus, 
  Trash2,
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  ChevronLeft, 
  Users,
  Signal,
  ArrowRight,
  MoreVertical,
  X,
  PlayCircle,
  Zap,
  ShieldCheck,
  Target,
  Globe,
  Radio,
  ExternalLink,
  Settings
} from "lucide-react"
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { toast } from "sonner"
import { API_URL as API } from '../../../lib/config'
import { useAuth } from "../../../lib/auth-context"
import { cn } from "../../../lib/utils"
 
interface LiveClass {
  _id: string
  title: string
  description: string
  course_id?: { _id: string; title: string }
  scheduled_date: string
  start_time: string
  duration_minutes: number
  meeting_url: string
  status: "scheduled" | "live" | "completed" | "cancelled"
}
 
interface Course {
  _id: string
  title: string
}
 
export default function InstructorLiveClassesPage() {
  const { token } = useAuth()
  const router = useRouter()
 
  // list state
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
 
  // form state
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    courseId: "",
    meetingLink: "",
    scheduledAt: "",
    duration: "60"
  })
 
  const fetchClasses = useCallback(async () => {
    if (!token) return
    setLoadingList(true)
    try {
      const r = await fetch(`${API}/instructor/live-classes`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      })
      const data = await r.json()
      if (data.success) setClasses(data.data?.classes || [])
    } catch { toast.error("Synchronization failure") }
    finally { setLoadingList(false) }
  }, [token])
 
  const fetchCourses = useCallback(async () => {
    if (!token) return
    try {
      const r = await fetch(`${API}/instructor/courses`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      })
      const data = await r.json()
      if (data.success) setCourses(data.data?.courses || data.data || [])
    } catch { /* non-critical */ }
  }, [token])
 
  useEffect(() => {
    fetchClasses()
    fetchCourses()
  }, [fetchClasses, fetchCourses])
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.scheduledAt || !form.duration) {
      toast.error("Critical fields missing")
      return
    }
    const scheduled = new Date(form.scheduledAt)
    if (scheduled <= new Date()) {
      toast.error("Temporal alignment error: Date must be future-dated")
      return
    }
    setSubmitting(true)
    try {
      const r = await fetch(`${API}/instructor/live-classes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          courseId: form.courseId || undefined,
          meetingLink: form.meetingLink || undefined,
          scheduledAt: form.scheduledAt,
          duration: parseInt(form.duration)
        })
      })
      const data = await r.json()
      if (data.success) {
        toast.success("Broadcast provisioned. Scholastic network notified.")
        setShowForm(false)
        setForm({ title: "", description: "", courseId: "", meetingLink: "", scheduledAt: "", duration: "60" })
        fetchClasses()
      } else {
        toast.error(data.message || "Provisioning failure")
      }
    } catch { toast.error("Uplink severed") }
    finally { setSubmitting(false) }
  }
 
  const handleCancel = async (id: string) => {
    if (!confirm("Decommission this broadcast session?")) return
    try {
      const r = await fetch(`${API}/instructor/live-classes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      })
      const data = await r.json()
      if (data.success) {
        toast.success("Broadcast decommissioned")
        fetchClasses()
      } else toast.error(data.message)
    } catch { toast.error("Decommissioning failed") }
  }
 
  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Broadcast Uplink Hero ───────────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-amber-500 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[3.5rem] bg-white border border-slate-200/60 p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] focus-within:shadow-[0_48px_96px_-24px_rgba(225,29,72,0.1)] transition-all">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-rose-50 rounded-full blur-[120px]" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-8 max-w-2xl">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-rose-50 text-rose-700 text-[11px] font-black uppercase tracking-[0.25em] border border-rose-100/50">
                <Radio className="w-4 h-4 animate-pulse" />
                Live Broadcast Center
              </div>
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-black text-slate-900 tracking-[-0.04em] leading-[0.95]">
                  Synchronize Your <br />
                  <span className="text-rose-600">Instructional Presence.</span>
                </h1>
                <p className="text-[19px] font-medium text-slate-500 leading-relaxed max-w-xl">
                  Orchestrate real-time, low-latency instructional broadcasts. Engage through high-fidelity virtual seminar environments and direct scholar interactions.
                </p>
              </div>
 
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <button
                  onClick={() => setShowForm(true)}
                  className="h-20 px-12 bg-slate-900 text-white rounded-[2.2rem] text-[16px] font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] group"
                >
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" strokeWidth={3} />
                  PROVISION BROADCAST
                </button>
                <button className="h-20 w-20 flex items-center justify-center rounded-[2.2rem] border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-600 transition-all">
                  <Signal className="w-7 h-7" />
                </button>
              </div>
            </div>
 
            {/* Broadcast Metrics Grid */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                <MetricMiniCard label="Total Broadcasts" value={classes.length} icon={<Video color="#E11D48" />} />
                <MetricMiniCard label="Live Now" value={classes.filter(c => c.status === 'live').length} icon={<Signal color="#10B981" />} />
                <MetricMiniCard label="Upcoming" value={classes.filter(c => c.status === 'scheduled').length} icon={<Calendar color="#4F46E5" />} />
                <MetricMiniCard label="Uptime" value="99.9%" icon={<Globe color="#3B82F6" />} />
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Operational Control Interface ───────────────────────────── */}
      <div className="space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 px-6">
           <div className="space-y-2">
              <h3 className="text-[22px] font-black text-slate-900 tracking-tight">Broadcast Session Stream</h3>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest italic opacity-70">
                {loadingList ? "// Synchronizing session stream..." : `// ${classes.length} broadcast sessions identified in current sector`}
              </p>
           </div>
           
           <div className="flex items-center gap-6 flex-wrap">
              <Button onClick={() => setShowForm(true)} className="h-14 px-8 rounded-2xl bg-rose-600 text-white font-black hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/10">
                 DEPLOY NEW UPLINK
              </Button>
           </div>
        </div>
 
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              className="relative z-50 bg-white rounded-[4rem] border border-slate-200 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.1)] overflow-hidden m-4"
            >
              <div className="p-12 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.4em]">Broadcast Parameter Configuration</p>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Provision Mission Session</h3>
                 </div>
                 <button onClick={() => setShowForm(false)} className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                    <X className="w-6 h-6" />
                 </button>
              </div>
 
              <form onSubmit={handleSubmit} className="p-12 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Broadcast Identity</label>
                    <div className="relative group">
                       <Radio className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200 group-focus-within:text-rose-600 transition-colors" />
                       <input
                         required
                         placeholder="e.g. Advanced AI Integration & Neural Architecture"
                         value={form.title}
                         onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                         className="w-full h-20 pl-16 pr-8 bg-slate-50 border border-slate-100 rounded-[1.8rem] text-[16px] font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-[8px] focus:ring-rose-500/5 focus:border-rose-500/30 transition-all"
                       />
                    </div>
                  </div>
 
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Temporal Alignment</label>
                    <input
                      type="datetime-local"
                      required
                      value={form.scheduledAt}
                      onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                      className="w-full h-20 px-8 bg-slate-50 border border-slate-100 rounded-[1.8rem] text-[16px] font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-[8px] focus:ring-rose-500/5 focus:border-rose-500/30 transition-all"
                    />
                  </div>
 
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Session Duration (Minutes)</label>
                    <input
                      type="number"
                      required
                      min={15}
                      value={form.duration}
                      onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                      className="w-full h-20 px-8 bg-slate-50 border border-slate-100 rounded-[1.8rem] text-[16px] font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-[8px] focus:ring-rose-500/5 focus:border-rose-500/30 transition-all"
                    />
                  </div>
 
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Curriculum Anchor context</label>
                    <select
                      value={form.courseId}
                      onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                      className="w-full h-20 px-8 bg-slate-50 border border-slate-100 rounded-[1.8rem] text-[16px] font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-[8px] focus:ring-rose-500/5 focus:border-rose-500/30 transition-all appearance-none"
                    >
                      <option value="">— GLOBAL SESSION (NULL ANCHOR) —</option>
                      {courses.map(c => (
                        <option key={c._id} value={c._id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
 
                <div className="flex gap-6 pt-10 border-t border-slate-50">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-20 flex-[2] bg-slate-900 text-white rounded-[2rem] text-[16px] font-black hover:scale-[1.02] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-4 group"
                  >
                    {submitting ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : <Signal className="h-6 w-6 group-hover:scale-110 transition-transform" strokeWidth={3} />}
                    {submitting ? "INITIALIZING UPLINK..." : "INITIALIZE BROADCAST SIGNAL"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="h-20 flex-1 rounded-[2rem] text-[14px] font-black text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                    onClick={() => setShowForm(false)}
                  >
                    ABORT MISSION
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
 
        <div className="grid grid-cols-1 gap-10 p-4">
          {loadingList ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-slate-100 rounded-[3.5rem] animate-pulse" />
            ))
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-48 text-center bg-white rounded-[4rem] border border-dashed border-slate-200 m-4">
              <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-10 border border-slate-100">
                <Video className="h-10 w-10 text-slate-200" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">No Broadcasts Active</h3>
              <p className="text-[17px] font-medium text-slate-400 max-w-sm mx-auto leading-relaxed mb-12 italic opacity-80">
                The broadcast sector is currently synchronized. Initialize a new session to begin instructional streaming.
              </p>
            </div>
          ) : (
            classes.map((lc, index) => (
              <PeakLiveCard key={lc._id} lc={lc} index={index} handleCancel={handleCancel} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
 
function PeakLiveCard({ lc, index, handleCancel }: { lc: LiveClass, index: number, handleCancel: any }) {
  const router = useRouter()
  const d = new Date(lc.scheduled_date)
  const isUpcoming = d > new Date()
  
  const statusColors: any = {
    live: "bg-rose-500 text-white shadow-rose-500/20",
    scheduled: "bg-indigo-600 text-white shadow-indigo-500/20",
    completed: "bg-slate-100 text-slate-400",
    cancelled: "bg-rose-50 text-rose-500",
  }
 
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.7 }}
      className="group relative"
    >
      <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 flex flex-col md:flex-row md:items-center justify-between gap-12 hover:border-rose-500/30 hover:shadow-[0_48px_96px_-24px_rgba(225,29,72,0.08)] transition-all duration-700 cursor-default border-l-4 hover:border-l-rose-500">
        
        <div className="flex-1 flex flex-col md:flex-row md:items-center gap-12">
          {/* Signal Indicator */}
          <div className="relative">
            <div className={cn(
              "w-20 h-20 rounded-[2.2rem] flex items-center justify-center transition-all duration-700 shadow-xl group-hover:rotate-6 group-hover:scale-110",
              lc.status === 'live' ? "bg-rose-600 text-white animate-pulse" : "bg-slate-50 text-slate-400 border border-slate-100"
            )}>
              <Video className="w-8 h-8" strokeWidth={3} />
            </div>
            {lc.status === 'live' && (
              <div className="absolute -top-1 -right-1 h-6 w-6 bg-rose-500 rounded-full border-4 border-white animate-ping" />
            )}
          </div>
 
          <div className="space-y-4 flex-1">
             <div className="flex items-center gap-4">
                <Badge className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-0", statusColors[lc.status] || statusColors.scheduled)}>
                  {lc.status === 'live' ? 'Synchronizing Live' : lc.status}
                </Badge>
                {lc.course_id && (
                  <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest italic">• {lc.course_id.title}</span>
                )}
             </div>
             <h4 className="text-[28px] font-black text-slate-900 tracking-tight leading-none group-hover:text-rose-600 transition-colors uppercase truncate max-w-xl">{lc.title}</h4>
             
             <div className="flex flex-wrap gap-8 items-center pt-2">
                <div className="flex items-center gap-3">
                   <Calendar className="w-4 h-4 text-rose-500" />
                   <span className="text-[14px] font-black text-slate-900">{d.toLocaleDateString("en-IN", { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="flex items-center gap-3">
                   <Clock className="w-4 h-4 text-indigo-500" />
                   <span className="text-[14px] font-black text-slate-900">{lc.start_time} <span className="text-slate-300 mx-1">/</span> {lc.duration_minutes} MINS</span>
                </div>
             </div>
          </div>
        </div>
 
        {/* Operational Controls */}
        <div className="flex flex-wrap items-center gap-4">
           {lc.meeting_url && lc.status !== 'completed' && (
             <button 
                onClick={() => window.open(lc.meeting_url, '_blank')}
                className="h-16 px-10 bg-slate-900 text-white rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-xl group/btn hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
             >
                <Signal className="w-4 h-4 animate-pulse group-hover/btn:text-rose-400" />
                Connect Channel
             </button>
           )}
           
           <button 
              onClick={() => router.push(`/instructor/live-classes/${lc._id}/attendance`)}
              className="h-16 w-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm"
           >
              <Users className="w-5 h-5" />
           </button>
 
           {lc.status === 'scheduled' && isUpcoming && (
             <button 
                onClick={() => handleCancel(lc._id)}
                className="h-16 w-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all shadow-sm"
             >
                <Trash2 className="w-5 h-5" />
             </button>
           )}
        </div>
      </div>
    </motion.div>
  )
}
 
function MetricMiniCard({ label, value, icon }: any) {
  return (
    <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-5 hover:bg-white hover:border-rose-200 hover:shadow-lg transition-all cursor-default group">
       <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
          <p className="text-[24px] font-black text-slate-900 leading-none tracking-tighter">{value}</p>
       </div>
    </div>
  )
}
