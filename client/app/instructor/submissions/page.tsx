"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  FileText, Filter, Search, CheckCircle, Clock, XCircle,
  Eye, MessageSquare, Award, Calendar, User, BookOpen
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
import { instructorApi } from "@/lib/api"
import { toast } from "sonner"

interface Submission {
  _id: string
  student_id: {
    _id: string
    name: string
    email: string
    profile?: { avatar?: string }
  }
  course_id: {
    _id: string
    title: string
  }
  assignment_type: string
  assignment_title: string
  submission_content?: string
  submission_url?: string
  submitted_date: string
  max_score: number
  earned_score?: number
  percentage?: number
  comments?: string
  graded_by?: {
    _id: string
    name: string
  }
  graded_date?: string
}

export default function SubmissionsPage() {
  const router = useRouter()
  const { token } = useAuth()

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Grading dialog
  const [showGradeDialog, setShowGradeDialog] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [gradeForm, setGradeForm] = useState({
    earned_score: 0,
    comments: ""
  })

  useEffect(() => {
    loadSubmissions()
  }, [token, page, statusFilter])

  async function loadSubmissions() {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        status: statusFilter
      })
      
      const res = await instructorApi.listSubmissions(token, params.toString())
      if (res.success && res.data) {
        setSubmissions((res.data as any).submissions || [])
        setTotalPages((res.data as any).pagination?.pages || 1)
      }
    } catch (error) {
      toast.error("Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }

  async function handleGradeSubmission() {
    if (!token || !selectedSubmission) return

    if (gradeForm.earned_score < 0 || gradeForm.earned_score > selectedSubmission.max_score) {
      toast.error(`Score must be between 0 and ${selectedSubmission.max_score}`)
      return
    }

    try {
      const res = await instructorApi.gradeSubmission(token, selectedSubmission._id, gradeForm)
      if (res.success) {
        toast.success("Submission graded successfully")
        setShowGradeDialog(false)
        setSelectedSubmission(null)
        setGradeForm({ earned_score: 0, comments: "" })
        loadSubmissions()
      } else {
        toast.error(res.error || "Failed to grade submission")
      }
    } catch (error) {
      toast.error("Failed to grade submission")
    }
  }

  function openGradeDialog(submission: Submission) {
    setSelectedSubmission(submission)
    setGradeForm({
      earned_score: submission.earned_score || 0,
      comments: submission.comments || ""
    })
    setShowGradeDialog(true)
  }

  const filteredSubmissions = submissions.filter(sub =>
    searchQuery === "" ||
    sub.student_id.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.course_id.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.assignment_title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (submission: Submission) => {
    if (submission.graded_date) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
          <CheckCircle className="h-3 w-3" />
          Graded
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 text-xs font-medium">
        <Clock className="h-3 w-3" />
        Pending
      </div>
    )
  }

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Submissions</h1>
        <p className="text-muted-foreground mt-1">Review and grade student submissions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student, course, or assignment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="graded">Graded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border bg-muted/20">
          <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium">No submissions found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "Try adjusting your search" : "Submissions will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <motion.div
              key={submission._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/50 bg-card p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Student Info */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                      {submission.student_id.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{submission.student_id.name}</p>
                      <p className="text-sm text-muted-foreground">{submission.student_id.email}</p>
                    </div>
                  </div>

                  {/* Assignment Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{submission.course_id.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{submission.assignment_title}</span>
                      <span className="text-xs text-muted-foreground">
                        ({submission.assignment_type})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Submitted {new Date(submission.submitted_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Submission Content */}
                  {submission.submission_url && (
                    <a
                      href={submission.submission_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
                    >
                      <Eye className="h-4 w-4" />
                      View Submission
                    </a>
                  )}

                  {/* Grade Info */}
                  {submission.graded_date && (
                    <div className="flex items-center gap-4 pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-orange-500" />
                        <span className="font-semibold text-lg">
                          {submission.earned_score}/{submission.max_score}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({submission.percentage?.toFixed(1)}%)
                        </span>
                      </div>
                      {submission.graded_by && (
                        <div className="text-sm text-muted-foreground">
                          Graded by {submission.graded_by.name}
                        </div>
                      )}
                    </div>
                  )}

                  {submission.comments && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{submission.comments}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-3">
                  {getStatusBadge(submission)}
                  <Button
                    size="sm"
                    onClick={() => openGradeDialog(submission)}
                    className="gap-2"
                  >
                    <Award className="h-4 w-4" />
                    {submission.graded_date ? "Update Grade" : "Grade"}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Grade Dialog */}
      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              {selectedSubmission && (
                <>
                  {selectedSubmission.student_id.name} - {selectedSubmission.assignment_title}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="score">
                  Score (out of {selectedSubmission.max_score})
                </Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max={selectedSubmission.max_score}
                  value={gradeForm.earned_score}
                  onChange={(e) =>
                    setGradeForm({ ...gradeForm, earned_score: parseFloat(e.target.value) || 0 })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Percentage: {((gradeForm.earned_score / selectedSubmission.max_score) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comments">Feedback</Label>
                <Textarea
                  id="comments"
                  placeholder="Provide feedback to the student..."
                  value={gradeForm.comments}
                  onChange={(e) => setGradeForm({ ...gradeForm, comments: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGradeSubmission}>
              <Award className="h-4 w-4 mr-2" />
              Submit Grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
