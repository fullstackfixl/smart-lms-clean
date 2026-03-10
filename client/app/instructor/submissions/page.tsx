"use client"
 
import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  Clock,
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Mail, 
  Calendar,
  BarChart3, 
  Loader2, 
  RefreshCw, 
  Filter, 
  Hash, 
  Star,
  Activity,
  Zap,
  ArrowRight,
  ShieldCheck,
  Globe,
  Database,
  SearchIcon,
  MousePointer2,
  Sparkles,
  ArrowUpRight,
  FileText,
  Boxes
} from "lucide-react"
import { Badge } from '../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { useAuth } from '../../../lib/auth-context'
import { toast } from "sonner"
import { API_URL } from '../../../lib/config'
import { cn } from "../../../lib/utils"
 
interface QuestionReview {
  questionText: string
  options: string[]
  selectedOption: number
  correctAnswer: number
  selectedText: string
  correctText: string
  isCorrect: boolean
  explanation: string
}
 
interface QuizSubmission {
  _id: string
  studentId: string
  studentName: string
  studentEmail: string
  studentAvatar: string | null
  quizId: string
  quizTitle: string
  totalMarks: number
  passPercentage: number
  courseId: string
  courseTitle: string
  score: number
  totalQuestions: number
  percentage: number
  passed: boolean
  attemptNumber: number
  timeTakenSeconds: number
  submittedAt: string
  answersCount: number
  correctCount: number
  questionReview: QuestionReview[]
}
 
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
 
function formatTime(seconds: number) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60), s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
 
function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
 
