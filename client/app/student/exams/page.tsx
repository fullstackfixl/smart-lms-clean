"use client"

import { useEffect, useState } from "react"
import { Target, RefreshCw } from "lucide-react"
import { useAuth } from "../../../lib/auth-context"
import { collegeApi } from "../../../lib/api"
import { Button } from "../../../components/ui/button"
import { toast } from "sonner"

interface ExamItem {
  _id?: string
  title?: string
  date?: string
  time?: string
  venue?: string
  semester?: number
}

export default function StudentExamsPage() {
  const { token } = useAuth()
  const [exams, setExams] = useState<ExamItem[]>([])
  const [loading, setLoading] = useState(true)

  async function loadExams() {
    if (!token) return
    setLoading(true)
    try {
      const res = await collegeApi.getStudentExams(token)
      if (res.success) {
        const payload: any = res.data || {}
        setExams(payload.exams || [])
      } else {
        toast.error(res.error || 'Failed to load exams')
      }
    } catch {
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExams()
  }, [token])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Exams</h1>
          <p className="text-slate-500 mt-1">Your exam schedule</p>
        </div>
        <Button variant="outline" onClick={loadExams} className="border-gray-200">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Target className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">Upcoming Exams</h2>
        </div>

        {exams.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No exams scheduled.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {exams.map((e, idx) => (
              <div key={e._id || idx} className="px-6 py-4 hover:bg-blue-50/50 transition-colors">
                <p className="font-medium text-slate-900">{e.title || 'Exam'}</p>
                <p className="text-sm text-slate-600 mt-1">
                  {(e.date ? new Date(e.date).toLocaleDateString() : 'TBA')} {e.time ? `• ${e.time}` : ''} {e.venue ? `• ${e.venue}` : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
