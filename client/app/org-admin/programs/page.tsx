"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, Edit, Trash2, Users, Clock, DollarSign, Eye, Loader2, AlertCircle, X, Send } from "lucide-react"
import { publishCourse, assignInstructor, programApi, departmentApi } from '../../../lib/services/orgAdminApi'
import { collegeApi } from '../../../lib/api'
import { useAuth } from '../../../lib/auth-context'
import { Button } from "../../../components/ui/button"
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
  const { token, organization } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
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

  const orgType = organization?.type?.toUpperCase() || 'COLLEGE'
  const isCollege = orgType === 'COLLEGE' || orgType === 'UNIVERSITY'

  useEffect(() => {
    if (!token) return
    loadCourses()
    loadDepartments()
  }, [statusFilter, token])

  async function loadDepartments() {
    try {
      if (!token) return
      let response
      if (isCollege) {
        response = await collegeApi.listDepartments(token)
      } else {
        response = await departmentApi.list(token)
      }
      if (response.success) {
        const payload = response.data as any
        const deptData = payload?.departments || payload || []
        setDepartments(Array.isArray(deptData) ? deptData : [])
      }
    } catch (error) {
      console.error('Error loading departments:', error)
      toast.error('Failed to load departments')
    }
  }

  async function loadCourses() {
    setLoading(true)
    try {
      if (!token) return
      let response
      if (isCollege) {
        response = await collegeApi.listPrograms(token)
      } else {
        const params: any = {}
        if (statusFilter !== "all") params.status = statusFilter
        if (searchTerm) params.search = searchTerm
        response = await programApi.list(token, params)
      }
      if (response.success && response.data) {
        const payload = response.data as any
        const programs = payload?.programs || payload || []
        setCourses(Array.isArray(programs) ? programs : [])
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
      if (!token) throw new Error('No authentication token')
      await publishCourse(token, courseId, !currentStatus)
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

  async function handleEditCourse(e: React.FormEvent) {
    e.preventDefault()
    if (!editingCourse) return
    setIsSubmitting(true)
    try {
      if (!token) throw new Error('No authentication token')
      let response
      if (isCollege) {
        response = await collegeApi.updateProgram(token, editingCourse._id, {
          name: formData.name,
          code: formData.code,
          departmentId: formData.department_id,
          duration: formData.duration_years,
          durationUnit: 'years',
          description: formData.description
        })
      } else {
        response = await programApi.update(token, editingCourse._id, formData)
      }
      if (response.success) {
        toast.success("Academic Program updated successfully")
        setShowCreateModal(false)
        setEditingCourse(null)
        resetForm()
        loadCourses()
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update course")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteCourse(courseId: string) {
    if (!confirm("Are you sure you want to delete this program?")) return
    try {
      if (!token) throw new Error('No authentication token')
      let response
      if (isCollege) {
        response = await collegeApi.deleteProgram(token, courseId)
      } else {
        response = await programApi.delete(token, courseId)
      }
      if (response.success) {
        toast.success("Program deleted successfully")
        loadCourses()
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete program")
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      code: "",
      department_id: "",
      duration_years: 3,
      total_semesters: 6,
      description: "",
      status: "ACTIVE"
    })
  }

  function openEditModal(course: Course) {
    setEditingCourse(course)
    setFormData({
      name: course.name,
      code: course.code,
      department_id: course.department_id?._id || '',
      duration_years: course.duration_years,
      total_semesters: course.total_semesters,
      description: course.description,
      status: course.status
    })
    setShowCreateModal(true)
  }

  function closeModal() {
    setShowCreateModal(false)
    setEditingCourse(null)
    resetForm()
  }

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (!token) throw new Error('No authentication token')
      let response
      if (isCollege) {
        response = await collegeApi.createProgram(token, {
          name: formData.name,
          code: formData.code,
          departmentId: formData.department_id,
          duration: formData.duration_years,
          durationUnit: 'years',
          description: formData.description
        })
      } else {
        response = await programApi.create(token, formData)
      }
      if (response.success) {
        toast.success("Academic Program created successfully")
        setShowCreateModal(false)
        resetForm()
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
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Programs</h1>
          <p className="text-slate-500 mt-1">Manage academic programs in your organization ({courses.length} total)</p>
        </div>
        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => {
            setEditingCourse(null)
            resetForm()
            setShowCreateModal(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4 stroke-[1.5]" />
          Create Program
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-gray-200 rounded-md p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadCourses()}
                className="w-full h-10 pl-11 pr-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </motion.div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-md">
          <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500">No programs found.</p>
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
              <div className="relative bg-white border border-gray-200 rounded-md overflow-hidden hover:border-gray-300 transition-colors">
                {/* Content */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-blue-100 mb-2 inline-block">
                        {course.department_id?.name || 'Academic'}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {course.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono mt-1">{course.code}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold border ${course.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                      {course.status}
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 mb-6 line-clamp-2 h-10">
                    {course.description || "No description provided."}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Duration</p>
                      <p className="text-sm text-slate-900 font-semibold">{course.duration_years} Years</p>
                    </div>
                    <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Semesters</p>
                      <p className="text-sm text-slate-900 font-semibold">{course.total_semesters} Sem</p>
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
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={() => window.location.href = `/org-admin/programs/${course._id}/subjects`}
                    >
                      Manage Subjects
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 border-gray-200" onClick={() => openEditModal(course)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <button onClick={() => handleDeleteCourse(course._id)} className="flex-1 py-2 bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 rounded-lg text-xs font-medium border border-slate-700 hover:border-red-500/20 transition-colors flex items-center justify-center gap-2">
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-7 border-b border-slate-100 bg-gradient-to-b from-orange-50/60 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[22px] font-black text-slate-900 tracking-tight mb-1">{editingCourse ? 'Edit Academic Program' : 'Create Academic Program'}</h2>
                    <p className="text-slate-500 text-[13px] font-medium">{editingCourse ? 'Update the academic program details' : 'Add a new academic program to your organization'}</p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={editingCourse ? handleEditCourse : handleCreateCourse} className="p-7 space-y-5">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-slate-600 uppercase tracking-widest ml-1">Course Name</label>
                    <input
                      required
                      placeholder="e.g. BCA, MBA"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/15 focus:border-orange-500/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-slate-600 uppercase tracking-widest ml-1">Course Code</label>
                    <input
                      required
                      placeholder="e.g. BCA101"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/15 focus:border-orange-500/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-black text-slate-600 uppercase tracking-widest ml-1">Department</label>
                  <select
                    required
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500/15 focus:border-orange-500/50 outline-none transition-all"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-slate-600 uppercase tracking-widest ml-1">Duration (Years)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="10"
                      value={formData.duration_years}
                      onChange={(e) => setFormData({ ...formData, duration_years: parseInt(e.target.value) })}
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500/15 focus:border-orange-500/50 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-slate-600 uppercase tracking-widest ml-1">Total Semesters</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="20"
                      value={formData.total_semesters}
                      onChange={(e) => setFormData({ ...formData, total_semesters: parseInt(e.target.value) })}
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500/15 focus:border-orange-500/50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-black text-slate-600 uppercase tracking-widest ml-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description of the academic program..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500/15 focus:border-orange-500/50 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 h-12 bg-white hover:bg-slate-50 text-slate-700 font-black rounded-2xl transition-all border border-slate-200 uppercase tracking-widest text-[12px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] h-12 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[12px] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    {editingCourse ? 'Update Program' : 'Create Program'}
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
