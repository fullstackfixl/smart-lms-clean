"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, Edit, Trash2, Users, Clock, DollarSign, Eye, Loader2, AlertCircle, X, Send } from "lucide-react"
import { publishCourse, assignInstructor, programApi, departmentApi } from '../../../lib/services/orgAdminApi'
import { toast } from "sonner"

interface Course {
  _id: string
  name: string
  code: string
  department_id: {
    _id: string
    name: string
    code: string
  }
  duration_years: number
  total_semesters: number
  description: string
  status: 'ACTIVE' | 'DRAFT'
  studentCount?: number
  subjectCount?: number
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [departments, setDepartments] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    department_id: "",
    duration_years: 3,
    total_semesters: 6,
    description: "",
    status: "ACTIVE"
  })

  useEffect(() => {
    loadCourses()
    loadDepartments()
  }, [statusFilter])

  async function loadDepartments() {
    try {
      const response = await departmentApi.list()
      if (response.success) {
        setDepartments(response.data || [])
      }
    } catch (error) {
      console.error('Error loading departments:', error)
    }
  }

  async function loadCourses() {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter !== "all") params.status = statusFilter
      if (searchTerm) params.search = searchTerm

      const response = await programApi.list(params)
      if (response.success && response.data) {
        setCourses(Array.isArray(response.data) ? response.data : (response.data.courses || []))
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
    const matchesSearch =
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.department_id?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await programApi.create(formData)
      if (response.success) {
        toast.success("Academic Program created successfully")
        setShowCreateModal(false)
        setFormData({
          name: "",
          code: "",
          department_id: "",
          duration_years: 3,
          total_semesters: 6,
          description: "",
          status: "ACTIVE"
        })
        loadCourses()
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create course")
    } finally {
      setIsSubmitting(false)
    }
  }

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
            Academic Programs
          </h1>
          <p className="text-slate-400">Manage academic programs in your organization ({courses.length} total)</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Program
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
                {/* Content */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-indigo-500/20 mb-2 inline-block">
                        {course.department_id?.name || 'Academic'}
                      </span>
                      <h3 className="text-xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                        {course.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-1">{course.code}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold border ${course.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                      {course.status}
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 mb-6 line-clamp-2 h-10">
                    {course.description || "No description provided."}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Duration</p>
                      <p className="text-sm text-slate-200 font-semibold">{course.duration_years} Years</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Semesters</p>
                      <p className="text-sm text-slate-200 font-semibold">{course.total_semesters} Sem</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 mb-6 px-1">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>{course.studentCount || 0} Students</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" />
                      <span>{course.subjectCount || 0} Subjects</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.location.href = `/org-admin/programs/${course._id}/subjects`}
                      className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      Manage Subjects
                    </motion.button>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center justify-center gap-2">
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button className="flex-1 py-2 bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 rounded-lg text-xs font-medium border border-slate-700 hover:border-red-500/20 transition-colors flex items-center justify-center gap-2">
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Create Academic Program</h2>
                    <p className="text-slate-400 text-sm">Add a new academic program to your organization</p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateCourse} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Course Name</label>
                    <input
                      required
                      placeholder="e.g. BCA, MBA"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/60 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Course Code</label>
                    <input
                      required
                      placeholder="e.g. BCA101"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/60 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Department</label>
                  <select
                    required
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500/60 outline-none transition-all"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Duration (Years)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="10"
                      value={formData.duration_years}
                      onChange={(e) => setFormData({ ...formData, duration_years: parseInt(e.target.value) })}
                      className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500/60 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">Total Semesters</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="20"
                      value={formData.total_semesters}
                      onChange={(e) => setFormData({ ...formData, total_semesters: parseInt(e.target.value) })}
                      className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500/60 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the academic program..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/60 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 h-12 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    Create Program
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
