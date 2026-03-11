"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Video, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2,
  Users,
  Signal,
  Globe,
  Play,
  X,
  RefreshCw,
  ChevronRight
} from "lucide-react"
import { Button } from '../../../components/ui/button'
import { toast } from "sonner"
import { cn } from "../../../lib/utils"
import { useAuth } from '../../../lib/auth-context'
import { liveClassApi } from '../../../lib/api'

interface LiveClass {
  _id: string
  title: string
  description: string
  course_id?: { _id: string; title: string }
  scheduled_date: string
  start_time: string
  duration_minutes: number
  meeting_url: string
  status: "scheduled" | "live" | "completed" | "cancelled"
  students?: number
}

interface Course {
  _id: string
  title: string
}

function MetricCard({ label, value, icon: Icon, color = "blue" }: { label: string; value: string | number; icon: any; color?: "blue" | "green" | "orange" | "indigo" | "red" }) {
  const colors = {
    blue: { bg: "bg-blue-50", icon: "text-blue-500" },
    green: { bg: "bg-green-50", icon: "text-green-500" },
    orange: { bg: "bg-orange-50", icon: "text-orange-500" },
    indigo: { bg: "bg-indigo-50", icon: "text-indigo-500" },
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

export default function InstructorLiveClassesPage() {
  const { token } = useAuth()
  const router = useRouter()
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    courseId: "",
    meetingLink: "",
    scheduledAt: "",
    duration: "60"
  })

  const fetchClasses = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await liveClassApi.listInstructor(token)
      if (res.success) {
        setClasses((res.data as any)?.classes || [])
      } else {
        toast.error("Failed to load live classes")
      }
    } catch (error) {
      toast.error("Error loading live classes")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !form.title.trim() || !form.scheduledAt) {
      toast.error("Please fill in required fields")
      return
    }

    setSubmitting(true)
    try {
      const res = await liveClassApi.schedule(token, {
        title: form.title,
        description: form.description,
        courseId: form.courseId || undefined,
        meetingLink: form.meetingLink || undefined,
        scheduledAt: form.scheduledAt,
        duration: parseInt(form.duration)
      })

      if (res.success) {
        toast.success("Live class scheduled successfully")
        setShowForm(false)
        setForm({ title: "", description: "", courseId: "", meetingLink: "", scheduledAt: "", duration: "60" })
        fetchClasses()
      } else {
        toast.error(res.error || "Failed to schedule class")
      }
    } catch (error) {
      toast.error("Error scheduling class")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return
    if (!token) return

    try {
      const res = await liveClassApi.cancel(token, id)
      if (res.success) {
        toast.success("Session cancelled successfully")
        fetchClasses()
      } else {
        toast.error(res.error || "Failed to cancel session")
      }
    } catch (error) {
      toast.error("Error cancelling session")
    }
  }

  const scheduledCount = classes.filter(c => c.status === 'scheduled').length
  const completedCount = classes.filter(c => c.status === 'completed').length
  const liveCount = classes.filter(c => c.status === 'live').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-2">
            <Video className="w-3.5 h-3.5" />
            Live Learning
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Live Classes</h1>
          <p className="text-slate-500 mt-1">Schedule and manage your live interactive sessions for students.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchClasses} className="border-gray-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className={showForm ? "bg-gray-600" : "bg-orange-500 hover:bg-orange-600"}
          >
            {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showForm ? "Cancel" : "Schedule New Class"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Total Classes" value={classes.length} icon={Video} color="blue" />
        <MetricCard label="Live Now" value={liveCount} icon={Signal} color="red" />
        <MetricCard label="Upcoming" value={scheduledCount} icon={Calendar} color="green" />
        <MetricCard label="Completed" value={completedCount} icon={Globe} color="indigo" />
      </div>

      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Schedule New Class</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                required
                placeholder="e.g. Weekly Q&A Session"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time</label>
              <input
                type="datetime-local"
                required
                value={form.scheduledAt}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min={15}
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Link (Optional)</label>
              <input
                placeholder="Zoom/Google Meet link"
                value={form.meetingLink}
                onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))}
                className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                {submitting ? "Scheduling..." : "Schedule Class"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-slate-900">Class Schedule</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Class</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Schedule</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Duration</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="h-48 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    Loading classes...
                  </div>
                </td>
              </tr>
            ) : classes.length === 0 ? (
              <tr>
                <td colSpan={5} className="h-48 text-center text-slate-400">
                  <Video className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  No live classes scheduled.
                </td>
              </tr>
            ) : (
              classes.map((lc) => (
                <tr key={lc._id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded flex items-center justify-center",
                        lc.status === 'live' ? "bg-red-100 text-red-600" : 
                        lc.status === 'completed' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                      )}>
                        <Video className="w-5 h-5 stroke-[1.5]" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{lc.title}</p>
                        {lc.course_id && <p className="text-sm text-slate-500">{lc.course_id.title}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn("px-2 py-1 text-xs font-medium rounded border",
                      lc.status === 'live' ? 'bg-red-100 text-red-700 border-red-200' :
                      lc.status === 'scheduled' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      lc.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    )}>
                      {lc.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {new Date(lc.scheduled_date).toLocaleDateString()}<br/>
                    <span className="text-slate-500">{lc.start_time}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{lc.duration_minutes} mins</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {lc.meeting_url && (
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50" onClick={() => window.open(lc.meeting_url, '_blank')}>
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      {lc.status === 'scheduled' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleCancel(lc._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
