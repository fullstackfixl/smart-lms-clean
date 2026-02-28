"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, Search, CheckCircle2, XCircle, Trophy, Clock,
  ChevronDown, ChevronUp, BookOpen, Mail, Calendar,
  BarChart3, Loader2, RefreshCw, Filter, Hash, Star
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { API_URL } from "@/lib/config"

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

export default function InstructorSubmissionsPage() {
  const { token } = useAuth()
  const router = useRouter()

  const [submissions, setSubmissions] = useState<QuizSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPass, setFilterPass] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

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
        setTotalCount(data.data.pagination?.total || 0)
      } else {
        toast.error(data.message || 'Failed to load submissions')
      }
    } catch {
      toast.error('Could not connect to server')
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

  // Stats
  const stats = {
    total: submissions.length,
    passed: submissions.filter(s => s.passed).length,
    failed: submissions.filter(s => !s.passed).length,
    avgScore: submissions.length ? Math.round(submissions.reduce((a, s) => a + s.percentage, 0) / submissions.length) : 0
  }

  // ─── Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center relative">
          <Users className="h-8 w-8 text-indigo-600 animate-pulse" />
          <Loader2 className="absolute -top-1 -right-1 h-5 w-5 animate-spin text-indigo-600" />
        </div>
        <p className="text-slate-500 font-semibold text-lg">Loading submissions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-16">
      {/* ── Header ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Quiz <span className="text-indigo-600">Submissions</span>
          </h1>
          <p className="text-slate-500 mt-1">All student quiz attempts across your courses</p>
        </div>
        <Button
          onClick={loadSubmissions}
          variant="outline"
          className="gap-2 rounded-xl border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </motion.div>

      {/* ── Stats row ─────────────────────────────────────────── */}
      {submissions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Attempts', value: stats.total, icon: Hash, color: 'bg-blue-50 text-blue-600' },
            { label: 'Passed', value: stats.passed, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
            { label: 'Failed', value: stats.failed, icon: XCircle, color: 'bg-red-50 text-red-500' },
            { label: 'Avg Score', value: stats.avgScore + '%', icon: BarChart3, color: 'bg-indigo-50 text-indigo-600' },
          ].map(s => (
            <Card key={s.label} className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-11 w-11 rounded-xl ${s.color.split(' ')[0]} flex items-center justify-center shrink-0`}>
                  <s.icon className={`h-5 w-5 ${s.color.split(' ')[1]}`} />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* ── Filters ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by student name, email, quiz or course..."
            className="pl-10 h-11 rounded-xl border-slate-200 bg-white shadow-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterPass} onValueChange={setFilterPass}>
          <SelectTrigger className="h-11 w-[160px] rounded-xl border-slate-200 bg-white shadow-sm">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="passed">Passed Only</SelectItem>
            <SelectItem value="failed">Failed Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Submission count ──────────────────────────────────── */}
      {filtered.length > 0 && (
        <p className="text-sm font-medium text-slate-500">
          Showing <span className="font-bold text-slate-800">{filtered.length}</span> of {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* ── Submissions List ──────────────────────────────────── */}
      {submissions.length === 0 ? (
        <Card className="border-0 shadow-md rounded-3xl">
          <CardContent className="py-20 flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Users className="h-10 w-10 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700">No submissions yet</h3>
            <p className="text-slate-400 text-center max-w-sm">
              When students attempt and submit your published quizzes, their results will appear here.
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-md rounded-3xl">
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <Search className="h-10 w-10 text-slate-300" />
            <p className="text-slate-500 font-medium">No submissions match your filter</p>
            <Button variant="ghost" className="text-indigo-600" onClick={() => { setSearch(''); setFilterPass('all') }}>
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {filtered.map((sub, idx) => (
            <SubmissionCard
              key={sub._id}
              sub={sub}
              idx={idx}
              isExpanded={expandedId === sub._id}
              onToggle={() => setExpandedId(expandedId === sub._id ? null : sub._id)}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// SUBMISSION CARD
// ─────────────────────────────────────────────────────────────────
function SubmissionCard({
  sub, idx, isExpanded, onToggle
}: {
  sub: QuizSubmission
  idx: number
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
    >
      <Card className={`border-0 shadow-md rounded-2xl overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-indigo-400' : 'hover:shadow-lg'}`}>
        {/* ── Pass/Fail color strip ────────────────────────── */}
        <div className={`h-1.5 w-full ${sub.passed ? 'bg-green-500' : 'bg-red-400'}`} />

        {/* ── Main row ────────────────────────────────────── */}
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Student avatar + info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-base font-extrabold shrink-0 ${sub.passed ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                {sub.studentAvatar ? (
                  <img src={sub.studentAvatar} alt={sub.studentName} className="h-12 w-12 rounded-xl object-cover" />
                ) : getInitials(sub.studentName)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-base leading-tight truncate">{sub.studentName}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                  <Mail className="h-3 w-3 shrink-0" /> {sub.studentEmail}
                </p>
              </div>
            </div>

            {/* Quiz + Course */}
            <div className="md:w-48 min-w-0">
              <p className="font-semibold text-slate-700 text-sm truncate">{sub.quizTitle}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                <BookOpen className="h-3 w-3 shrink-0" /> {sub.courseTitle}
              </p>
            </div>

            {/* Score */}
            <div className="md:w-36 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>{sub.correctCount}/{sub.totalQuestions} correct</span>
                <span className={sub.passed ? 'text-green-600' : 'text-red-500'}>{sub.percentage}%</span>
              </div>
              <Progress
                value={sub.percentage}
                className={`h-2 ${sub.passed ? '[&>div]:bg-green-500' : '[&>div]:bg-red-400'}`}
              />
            </div>

            {/* Status + meta */}
            <div className="flex items-center gap-3 shrink-0">
              {sub.passed ? (
                <Badge className="bg-green-50 text-green-700 border border-green-200 gap-1">
                  <Trophy className="h-3 w-3" /> Passed
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1 opacity-80">
                  <XCircle className="h-3 w-3" /> Failed
                </Badge>
              )}
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {formatTime(sub.timeTakenSeconds)}
                </p>
                <p className="text-xs text-slate-400">Attempt #{sub.attemptNumber}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="rounded-xl h-9 px-3 text-indigo-600 hover:bg-indigo-50 shrink-0"
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className="ml-1 text-xs font-semibold hidden sm:inline">
                  {isExpanded ? 'Hide' : 'Review'}
                </span>
              </Button>
            </div>
          </div>

          {/* Date row */}
          <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Submitted: {formatDate(sub.submittedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3" /> Pass threshold: {sub.passPercentage}%
            </span>
            <span className="flex items-center gap-1 sm:hidden">
              <Clock className="h-3 w-3" /> Time: {formatTime(sub.timeTakenSeconds)}
            </span>
          </div>
        </CardContent>

        {/* ── Expandable Question Review ───────────────────── */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="bg-slate-50 border-t border-slate-100 p-5 space-y-3">
                <h4 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-indigo-600" />
                  Question-by-Question Review
                  <span className="ml-auto text-xs font-normal text-slate-400">
                    {sub.correctCount} correct / {sub.totalQuestions} total
                  </span>
                </h4>
                {sub.questionReview.length > 0 ? (
                  sub.questionReview.map((q, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border p-4 ${q.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${q.isCorrect ? 'bg-green-500 text-white' : 'bg-red-400 text-white'}`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm mb-2">{q.questionText}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className={`flex items-center gap-1.5 rounded-lg px-3 py-2 font-medium ${q.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                              {q.isCorrect ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <XCircle className="h-3.5 w-3.5 shrink-0" />}
                              <span>Answered: {q.selectedText}</span>
                            </div>
                            {!q.isCorrect && (
                              <div className="flex items-center gap-1.5 rounded-lg px-3 py-2 font-medium bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                <span>Correct: {q.correctText}</span>
                              </div>
                            )}
                          </div>
                          {q.explanation && (
                            <p className="text-xs text-slate-500 mt-1.5 italic">💡 {q.explanation}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">No question details available</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}
