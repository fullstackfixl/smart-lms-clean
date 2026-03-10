"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter } from "next/navigation"
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
  Boxes,
  CheckCircle,
  MoreVertical
} from "lucide-react"
import { Button } from '../../../components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { useAuth } from '../../../lib/auth-context'
import { toast } from "sonner"
import { API_URL } from '../../../lib/config'
import { cn } from "../../../lib/utils"
import { 
  SimpleCard, 
  SimpleBadge,
  FlatTable,
  FlatTableHead,
  FlatTableRow,
  FlatTableCell 
} from '../../../components/platform/ui-standard'
 
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
        toast.error("Failed to synchronize submission data")
      }
    } catch {
      toast.error("Network error: Could not reach submission server")
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
    <div className="space-y-10 pb-20">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl opacity-60" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            <Trophy className="w-3.5 h-3.5" />
            Performance Insights
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quiz Submissions</h1>
          <p className="text-sm text-slate-500 font-medium italic">Review learner achievement, quiz results, and detailed performance metrics.</p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4">
          <Button 
            variant="outline"
            onClick={loadSubmissions}
            className="rounded-2xl h-14 px-8 border-slate-200 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4 stroke-[3]" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* ─── Metrics Quickview ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricMiniCard label="Total Submissions" value={stats.total} icon={<Hash className="w-6 h-6 text-blue-600" />} />
        <MetricMiniCard label="Avg. Score" value={`${stats.avgScore}%`} icon={<Trophy className="w-6 h-6 text-orange-600" />} />
        <MetricMiniCard label="Passed" value={stats.passed} icon={<CheckCircle className="w-6 h-6 text-emerald-600" />} />
        <MetricMiniCard label="Failed" value={stats.failed} icon={<XCircle className="w-6 h-6 text-rose-600" />} />
      </div>

      {/* ─── Submissions Log Table ─── */}
      <SimpleCard className="p-0 overflow-hidden border-slate-100 shadow-sm rounded-[2.5rem]">
        <div className="p-10 border-b border-slate-50 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[3]" />
            <input
              type="text"
              placeholder="Search by learner, quiz, or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-14 w-full pl-14 pr-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all font-bold text-slate-900 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <Select value={filterPass} onValueChange={setFilterPass}>
              <SelectTrigger className="h-14 w-[220px] rounded-2xl bg-white border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-indigo-500/5 transition-all">
                <SelectValue placeholder="All Results" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                <SelectItem value="all" className="rounded-xl py-3 font-black text-[10px] uppercase tracking-widest text-slate-600">All Attempts</SelectItem>
                <SelectItem value="passed" className="rounded-xl py-3 font-black text-[10px] uppercase tracking-widest text-emerald-600">Passed Only</SelectItem>
                <SelectItem value="failed" className="rounded-xl py-3 font-black text-[10px] uppercase tracking-widest text-rose-600">Failed Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <FlatTable>
          <FlatTableHead>
            <FlatTableRow className="bg-slate-50/50">
              <FlatTableCell className="w-[100px] font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6 pl-10">Learner</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6">Quiz Assessment</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6">Score</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6">Status</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6">Submitted Date</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6 text-right pr-10">Actions</FlatTableCell>
            </FlatTableRow>
          </FlatTableHead>
          <tbody>
            {filtered.length === 0 ? (
              <FlatTableRow>
                <FlatTableCell colSpan={6} className="h-72 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400 italic font-bold">
                    <Database className="w-12 h-12 mb-4 opacity-10" />
                    No submissions found matching your search.
                  </div>
                </FlatTableCell>
              </FlatTableRow>
            ) : (
              filtered.map((sub) => (
                <Suspense key={sub._id} fallback={<tr><td colSpan={6}>Loading...</td></tr>}>
                   <SubmissionRow
                    sub={sub}
                    isExpanded={expandedId === sub._id}
                    onToggle={() => setExpandedId(expandedId === sub._id ? null : sub._id)}
                  />
                </Suspense>
              ))
            )}
          </tbody>
        </FlatTable>
      </SimpleCard>
    </div>
  )
}

