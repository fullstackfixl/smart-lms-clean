"use client"

import React, { useState, useEffect, useCallback, Suspense } from "react"
import {
  Trophy,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Hash,
  Database,
  RefreshCw,
  Filter,
  Eye,
  FileText,
  FileQuestion,
  Download,
  ChevronLeft,
  ChevronRight
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
  type: 'quiz'
}

interface AssignmentSubmission {
  _id: string
  studentId: string
  studentName: string
  studentEmail: string
  studentAvatar: string | null
  assignmentId: string
  assignmentTitle: string
  maxScore: number
  courseId: string
  courseTitle: string
  earnedScore: number | null
  percentage: number | null
  status: 'submitted' | 'graded'
  submittedAt: string
  gradedAt: string | null
  gradedBy: string | null
  comments: string | null
  content: string
  attachments: string[]
  type: 'assignment'
}

type SubmissionItem = QuizSubmission | AssignmentSubmission

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
  const [activeTab, setActiveTab] = useState<'all' | 'quiz' | 'assignment'>('all')
  const [items, setItems] = useState<SubmissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const loadAll = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [quizRes, assignmentRes] = await Promise.all([
        instructorApi.listQuizSubmissions(token, 'limit=100'),
        instructorApi.listSubmissions(token, 'limit=100')
      ])

      const quizItems: QuizSubmission[] = quizRes.success
        ? (() => {
            const payload: any = quizRes.data
            const list = payload?.submissions || payload?.quizSubmissions || payload || []
            return (Array.isArray(list) ? list : []).map((s: any) => ({ ...s, type: 'quiz' as const }))
          })()
        : []

      if (!quizRes.success) {
        toast.error(quizRes.error || 'Failed to load quiz submissions')
      }

      const assignmentItems: AssignmentSubmission[] = assignmentRes.success
        ? (() => {
            const payload: any = assignmentRes.data
            const list = payload?.submissions || payload || []
            return (Array.isArray(list) ? list : []).map((s: any) => ({
              _id: s._id,
              studentId: s.studentId,
              studentName: s.studentName,
              studentEmail: s.studentEmail,
              studentAvatar: s.studentAvatar,
              assignmentId: s.assignmentId,
              assignmentTitle: s.assignmentTitle,
              maxScore: s.maxScore,
              courseId: s.courseId,
              courseTitle: s.courseTitle,
              earnedScore: s.earnedScore,
              percentage: s.percentage,
              status: s.status,
              submittedAt: s.submittedAt,
              gradedAt: s.gradedAt,
              gradedBy: s.gradedBy,
              comments: s.comments,
              content: s.content,
              attachments: s.attachments || [],
              type: 'assignment' as const
            }))
          })()
        : []

      if (!assignmentRes.success) {
        toast.error(assignmentRes.error || 'Failed to load assignment submissions')
      }

      const combined: SubmissionItem[] = [...quizItems, ...assignmentItems]
      combined.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      setItems(combined)
    } catch {
      toast.error('Network error: Could not load submissions')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const tabbed = items.filter(i => activeTab === 'all' ? true : i.type === activeTab)

  const filtered = tabbed.filter(s => {
    const title = s.type === 'quiz' ? s.quizTitle : s.assignmentTitle
    const matchSearch = s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
      title.toLowerCase().includes(search.toLowerCase()) ||
      s.courseTitle.toLowerCase().includes(search.toLowerCase())

    if (filterStatus === 'all') return matchSearch
    if (filterStatus === 'passed') return matchSearch && s.type === 'quiz' && s.passed
    if (filterStatus === 'failed') return matchSearch && s.type === 'quiz' && !s.passed
    if (filterStatus === 'graded') return matchSearch && s.type === 'assignment' && s.status === 'graded'
    if (filterStatus === 'pending') return matchSearch && s.type === 'assignment' && s.status === 'submitted'
    return matchSearch
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const pageItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const quizOnly = items.filter(i => i.type === 'quiz') as QuizSubmission[]
  const assignmentOnly = items.filter(i => i.type === 'assignment') as AssignmentSubmission[]

  const stats = {
    total: items.length,
    quizzes: quizOnly.length,
    assignments: assignmentOnly.length,
    passed: quizOnly.filter(s => s.passed).length,
    failed: quizOnly.filter(s => !s.passed).length,
    pending: assignmentOnly.filter(s => s.status === 'submitted').length
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-2">
            <Trophy className="w-3.5 h-3.5" />
            Performance Insights
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Student Submissions</h1>
          <p className="text-slate-500 mt-1">Review quiz attempts and assignment submissions.</p>
        </div>
        <Button variant="outline" onClick={loadAll} className="border-gray-200">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Total Submissions" value={stats.total} icon={Hash} color="blue" />
        <MetricCard label="Quiz Attempts" value={stats.quizzes} icon={FileQuestion} color="orange" />
        <MetricCard label="Assignments" value={stats.assignments} icon={FileText} color="green" />
        <MetricCard label="Pending Grading" value={stats.pending} icon={Clock} color="red" />
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-4 flex flex-col gap-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setActiveTab('all'); setCurrentPage(1) }}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-bold transition-all',
              activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            )}
          >
            All
          </button>
          <button
            onClick={() => { setActiveTab('quiz'); setCurrentPage(1) }}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-bold transition-all',
              activeTab === 'quiz' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'
            )}
          >
            Quizzes
          </button>
          <button
            onClick={() => { setActiveTab('assignment'); setCurrentPage(1) }}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-bold transition-all',
              activeTab === 'assignment' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'
            )}
          >
            Assignments
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[1.5]" />
          <input
            type="text"
            placeholder="Search by learner, quiz, or course..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            className="h-10 w-full pl-10 pr-4 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setCurrentPage(1) }}>
          <SelectTrigger className="w-[180px] h-10 border-gray-200">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {activeTab !== 'assignment' && <SelectItem value="passed">Quiz: Passed</SelectItem>}
            {activeTab !== 'assignment' && <SelectItem value="failed">Quiz: Failed</SelectItem>}
            {activeTab !== 'quiz' && <SelectItem value="pending">Assignment: Pending</SelectItem>}
            {activeTab !== 'quiz' && <SelectItem value="graded">Assignment: Graded</SelectItem>}
          </SelectContent>
        </Select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Learner</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Score / Status</th>
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
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-48 text-center text-slate-400">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  No submissions found.
                </td>
              </tr>
            ) : (
              pageItems.map((sub) => (
                <React.Fragment key={`${sub.type}:${sub._id}`}>
                  <tr className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                          sub.type === 'quiz'
                            ? sub.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                            : sub.status === 'graded' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-700"
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
                      <div className="flex items-center gap-2">
                        {sub.type === 'quiz'
                          ? <FileQuestion className="w-4 h-4 text-purple-600" />
                          : <FileText className="w-4 h-4 text-emerald-600" />
                        }
                        <span className="text-sm font-medium text-slate-900">{sub.type === 'quiz' ? 'Quiz' : 'Assignment'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900">
                        {sub.type === 'quiz' ? sub.quizTitle : sub.assignmentTitle}
                      </p>
                      <p className="text-sm text-slate-500">{sub.courseTitle}</p>
                    </td>
                    <td className="px-4 py-4">
                      {sub.type === 'quiz' ? (
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-20 bg-slate-100 rounded-full overflow-hidden">
                              <div className={cn("h-full rounded-full", sub.passed ? "bg-green-500" : "bg-red-500")} style={{ width: `${sub.percentage}%` }} />
                            </div>
                            <span className="text-sm font-medium text-slate-900">{sub.percentage}%</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{sub.correctCount}/{sub.totalQuestions} • attempt {sub.attemptNumber}</p>
                        </div>
                      ) : (
                        <div>
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded border",
                            sub.status === 'graded'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-orange-100 text-orange-700 border-orange-200'
                          )}>
                            {sub.status === 'graded' ? 'GRADED' : 'PENDING'}
                          </span>
                          <p className="text-xs text-slate-500 mt-1">
                            {sub.earnedScore !== null ? `${sub.earnedScore}/${sub.maxScore}` : `—/${sub.maxScore}`}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {formatDate(sub.submittedAt)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setExpandedKey(expandedKey === `${sub.type}:${sub._id}` ? null : `${sub.type}:${sub._id}`)}
                        className="border-gray-200"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {expandedKey === `${sub.type}:${sub._id}` ? 'Close' : 'Review'}
                      </Button>
                    </td>
                  </tr>

                  {expandedKey === `${sub.type}:${sub._id}` && sub.type === 'quiz' && sub.questionReview && (
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
                  {expandedKey === `${sub.type}:${sub._id}` && sub.type === 'assignment' && (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 bg-slate-50">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-slate-900">Assignment Submission</h4>
                            <span className="text-sm text-slate-500">{sub.status === 'graded' ? 'Graded' : 'Not graded yet'}</span>
                          </div>

                          {sub.content && (
                            <div className="bg-white border border-gray-200 rounded-md p-4">
                              <p className="text-sm font-medium text-slate-700 mb-2">Student Answer:</p>
                              <p className="text-sm text-slate-700 whitespace-pre-wrap">{sub.content}</p>
                            </div>
                          )}

                          {sub.attachments?.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-md p-4">
                              <p className="text-sm font-medium text-slate-700 mb-3">Attachments:</p>
                              <div className="flex flex-wrap gap-2">
                                {sub.attachments.map((url, i) => {
                                  // Handle base64 data URLs
                                  const isBase64 = url.startsWith('data:')
                                  const handleDownload = (e: React.MouseEvent) => {
                                    e.preventDefault()
                                    if (isBase64) {
                                      // Extract mime type and data
                                      const match = url.match(/^data:([^;]+);base64,(.+)$/)
                                      if (match) {
                                        const mimeType = match[1]
                                        const base64Data = match[2]
                                        const byteCharacters = atob(base64Data)
                                        const byteNumbers = new Array(byteCharacters.length)
                                        for (let i = 0; i < byteCharacters.length; i++) {
                                          byteNumbers[i] = byteCharacters.charCodeAt(i)
                                        }
                                        const byteArray = new Uint8Array(byteNumbers)
                                        const blob = new Blob([byteArray], { type: mimeType })
                                        const blobUrl = URL.createObjectURL(blob)
                                        
                                        const link = document.createElement('a')
                                        link.href = blobUrl
                                        link.download = `attachment-${i + 1}.${mimeType.split('/')[1] || 'bin'}`
                                        document.body.appendChild(link)
                                        link.click()
                                        document.body.removeChild(link)
                                        URL.revokeObjectURL(blobUrl)
                                      }
                                    } else {
                                      window.open(url, '_blank')
                                    }
                                  }
                                  
                                  return (
                                    <button
                                      key={i}
                                      onClick={handleDownload}
                                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 text-sm text-slate-700 hover:bg-gray-50 transition-colors"
                                    >
                                      <Download className="w-4 h-4" />
                                      Attachment {i + 1}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Grading Form */}
                          <div className="bg-white border border-gray-200 rounded-md p-4">
                            <p className="text-sm font-medium text-slate-700 mb-4">Grade Assignment:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm text-slate-600 mb-1">Score (out of {sub.maxScore})</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={sub.maxScore}
                                  defaultValue={sub.earnedScore || ''}
                                  id={`score-${sub._id}`}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                  placeholder="Enter score"
                                />
                              </div>
                              <div>
                                <label className="block text-sm text-slate-600 mb-1">Comments / Feedback</label>
                                <textarea
                                  id={`comments-${sub._id}`}
                                  defaultValue={sub.comments || ''}
                                  rows={1}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                  placeholder="Add feedback..."
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={async () => {
                                  const scoreInput = document.getElementById(`score-${sub._id}`) as HTMLInputElement
                                  const commentsInput = document.getElementById(`comments-${sub._id}`) as HTMLTextAreaElement
                                  const score = parseFloat(scoreInput.value)
                                  const comments = commentsInput.value
                                  
                                  if (isNaN(score) || score < 0 || score > sub.maxScore) {
                                    toast.error(`Please enter a valid score between 0 and ${sub.maxScore}`)
                                    return
                                  }
                                  
                                  if (!token) {
                                    toast.error('Not authenticated')
                                    return
                                  }
                                  
                                  try {
                                    const res = await instructorApi.gradeSubmission(token, sub._id, {
                                      earned_score: score,
                                      comments: comments
                                    })
                                    
                                    if (res.success) {
                                      toast.success('Grade saved successfully!')
                                      await loadAll()
                                    } else {
                                      toast.error(res.error || 'Failed to save grade')
                                    }
                                  } catch (err) {
                                    toast.error('Error saving grade')
                                  }
                                }}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Save Grade
                              </Button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>

        {!loading && filtered.length > itemsPerPage && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-slate-700">{currentPage}/{totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
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
