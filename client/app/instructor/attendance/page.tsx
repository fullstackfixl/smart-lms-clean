"use client"

import React, { useState, useEffect } from "react"
import {
  UserCheck, 
  Users, 
  AlertCircle, 
  ChevronRight, 
  Calendar, 
  BarChart3, 
  TrendingUp,
  Clock,
  ShieldAlert,
  Search,
  BookOpen,
  Filter,
  Zap,
  MoreVertical,
  CheckCircle2,
  XCircle
} from "lucide-react"
import { instructorApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"
import { toast } from "sonner"
import { Button } from "../../../components/ui/button"
import { 
  SimpleCard, 
  SimpleBadge,
  FlatTable,
  FlatTableHead,
  FlatTableRow,
  FlatTableCell 
} from '../../../components/platform/ui-standard'
import { cn } from "../../../lib/utils"
 
interface AttendanceStats {
  overall: number
  studentsBelow75: number
  byCourse: Array<{
    _id: string
    totalStudents: number
    avgPresent: number
    belowThreshold: number
    courseInfo?: any
  }>
}
 
export default function InstructorAttendancePage() {
  const { token, user } = useAuth()
  const [data, setData] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
 
  useEffect(() => {
    if (token) {
      loadAttendanceData()
    }
  }, [token])
 
  const loadAttendanceData = async () => {
    setLoading(true)
    try {
      const res = await instructorApi.attendanceSummary(token!)
      if (res.success) {
        setData(res.data as AttendanceStats)
      }
    } catch (error) {
      console.error("Attendance error:", error)
      toast.error("Failed to synchronize attendance stream")
    } finally {
      setLoading(false)
    }
  }
 
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-12 w-12 border-4 border-emerald-500/10 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Attendance Core...</p>
      </div>
    )
  }
 
  const filteredCourses = data?.byCourse.filter(c => 
    c._id.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []
 
  return (
    <div className="space-y-10 pb-20">
      {/* ─── Page Header ─── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl opacity-60" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            <UserCheck className="w-3.5 h-3.5" />
            Attendance Records
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Attendance</h1>
          <p className="text-sm text-slate-500 font-medium italic">Monitor student engagement and session presence across your courses.</p>
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative group min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 bg-slate-50/50 border-slate-100 rounded-2xl pl-12 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all"
            />
          </div>
          <Button
            className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-xl shadow-emerald-500/20 transition-all hover:translate-y-[-2px]"
          >
            <Calendar className="w-4 h-4 stroke-[3]" />
            Mark Attendance
          </Button>
        </div>
      </div>

      {/* ─── Stats Overview ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricMiniCard 
            label="Overall Attendance" 
            value={`${data?.overall || 0}%`} 
            icon={<TrendingUp className="text-emerald-500" />} 
          />
          <MetricMiniCard 
            label="Low Attendance (<75%)" 
            value={data?.studentsBelow75 || 0} 
            icon={<ShieldAlert className="text-rose-500" />} 
          />
          <MetricMiniCard 
            label="Active Courses" 
            value={data?.byCourse.length || 0} 
            icon={<Users className="text-blue-500" />} 
          />
          <MetricMiniCard 
            label="System Status" 
            value="Active" 
            icon={<CheckCircle2 className="text-emerald-600" />} 
          />
      </div>

      {/* ─── Course Attendance Grid ─── */}
      {!data || data.byCourse.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 bg-white border border-dashed border-slate-200 rounded-[3.5rem]">
           <UserCheck className="h-20 w-20 text-slate-100 mb-8" />
           <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No Records Found</h3>
           <p className="text-sm text-slate-400 font-medium italic mt-2">No student attendance data is available for your courses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filteredCourses.map((course) => (
             <SimpleCard
               key={course._id}
               className="p-10 border-slate-100 hover:border-emerald-200 group transition-all duration-500 rounded-[2.5rem] bg-white hover:shadow-2xl hover:shadow-emerald-500/5 hover:translate-y-[-4px]"
             >
                <div className="flex items-center justify-between mb-10">
                   <div className="h-16 w-16 rounded-[1.5rem] bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 border border-emerald-100">
                     <BookOpen className="h-7 w-7" />
                   </div>
                   <SimpleBadge className={cn(
                     "font-black tracking-widest px-4 py-1.5 rounded-full border-none",
                     (course.avgPresent * 100) < 75 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                   )}>
                      {(course.avgPresent * 100).toFixed(1)}% AVG
                   </SimpleBadge>
                </div>
                
                <div className="space-y-2 mb-10">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">// Course</p>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight line-clamp-2 min-h-[64px]">{course._id}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10">
                   <div className="p-5 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 group-hover:bg-white transition-colors duration-500">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Students</p>
                      <p className="text-xl font-black text-slate-900">{course.totalStudents}</p>
                   </div>
                   <div className="p-5 rounded-[1.5rem] bg-rose-50/30 border border-rose-100 group-hover:bg-rose-50/50 transition-colors duration-500">
                      <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1.5">Below 75%</p>
                      <p className="text-xl font-black text-rose-600">{course.belowThreshold}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                      <span>Attendance Rate</span>
                      <span className="text-emerald-600">{(course.avgPresent * 100).toFixed(1)}%</span>
                   </div>
                   <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          (course.avgPresent * 100) < 75 ? "bg-rose-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${course.avgPresent * 100}%` }}
                      />
                   </div>
                </div>

                <div className="mt-10 pt-10 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-[-8px]">
                       <div className="h-10 w-10 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center text-[10px] font-black text-slate-400 translate-x-0 relative z-10 shadow-sm">J</div>
                       <div className="h-10 w-10 rounded-full bg-slate-50 border-4 border-white flex items-center justify-center text-[10px] font-black text-slate-400 -translate-x-3 relative z-20 shadow-sm">M</div>
                       <div className="h-10 w-10 rounded-full bg-emerald-600 border-4 border-white flex items-center justify-center text-[10px] font-black text-white -translate-x-6 relative z-30 shadow-sm">+{course.totalStudents > 2 ? course.totalStudents - 2 : 0}</div>
                   </div>
                   <Button variant="ghost" className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-emerald-50 hover:text-emerald-700 transition-all">
                      View Details
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                   </Button>
                </div>
             </SimpleCard>
           ))}
        </div>
      )}
    </div>
  )
}

function MetricMiniCard({ label, value, icon }: any) {
  return (
    <SimpleCard className="p-8 border-slate-100 shadow-sm bg-white flex items-center gap-6 transition-all hover:border-blue-200 group rounded-[2rem] hover:shadow-xl hover:shadow-slate-500/5">
       <div className="h-14 w-14 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white transition-all duration-500">
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-2">{label}</p>
          <p className="text-3xl font-black text-slate-900 leading-none tracking-tight">{value}</p>
       </div>
    </SimpleCard>
  )
}
