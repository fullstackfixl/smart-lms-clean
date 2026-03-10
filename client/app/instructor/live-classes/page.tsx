"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  Settings,
  ChevronRight
} from "lucide-react"
import { Button } from '../../../components/ui/button'
import { toast } from "sonner"
import { API_URL as API } from '../../../lib/config'
import { useAuth } from "../../../lib/auth-context"
import { cn } from "../../../lib/utils"
import { 
  SimpleCard, 
  SimpleBadge,
  FlatTable,
  FlatTableHead,
  FlatTableRow,
  FlatTableCell 
} from '../../../components/platform/ui-standard'
 
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
        toast.success("Live class created successfully")
        setShowForm(false)
        setForm({ title: "", description: "", courseId: "", meetingLink: "", scheduledAt: "", duration: "60" })
        fetchClasses()
      } else {
        toast.error(data.message || "Failed to create class")
      }
    } catch { toast.error("Connection error") }
    finally { setSubmitting(false) }
  }
 
  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return
    try {
      const r = await fetch(`${API}/instructor/live-classes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      })
      const data = await r.json()
      if (data.success) {
        toast.success("Session deleted successfully")
        fetchClasses()
      } else toast.error(data.message)
    } catch { toast.error("Failed to delete session") }
  }
 
  if (loadingList && classes.length === 0) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-40 rounded-2xl bg-white border border-gray-100" />
        <div className="h-96 rounded-2xl bg-white border border-gray-100" />
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-20">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl opacity-60" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
            <Video className="w-3.5 h-3.5" />
            Live Learning
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Live Classes</h1>
          <p className="text-sm text-slate-500 font-medium italic">Schedule and manage your live interactive sessions for students.</p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4">
          <Button 
            onClick={() => setShowForm(!showForm)}
            className={cn(
               "rounded-2xl h-14 px-8 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl",
               showForm 
                ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border-none shadow-none" 
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:translate-y-[-2px]"
            )}
          >
            {showForm ? <X className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4 stroke-[3]" />}
            {showForm ? "Cancel" : "Schedule New Class"}
          </Button>
        </div>
      </div>

      {/* ─── Schedule Form ─── */}
      {showForm && (
        <SimpleCard className="p-10 border-blue-100 bg-blue-50/10 relative overflow-hidden rounded-[2.5rem] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
            <Radio className="w-48 h-48 text-blue-600" />
          </div>
          <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">// Session Title</label>
                <input
                  required
                  placeholder="e.g. Weekly Q&A Session"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all placeholder:font-medium"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">// Related Course</label>
                <div className="relative">
                  <select
                    value={form.courseId}
                    onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                    className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Course (Optional)</option>
                    {courses.map(c => (
                      <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none rotate-90" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">// Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={form.scheduledAt}
                   onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                  className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">// Duration (Mins)</label>
                <input
                  type="number"
                  required
                  min={15}
                  value={form.duration}
                  onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">// Meeting Link (Optional)</label>
                <input
                  placeholder="External provider link"
                  value={form.meetingLink}
                  onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))}
                  className="w-full h-14 px-6 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all placeholder:font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="submit"
                disabled={submitting}
                className="h-16 px-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-500/10 transition-all hover:translate-y-[-2px]"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Schedule Class"}
              </Button>
            </div>
          </form>
        </SimpleCard>
      )}

      {/* ─── Metrics Quickview ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricMiniCard label="Total Classes" value={classes.length} icon={<Video className="w-6 h-6 text-blue-600" />} />
        <MetricMiniCard label="Live Now" value={classes.filter(c => c.status === 'live').length} icon={<Signal className="w-6 h-6 text-rose-500 animate-pulse" />} />
        <MetricMiniCard label="Upcoming" value={classes.filter(c => c.status === 'scheduled').length} icon={<Calendar className="w-6 h-6 text-emerald-600" />} />
        <MetricMiniCard label="System Status" value="Online" icon={<Globe className="w-6 h-6 text-indigo-600" />} />
      </div>

      {/* ─── Sessions Registry Table ─── */}
      <SimpleCard className="p-0 overflow-hidden border-slate-100 shadow-sm rounded-[2.5rem]">
        <div className="p-10 border-b border-slate-50 bg-white">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Class History</h3>
        </div>

        <FlatTable>
          <FlatTableHead>
            <FlatTableRow className="bg-slate-50/50">
              <FlatTableCell className="w-[100px] font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6 pl-10">Type</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6">Class Details</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6">Status</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6">Schedule</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6">Duration</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6 text-right pr-10">Actions</FlatTableCell>
            </FlatTableRow>
          </FlatTableHead>
          <tbody>
            {!classes || classes.length === 0 ? (
              <FlatTableRow>
                <FlatTableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400 italic font-bold">
                    <Video className="w-12 h-12 mb-4 opacity-10" />
                    No live classes scheduled.
                  </div>
                </FlatTableCell>
              </FlatTableRow>
            ) : (
              classes.map((lc) => {
                const d = new Date(lc.scheduled_date)
                const isUpcoming = d > new Date()
                return (
                  <FlatTableRow key={lc._id} className="group transition-all">
                    <FlatTableCell className="pl-10 py-8">
                      <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-all border shadow-sm",
                        lc.status === 'live' 
                          ? "bg-rose-50 text-rose-600 animate-pulse border-rose-100" 
                          : "bg-slate-50 text-slate-300 border-slate-100"
                      )}>
                        <Video className="w-6 h-6" />
                      </div>
                    </FlatTableCell>
                    <FlatTableCell className="max-w-md">
                      <div className="space-y-1.5">
                        <p className="text-[15px] font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase truncate">{lc.title}</p>
                        {lc.course_id && (
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">{lc.course_id.title}</p>
                        )}
                      </div>
                    </FlatTableCell>
                    <FlatTableCell>
                      <SimpleBadge className={cn(
                        "font-black uppercase text-[9px] tracking-widest px-4 py-1.5 border-none",
                        lc.status === 'live' ? 'bg-rose-50 text-rose-600' : 
                        lc.status === 'scheduled' ? 'bg-blue-50 text-blue-600' : 
                        lc.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      )}>
                        {lc.status}
                      </SimpleBadge>
                    </FlatTableCell>
                    <FlatTableCell>
                      <div className="flex items-center gap-2 text-slate-600 font-black tabular-nums text-[11px] uppercase tracking-widest">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {d.toLocaleDateString()}
                      </div>
                    </FlatTableCell>
                    <FlatTableCell>
                      <div className="flex items-center gap-2 text-slate-600 font-black tabular-nums text-[11px] uppercase tracking-widest">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {lc.duration_minutes} MINS
                      </div>
                    </FlatTableCell>
                    <FlatTableCell className="text-right pr-10">
                      <div className="flex items-center justify-end gap-3">
                        {lc.meeting_url && lc.status !== 'completed' && (
                          <Button 
                            onClick={() => window.open(lc.meeting_url, '_blank')}
                            className="h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-slate-900/10 transition-all hover:translate-y-[-2px]"
                          >
                            Join Class
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all"
                          onClick={() => router.push(`/instructor/live-classes/${lc._id}/attendance`)}
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                        {lc.status === 'scheduled' && isUpcoming && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
                            onClick={() => handleCancel(lc._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </FlatTableCell>
                  </FlatTableRow>
                )
              })
            )}
          </tbody>
        </FlatTable>
      </SimpleCard>
    </div>
  )
}

function MetricMiniCard({ label, value, icon }: any) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex items-center gap-6 hover:border-blue-200 transition-all cursor-default group shadow-sm hover:shadow-xl hover:shadow-slate-500/5">
       <div className="h-14 w-14 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-500">
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">{label}</p>
          <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">{value}</p>
       </div>
    </div>
  )
}