function SubmissionRow({ sub, isExpanded, onToggle }: any) {
  return (
    <>
      <FlatTableRow className={cn("group transition-all", isExpanded && "bg-indigo-50/30")}>
        <FlatTableCell className="pl-10 py-8">
          <div className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-black border shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500",
            sub.passed ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
          )}>
            {getInitials(sub.studentName)}
          </div>
        </FlatTableCell>
        <FlatTableCell>
          <div className="space-y-1.5 min-w-[300px]">
            <p className="text-[15px] font-black text-slate-900 uppercase pr-8 truncate group-hover:text-indigo-600 transition-colors">{sub.quizTitle}</p>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">{sub.studentName} // {sub.courseTitle}</p>
          </div>
        </FlatTableCell>
        <FlatTableCell>
          <div className="flex items-center gap-3">
            <div className="h-2 w-20 bg-slate-100 rounded-full overflow-hidden shrink-0 shadow-inner">
               <div className={cn("h-full rounded-full transition-all duration-700", sub.passed ? "bg-emerald-500" : "bg-rose-500")} style={{ width: `${sub.percentage}%` }} />
            </div>
            <span className="text-[11px] font-black tabular-nums text-slate-900 tracking-wider">{sub.percentage}%</span>
          </div>
        </FlatTableCell>
        <FlatTableCell>
          <SimpleBadge variant={sub.passed ? 'green' : 'red'}>
            {sub.passed ? 'PASSED' : 'FAILED'}
          </SimpleBadge>
        </FlatTableCell>
        <FlatTableCell>
          <div className="flex items-center gap-2 text-slate-600 font-black uppercase tracking-widest tabular-nums text-[10px]">
            <Clock className="w-4 h-4 text-slate-400" />
            {formatDate(sub.submittedAt)}
          </div>
        </FlatTableCell>
        <FlatTableCell className="text-right pr-10">
          <div className="flex items-center justify-end gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onToggle}
              className={cn("h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all", isExpanded ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50")}
            >
              {isExpanded ? 'CLOSE' : 'REVIEW'}
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-50 text-slate-400">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </FlatTableCell>
      </FlatTableRow>
      
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-10 pb-12 pt-4 bg-indigo-50/30 border-b border-slate-100">
            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-8 gap-6">
                 <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest">
                       <Sparkles className="w-3 h-3" />
                       Analysis Report
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight">Grade Assessment Summary</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-80 pr-4 truncate max-w-lg">
                      {sub.studentName} // {sub.quizTitle}
                    </p>
                 </div>
                 <div className="flex items-center gap-10">
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Time Elapsed</p>
                       <p className="text-xl font-black text-slate-900 tabular-nums uppercase">{formatTime(sub.timeTakenSeconds)}</p>
                    </div>
                    <div className="h-10 w-[1px] bg-slate-200" />
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Score Matrix</p>
                       <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">{sub.correctCount} / {sub.totalQuestions}</p>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {sub.questionReview.map((q: any, i: number) => (
                  <div key={i} className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group/q">
                    <div className="flex items-start gap-6">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-transform group-hover/q:scale-110",
                        q.isCorrect ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                      )}>
                        {i + 1}
                      </div>
                      <div className="flex-1 space-y-6 min-w-0">
                        <p className="text-xl font-black text-slate-900 leading-tight tracking-tight">{q.questionText}</p>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                           <div className={cn(
                             "p-5 rounded-2xl border flex items-center gap-4 transition-all",
                             q.isCorrect ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800"
                           )}>
                              {q.isCorrect ? <CheckCircle className="w-5 h-5 stroke-[3]" /> : <XCircle className="w-5 h-5 stroke-[3]" />}
                              <div className="flex-1 min-w-0">
                                 <p className="text-[9px] uppercase font-black tracking-[0.2em] opacity-60 mb-1">Learner Response</p>
                                 <p className="text-[13px] font-black uppercase tracking-wider truncate">{q.selectedText}</p>
                              </div>
                           </div>
                           {!q.isCorrect && (
                             <div className="p-5 rounded-2xl border bg-emerald-50 border-emerald-100 text-emerald-800 flex items-center gap-4 transition-all">
                                <CheckCircle className="w-5 h-5 stroke-[3]" />
                                <div className="flex-1 min-w-0">
                                   <p className="text-[9px] uppercase font-black tracking-[0.2em] opacity-60 mb-1">Correct Answer</p>
                                   <p className="text-[13px] font-black uppercase tracking-wider truncate">{q.correctText}</p>
                                </div>
                             </div>
                           )}
                        </div>

                        {q.explanation && (
                          <div className="p-6 rounded-[1.5rem] bg-slate-50/80 border border-slate-100 flex items-start gap-4 transition-colors group-hover/q:bg-indigo-50/50 group-hover/q:border-indigo-100">
                             <Zap className="w-5 h-5 text-indigo-400 mt-1" />
                             <div className="space-y-1.5 flex-1">
                                <p className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400">Analysis & Context</p>
                                <p className="text-sm text-slate-600 font-bold leading-relaxed">{q.explanation}</p>
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
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

export default function InstructorSubmissionsPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
                <div className="h-16 w-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin shadow-inner" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse italic">Loading Performance Records...</p>
            </div>
        }>
            <SubmissionsContent />
        </Suspense>
    )
}
