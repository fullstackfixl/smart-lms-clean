"use client"
 
import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  Zap
} from "lucide-react"
import { instructorApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"
import { toast } from "sonner"
import { Badge } from "../../../components/ui/badge"
import { Card, CardContent } from "../../../components/ui/card"
 
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
    <div className="max-w-[1580px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20 p-6">
      {/* Premium Attendance Hero */}
      <div className="relative overflow-hidden rounded-[3.5rem] bg-white dark:bg-[#0B0F1A] border border-slate-100 dark:border-slate-800/50 px-12 py-16 shadow-sm group">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[32rem] h-[32rem] bg-emerald-500/5 rounded-full blur-[100px] group-hover:bg-emerald-500/10 transition-all duration-1000" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-black uppercase tracking-[0.25em] mb-2 border border-emerald-100 dark:border-emerald-500/20">
              <UserCheck className="w-3.5 h-3.5" />
              Presence Intelligence
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              Academic <br /><span className="text-emerald-600">Engagement</span>
            </h1>
            <p className="text-[17px] font-medium text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              Orchestrate student participation across your scholarly domains. Identify engagement deficits and monitor the pulse of your academic delivery in real-time.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-5">
             <div className="h-20 px-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2.2rem] text-[15px] font-black shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
               <Calendar className="h-6 w-6" strokeWidth={3} />
               MARK SESSION
             </div>
          </div>
        </div>
      </div>
 
      {/* Stats Cluster */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <PlatformStat 
          label="Global Participation" 
          value={`${data?.overall || 0}%`} 
          icon={<TrendingUp className="w-5 h-5" />} 
          color="emerald" 
          trend="OPTIMAL"
        />
        <PlatformStat 
          label="Risk Profiles" 
          value={data?.studentsBelow75 || 0} 
          icon={<ShieldAlert className="w-5 h-5" />} 
          color="rose" 
          trend="CRITICAL"
        />
        <PlatformStat 
          label="Active Cohorts" 
          value={data?.byCourse.length || 0} 
          icon={<Users className="w-5 h-5" />} 
          color="blue" 
          trend="SYNCED"
        />
        <PlatformStat 
          label="Sync Latency" 
          value="0.4ms" 
          icon={<Zap className="w-5 h-5" />} 
          color="amber" 
          trend="PEAK"
        />
      </div>
 
      {/* Search & Filter Bar */}
      <div className="flex items-center gap-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search academic sectors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-16 bg-white dark:bg-[#0B0F1A] border border-slate-100 dark:border-slate-800 rounded-[1.8rem] pl-16 pr-6 text-[14px] font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
          />
        </div>
        <button className="h-16 w-16 bg-white dark:bg-[#0B0F1A] border border-slate-100 dark:border-slate-800 rounded-[1.5rem] flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-all shadow-sm">
          <Filter className="h-5 w-5" />
        </button>
      </div>
 
      {/* Participation Architecture */}
      {!data || data.byCourse.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 bg-white dark:bg-[#0B0F1A] border border-dashed border-slate-200 dark:border-slate-800 rounded-[3.5rem]">
           <UserCheck className="h-16 w-16 text-slate-100 mb-6" />
           <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Zero Presence Logs</h3>
           <p className="text-[14px] text-slate-400 font-bold italic mt-2">// Academic presence data link inactive.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filteredCourses.map((course, idx) => (
             <motion.div
               key={course._id}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: idx * 0.1 }}
               className="group bg-white dark:bg-[#0B0F1A] border border-slate-100 dark:border-slate-800/50 rounded-[3rem] p-8 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 transition-all cursor-pointer relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
                   <BookOpen className="w-24 h-24 -mr-8 -mt-8 rotate-12" />
                </div>
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-600 group-hover:rotate-6 transition-all duration-700 shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                    <BookOpen className="h-6 w-6 text-emerald-600 group-hover:text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1.5">Academic Domain</p>
                    <p className="text-[18px] font-black text-slate-900 dark:text-white tracking-tight truncate leading-tight">{course._id}</p>
                  </div>
                </div>
 
                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="p-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Scholars</p>
                      <p className="text-[18px] font-black text-slate-900 dark:text-white leading-none">{course.totalStudents}</p>
                   </div>
                   <div className="p-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1.5">At Risk</p>
                      <p className="text-[18px] font-black text-rose-600 leading-none">{course.belowThreshold}</p>
                   </div>
                </div>
 
                <div className="space-y-3">
                   <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                      <span>Course Presence</span>
                      <span className="text-emerald-600">{(course.avgPresent * 100).toFixed(1)}%</span>
                   </div>
                   <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden p-0.5 shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${course.avgPresent * 100}%` }}
                        transition={{ duration: 1 }}
                        className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      />
                   </div>
                </div>
 
                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                   <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-[#0B0F1A] flex items-center justify-center text-[10px] font-black text-slate-400">
                           {i}
                        </div>
                      ))}
                   </div>
                   <button className="h-10 px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all">Audit Sector</button>
                </div>
             </motion.div>
           ))}
        </div>
      )}
    </div>
  )
}
 
function PlatformStat({ label, value, icon, color, trend }: any) {
  const themes: any = {
    emerald: "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 border-emerald-100 dark:border-emerald-500/20",
    rose: "bg-rose-50 dark:bg-rose-900/10 text-rose-600 border-rose-100 dark:border-rose-500/20",
    blue: "bg-blue-50 dark:bg-blue-900/10 text-blue-600 border-blue-100 dark:border-blue-500/20",
    amber: "bg-amber-50 dark:bg-amber-900/10 text-amber-600 border-amber-100 dark:border-amber-500/20",
  }
 
  return (
    <div className="bg-white dark:bg-[#0B0F1A] border border-slate-100 dark:border-slate-800/50 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
         {React.cloneElement(icon, { size: 60 })}
      </div>
      <div className={`p-4 rounded-2xl ${themes[color]} w-fit border mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-sm`}>
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1.5">{label}</p>
        <div className="flex items-baseline gap-3">
           <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
           <span className={`text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 ${trend === 'OPTIMAL' || trend === 'SYNCED' || trend === 'PEAK' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend}
           </span>
        </div>
      </div>
    </div>
  )
}
