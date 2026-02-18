"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Plus, Edit, Trash2, Users, Clock, DollarSign, Eye, Loader2, AlertCircle } from "lucide-react"
import { getCourses, publishCourse, assignInstructor } from "@/lib/services/orgAdminApi"
import { toast } from "sonner"

interface Course {
  _id: string
  title: string
  description: string
  status: string
  instructor_id: {
    profile: {
      fullName: string
    }
    email: string
  }
  enrollmentCount?: number
  duration?: number
  price: number
  thumbnail?: string
  isPublished?: boolean
}

export default function CoursesPage() {
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
        setCourses(response.data.courses || [])
      }
    } catch (error) {
      console.error('Error loading courses:', error)
      toast.error("Failed to load courses")
    } finally {
      setLoading(false)
    }
  }

  async function handleTogglePublish(courseId: string, currentStatus: boolean) {
    try {
      await publishCourse(courseId, !currentStatus)
      toast.success(`Course ${!currentStatus ? 'published' : 'unpublished'} successfully`)
      loadCourses()
    } catch (error) {
      console.error('Failed to toggle publish status:', error)
      toast.error('Failed to update course status')
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor_id?.profile?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading courses...</p>
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
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-2">
            Courses
          </h1>
          <p className="text-slate-400">Manage all courses in your organization ({courses.length} total)</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Course
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadCourses()}
                className="w-full h-11 pl-11 pr-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </motion.div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-slate-500 mb-4" />
          <p className="text-slate-400">No courses found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              whileHover={{ y: -4 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 rounded-2xl" />
              <div className="relative bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl overflow-hidden hover:border-slate-700/50 transition-all">
                {/* Thumbnail */}
                <div className="relative h-48 bg-slate-800 overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                      <span className="text-4xl">📚</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => handleTogglePublish(course._id, course.isPublished || false)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium backdrop-blur-sm transition-colors ${
                        course.status === "published" || course.isPublished
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                          : "bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30"
                      }`}
                    >
                      {course.status === "published" || course.isPublished ? 'Published' : 'Draft'}
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-slate-200 mb-2 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-400 mb-4">
                    by {course.instructor_id?.profile?.fullName || 'Unknown'}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-300">{course.enrollmentCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-300">{course.duration || 0}m</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-300">${course.price || 0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-sm font-medium transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50 rounded-lg transition-all"
                      title="Edit course"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition-all"
                      title="Delete course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
