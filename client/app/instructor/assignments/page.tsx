"use client"

import { useEffect, useMemo, useState } from "react"
import { FileText, RefreshCw, Send, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "../../../components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select"
import { useAuth } from "../../../lib/auth-context"
import { assignmentApi, instructorApi } from "../../../lib/api"
import { toast } from "sonner"

interface BatchRef {
  _id: string
  name?: string
  code?: string
  year?: number
  semester?: number
}

interface SubjectCard {
  _id: string
  name?: string
  code?: string
  batchId?: string | null
  batch?: BatchRef | null
}

export default function InstructorAssignmentsPage() {
  const { token, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<SubjectCard[]>([])

  const [subjectId, setSubjectId] = useState<string>("")
  const [batchId, setBatchId] = useState<string>("")

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [maxScore, setMaxScore] = useState<string>("100")
  const [submitting, setSubmitting] = useState(false)

  const isCollege = String(user?.organizationType || "").toUpperCase() === "COLLEGE"

  const loadSubjects = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await instructorApi.listSubjects(token)
      if (!res.success) {
        toast.error(res.error || "Failed to load subjects")
        setSubjects([])
        return
      }

      const payload: any = res.data
      const list = payload?.subjects || payload || []
      setSubjects(Array.isArray(list) ? list : [])
    } catch {
      toast.error("Failed to load subjects")
      setSubjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    if (!isCollege) return
    loadSubjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isCollege])

  const subjectOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; code?: string }>()
    for (const s of subjects) {
      const id = String(s._id)
      if (!id) continue
      if (!map.has(id)) {
        map.set(id, { id, name: s.name || "Unnamed Subject", code: s.code })
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [subjects])

  const batchOptions = useMemo(() => {
    if (!subjectId) return []
    const rows = subjects.filter((s) => String(s._id) === String(subjectId) && s.batchId)
    const map = new Map<string, { id: string; label: string }>()

    for (const r of rows) {
      const id = String(r.batchId)
      if (!id) continue
      const b = r.batch
      const label = b?.name || b?.code || "Batch"
      map.set(id, { id, label })
    }

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
  }, [subjects, subjectId])

  useEffect(() => {
    // Reset batch when subject changes
    setBatchId("")
  }, [subjectId])

  const canSubmit = Boolean(subjectId && batchId && title.trim() && !submitting)

  const handleCreate = async () => {
    if (!token) return
    if (!subjectId || !batchId) {
      toast.error("Please select subject and batch")
      return
    }
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }

    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() ? description.trim() : undefined,
        subjectId,
        batchId,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        max_score: Number(maxScore || 0),
      }

      const res = await assignmentApi.create(token, payload)
      if (res.success) {
        toast.success("Assignment published to the batch")
        setTitle("")
        setDescription("")
        setDueDate("")
        setMaxScore("100")
      } else {
        toast.error(res.error || "Failed to create assignment")
      }
    } catch {
      toast.error("Failed to create assignment")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isCollege) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <FileText className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">Assignments Not Available</h2>
        <p className="text-slate-500 mt-2">This module is available for college/institution accounts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
          <p className="text-slate-500 mt-1">Create and publish assignments to your Subject + Batch.</p>
        </div>
        <Button variant="outline" onClick={loadSubjects} disabled={loading} className="border-gray-200">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="h-10 border-gray-200">
                <SelectValue placeholder={loading ? "Loading..." : "Select subject"} />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}{s.code ? ` (${s.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Batch</label>
            <Select value={batchId} onValueChange={setBatchId} disabled={!subjectId || batchOptions.length === 0}>
              <SelectTrigger className="h-10 border-gray-200">
                <SelectValue placeholder={!subjectId ? "Select subject first" : batchOptions.length ? "Select batch" : "No batches assigned"} />
              </SelectTrigger>
              <SelectContent>
                {batchOptions.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., DSA Assignment 1"
            className="h-10 w-full px-3 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Instructions for students..."
            rows={4}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Deadline</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 w-full pl-10 pr-3 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Max Score</label>
            <input
              type="number"
              min={0}
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              className="h-10 w-full px-3 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Students will see this in <span className="font-semibold">/student/assignments</span> and submissions will appear in <span className="font-semibold">/instructor/submissions</span>.
          </p>
          <Button onClick={handleCreate} disabled={!canSubmit} className="h-10">
            <Send className="w-4 h-4 mr-2" />
            {submitting ? "Publishing..." : "Publish Assignment"}
          </Button>
        </div>
      </div>
    </div>
  )
}
