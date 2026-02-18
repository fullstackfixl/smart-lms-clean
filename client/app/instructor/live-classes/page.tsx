"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Video, Plus, Calendar, Clock, Users, Link as LinkIcon,
  Edit, Trash2, Play, CheckCircle, XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

interface Course {
  _id: string
  title: string
}

interface LiveClass {
  _id: string
  course_id: {
    _id: string
    title: string
  }
  title: string
  description?: string
  scheduled_date: string
  duration_minutes: number
  meeting_link?: string
  status: "scheduled" | "live" | "completed" | "cancelled"
  is_active: boolean
  createdAt: string
}

export default function LiveClassesPage() {
  const router = useRouter()
  const { token } = useAuth()

  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingClass, setEditingClass] = useState<LiveClass | null>(null)
  const [classForm, setClassForm] = useState({
    course_id: "",
    title: "",
    description: "",
    scheduled_date: "",
    duration_minutes: 60,
    meeting_link: ""
  })

  useEffect(() => {
    loadData()
  }, [token])

  async function loadData() {
    if (!token) return
    setLoading(true)
    try {
      await Promise.all([loadLiveClasses(), loadCourses()])
    } catch (error) {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  async function loadLiveClasses() {
    if (!token) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/live-classes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })
      const data = await res.json()
      if (data.success && data.data) {
        setLiveClasses(data.data.liveClasses || [])
      }
    } catch (error) {
      console.error("Failed to load live classes:", error)
    }
  }

  async function loadCourses() {
    if (!token) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/instructor/courses?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })
      const data = await res.json()
      if (data.success && data.data) {
        setCourses(data.data.courses || [])
      }
    } catch (error) {
      console.error("Failed to load courses:", error)
    }
  }

  async function handleCreateClass() {
    if (!token || !classForm.course_id || !classForm.title || !classForm.scheduled_date) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const csrfRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/csrf-token`, {
        credentials: "include",
      })
      const csrfData = await csrfRes.json()

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/live-classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-CSRF-Token": csrfData.data?.csrfToken || "",
        },
        credentials: "include",
        body: JSON.stringify(classForm),
      })

      const data = await res.json()
      if (data.success) {
        toast.success("Live class created successfully")
        setShowDialog(false)
        resetForm()
        loadLiveClasses()
      } else {
        toast.error(data.error || "Failed to create live class")
      }
    } catch (error) {
      toast.error("Failed to create live class")
    }
  }

  async function handleUpdateClass() {
    if (!token || !editingClass || !classForm.title || !classForm.scheduled_date) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const csrfRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/csrf-token`, {
        credentials: "include",
      })
      const csrfData = await csrfRes.json()

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/live-classes/${editingClass._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-CSRF-Token": csrfData.data?.csrfToken || "",
        },
        credentials: "include",
        body: JSON.stringify(classForm),
      })

      const data = await res.json()
      if (data.success) {
        toast.success("Live class updated successfully")
        setShowDialog(false)
        setEditingClass(null)
        resetForm()
        loadLiveClasses()
      } else {
        toast.error(data.error || "Failed to update live class")
      }
    } catch (error) {
      toast.error("Failed to update live class")
    }
  }

  async function handleDeleteClass(id: string) {
    if (!token || !confirm("Delete this live class?")) return

    try {
      const csrfRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/csrf-token`, {
        credentials: "include",
      })
      const csrfData = await csrfRes.json()

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/live-classes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-CSRF-Token": csrfData.data?.csrfToken || "",
        },
        credentials: "include",
      })

      const data = await res.json()
      if (data.success) {
        toast.success("Live class deleted successfully")
        loadLiveClasses()
      } else {
        toast.error(data.error || "Failed to delete live class")
      }
    } catch (error) {
      toast.error("Failed to delete live class")
    }
  }

  function openDialog(liveClass?: LiveClass) {
    if (liveClass) {
      setEditingClass(liveClass)
      setClassForm({
        course_id: liveClass.course_id._id,
        title: liveClass.title,
        description: liveClass.description || "",
        scheduled_date: new Date(liveClass.scheduled_date).toISOString().slice(0, 16),
        duration_minutes: liveClass.duration_minutes,
        meeting_link: liveClass.meeting_link || ""
      })
    } else {
      setEditingClass(null)
      resetForm()
    }
    setShowDialog(true)
  }

  function resetForm() {
    setClassForm({
      course_id: "",
      title: "",
      description: "",
      scheduled_date: "",
      duration_minutes: 60,
      meeting_link: ""
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-medium">
            <Calendar className="h-3 w-3" />
            Scheduled
          </div>
        )
      case "live":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
            <Play className="h-3 w-3" />
            Live
          </div>
        )
      case "completed":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-600 text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            Completed
          </div>
        )
      case "cancelled":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-medium">
            <XCircle className="h-3 w-3" />
            Cancelled
          </div>
        )
      default:
        return null
    }
  }

  const upcomingClasses = liveClasses.filter(
    c => c.status === "scheduled" || c.status === "live"
  )
  const pastClasses = liveClasses.filter(
    c => c.status === "completed" || c.status === "cancelled"
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading live classes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Classes</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage live sessions</p>
        </div>
        <Button onClick={() => openDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Schedule Class
        </Button>
      </div>

      {/* Upcoming Classes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Upcoming Classes</h2>
        {upcomingClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-border bg-muted/20">
            <Video className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No upcoming classes scheduled</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingClasses.map((liveClass) => (
              <motion.div
                key={liveClass._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border/50 bg-card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{liveClass.title}</h3>
                    <p className="text-sm text-muted-foreground">{liveClass.course_id.title}</p>
                  </div>
                  {getStatusBadge(liveClass.status)}
                </div>

                {liveClass.description && (
                  <p className="text-sm text-muted-foreground mb-4">{liveClass.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(liveClass.scheduled_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(liveClass.scheduled_date).toLocaleTimeString()} ({liveClass.duration_minutes} min)
                    </span>
                  </div>
                  {liveClass.meeting_link && (
                    <a
                      href={liveClass.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Join Meeting
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openDialog(liveClass)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteClass(liveClass._id)}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Past Classes */}
      {pastClasses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Past Classes</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pastClasses.map((liveClass) => (
              <motion.div
                key={liveClass._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border/50 bg-card p-6 opacity-75"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{liveClass.title}</h3>
                    <p className="text-sm text-muted-foreground">{liveClass.course_id.title}</p>
                  </div>
                  {getStatusBadge(liveClass.status)}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(liveClass.scheduled_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{liveClass.duration_minutes} minutes</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingClass ? "Edit Live Class" : "Schedule Live Class"}</DialogTitle>
            <DialogDescription>
              {editingClass ? "Update live class details" : "Create a new live class session"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="course">Course *</Label>
              <Select
                value={classForm.course_id}
                onValueChange={(value) => setClassForm({ ...classForm, course_id: value })}
                disabled={!!editingClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course._id} value={course._id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Class Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Week 1 - Introduction"
                value={classForm.title}
                onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What will be covered in this session?"
                value={classForm.description}
                onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Date & Time *</Label>
                <Input
                  id="scheduled_date"
                  type="datetime-local"
                  value={classForm.scheduled_date}
                  onChange={(e) => setClassForm({ ...classForm, scheduled_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  step="15"
                  value={classForm.duration_minutes}
                  onChange={(e) =>
                    setClassForm({ ...classForm, duration_minutes: parseInt(e.target.value) || 60 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting_link">Meeting Link</Label>
              <Input
                id="meeting_link"
                placeholder="https://zoom.us/j/..."
                value={classForm.meeting_link}
                onChange={(e) => setClassForm({ ...classForm, meeting_link: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Zoom, Google Meet, or any video conferencing link
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={editingClass ? handleUpdateClass : handleCreateClass}>
              <Calendar className="h-4 w-4 mr-2" />
              {editingClass ? "Update" : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
