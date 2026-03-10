"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Video, 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  VideoOff,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronRight,
  Shield,
  Trash2,
  Edit,
  Play,
  MonitorPlay,
  History,
  Info,
  X,
  Link as LinkIcon,
  CheckCircle2
} from "lucide-react"
import { useAuth } from '../../../lib/auth-context'
import { getLiveClasses, getCourses, deleteLiveClass, createLiveClass } from '../../../lib/services/orgAdminApi'
import { toast } from "sonner"

interface LiveClass {
  _id: string
  title: string
  description?: string
  course_id: { _id: string; title: string }
  instructor_id: { _id: string; name: string; email: string }
  scheduled_date: string
  start_time: string
  duration_minutes: number
  status: 'scheduled' | 'live' | 'completed' | 'cancelled'
  meeting_url?: string
  current_participants?: number
  max_participants: number
}

function StatCard({ title, value, icon: Icon, color, subValue }: { title: string, value: string | number, icon: any, color: string, subValue?: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5" strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">{value}</h3>
          {subValue && <span className="text-[10px] font-bold text-slate-400 uppercase opacity-60 tracking-wider">/ {subValue}</span>}
        </div>
      </div>
    </div>
  )
}

export default function LiveClassesPage() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  
  const [showCreate, setShowCreate] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [newClass, setNewClass] = useState({
    course_id: "",
    title: "",
    description: "",
    scheduled_date: "",
    start_time: "",
    duration_minutes: 60,
    max_participants: 50
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getLiveClasses({ 
        search: searchTerm !== "" ? searchTerm : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined
      })
      if (res.success) setClasses(res.data.live_classes || [])
    } catch (err) {
      toast.error("Failed to load live sessions")
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (showCreate) {
      getCourses().then(res => {
        if (res.success) setCourses(res.data.courses || res.data || [])
      })
    }
  }, [showCreate])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const loadingToast = toast.loading("Scheduling live session...")
    try {
      const res = await createLiveClass(newClass)
      if (res.success) {
        toast.success("Live class scheduled successfully", { id: loadingToast })
        setShowCreate(false)
        setNewClass({
            course_id: "",
            title: "",
            description: "",
            scheduled_date: "",
            start_time: "",
            duration_minutes: 60,
            max_participants: 50
        })
        loadData()
      }
    } catch (err) {
      toast.error("Failed to create live class", { id: loadingToast })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to cancel this live session?")) return
    const loadingToast = toast.loading("Cancelling session...")
    try {
      const res = await deleteLiveClass(id)
      if (res.success) {
        toast.success("Session cancelled successfully", { id: loadingToast })
        loadData()
      }
    } catch (err) {
      toast.error("Failed to cancel session", { id: loadingToast })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live': return "bg-rose-50 text-rose-600 border border-rose-100"
      case 'scheduled': return "bg-blue-50 text-blue-600 border border-blue-100"
      case 'completed': return "bg-slate-50 text-slate-500 border border-slate-100"
      case 'cancelled': return "bg-slate-100 text-slate-400 border border-transparent"
      default: return "bg-slate-50 text-slate-500"
    }
  }

  if (loading && classes.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-[13px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Establishing Session Streams...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-3">
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                Live Engine
             </div>
             <div className="w-1 h-1 rounded-full bg-slate-300" />
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Broadcast</span>
          </div>
          <h1 className="text-[32px] font-black text-slate-900 tracking-tight leading-none">Live Classes</h1>
          <p className="text-[14px] text-slate-500 font-medium mt-3">Sync real-time learning across your entire organization catalog.</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2.5 px-6 h-12 bg-blue-600 text-white rounded-xl text-[13px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
        >
          <MonitorPlay className="w-4.5 h-4.5" strokeWidth={3} />
          Broadcast Now
        </button>
      </div>

      {/* Stats Quick Look */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="SESSIONS ACTIVE" 
            value={classes.filter(c => c.status === 'live').length} 
            icon={Play} 
            color="bg-rose-50 text-rose-600" 
          />
          <StatCard 
            title="UPCOMING TODAY" 
            value={classes.filter(c => c.status === 'scheduled').length} 
            icon={Calendar} 
            color="bg-blue-50 text-blue-600" 
          />
          <StatCard 
            title="AVG. ATTENDANCE" 
            value="94%" 
            icon={History} 
            color="bg-emerald-50 text-emerald-600" 
            subValue="RETENTION"
          />
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search within live sessions catalog..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-slate-50 border-transparent rounded-xl text-[14px] font-semibold text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500/40 transition-all font-sans"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 px-5 bg-white border border-slate-200 rounded-xl text-[13px] font-black text-slate-600 focus:outline-none uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-all"
          >
            <option value="all">Filtering: All</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live Only</option>
            <option value="completed">Completed</option>
          </select>
          <button 
            onClick={loadData}
            className="h-12 px-6 bg-slate-900 text-white rounded-xl text-[13px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Modern Session Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-10">
        {classes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Session Identity</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Program Context</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Temporal Data</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Engagement</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lifecycle</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.map((c) => (
                  <tr key={c._id} className="group hover:bg-slate-50/50 transition-all duration-300">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                          c.status === 'live' 
                            ? "bg-rose-50 text-rose-600 border-rose-100 shadow-lg shadow-rose-500/10" 
                            : "bg-blue-50 text-blue-600 border-blue-100 shadow-sm shadow-blue-500/5 group-hover:bg-white"
                        }`}>
                          <Video className={`w-5.5 h-5.5 ${c.status === 'live' ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-black text-slate-900 truncate tracking-tight group-hover:text-blue-600 transition-colors uppercase">{c.title}</p>
                          <p className="text-[11px] text-slate-400 font-bold truncate mt-1.5 opacity-80">{c.description || "System Lecture Session"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                       <p className="text-[13px] font-black text-slate-700 leading-none">{c.course_id?.title}</p>
                       <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-2.5 tracking-tighter">By {c.instructor_id?.name}</p>
                    </td>
                    <td className="px-6 py-6">
                       <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-[12px] font-black text-slate-900 tracking-tight">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(c.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            {c.start_time} <span className="text-[9px] opacity-60 uppercase">({c.duration_minutes}m)</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" strokeWidth={2.5} />
                            <span className="text-[14px] font-black text-slate-900 tracking-tight">{c.current_participants || 0}</span>
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">/ {c.max_participants}</span>
                          </div>
                          <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                             <div 
                                className={`h-full transition-all duration-1000 ${c.status === 'live' ? 'bg-rose-500' : 'bg-blue-500'}`} 
                                style={{ width: `${Math.min(((c.current_participants || 0) / c.max_participants) * 100, 100)}%` }} 
                             />
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <div className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 w-fit ${getStatusBadge(c.status)}`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${c.status === 'live' ? 'bg-rose-500 animate-ping' : c.status === 'scheduled' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                         <span className="text-[10px] font-black uppercase tracking-widest">
                           {c.status}
                         </span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                         {c.status === 'live' || c.status === 'scheduled' ? (
                           <a 
                             href={c.meeting_url} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl shadow-sm hover:scale-110 active:scale-95 transition-all"
                             title="Join Stream"
                           >
                             <LinkIcon className="w-4.5 h-4.5" strokeWidth={2.5} />
                           </a>
                         ) : (
                           <div className="w-10 h-10 flex items-center justify-center text-slate-300 cursor-not-allowed">
                             <VideoOff className="w-4.5 h-4.5" />
                           </div>
                         )}
                         <button className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 text-slate-400 rounded-xl transition-all">
                            <MoreVertical className="w-4.5 h-4.5" />
                         </button>
                         <button 
                            onClick={() => handleDelete(c._id)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"
                            title="Purge"
                          >
                           <Trash2 className="w-4.5 h-4.5" strokeWidth={2.5} />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-32 text-center max-w-md mx-auto px-6">
             <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
               <Video className="w-10 h-10 text-slate-300" strokeWidth={1} />
             </div>
             <div>
               <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Null Broadcast Feed</h3>
               <p className="text-[14px] text-slate-500 font-medium mt-4 leading-relaxed tracking-wide">
                 You haven&apos;t scheduled any real-time interactions yet. Launch a session to begin live institutional knowledge transfer.
               </p>
             </div>
             <button 
               onClick={() => setShowCreate(true)}
               className="mt-10 inline-flex items-center gap-3 px-8 h-12 bg-blue-600 text-white rounded-xl text-[13px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all"
             >
               <MonitorPlay className="w-4.5 h-4.5" />
               Launch First Session
             </button>
          </div>
        )}
      </div>

      {/* Redesigned Schedule Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowCreate(false)}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
             />
             <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 w-full max-w-2xl shadow-2xl flex flex-col gap-10"
             >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                     <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm border border-blue-100">
                        <MonitorPlay className="w-7 h-7" strokeWidth={3} />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase">Configure Broadcast</h3>
                        <p className="text-[14px] text-slate-500 font-medium mt-2">Specify technical parameters for your live event.</p>
                     </div>
                  </div>
                  <button onClick={() => setShowCreate(false)} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Institutional Program</label>
                        <select 
                          required
                          value={newClass.course_id}
                          onChange={(e) => setNewClass({...newClass, course_id: e.target.value})}
                          className="w-full h-14 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all cursor-pointer"
                        >
                           <option value="" disabled>Select a Learning Path</option>
                           {courses.map(c => (
                             <option key={c._id} value={c._id}>{c.title}</option>
                           ))}
                        </select>
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Broadcast Identity</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g. Masterclass: System Architecture"
                          value={newClass.title}
                          onChange={(e) => setNewClass({...newClass, title: e.target.value})}
                          className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all placeholder:text-slate-300 placeholder:font-bold"
                        />
                      </div>
                   </div>

                   <div className="space-y-2.5">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Agenda / Description</label>
                      <textarea 
                        placeholder="Define the primary focus and takeaways for this real-time session..."
                        value={newClass.description}
                        onChange={(e) => setNewClass({...newClass, description: e.target.value})}
                        className="w-full h-28 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all resize-none placeholder:text-slate-300"
                      />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Temporal Date</label>
                        <input 
                          type="date" 
                          required
                          value={newClass.scheduled_date}
                          onChange={(e) => setNewClass({...newClass, scheduled_date: e.target.value})}
                          className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Launch Time</label>
                        <input 
                          type="time" 
                          required
                          value={newClass.start_time}
                          onChange={(e) => setNewClass({...newClass, start_time: e.target.value})}
                          className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Stream Max Pop</label>
                        <input 
                          type="number" 
                          required
                          value={newClass.max_participants}
                          onChange={(e) => setNewClass({...newClass, max_participants: parseInt(e.target.value)})}
                          className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all"
                        />
                      </div>
                   </div>

                   <div className="flex gap-4 pt-6">
                      <button 
                        type="button"
                        onClick={() => setShowCreate(false)}
                        className="flex-1 h-16 bg-slate-100 text-slate-600 rounded-2xl text-[13px] font-black uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all"
                      >
                        Discard
                      </button>
                      <button 
                         type="submit"
                         className="flex-[2] h-16 bg-blue-600 text-white rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                         Confirm Broadcast
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
