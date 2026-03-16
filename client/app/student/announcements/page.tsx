"use client"

import { useEffect, useState } from "react"
import { Megaphone, RefreshCw, Pin } from "lucide-react"
import { useAuth } from "../../../lib/auth-context"
import { collegeApi } from "../../../lib/api"
import { Button } from "../../../components/ui/button"
import { toast } from "sonner"

interface Announcement {
  _id: string
  title: string
  message: string
  is_pinned: boolean
  createdAt: string
  course_id?: { _id: string; title: string }
  instructor_id?: { _id: string; name?: string; email?: string; profile?: any }
}

export default function StudentAnnouncementsPage() {
  const { token } = useAuth()
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  async function loadAnnouncements() {
    if (!token) return
    setLoading(true)
    try {
      const res = await collegeApi.getStudentAnnouncements(token)
      if (res.success) {
        const payload: any = res.data || {}
        setItems(payload.announcements || [])
      } else {
        toast.error(res.error || 'Failed to load announcements')
      }
    } catch {
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnouncements()
  }, [token])

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
          <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
          <p className="text-slate-500 mt-1">Updates from your instructors</p>
        </div>
        <Button variant="outline" onClick={loadAnnouncements} className="border-gray-200">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">All Announcements</h2>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No announcements yet.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((a) => (
              <div key={a._id} className="px-6 py-5 hover:bg-blue-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {a.is_pinned && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-100 px-2 py-1 rounded">
                          <Pin className="w-3.5 h-3.5" /> Pinned
                        </span>
                      )}
                      {a.course_id?.title && (
                        <span className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded">
                          {a.course_id.title}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-900 mt-2">{a.title}</p>
                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{a.message}</p>
                    <p className="text-xs text-slate-400 mt-2">{new Date(a.createdAt).toLocaleString()}</p>
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
