"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus, 
  Search, 
  BookOpen, 
  Users, 
  Eye, 
  Edit2,
  Trash2,
  Grid3X3,
  List,
  ChevronDown,
  Layers,
  CheckCircle,
  TrendingUp,
  MoreHorizontal
} from "lucide-react"
import { instructorApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"
import { Button } from '../../../components/ui/button'
import { toast } from "sonner"
import { cn } from "../../../lib/utils"
 
interface Course {
  _id: string
  title: string
  description: string
  thumbnail?: string
  category: string
  level: string
  status: 'draft' | 'published' | 'archived'
  enrollmentCount: number
  createdAt: string
  course_credits?: number
  subject_id?: { name: string, code: string }
  semester_id?: { name: string, number: number }
}

// Mock courses for demo
const mockCourses: Course[] = [
  { _id: "1", title: "JavaScript Mastery", description: "Complete guide to modern JavaScript", category: "Programming", level: "Intermediate", status: "published", enrollmentCount: 1247, createdAt: "2026-01-15", course_credits: 4 },
  { _id: "2", title: "React Fundamentals", description: "Learn React from scratch with projects", category: "Frontend", level: "Beginner", status: "published", enrollmentCount: 892, createdAt: "2026-01-20", course_credits: 3 },
  { _id: "3", title: "Backend Development", description: "Node.js, Express, and MongoDB", category: "Backend", level: "Advanced", status: "published", enrollmentCount: 456, createdAt: "2026-02-01", course_credits: 4 },
  { _id: "4", title: "CSS Animations", description: "Create stunning animations with CSS", category: "Design", level: "Intermediate", status: "published", enrollmentCount: 234, createdAt: "2026-02-10", course_credits: 2 },
  { _id: "5", title: "TypeScript Pro", description: "Advanced TypeScript patterns", category: "Programming", level: "Advanced", status: "draft", enrollmentCount: 0, createdAt: "2026-02-15", course_credits: 3 },
  { _id: "6", title: "Web Performance", description: "Optimize your web applications", category: "Performance", level: "Advanced", status: "draft", enrollmentCount: 0, createdAt: "2026-02-20", course_credits: 2 },
  { _id: "7", title: "GraphQL API Design", description: "Build efficient APIs with GraphQL", category: "Backend", level: "Intermediate", status: "published", enrollmentCount: 567, createdAt: "2026-03-01", course_credits: 3 },
  { _id: "8", title: "Docker & Kubernetes", description: "Container orchestration mastery", category: "DevOps", level: "Advanced", status: "archived", enrollmentCount: 0, createdAt: "2025-12-01", course_credits: 4 },
]
 
export default function InstructorCoursesPage() {
  const { token, user } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
 
  useEffect(() => {
    if (token) {
      fetchCourses()
    } else {
      setCourses(mockCourses)
      setLoading(false)
    }
  }, [token, page, statusFilter])
 
  const fetchCourses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      })
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      const response = await instructorApi.listCourses(token!, params.toString())
      if (response.success && response.data) {
        const payload = response.data as any
        const courseList = payload.courses || payload || []
        setCourses(courseList.length > 0 ? courseList : mockCourses)
        if (payload.pagination) {
          setTotalPages(payload.pagination.pages)
        }
      } else {
        setCourses(mockCourses)
      }
    } catch (error) {
      console.error('Courses fetch error:', error)
      setCourses(mockCourses)
      toast.error('Failed to load courses - showing demo data')
    } finally {
      setLoading(false)
    }
  }
 
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(search.toLowerCase()) ||
    course.description.toLowerCase().includes(search.toLowerCase())
  )

  // Metric Card Component
  function MetricCard({ label, value, icon: Icon, color = "blue" }: { label: string; value: string | number; icon: any; color?: "blue" | "green" | "orange" | "indigo" }) {
    const colors = {
      blue: { bg: "bg-blue-50", icon: "text-blue-500" },
      green: { bg: "bg-green-50", icon: "text-green-500" },
      orange: { bg: "bg-orange-50", icon: "text-orange-500" },
      indigo: { bg: "bg-indigo-50", icon: "text-indigo-500" },
    }
    const c = colors[color]
    return (
      <div className="bg-white border border-gray-200 rounded-md p-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${c.bg} rounded-md flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${c.icon} stroke-[1.5]`} />
          </div>
          <div>
            <p className="text-sm text-slate-600">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
        </div>
      </div>
    )
  }

  // Course Card Component
  function CourseCard({ course }: { course: Course }) {
    const statusColors = {
      published: "bg-green-100 text-green-700 border-green-200",
      draft: "bg-yellow-100 text-yellow-700 border-yellow-200",
      archived: "bg-gray-100 text-gray-700 border-gray-200",
    }
    return (
      <div className="bg-white border border-gray-200 rounded-md p-5 hover:border-blue-300 transition-all group">
        <div 
          onClick={() => router.push(`/instructor/courses/${course._id}`)}
          className="cursor-pointer"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-blue-500 stroke-[1.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 text-base group-hover:text-blue-600 transition-colors truncate">
                {course.title}
              </h3>
              <p className="text-sm text-slate-500 line-clamp-1">{course.description}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Users className="w-4 h-4 text-orange-500 stroke-[1.5]" />
            <span>{course.enrollmentCount} students</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${statusColors[course.status]}`}>
              {course.status}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50"
              onClick={() => router.push(`/instructor/courses/${course._id}`)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }
 
  if (loading && page === 1) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const coursesToShow = filteredCourses.length > 0 ? filteredCourses : mockCourses
 
  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Course Management
          </span>
          <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
          <p className="text-slate-500 mt-1">Manage and organize your courses, curriculum, and student content.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-md p-1">
            {['all', 'draft', 'published', 'archived'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-4 py-1.5 rounded text-xs font-medium transition-all",
                  statusFilter === status 
                    ? "bg-blue-50 text-blue-600" 
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <Button 
            onClick={() => router.push('/instructor/courses/new')}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2 stroke-[1.5]" />
            Create Course
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Active Courses" value={coursesToShow.length} icon={Layers} color="blue" />
        <MetricCard label="Total Students" value={coursesToShow.reduce((acc, c) => acc + (c.enrollmentCount || 0), 0).toLocaleString()} icon={Users} color="green" />
        <MetricCard label="Published" value={coursesToShow.filter(c => c.status === 'published').length} icon={CheckCircle} color="indigo" />
        <MetricCard label="Avg. Engagement" value="88%" icon={TrendingUp} color="orange" />
      </div>

      {/* Search & View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[1.5]" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full pl-10 pr-4 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{coursesToShow.length} courses</span>
          <div className="flex items-center border border-gray-200 rounded-md p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("p-1.5 rounded", viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-600")}
            >
              <Grid3X3 className="w-4 h-4 stroke-[1.5]" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("p-1.5 rounded", viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-600")}
            >
              <List className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {coursesToShow.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Course</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Students</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Credits</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {coursesToShow.map((course) => (
                <tr key={course._id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-500 stroke-[1.5]" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{course.title}</p>
                        <p className="text-xs text-slate-500">{course.description.slice(0, 50)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-1 text-xs font-medium rounded border",
                      course.status === 'published' ? 'bg-green-100 text-green-700 border-green-200' :
                      course.status === 'draft' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    )}>
                      {course.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{course.enrollmentCount}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded">
                      {course.course_credits || 0} credits
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50" onClick={() => router.push(`/instructor/courses/${course._id}`)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-gray-50" onClick={() => router.push(`/instructor/courses/${course._id}/preview`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-gray-200"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="border-gray-200"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
