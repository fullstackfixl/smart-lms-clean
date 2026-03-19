"use client"

import { useEffect, useMemo, useState } from "react"
import { FileText, RefreshCw, Search, Upload, Calendar, Clock, CheckCircle } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { useAuth } from "../../../lib/auth-context"
import { collegeApi, submissionApi } from "../../../lib/api"
import { toast } from "sonner"

interface Assignment {
  _id: string
  title: string
  description?: string
  due_date?: string
  max_score?: number
  course_id?: { _id: string; title: string }
  subjectId?: { _id: string; name: string; code?: string }
  created_by?: { _id: string; name: string; email: string }
}

interface Submission {
  _id: string
  assignment_id: string
  status: 'submitted' | 'graded'
  submitted_at: string
  earned_score?: number
  comments?: string
}

export default function StudentAssignmentsPage() {
  const { token, user } = useAuth()
  const [items, setItems] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({})
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const isCollege = String(user?.organizationType || '').toUpperCase() === 'COLLEGE'

  async function loadAssignments() {
    if (!token) return
    setLoading(true)
    try {
      console.log('📥 Loading student assignments...')
      let data: Assignment[] = []
      
      if (isCollege) {
        const res = await collegeApi.getStudentAssignments(token)
        console.log('📦 Assignments response:', res)
        if (res.success) {
          data = (res.data as any)?.assignments || []
          console.log('✅ Assignments loaded:', data.length, data)
        } else {
          console.error('❌ Failed to load:', res.error)
          toast.error(res.error || 'Failed to load assignments')
        }
      }
      
      setItems(data)
      
      // Load submissions for these assignments
      if (data.length > 0) {
        await loadSubmissions(data.map(a => a._id))
      }
    } catch (err) {
      console.error('❌ Error loading assignments:', err)
      toast.error('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  async function loadSubmissions(assignmentIds: string[]) {
    if (!token || assignmentIds.length === 0) return
    try {
      console.log('📥 Loading submissions for assignments:', assignmentIds)
      // Query each assignment separately to avoid issues
      const submissionsMap: Record<string, Submission> = {}
      
      for (const assignmentId of assignmentIds) {
        const res = await submissionApi.list(token, `assignment_id=${assignmentId}`)
        if (res.success) {
          const subs = (res.data as any)?.submissions || []
          console.log(`Submissions for ${assignmentId}:`, subs)
          subs.forEach((s: Submission) => {
            if (s.assignment_id) {
              submissionsMap[s.assignment_id] = s
            }
          })
        }
      }
      
      console.log('📦 All submissions loaded:', submissionsMap)
      setSubmissions(submissionsMap)
    } catch (err) {
      console.error('Failed to load submissions:', err)
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
      (a.course_id?.title || '').toLowerCase().includes(s) ||
      (a.subjectId?.name || '').toLowerCase().includes(s)
    )
  }, [items, q])

  const handleSubmit = async (assignmentId: string) => {
    if (!token) return
    if (!content.trim() && !file) {
      toast.error('Please provide content or upload a file')
      return
    }

    // Validate assignmentId format
    console.log('🔍 Submitting for assignmentId:', assignmentId, 'Type:', typeof assignmentId, 'Length:', assignmentId?.length);
    
    if (!assignmentId || assignmentId.length !== 24) {
      toast.error('Invalid assignment ID format')
      console.error('❌ Invalid assignmentId:', assignmentId);
      return
    }

    setSubmitting(assignmentId)
    try {
      let attachments: string[] = []
      
      if (file) {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        attachments = [base64]
      }

      const payload = {
        assignment_id: assignmentId,
        content: content.trim(),
        attachments
      }
      
      console.log('📤 Submitting payload:', payload);
      
      const res = await submissionApi.create(token, payload)

      console.log('📥 Submit response:', res)

      if (res.success) {
        toast.success('Assignment submitted successfully!')
        // Immediately add submission to state for instant UI feedback
        const newSubmission: Submission = {
          _id: res.data?.submission?._id || Date.now().toString(),
          assignment_id: assignmentId,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        }
        setSubmissions(prev => ({ ...prev, [assignmentId]: newSubmission }))
        setSelectedAssignment(null)
        setContent('')
        setFile(null)
        await loadSubmissions(items.map(a => a._id))
      } else {
        toast.error(res.error || 'Failed to submit')
        console.error('❌ Submit failed:', res);
      }
    } catch (err) {
      console.error('❌ Submit error:', err)
      toast.error('Failed to submit assignment')
    } finally {
      setSubmitting(null)
    }
  }

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
          <h1 className="text-2xl font-bold text-slate-900">My Assignments</h1>
          <p className="text-slate-500 mt-1">
            {items.length === 0 ? 'No assignments available' : `${items.length} assignment${items.length > 1 ? 's' : ''}`}
          </p>
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

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-md p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No assignments found</h3>
          <p className="text-slate-500 mt-1">Check back later or contact your instructor.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((a) => {
            const submission = submissions[a._id]
            const isSubmitted = !!submission
            const isGraded = submission?.status === 'graded'

            return (
              <div key={a._id} className="bg-white border border-gray-200 rounded-md p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{a.title}</p>
                      {isSubmitted && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          isGraded 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {isGraded ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {isGraded ? `Graded: ${submission.earned_score}/${a.max_score}` : 'Submitted'}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                      {a.subjectId?.name && (
                        <span className="inline-flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {a.subjectId.name}
                          {a.subjectId.code && ` (${a.subjectId.code})`}
                        </span>
                      )}
                      {a.due_date && (
                        <span className={`inline-flex items-center gap-1 ${
                          new Date(a.due_date) < new Date() && !isSubmitted ? 'text-red-600 font-medium' : ''
                        }`}>
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(a.due_date).toLocaleString()}
                        </span>
                      )}
                      <span>Max Score: {a.max_score || 100}</span>
                    </div>

                    {a.description && (
                      <p className="text-sm text-slate-600 mt-3">{a.description}</p>
                    )}

                    {submission?.comments && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-xs font-medium text-slate-700">Instructor Feedback:</p>
                        <p className="text-sm text-slate-600 mt-1">{submission.comments}</p>
                      </div>
                    )}
                  </div>

                  {!isSubmitted && (
                    <Button 
                      size="sm" 
                      onClick={() => setSelectedAssignment(a)}
                      className="shrink-0"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Submit
                    </Button>
                  )}
                </div>

                {/* Submission Form */}
                {selectedAssignment?._id === a._id && !isSubmitted && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Your Answer / Notes
                        </label>
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Type your answer or add notes..."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Upload File (optional)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="text-sm"
                          />
                          {file && (
                            <span className="text-xs text-slate-500">
                              {file.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          onClick={() => handleSubmit(a._id)}
                          disabled={submitting === a._id || (!content.trim() && !file)}
                        >
                          {submitting === a._id ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Submit Assignment
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAssignment(null)
                            setContent('')
                            setFile(null)
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
