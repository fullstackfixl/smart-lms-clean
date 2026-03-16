"use client"

import { useEffect, useMemo, useState } from "react"
import { FileText, RefreshCw, Search } from "lucide-react"
import { useAuth } from "../../../lib/auth-context"
import { collegeApi } from "../../../lib/api"
import { API_URL } from "../../../lib/config"
import { Button } from "../../../components/ui/button"
import { toast } from "sonner"

interface Assignment {
  _id: string
  title: string
  description?: string
  due_date?: string
  max_score?: number
  course_id?: { _id: string; title: string }
  created_by?: { _id: string; name: string; email: string }
}

export default function StudentAssignmentsPage() {
  const { token, user } = useAuth()
  const [items, setItems] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")

  const isCollege = String(user?.organizationType || '').toUpperCase() === 'COLLEGE'

  async function loadAssignments() {
    if (!token) return
    setLoading(true)
    try {
      let data
      if (isCollege) {
        const res = await collegeApi.getStudentAssignments(token)
        if (res.success) {
          data = (res.data as any)?.assignments || []
        } else {
          toast.error(res.error || 'Failed to load assignments')
          setLoading(false)
          return
        }
      } else {
        const r = await fetch(`${API_URL}/api/assignments?active=true&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        })
        const response = await r.json()
        if (response.success) {
          data = response.data?.assignments || []
        } else {
          toast.error(response.message || 'Failed to load assignments')
          setLoading(false)
          return
        }
      }
      setItems(data || [])
    } catch {
      toast.error('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssignments()
  }, [token])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter(a =>
      a.title?.toLowerCase().includes(s) ||
      (a.course_id?.title || '').toLowerCase().includes(s)
    )
  }, [items, q])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
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
          <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
          <p className="text-slate-500 mt-1">View tasks posted for your courses</p>
        </div>
        <Button variant="outline" onClick={loadAssignments} className="border-gray-200">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search assignments..."
            className="h-10 w-full pl-10 pr-4 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">All Assignments</h2>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No assignments found.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filtered.map((a) => (
              <div key={a._id} className="px-6 py-4 hover:bg-blue-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{a.title}</p>
                    {a.course_id?.title && <p className="text-xs text-slate-500 mt-1">{a.course_id.title}</p>}
                    {a.description && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{a.description}</p>}
                    <p className="text-xs text-slate-400 mt-2">
                      {a.due_date ? `Due: ${new Date(a.due_date).toLocaleString()}` : 'No due date'}
                      {a.max_score ? ` • Max: ${a.max_score}` : ''}
                    </p>
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