function SubmissionsContent() {
  const { token } = useAuth()
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPass, setFilterPass] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
 
  const loadSubmissions = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/quizzes/submissions?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include'
      })
      const data = await res.json()
      if (data.success) {
        setSubmissions(data.data.submissions || [])
      } else {
        toast.error("Telemetry link synchronization failure")
      }
    } catch {
      toast.error("Audit stream link severed")
    } finally {
      setLoading(false)
    }
  }, [token])
 
  useEffect(() => { loadSubmissions() }, [loadSubmissions])
 
  const filtered = submissions.filter(s => {
    const matchSearch = s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
      s.quizTitle.toLowerCase().includes(search.toLowerCase()) ||
      s.courseTitle.toLowerCase().includes(search.toLowerCase())
    const matchPass = filterPass === 'all' ? true : filterPass === 'passed' ? s.passed : !s.passed
    return matchSearch && matchPass
  })
 
  const stats = {
    total: submissions.length,
    passed: submissions.filter(s => s.passed).length,
    failed: submissions.filter(s => !s.passed).length,
    avgScore: submissions.length ? Math.round(submissions.reduce((a, s) => a + s.percentage, 0) / submissions.length) : 0
  }
 
  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Audit Stream Hero ──────────────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[3.5rem] bg-indigo-600 p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(79,70,229,0.3)] transition-all">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-white/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 p-12 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
              <Database className="w-80 h-80 -ml-20 -mb-20 rotate-12" />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-8 max-w-2xl text-white">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 text-white text-[11px] font-black uppercase tracking-[0.25em] border border-white/20">
                <ShieldCheck className="w-4 h-4 fill-white" />
                Authored Audit Stream
              </div>
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-black text-white tracking-[-0.04em] leading-[0.95]">
                  Submission <br />
                  <span className="text-indigo-200">Intelligence.</span>
                </h1>
                <p className="text-[19px] font-medium text-indigo-50 leading-relaxed max-w-xl opacity-90">
                  Verify scholarly outcomes with granular precision. Analyze pass velocities, diagnostic trajectories, and cohort performace through an executive-grade audit interface.
                </p>
              </div>
 
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <button
                  onClick={loadSubmissions}
                  className="h-20 px-12 bg-white text-indigo-600 rounded-[2.2rem] text-[16px] font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] group"
                >
                  <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
                  SYNCHRONIZE STREAM
                </button>
                <div className="flex items-center gap-3 h-20 px-8 rounded-[2.2rem] border border-white/20 bg-white/5 backdrop-blur-md">
                   <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                   <span className="text-[11px] font-black uppercase tracking-widest text-white/70">Registry Online</span>
                </div>
              </div>
            </div>
 
            {/* Macro Stats Grid */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                <MetricMiniCard variant="glass" label="Intersections" value={stats.total} icon={<Hash color="#fff" />} />
                <MetricMiniCard variant="glass" label="Mastery Index" value={`${stats.avgScore}%`} icon={<Trophy color="#fff" />} />
                <MetricMiniCard variant="glass" label="Secured" value={stats.passed} icon={<CheckCircle2 color="#fff" />} />
                <MetricMiniCard variant="glass" label="Deficits" value={stats.failed} icon={<XCircle color="#fff" />} />
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Control Surface ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-center gap-8 px-4">
        <div className="relative flex-1 group w-full">
           <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
             <SearchIcon className="h-6 w-6 text-slate-300 group-hover:text-indigo-600 transition-colors" strokeWidth={3} />
           </div>
           <input 
             value={search}
             onChange={e => setSearch(e.target.value)}
             placeholder="Search by scholar identity, module, or curriculum context..."
             className="w-full h-24 pl-20 pr-10 bg-white border border-slate-100 rounded-[2.5rem] text-[17px] font-bold text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-[12px] focus:ring-indigo-500/5 focus:border-indigo-500/20 shadow-sm transition-all"
           />
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
           <div className="bg-slate-50 p-1 rounded-[2.2rem] border border-slate-100 shadow-inner w-full lg:w-auto">
             <Select value={filterPass} onValueChange={setFilterPass}>
               <SelectTrigger className="h-20 w-full lg:w-[260px] rounded-[2rem] bg-white border-none shadow-sm px-8 font-black text-[14px]">
                 <div className="flex items-center gap-4">
                   <Filter className="w-5 h-5 text-indigo-500" strokeWidth={3} />
                   <SelectValue placeholder="All Contexts" />
                 </div>
               </SelectTrigger>
               <SelectContent className="rounded-[2.2rem] p-3 border-slate-100 shadow-2xl">
                 <SelectItem value="all" className="rounded-xl py-4 font-black">ALL SUBMISSIONS</SelectItem>
                 <SelectItem value="passed" className="rounded-xl py-4 font-black">SECURED CLUSTERS</SelectItem>
                 <SelectItem value="failed" className="rounded-xl py-4 font-black">DEFICIT CLUSTERS</SelectItem>
               </SelectContent>
             </Select>
           </div>
        </div>
      </div>
 
      {/* ─── Audit Matrix ────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {submissions.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border border-dashed border-slate-200 rounded-[4rem] py-48 text-center m-4"
          >
             <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-10 border border-slate-100 mx-auto">
                <FileText className="h-10 w-10 text-slate-200" />
             </div>
             <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">AUDIT STANDBY</h3>
             <p className="text-[17px] font-medium text-slate-400 max-w-sm mx-auto leading-relaxed italic opacity-80">
                The audit stream is currently stagnant. Zero scholar submissions identified in global registry.
             </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-8 p-4">
             {filtered.map((sub, idx) => (
               <SubmissionCard
                 key={sub._id}
                 sub={sub}
                 idx={idx}
                 isExpanded={expandedId === sub._id}
                 onToggle={() => setExpandedId(expandedId === sub._id ? null : sub._id)}
               />
             ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
 
function SubmissionCard({ sub, idx, isExpanded, onToggle }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04, duration: 0.6 }}
      className={cn(
        "group relative bg-white border rounded-[3.5rem] transition-all duration-700 overflow-hidden",
        isExpanded 
          ? "border-indigo-500/30 shadow-[0_48px_96px_-24px_rgba(79,70,229,0.12)] bg-indigo-50/10" 
          : "border-slate-100 shadow-sm hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] hover:border-slate-200"
      )}
    >
      <div className="p-10 lg:p-14">
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            
            {/* Identity Cluster */}
            <div className="flex items-center gap-8 flex-1 min-w-0">
               <div className={cn(
                 "h-24 w-24 rounded-[2.5rem] flex items-center justify-center text-[24px] font-black shadow-lg transition-transform duration-700 group-hover:rotate-6 shrink-0 border-2",
                 sub.passed ? "bg-emerald-50 text-emerald-600 border-emerald-100/50" : "bg-rose-50 text-rose-600 border-rose-100/50"
               )}>
                  {sub.studentAvatar ? <img src={sub.studentAvatar} className="w-full h-full object-cover rounded-[2.5rem]" /> : getInitials(sub.studentName)}
               </div>
               <div className="min-w-0 space-y-2">
                  <p className="text-[26px] font-black text-slate-900 tracking-[-0.02em] leading-none truncate group-hover:text-indigo-600 transition-colors uppercase">{sub.studentName}</p>
                  <p className="text-[13px] font-bold text-slate-400 truncate uppercase tracking-[0.1em] flex items-center gap-3">
                     <Mail className="w-4 h-4 opacity-40 text-indigo-500" />
                     {sub.studentEmail}
                  </p>
               </div>
            </div>
 
            {/* Context Module */}
            <div className="w-full lg:w-64 shrink-0 space-y-3">
               <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 font-mono opacity-80">// MODULE CONTEXT</p>
                  <p className="text-[19px] font-black text-slate-900 leading-tight uppercase tracking-tighter truncate">{sub.quizTitle}</p>
               </div>
               <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 w-fit">
                  <BookOpen className="w-3.5 h-3.5" />
                  <p className="text-[10px] font-black uppercase tracking-widest truncate max-w-[140px]">{sub.courseTitle}</p>
               </div>
            </div>
 
            {/* Performance Dial */}
            <div className="w-full lg:w-64 shrink-0 space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">MASTERY INDEX</span>
                  <span className={cn(
                    "text-[20px] font-black tracking-tighter",
                    sub.passed ? "text-emerald-600" : "text-rose-600"
                  )}>{sub.percentage}%</span>
               </div>
               <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden p-1 shadow-inner relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${sub.percentage}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full shadow-lg",
                      sub.passed ? "bg-emerald-500 shadow-emerald-500/20" : "bg-rose-500 shadow-rose-500/20"
                    )} 
                  />
               </div>
            </div>
            
            {/* Status & Action */}
            <div className="flex items-center gap-8 shrink-0">
               <div className={cn(
                 "px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border-2",
                 sub.passed ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
               )}>
                  {sub.passed ? 'SECURED' : 'DEFICIT'}
               </div>
               <button 
                 onClick={onToggle}
                 className={cn(
                   "h-16 w-16 rounded-3xl flex items-center justify-center transition-all duration-700",
                   isExpanded 
                     ? "bg-slate-900 text-white shadow-xl rotate-180" 
                     : "bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white"
                 )}
               >
                  <ChevronDown className="h-7 w-7" strokeWidth={3} />
               </button>
            </div>
         </div>
         
         <div className="mt-12 pt-10 border-t border-slate-50 flex flex-wrap gap-12">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Calendar className="w-5 h-5" />
               </div>
               <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">SUBMISSION PULSE</p>
                  <p className="text-[13px] font-black text-slate-600 uppercase tracking-tighter">{formatDate(sub.submittedAt)}</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Clock className="w-5 h-5" />
               </div>
               <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">TEMPORAL LATENCY</p>
                  <p className="text-[13px] font-black text-slate-600 uppercase tracking-tighter">{formatTime(sub.timeTakenSeconds)}</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Target className="h-5 w-5" />
               </div>
               <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">ATTEMPT VECTOR</p>
                  <p className="text-[13px] font-black text-slate-800 uppercase tracking-tighter">SEQUENCE #{sub.attemptNumber}</p>
               </div>
            </div>
         </div>
      </div>
 
      <AnimatePresence>
         {isExpanded && (
            <motion.div
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               className="bg-slate-50/50 border-t border-slate-100 p-12 lg:p-20"
            >
               <div className="max-w-5xl mx-auto space-y-12">
                  <div className="flex items-center justify-between">
                     <div className="space-y-2">
                        <h4 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-4">
                           <Activity className="w-7 h-7 text-indigo-600" />
                           Full Spectrum Diagnostic review
                        </h4>
                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest italic opacity-70">// Detailed sector analysis provided by neural link</p>
                     </div>
                     <div className="h-16 px-8 rounded-2xl bg-indigo-600 text-white flex items-center gap-4 shadow-xl shadow-indigo-500/20">
                        <span className="text-[20px] font-black tracking-tighter">{sub.correctCount} / {sub.totalQuestions}</span>
                        <div className="h-6 w-[1px] bg-white/20" />
                        <span className="text-[11px] font-black uppercase tracking-widest opacity-80">Sectors Secured</span>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-10">
                    {sub.questionReview.map((q: any, i: number) => (
                      <div key={i} className={cn(
                        "p-10 rounded-[3rem] border-2 transition-all bg-white relative overflow-hidden group/q",
                        q.isCorrect ? "border-emerald-500/10 shadow-lg shadow-emerald-500/5" : "border-rose-500/10 shadow-lg shadow-rose-500/5"
                      )}>
                         <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/q:opacity-[0.08] transition-opacity">
                            {q.isCorrect ? <ShieldCheck className="w-20 h-20" /> : <XCircle className="w-20 h-20" />}
                         </div>
                         <div className="flex items-start gap-8 relative z-10">
                            <div className={cn(
                              "h-14 w-14 rounded-2xl flex items-center justify-center text-[18px] font-black shrink-0 transition-all group-hover/q:rotate-12",
                              q.isCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                            )}>
                               {i + 1}
                            </div>
                            <div className="flex-1 space-y-8">
                               <p className="text-[22px] font-black text-slate-900 leading-snug tracking-tight pr-12">{q.questionText}</p>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className={cn(
                                    "p-6 rounded-[1.8rem] border flex items-center gap-6 transition-all",
                                    q.isCorrect 
                                      ? "bg-emerald-50 border-emerald-500/30 text-emerald-700" 
                                      : "bg-rose-50 border-rose-500/30 text-rose-700"
                                  )}>
                                     <div className={cn(
                                       "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border-2",
                                       q.isCorrect ? "bg-white border-emerald-500/20" : "bg-white border-rose-500/20"
                                     )}>
                                        {q.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                     </div>
                                     <div className="flex-1">
                                        <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-50 mb-1">Submitted Response</p>
                                        <p className="text-[16px] font-black leading-none">{q.selectedText}</p>
                                     </div>
                                  </div>
                                  {!q.isCorrect && (
                                    <div className="p-6 rounded-[1.8rem] border bg-emerald-50 border-emerald-500/20 text-emerald-700 flex items-center gap-6">
                                       <div className="h-10 w-10 rounded-xl bg-white border-2 border-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm">
                                          <CheckCircle2 className="w-5 h-5" />
                                       </div>
                                       <div className="flex-1">
                                          <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-50 mb-1">Validated Intelligence</p>
                                          <p className="text-[16px] font-black leading-none">{q.correctText}</p>
                                       </div>
                                    </div>
                                  )}
                               </div>
                               {q.explanation && (
                                  <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-start gap-6 relative group/expl">
                                     <div className="h-10 w-10 rounded-2xl bg-indigo-600/10 flex items-center justify-center shrink-0 group-hover/expl:scale-110 transition-transform">
                                        <Zap className="w-5 h-5 text-indigo-600 fill-indigo-600" />
                                     </div>
                                     <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-black tracking-widest text-indigo-400 opacity-60">SYNTHESIZED EXPLANATION</p>
                                        <p className="text-[15px] font-bold text-slate-500 leading-relaxed italic opacity-90">{q.explanation}</p>
                                     </div>
                                  </div>
                               )}
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
 
                  <div className="pt-10 flex justify-center">
                     <button 
                       onClick={onToggle}
                       className="h-16 px-12 rounded-[1.5rem] bg-slate-900 text-white text-[13px] font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
                     >
                       CLOSE AUDIT LOG
                     </button>
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>
    </motion.div>
  )
}
 
function MetricMiniCard({ label, value, icon, variant = "default" }: any) {
  return (
    <div className={cn(
      "p-6 rounded-[2.5rem] border flex items-center gap-5 transition-all cursor-default group",
      variant === "glass" 
        ? "bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-md" 
        : "bg-slate-50/50 border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-lg"
    )}>
       <div className={cn(
         "h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform",
         variant === "glass" ? "bg-white/10" : "bg-white border border-slate-200"
       )}>
          {icon}
       </div>
       <div>
          <p className={cn(
            "text-[10px] font-black uppercase tracking-widest leading-none mb-1.5",
            variant === "glass" ? "text-indigo-200" : "text-slate-400"
          )}>{label}</p>
          <p className={cn(
            "text-[24px] font-black leading-none tracking-tighter",
            variant === "glass" ? "text-white" : "text-slate-900"
          )}>{value}</p>
       </div>
    </div>
  )
}
 
export default function InstructorSubmissionsPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
                <div className="relative">
                  <div className="h-20 w-20 border-[6px] border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Database className="w-6 h-6 text-indigo-600 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                   <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.3em]">Synchronizing Submission Hub</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic animate-pulse">Establishing audit link...</p>
                </div>
            </div>
        }>
            <SubmissionsContent />
        </Suspense>
    )
}
