"use client"

import { useEffect, useState } from "react"
import { Award, RefreshCw, Trophy, BookOpen } from "lucide-react"
import { useAuth } from "../../../lib/auth-context"
import { collegeApi } from "../../../lib/api"
import { Button } from "../../../components/ui/button"
import { toast } from "sonner"

interface QuizAttempt {
  _id: string
  quiz_id?: { _id: string; title: string; course_id?: string }
  score?: number
  percentage?: number
  passed?: boolean
  attempt_number?: number
  submitted_at?: string
}

interface LectureQuizResult {
  _id: string
  course_id?: { _id: string; title: string }
  lecture_id?: { _id: string; title: string }
  score?: number
  passed?: boolean
  submitted_at?: string
}

export default function StudentResultsPage() {
  const { token } = useAuth()
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([])
  const [lectureResults, setLectureResults] = useState<LectureQuizResult[]>([])
  const [loading, setLoading] = useState(true)

  async function loadResults() {
    if (!token) return
    setLoading(true)
    try {
      const res = await collegeApi.getStudentResults(token)
      if (res.success) {
        const payload: any = res.data || {}
        setQuizAttempts(payload.quizAttempts || [])
        setLectureResults(payload.lectureQuizResults || [])
      } else {
        toast.error(res.error || 'Failed to load results')
      }
    } catch {
      toast.error('Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResults()
  }, [token])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-gray-100 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const totalAttempts = quizAttempts.length + lectureResults.length
  const passedCount = quizAttempts.filter(a => a.passed).length + lectureResults.filter(r => r.passed).length

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Results</h1>
          <p className="text-slate-500 mt-1">Your quiz performance & attempt history</p>
        </div>
        <Button variant="outline" onClick={loadResults} className="border-gray-200">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Total Attempts</p>
              <p className="text-3xl font-bold text-slate-900">{totalAttempts}</p>
            </div>
            <div className="p-3 rounded-md bg-blue-50">
              <BookOpen className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Passed</p>
              <p className="text-3xl font-bold text-slate-900">{passedCount}</p>
            </div>
            <div className="p-3 rounded-md bg-green-50">
              <Trophy className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Pass Rate</p>
              <p className="text-3xl font-bold text-slate-900">{totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0}%</p>
            </div>
            <div className="p-3 rounded-md bg-orange-50">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-slate-900">Quiz Attempts</h2>
          <p className="text-sm text-slate-500">All submitted attempts</p>
        </div>

        {totalAttempts === 0 ? (
          <div className="text-center py-12 text-slate-500">No results yet.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {quizAttempts.map((a) => (
              <div key={a._id} className="px-6 py-4 hover:bg-blue-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{a.quiz_id?.title || 'Quiz'}</p>
                    <p className="text-xs text-slate-400 mt-1">Attempt #{a.attempt_number || 1} • {a.submitted_at ? new Date(a.submitted_at).toLocaleString() : ''}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">{Math.round(a.percentage || 0)}%</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded border ${a.passed ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                      {a.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {lectureResults.map((r) => (
              <div key={r._id} className="px-6 py-4 hover:bg-blue-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{r.lecture_id?.title || 'Lecture Quiz'}</p>
                    <p className="text-xs text-slate-400 mt-1">{r.course_id?.title || ''} • {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : ''}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">{Math.round(r.score || 0)}%</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded border ${r.passed ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                      {r.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
