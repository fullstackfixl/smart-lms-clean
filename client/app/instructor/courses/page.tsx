"use client"
 
import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, 
  Search, 
  Filter, 
  BookOpen, 
  Users, 
  Eye, 
  Trash2,
  Loader2, 
  CheckCircle, 
  XCircle, 
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
  MoreHorizontal
} from "lucide-react"
import { instructorApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { toast } from "sonner"
 
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
 
  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Curriculum Hero Section ───────────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[3.5rem] bg-white border border-slate-200/60 p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)]">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-indigo-50 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 bg-blue-50 rounded-full blur-[100px]" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-8 max-w-2xl">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-black uppercase tracking-[0.25em] border border-indigo-100/50">
                <Layers className="w-4 h-4" />
                Curriculum Architecture
              </div>
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-black text-slate-900 tracking-[-0.04em] leading-[0.95]">
                  Orchestrate <br />
                  <span className="text-indigo-600">Knowledge Matrices.</span>
                </h1>
                <p className="text-[19px] font-medium text-slate-500 leading-relaxed max-w-xl">
                  Manifest premium educational experiences. From initial conceptual blueprint to global instructional dissemination, manage every dimension of your curriculum here.
                </p>
              </div>
              <button
                onClick={() => router.push('/instructor/courses/new')}
                className="h-20 px-12 bg-slate-900 text-white rounded-[2.2rem] text-[16px] font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] group"
              >
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" strokeWidth={3} />
                PROVISION NEW COURSE
              </button>
            </div>
 
            {/* Quick Metrics Panel */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                <MetricMiniCard label="Active Units" value={courses.length} icon={<Layers color="#4F46E5" />} />
                <MetricMiniCard label="Total Scholars" value={courses.reduce((acc, c) => acc + (c.enrollmentCount || 0), 0)} icon={<Users color="#10B981" />} />
                <MetricMiniCard label="Published" value={courses.filter(c => c.status === 'published').length} icon={<CheckCircle color="#3B82F6" />} />
                <MetricMiniCard label="Engagement" value="88%" icon={<TrendingUp color="#F59E0B" />} />
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Intelligence Control Surface ───────────────────────────── */}
      <div className="space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 px-6">
           <div className="space-y-2">
              <h3 className="text-[22px] font-black text-slate-900 tracking-tight">Curriculum Registry</h3>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest italic opacity-70">
                {loading ? "// Synchronizing curriculum stream..." : "// Stream synchronized. Unified view active."}
              </p>
           </div>
           
           <div className="flex items-center gap-6 flex-wrap">
              <div className="relative group min-w-[380px]">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Intelligence search by title or metadata..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-16 w-full pl-16 pr-6 bg-white border border-slate-200 rounded-[1.8rem] text-[15px] font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-[8px] focus:ring-indigo-500/5 focus:border-indigo-500/30 transition-all shadow-sm"
                />
              </div>
              <div className="flex bg-white p-2 rounded-[2rem] border border-slate-200 shadow-sm gap-1">
                {['all', 'draft', 'published', 'archived'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                      statusFilter === status 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                        : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
           </div>
        </div>
 
        {/* Course Intelligence Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 p-4"
            >
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-[500px] rounded-[3.5rem] bg-slate-100 animate-pulse border border-slate-200/50" />
              ))}
            </motion.div>
          ) : filteredCourses.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-48 text-center bg-white rounded-[4rem] border border-dashed border-slate-200 m-4"
            >
              <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-10 border border-slate-100 italic">
                <BookOpen className="h-10 w-10 text-slate-200" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">NULL RESPONSE IDENTIFIED</h3>
              <p className="text-[17px] font-medium text-slate-400 max-w-sm mx-auto leading-relaxed mb-12 italic opacity-80">
                The curriculum registry returned zero instructional assets matching your current tactical search criteria.
              </p>
              <Button 
                onClick={() => router.push('/instructor/courses/new')}
                className="h-16 px-12 rounded-2xl bg-indigo-600 text-white text-[14px] font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
              >
                INITIALIZE NEW CURRICULUM
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 p-4"
            >
              {filteredCourses.map((course, index) => (
                <PeakCourseCard key={course._id} course={course} index={index} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
 
        {/* Unified Pagination Control */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-10 mt-20 px-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-16 px-10 bg-white border border-slate-200 rounded-2xl text-[12px] font-black text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-20 transition-all flex items-center gap-3 group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" strokeWidth={3} />
              PREV
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-1">Index Page</span>
              <span className="text-[20px] font-black text-slate-900 tabular-nums">{page} <span className="text-slate-200 px-1">/</span> {totalPages}</span>
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-16 px-10 bg-slate-900 text-white rounded-2xl text-[12px] font-black shadow-xl hover:scale-105 active:scale-95 disabled:opacity-20 transition-all flex items-center gap-3 group"
            >
              NEXT
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
 
function PeakCourseCard({ course, index }: { course: Course, index: number }) {
  const router = useRouter()
  
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'published': return "bg-emerald-500 text-white shadow-emerald-500/20"
      case 'draft': return "bg-amber-500 text-white shadow-amber-500/20"
      case 'archived': return "bg-slate-500 text-white"
      default: return "bg-slate-900 text-white"
    }
  }
 
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.8 }}
      className="group relative"
    >
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-[0_48px_96px_-24px_rgba(0,0,0,0.06)] transition-all duration-700 overflow-hidden flex flex-col h-full cursor-default border-b-4 hover:border-b-indigo-600">
        {/* Landscape Media Surface */}
        <div className="relative h-64 bg-slate-50 overflow-hidden">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50/50 to-blue-50/50">
              <Layers className="h-16 w-16 text-indigo-100" strokeWidth={1} />
            </div>
          )}
          
          <div className="absolute top-8 right-8 flex flex-col items-end gap-3 scale-90 group-hover:scale-100 transition-all duration-500">
             <Badge className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-0 shadow-lg", getStatusStyle(course.status))}>
               {course.status}
             </Badge>
             {course.course_credits && (
               <Badge className="bg-white/90 backdrop-blur-md text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100 shadow-sm">
                 {course.course_credits} Credits
               </Badge>
             )}
          </div>
 
          {/* Executive Action Overlay */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-700 flex items-center justify-center gap-4">
             <button 
                onClick={() => router.push(`/instructor/courses/${course._id}`)}
                className="h-14 px-8 bg-white text-slate-900 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl"
             >
                PROPERTIES
             </button>
             <button 
                onClick={() => router.push(`/instructor/courses/${course._id}/preview`)}
                className="h-14 w-14 bg-white/10 hover:bg-white text-white hover:text-slate-900 border border-white/20 rounded-2xl transition-all flex items-center justify-center"
             >
                <Eye className="w-5 h-5" />
             </button>
          </div>
        </div>
 
        {/* Context Surface */}
        <div className="p-10 flex flex-col flex-1 space-y-8">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
               <div className="h-8 px-4 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center">
                 {course.category}
               </div>
               <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest italic">• {course.level || "Standard Level"}</span>
            </div>
            <h3 className="text-[25px] font-black text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors line-clamp-2">
              {course.title}
            </h3>
            <p className="text-[15px] font-medium text-slate-400 line-clamp-2 leading-relaxed italic opacity-80">
              {course.description}
            </p>
          </div>
 
          {/* Scholastic Registry Meta */}
          <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                   <Users className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[16px] font-black text-slate-900 leading-none mb-1">{course.enrollmentCount || 0}</p>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Scholars</p>
                </div>
             </div>
             <button 
                onClick={() => router.push(`/instructor/courses/${course._id}/students`)}
                className="h-12 px-6 rounded-2xl hover:bg-slate-50 text-indigo-600 text-[11px] font-black uppercase tracking-widest flex items-center gap-2 group/btn transition-all"
             >
                Insights <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
             </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
 
function MetricMiniCard({ label, value, icon }: any) {
  return (
    <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-5 hover:bg-white hover:border-indigo-200 hover:shadow-lg transition-all cursor-default group">
       <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
          <p className="text-[24px] font-black text-slate-900 leading-none">{value}</p>
       </div>
    </div>
  )
}
