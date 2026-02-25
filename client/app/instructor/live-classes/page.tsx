"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Video, Calendar, Clock, Link, BookOpen, Plus, Trash2,
  Loader2, CheckCircle, AlertCircle, ChevronLeft, Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

import { API_URL as API } from "@/lib/config"
const getToken = () =>
  typeof window !== "undefined"
    ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
    : null

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
}

interface Course {
  _id: string
  title: string
}

export default function InstructorLiveClassesPage() {
  const router = useRouter()

  // list state
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])

  // form state
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
    setLoadingList(true)
    try {
      const r = await fetch(`${API}/instructor/live-classes`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: "include"
      })
      const data = await r.json()
      if (data.success) setClasses(data.data?.classes || [])
    } catch { toast.error("Failed to load live classes") }
    finally { setLoadingList(false) }
  }, [])

  const fetchCourses = useCallback(async () => {
    try {
      const r = await fetch(`${API}/instructor/courses`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: "include"
      })
      const data = await r.json()
      if (data.success) setCourses(data.data?.courses || data.data || [])
    } catch { /* non-critical */ }
  }, [])

  useEffect(() => {
    fetchClasses()
    fetchCourses()
  }, [fetchClasses, fetchCourses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.scheduledAt || !form.duration) {
      toast.error("Please fill in all required fields")
      return
    }
    const scheduled = new Date(form.scheduledAt)
    if (scheduled <= new Date()) {
      toast.error("Scheduled date must be in the future")
      return
    }
    if (form.meetingLink && !/^https?:\/\//.test(form.meetingLink)) {
      toast.error("Meeting link must start with http:// or https://")
      return
    }
    setSubmitting(true)
    try {
      const r = await fetch(`${API}/instructor/live-classes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          courseId: form.courseId || undefined,
          meetingLink: form.meetingLink || undefined,
          scheduledAt: form.scheduledAt,
          duration: parseInt(form.duration)
        })
      })
      const data = await r.json()
      if (data.success) {
        toast.success("Live class scheduled! Students will be notified via email.")
        setShowForm(false)
        setForm({ title: "", description: "", courseId: "", meetingLink: "", scheduledAt: "", duration: "60" })
        fetchClasses()
      } else {
        toast.error(data.message || "Failed to schedule live class")
      }
    } catch { toast.error("Network error") }
    finally { setSubmitting(false) }
  }

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this live class?")) return
    try {
      const r = await fetch(`${API}/instructor/live-classes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: "include"
      })
      const data = await r.json()
      if (data.success) {
        toast.success("Live class cancelled")
        fetchClasses()
      } else toast.error(data.message)
    } catch { toast.error("Failed to cancel") }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-700 border-blue-200",
      live: "bg-green-100 text-green-700 border-green-200 animate-pulse",
      completed: "bg-gray-100 text-gray-600 border-gray-200",
      cancelled: "bg-red-100 text-red-600 border-red-200"
    }
    return map[status] || map.scheduled
  }

  const minDateTime = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Video className="h-8 w-8 text-purple-600" />
            Live Classes
          </h1>
          <p className="text-muted-foreground mt-1">Schedule sessions — all org students get notified</p>
        </div>
        <Button
          onClick={() => setShowForm(v => !v)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" /> Schedule Class
        </Button>
      </div>

      {/* Schedule Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -16, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -16, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" /> Schedule a New Live Class
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <Label>Class Title <span className="text-red-500">*</span></Label>
                      <Input
                        className="mt-1"
                        placeholder="e.g. Introduction to React Hooks"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        className="mt-1"
                        placeholder="What will be covered in this session..."
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Date & Time <span className="text-red-500">*</span></Label>
                      <Input
                        type="datetime-local"
                        className="mt-1"
                        min={minDateTime}
                        value={form.scheduledAt}
                        onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label>Duration (minutes) <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        className="mt-1"
                        min={15}
                        max={480}
                        value={form.duration}
                        onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label>
                        <Link className="inline h-3.5 w-3.5 mr-1" />
                        Meeting Link
                      </Label>
                      <Input
                        className="mt-1"
                        placeholder="https://meet.google.com/..."
                        value={form.meetingLink}
                        onChange={e => setForm(f => ({ ...f, meetingLink: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Leave blank to auto-generate a Jitsi room</p>
                    </div>
                    <div>
                      <Label>
                        <BookOpen className="inline h-3.5 w-3.5 mr-1" />
                        Course (optional)
                      </Label>
                      <select
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={form.courseId}
                        onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                      >
                        <option value="">— Select a course —</option>
                        {courses.map(c => (
                          <option key={c._id} value={c._id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      {submitting ? "Scheduling..." : "Schedule & Notify Students"}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Classes List */}
      {loadingList ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16">
          <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No live classes yet</h3>
          <p className="text-muted-foreground mb-6">Schedule your first live class and notify all students instantly</p>
          <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <Plus className="h-4 w-4 mr-2" /> Schedule First Class
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground uppercase tracking-wide text-xs">Scheduled Sessions ({classes.length})</h2>
          {classes.map(lc => {
            const d = new Date(lc.scheduled_date)
            const [h, m] = lc.start_time.split(":")
            d.setHours(Number(h), Number(m))
            const isUpcoming = d > new Date()
            return (
              <motion.div key={lc._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusBadge(lc.status)}`}>
                            {lc.status === "live" ? "🔴 LIVE" : lc.status.charAt(0).toUpperCase() + lc.status.slice(1)}
                          </span>
                          {lc.course_id && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <BookOpen className="h-3 w-3" /> {lc.course_id.title}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg">{lc.title}</h3>
                        {lc.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{lc.description}</p>}
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {lc.start_time} · {lc.duration_minutes} min
                          </span>
                          {lc.meeting_url && (
                            <a href={lc.meeting_url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-purple-600 hover:underline">
                              <Link className="h-3.5 w-3.5" /> Join Link
                            </a>
                          )}
                        </div>
                      </div>
                      {lc.status === "scheduled" && isUpcoming && (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleCancel(lc._id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
