"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Search, Filter, MoreVertical, PlayCircle, Clock, Award, ChevronRight } from "lucide-react"
import { useAuth } from "../../../lib/auth-context"
import { collegeApi, studentApi } from "../../../lib/api"
import { API_URL } from "../../../lib/config"
import { Button } from "../../../components/ui/button"
import Link from "next/link"
import { toast } from "sonner"

export default function StudentCoursesPage() {
  const { user, token } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all") // all, in-progress, completed

  const getProgressPercentage = (p: any): number => {
    if (typeof p === 'number') return p
    if (!p || typeof p !== 'object') return 0
    const v =
      p.completionPercentage ??
      p.completion_percentage ??
      p.completion ??
      p.percentage
    return typeof v === 'number' ? v : 0
  }

  useEffect(() => {
    loadCourses()
  }, [token])

  async function loadCourses() {
    if (!token) return
    try {
      setLoading(true)
      const isCollegeStudent = String(user?.organizationType || '').toUpperCase() === 'COLLEGE'
      if (isCollegeStudent) {
        const res = await collegeApi.getStudentCourses(token)
        if (res.success) {
          const payload: any = res.data || {}
          setCourses(payload.courses || [])
        }
      } else {
        const r = await fetch(`${API_URL}/api/courses/my-courses`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        })
        const data = await r.json()
        if (data.success) {
          setCourses(data.data?.courses || data.data || [])
        }
      }
    } catch (error) {
      toast.error("Failed to load courses")
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.code?.toLowerCase().includes(searchQuery.toLowerCase())

    const pct = getProgressPercentage(course.progress)
    
    if (filter === "all") return matchesSearch
    if (filter === "in-progress") return matchesSearch && pct > 0 && pct < 100
    if (filter === "completed") return matchesSearch && pct === 100
    
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
          <p className="text-slate-500 mt-1">Continue learning from where you left off</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-gray-200">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-gray-200 bg-white pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
        <div className="flex gap-2">
          {["all", "in-progress", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-white text-slate-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1).replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No courses found</p>
          <Link href="/student/available-courses">
            <Button className="mt-4 bg-green-600 hover:bg-green-700">
              Browse Available Courses
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            (() => {
              const pct = getProgressPercentage(course.progress)
              return (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
            >
              {/* Course Thumbnail */}
              <div className="h-40 bg-gradient-to-br from-green-500 to-emerald-600 relative">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white/50" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <button className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center justify-between text-white text-sm">
                    <span className="flex items-center gap-1">
                      <PlayCircle className="w-4 h-4" />
                      {course.totalLessons || 12} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {course.duration || "4h 30m"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Course Info */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 line-clamp-1">{course.title}</h3>
                  {course.certificate && (
                    <Award className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                  {course.description || "Learn the fundamentals and advanced concepts in this comprehensive course."}
                </p>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600">{pct}% complete</span>
                    <span className="text-green-600 font-medium">
                      {pct === 100 ? "Completed" : "In Progress"}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Action */}
                <Link href={`/student/course/${course._id}`}>
                  <Button className="w-full bg-green-600 hover:bg-green-700 group-hover:shadow-md transition-all">
                    {pct === 0 ? "Start Course" : pct === 100 ? "Review Course" : "Continue Learning"}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
              )
            })()
          ))}
        </div>
      )}
    </div>
  )
}
