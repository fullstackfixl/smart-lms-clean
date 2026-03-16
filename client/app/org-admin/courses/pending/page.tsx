"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  BookOpen, CheckCircle, XCircle, Clock, Search, 
  User, Calendar, Loader2, Eye, X, RefreshCw
} from "lucide-react"
import { collegeApi } from "../../../../lib/api"
import { useAuth } from "../../../../lib/auth-context"
import { Button } from "../../../../components/ui/button"
import { toast } from "sonner"

interface PendingCourse {
  _id: string
  title: string
  description: string
  category: string
  level: string
  thumbnail?: string
  instructor_id: {
    _id: string
    name?: string
    email: string
    profile?: {
      firstName: string
      lastName: string
    }
  }
  createdAt: string
  status: string
}

export default function PendingCoursesPage() {
  const { token } = useAuth()
  const [courses, setCourses] = useState<PendingCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<PendingCourse | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    if (token) loadPendingCourses()
  }, [token])

  async function loadPendingCourses() {
    setLoading(true)
    try {
      if (!token) return
      console.log('[DEBUG] Frontend: Loading pending courses...')
      const response = await collegeApi.listPendingCourses(token)
      console.log('[DEBUG] Frontend: API response:', response)
      if (response.success && response.data) {
        const data = response.data as { courses?: PendingCourse[] }
        console.log('[DEBUG] Frontend: Courses count:', data.courses?.length || 0)
        setCourses(data.courses || [])
      } else {
        console.log('[DEBUG] Frontend: Response not successful:', response)
      }
    } catch (error) {
      console.error('Error loading pending courses:', error)
      toast.error("Failed to load pending courses")
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(courseId: string) {
    setProcessingId(courseId)
    try {
      if (!token) return
      const response = await collegeApi.approveCourse(token, courseId, { status: 'published' })
      if (response.success) {
        toast.success("Course approved and published successfully")
        loadPendingCourses()
      }
    } catch (error) {
      console.error('Error approving course:', error)
      toast.error("Failed to approve course")
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(courseId: string) {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason")
      return
    }
    setProcessingId(courseId)
    try {
      if (!token) return
      const response = await collegeApi.approveCourse(token, courseId, { 
        status: 'rejected', 
        rejectionReason: rejectReason 
      })
      if (response.success) {
        toast.success("Course rejected")
        setShowRejectModal(false)
        setSelectedCourse(null)
        setRejectReason("")
        loadPendingCourses()
      }
    } catch (error) {
      console.error('Error rejecting course:', error)
      toast.error("Failed to reject course")
    } finally {
      setProcessingId(null)
    }
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.instructor_id?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (course.instructor_id?.profile?.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (course.instructor_id?.profile?.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (course.category?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading pending courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Course Approvals</h1>
          <p className="text-slate-500 mt-1">Review and approve instructor-submitted courses ({courses.length} pending)</p>
        </div>
        <Button variant="outline" onClick={loadPendingCourses} className="border-gray-200">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-gray-200 rounded-md p-6"
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by course name, instructor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-11 pr-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </motion.div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-md">
          <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500">No pending courses to review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="bg-white border border-gray-200 rounded-md overflow-hidden hover:border-gray-300 transition-colors"
            >
              {/* Thumbnail */}
              <div className="h-40 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 relative">
                {course.thumbnail && (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-orange-100">
                    Pending Review
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-medium rounded">
                    {course.category || 'General'}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-medium rounded">
                    {course.level || 'Beginner'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                  {course.title}
                </h3>

                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {course.description || "No description provided"}
                </p>

                {/* Instructor */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                  <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-bold">
                    {(course.instructor_id?.name?.charAt(0) || 
                      course.instructor_id?.profile?.firstName?.charAt(0) || 
                      'I')}
                  </div>
                  <div>
                    <p className="text-sm text-slate-900 font-medium">
                      {course.instructor_id?.name || 
                       `${course.instructor_id?.profile?.firstName || ''} ${course.instructor_id?.profile?.lastName || ''}`.trim() || 
                       'Unknown Instructor'}
                    </p>
                    <p className="text-xs text-slate-500">{course.instructor_id?.email}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleApprove(course._id)}
                    disabled={processingId === course._id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {processingId === course._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedCourse(course)
                      setShowRejectModal(true)
                    }}
                    variant="outline"
                    className="flex-1 border-gray-200 text-slate-700 hover:bg-red-50 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md"
          >
            <button
              onClick={() => setShowRejectModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-100 mb-2">Reject Course</h3>
            <p className="text-slate-400 text-sm mb-4">
              You are about to reject "{selectedCourse.title}". Please provide a reason for rejection.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all resize-none"
            />

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedCourse._id)}
                disabled={processingId === selectedCourse._id}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {processingId === selectedCourse._id ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Reject Course"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
