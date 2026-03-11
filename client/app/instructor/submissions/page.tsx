"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter } from "next/navigation"
import {
  Trophy,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Hash,
  Database,
  RefreshCw,
  Filter,
  Star,
  ChevronRight,
  Eye
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
import { cn } from "../../../lib/utils"
import { instructorApi } from '../../../lib/api'

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
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

function MetricCard({ label, value, icon: Icon, color = "blue" }: { label: string; value: string | number; icon: any; color?: "blue" | "green" | "orange" | "red" }) {
  const colors = {
    blue: { bg: "bg-blue-50", icon: "text-blue-500" },
    green: { bg: "bg-green-50", icon: "text-green-500" },
    orange: { bg: "bg-orange-50", icon: "text-orange-500" },
    red: { bg: "bg-red-50", icon: "text-red-500" },
  }
  const c = colors[color]
  return (
    <div className="bg-white border border-gray-200 rounded-md p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${c.bg} rounded-md flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${c.icon} stroke-[1.5]`} />
        </div>
        <div>
          <p className="text-sm text-slate-600">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  )
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
      const res = await instructorApi.listQuizSubmissions(token, 'limit=100')
      if (res.success) {
        const payload: any = res.data
        const list = payload?.submissions || payload?.quizSubmissions || payload || []
        setSubmissions(Array.isArray(list) ? list : [])
      } else {
        toast.error(res.error || "Failed to load submissions")
      }
    } catch {
      toast.error("Network error: Could not reach submission server")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadSubmissions()
  }, [loadSubmissions])

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-2">
            <Trophy className="w-3.5 h-3.5" />
            Performance Insights
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Quiz Submissions</h1>
          <p className="text-slate-500 mt-1">Review learner achievement, quiz results, and detailed performance metrics.</p>
        </div>
        <Button variant="outline" onClick={loadSubmissions} className="border-gray-200">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Total Submissions" value={stats.total} icon={Hash} color="blue" />
        <MetricCard label="Avg. Score" value={`${stats.avgScore}%`} icon={Trophy} color="orange" />
        <MetricCard label="Passed" value={stats.passed} icon={CheckCircle2} color="green" />
        <MetricCard label="Failed" value={stats.failed} icon={XCircle} color="red" />
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[1.5]" />
          <input
            type="text"
            placeholder="Search by learner, quiz, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full pl-10 pr-4 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <Select value={filterPass} onValueChange={setFilterPass}>
          <SelectTrigger className="w-[160px] h-10 border-gray-200">
            <SelectValue placeholder="All Results" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Attempts</SelectItem>
            <SelectItem value="passed">Passed Only</SelectItem>
            <SelectItem value="failed">Failed Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Learner</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Quiz</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Score</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="h-48 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin" />
                  Loading submissions...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-48 text-center text-slate-400">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  No submissions found.
                </td>
              </tr>
            ) : (
              filtered.map((sub) => (
                <>
                  <tr key={sub._id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                          sub.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        )}>
                          {getInitials(sub.studentName)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{sub.studentName}</p>
                          <p className="text-sm text-slate-500">{sub.studentEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900">{sub.quizTitle}</p>
                      <p className="text-sm text-slate-500">{sub.courseTitle}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-20 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", sub.passed ? "bg-green-500" : "bg-red-500")} style={{ width: `${sub.percentage}%` }} />
                        </div>
                        <span className="text-sm font-medium text-slate-900">{sub.percentage}%</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{sub.correctCount}/{sub.totalQuestions}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn("px-2 py-1 text-xs font-medium rounded border",
                        sub.passed ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'
                      )}>
                        {sub.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {formatDate(sub.submittedAt)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setExpandedId(expandedId === sub._id ? null : sub._id)}
                        className="border-gray-200"
                      >
                        {expandedId === sub._id ? 'Close' : 'Review'}
                      </Button>
                    </td>
                  </tr>
                  {expandedId === sub._id && sub.questionReview && (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 bg-slate-50">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-slate-900">Detailed Review</h4>
                            <span className="text-sm text-slate-500">Time: {formatTime(sub.timeTakenSeconds)}</span>
                          </div>
                          {sub.questionReview.map((q, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-md p-4">
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded flex items-center justify-center text-sm font-bold shrink-0",
                                  q.isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                )}>
                                  {i + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-slate-900 mb-2">{q.questionText}</p>
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                    <div className={cn(
                                      "p-2 rounded border text-sm",
                                      q.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                                    )}>
                                      <span className="text-xs text-slate-500">Student Answer:</span>
                                      <p className={q.isCorrect ? "text-green-700" : "text-red-700"}>{q.selectedText}</p>
                                    </div>
                                    {!q.isCorrect && (
                                      <div className="p-2 rounded border bg-green-50 border-green-200 text-sm">
                                        <span className="text-xs text-slate-500">Correct Answer:</span>
                                        <p className="text-green-700">{q.correctText}</p>
                                      </div>
                                    )}
                                  </div>
                                  {q.explanation && (
                                    <p className="mt-2 text-sm text-slate-600 bg-slate-100 p-2 rounded">{q.explanation}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function InstructorSubmissionsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500">Loading submissions...</p>
      </div>
    }>
      <SubmissionsContent />
    </Suspense>
  )
}
