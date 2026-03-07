"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, Edit, Trash2, Users, Clock, Award, Star, Loader2, AlertCircle, X, ExternalLink, BookOpen } from "lucide-react"
import { getCourses, publishCourse, deleteUser } from '../../../lib/services/orgAdminApi'
import { toast } from "sonner"
import { Badge } from "../../../components/ui/badge"

interface Course {
  _id: string
  title: string
  description: string
  category: string
  instructor_id: {
    _id: string
    profile?: { fullName: string }
    email: string
  }
  isPublished: boolean
  price: number
  level: string
  thumbnail?: string
  enrollmentCount?: number
  createdAt: string
}

export default function ContentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    loadCourses()
  }, [statusFilter])

  async function loadCourses() {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter !== "all") params.status = statusFilter
      if (searchTerm) params.search = searchTerm

      const response = await getCourses(params)
      if (response.success && response.data) {
        setCourses(Array.isArray(response.data) ? response.data : (response.data.courses || []))
      }
    } catch (error) {
      console.error('Error loading courses:', error)
      toast.error("Failed to load content courses")
    } finally {
      setLoading(false)
    }
  }

  async function handleTogglePublish(courseId: string, currentStatus: boolean) {
    try {
      const response = await publishCourse(courseId, !currentStatus)
      if (response.success) {
        toast.success(`Course ${!currentStatus ? 'published' : 'unpublished'} successfully`)
        loadCourses()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update course status')
    }
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.instructor_id?.profile?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading content courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent mb-2">
            LMS Courses
          </h1>
          <p className="text-slate-400">Manage and monitor instructor-created content courses ({courses.length})</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = '/instructor/courses/new'}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium border border-white/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create as Admin
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title, category, or instructor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <button
              onClick={loadCourses}
              className="px-4 h-11 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all"
            >
              Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-indigo-400 opacity-50" />
          </div>
          <p className="text-slate-400 text-lg">No content courses found</p>
          <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="group relative bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden hover:border-indigo-500/30 transition-all"
            >
              {/* Thumbnail */}
              <div className="aspect-video w-full bg-slate-800 relative overflow-hidden">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-slate-700" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge className={course.isPublished ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}>
                    {course.isPublished ? "Published" : "Draft"}
                  </Badge>
                  <Badge variant="outline" className="bg-slate-900/80 backdrop-blur-md">
                    {course.level}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">{course.category}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Users className="w-3 h-3" />
                    <span>{course.enrollmentCount || 0}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-100 mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                  {course.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 mb-4 h-8 leading-relaxed">
                  {course.description}
                </p>

                <div className="flex items-center gap-3 mb-6 p-3 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold">
                    {course.instructor_id?.profile?.fullName?.charAt(0) || "I"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-300 truncate">{course.instructor_id?.profile?.fullName || "Instructor"}</p>
                    <p className="text-[9px] text-slate-500 truncate">{course.instructor_id?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePublish(course._id, course.isPublished)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${course.isPublished
                        ? "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
                      }`}
                  >
                    {course.isPublished ? "Unpublish" : "Publish Now"}
                  </button>
                  <button
                    onClick={() => window.open(`/courses/${course._id}`, '_blank')}
                    className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/10 transition-all"
                    title="View Public Page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
