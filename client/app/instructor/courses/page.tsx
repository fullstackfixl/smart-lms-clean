"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus, 
  Search, 
  Filter, 
  BookOpen, 
  Users, 
  Eye, 
  Trash2,
  CheckCircle, 
  Clock,
  TrendingUp,
  Layout,
  ChevronRight,
  ChevronLeft,
  Edit2,
  Zap,
  Target,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  MoreHorizontal,
  FileText
} from "lucide-react"
import { instructorApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"
import { Button } from '../../../components/ui/button'
import { toast } from "sonner"
import { cn } from "../../../lib/utils"
import { 
  SimpleCard, 
  SimpleBadge,
  FlatTable,
  FlatTableHead,
  FlatTableRow,
  FlatTableCell
} from '../../../components/platform/ui-standard'
 
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
 
export default function InstructorCoursesPage() {
  const { token, user } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
 
  useEffect(() => {
    if (token) {
      fetchCourses()
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
        setCourses(payload.courses || payload || [])
        if (payload.pagination) {
          setTotalPages(payload.pagination.pages)
        }
      } else {
        toast.error(response.error || 'Synchronization failed')
      }
    } catch (error) {
      console.error('Peak Courses error:', error)
      toast.error('Curriculum stream link severed')
    } finally {
      setLoading(false)
    }
  }
 
  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(search.toLowerCase()) ||
    course.description.toLowerCase().includes(search.toLowerCase())
  )
 
  if (loading && page === 1) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-40 rounded-2xl bg-white border border-gray-100" />
        <div className="h-96 rounded-2xl bg-white border border-gray-100" />
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-20">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl opacity-60" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
            <BookOpen className="w-3.5 h-3.5" />
            Course Management
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Courses</h1>
          <p className="text-sm text-slate-500 font-medium italic">Manage and organize your courses, curriculum, and student content.</p>
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100 backdrop-blur-sm">
            {['all', 'draft', 'published', 'archived'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  statusFilter === status 
                    ? "bg-white text-blue-600 shadow-md border border-slate-100" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {status}
              </button>
            ))}
          </div>
          <Button 
            onClick={() => router.push('/instructor/courses/new')}
            className="rounded-2xl h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-500/20 transition-all hover:translate-y-[-2px]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Create Course
          </Button>
        </div>
      </div>

      {/* ─── Metrics Quickview ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricMiniCard label="Active Courses" value={courses.length} icon={<Layers className="w-6 h-6 text-blue-600" />} />
        <MetricMiniCard label="Total Students" value={courses.reduce((acc, c) => acc + (c.enrollmentCount || 0), 0)} icon={<Users className="w-6 h-6 text-emerald-600" />} />
        <MetricMiniCard label="Published" value={courses.filter(c => c.status === 'published').length} icon={<CheckCircle className="w-6 h-6 text-indigo-600" />} />
        <MetricMiniCard label="Avg. Engagement" value="88%" icon={<TrendingUp className="w-6 h-6 text-orange-600" />} />
      </div>

      {/* ─── Course Registry Table ─── */}
      <SimpleCard className="p-0 overflow-hidden border-slate-100 shadow-sm rounded-[2.5rem]">
        <div className="p-10 border-b border-slate-50 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-14 w-full pl-12 pr-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all font-bold placeholder:font-medium"
            />
          </div>
          <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-100 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        <FlatTable>
          <FlatTableHead>
            <FlatTableRow className="bg-slate-50/50">
              <FlatTableCell className="w-[120px] font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] py-6 pl-10">Thumbnail</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] py-6">Course Details</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] py-6">Status</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] py-6 text-center">Students</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] py-6 text-center">Credits</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] py-6 text-right pr-10">Actions</FlatTableCell>
            </FlatTableRow>
          </FlatTableHead>
          <tbody>
            {filteredCourses.length === 0 ? (
              <FlatTableRow>
                <FlatTableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400 italic font-bold">
                    <FileText className="w-12 h-12 mb-4 opacity-10" />
                    No courses found in this category.
                  </div>
                </FlatTableCell>
              </FlatTableRow>
            ) : (
              filteredCourses.map((course) => (
                <FlatTableRow key={course._id} className="group transition-all">
                  <FlatTableCell className="py-8 pl-10">
                    <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-500">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-300">
                          <Layers className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  </FlatTableCell>
                  <FlatTableCell className="max-w-[320px]">
                    <div className="space-y-1.5">
                      <p className="font-black text-slate-900 line-clamp-1 text-lg group-hover:text-blue-600 transition-colors">{course.title}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black italic">{course.category}</p>
                    </div>
                  </FlatTableCell>
                  <FlatTableCell>
                    <SimpleBadge 
                      className={cn(
                        "px-4 py-1.5 font-black uppercase text-[9px] tracking-widest border-none",
                        course.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 
                        course.status === 'draft' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {course.status}
                    </SimpleBadge>
                  </FlatTableCell>
                  <FlatTableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="font-black text-slate-900 border-b-2 border-slate-100">{course.enrollmentCount || 0}</span>
                    </div>
                  </FlatTableCell>
                  <FlatTableCell className="text-center">
                    <SimpleBadge className="bg-blue-50 text-blue-600 font-black text-[10px] border-none px-4 py-1.5 tracking-widest">
                      {course.course_credits || 0} CREDITS
                    </SimpleBadge>
                  </FlatTableCell>
                  <FlatTableCell className="text-right pr-10">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-12 w-12 rounded-[1.25rem] hover:bg-blue-50 hover:text-blue-600 transition-all"
                        onClick={() => router.push(`/instructor/courses/${course._id}`)}
                      >
                        <Edit2 className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-12 w-12 rounded-[1.25rem] hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                        onClick={() => router.push(`/instructor/courses/${course._id}/preview`)}
                      >
                        <Eye className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-12 w-12 rounded-[1.25rem] text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </FlatTableCell>
                </FlatTableRow>
              ))
            )}
          </tbody>
        </FlatTable>

        {/* ─── Pagination ─── */}
        {totalPages > 1 && (
          <div className="p-10 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Showing {page} of {totalPages} Units
            </p>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-2xl h-12 px-8 border-slate-100 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all"
              >
                <ChevronLeft className="w-4 h-4 mr-2 stroke-[3]" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-2xl h-12 px-8 border-slate-100 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2 stroke-[3]" />
              </Button>
            </div>
          </div>
        )}
      </SimpleCard>
    </div>
  )
}

function MetricMiniCard({ label, value, icon }: any) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex items-center gap-6 hover:border-blue-200 transition-all cursor-default group shadow-sm hover:shadow-xl hover:shadow-slate-500/5">
       <div className="h-14 w-14 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-500">
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">{label}</p>
          <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">{value}</p>
       </div>
    </div>
  )
}
