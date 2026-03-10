"use client"
 
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, 
  Search, 
  Download, 
  TrendingUp, 
  Clock, 
  Award,
  Mail, 
  Calendar, 
  CheckCircle, 
  Activity,
  ChevronRight,
  Filter,
  BarChart3,
  UserCheck,
  GraduationCap,
  Zap,
  Target,
  ShieldCheck,
  ArrowUpRight,
  MousePointer2,
  MoreVertical
} from "lucide-react"
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { useAuth } from '../../../lib/auth-context'
import { instructorApi } from '../../../lib/api'
import { toast } from "sonner"
import { cn } from "../../../lib/utils"
 
interface Course {
  _id: string
  title: string
}
 
interface Student {
  _id: string
  status: string
  enrolledAt: string
  student: {
    _id: string
    name: string
    email: string
    profile?: {
      avatar?: string
    }
  }
  progress: {
    completionPercentage: number
    totalTimeSpent: number
  }
}
 
function StudentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token } = useAuth()
 
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
 
  useEffect(() => {
    if (token) {
      loadCourses()
    }
  }, [token])
 
  useEffect(() => {
    const courseId = searchParams.get("courseId")
    if (courseId) {
      setSelectedCourseId(courseId)
    }
  }, [searchParams])
 
  useEffect(() => {
    if (selectedCourseId && token) {
      loadStudents()
    }
  }, [selectedCourseId, token])
 
  async function loadCourses() {
    setLoading(true)
    try {
      const res = await instructorApi.listCourses(token!, "limit=100")
      if (res.success && res.data) {
        const courseList = (res.data as any).courses || []
        setCourses(courseList)
        if (courseList.length > 0 && !selectedCourseId && !searchParams.get("courseId")) {
          setSelectedCourseId(courseList[0]._id)
        }
      }
    } catch (error) {
      toast.error("Failed to load curriculum context")
    } finally {
      setLoading(false)
    }
  }
 
  async function loadStudents() {
    setLoading(true)
    try {
      const res = await instructorApi.getStudents(token!, selectedCourseId)
      if (res.success && res.data) {
        setStudents((res.data as any).students || [])
      }
    } catch (error) {
      toast.error("Failed to synchronize scholar registry")
    } finally {
      setLoading(false)
    }
  }
 
  function exportToCSV() {
    if (students.length === 0) {
      toast.error("No intelligence to export")
      return
    }
 
    const headers = ["Name", "Email", "Status", "Enrolled Date", "Progress %", "Time Spent (hours)"]
    const rows = students.map((s) => [
      s.student.name,
      s.student.email,
      s.status,
      new Date(s.enrolledAt).toLocaleDateString(),
      s.progress.completionPercentage?.toFixed(1) || "0",
      ((s.progress.totalTimeSpent || 0) / 3600).toFixed(2),
    ])
 
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")
 
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `scholar-registry-${selectedCourseId}-${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Intelligence registry exported successfully")
  }
 
  const filteredStudents = students.filter(
    (s) =>
      searchQuery === "" ||
      s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student.email.toLowerCase().includes(searchQuery.toLowerCase())
  )
 
  const avgProgress =
    students.length > 0
      ? students.reduce((sum, s) => sum + (s.progress.completionPercentage || 0), 0) / students.length
      : 0
 
  const activeStudents = students.filter((s) => s.status === "active").length
  const completedStudents = students.filter(
    (s) => s.progress.completionPercentage === 100
  ).length
 
  return (
    <div className="max-w-[1600px] mx-auto space-y-16 pb-32 p-8 animate-in fade-in duration-1000">
      
      {/* ─── Scholar Registry Hero ────────────────────────────────────── */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[4rem] blur opacity-[0.03] group-hover:opacity-[0.08] transition duration-1000" />
        <div className="relative overflow-hidden rounded-[3.5rem] bg-white border border-slate-200/60 p-12 lg:p-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.03)] focus-within:shadow-[0_48px_96px_-24px_rgba(16,185,129,0.1)] transition-all">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[35rem] h-[35rem] bg-emerald-50 rounded-full blur-[120px]" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-16">
            <div className="space-y-8 max-w-2xl">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black uppercase tracking-[0.25em] border border-emerald-100/50">
                <Users className="w-4 h-4" />
                Scholastic Population
              </div>
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-black text-slate-900 tracking-[-0.04em] leading-[0.95]">
                  Oversee Your <br />
                  <span className="text-emerald-600">Scholar Network.</span>
                </h1>
                <p className="text-[19px] font-medium text-slate-500 leading-relaxed max-w-xl">
                  Analyze scholar engagement velocity, cross-sectional mastery trends, and individual achievement trajectories across your pedagogical units.
                </p>
              </div>
 
              <div className="flex flex-wrap items-center gap-6 pt-4">
                 <div className="bg-slate-50 p-1 rounded-[1.8rem] border border-slate-100 shadow-inner group/select">
                   <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                     <SelectTrigger className="w-[340px] h-14 rounded-[1.5rem] bg-white border-none shadow-sm text-[14px] font-black px-6 focus:ring-0">
                       <div className="flex flex-col items-start text-left">
                         <span className="text-[9px] text-slate-400 uppercase tracking-widest leading-none mb-1 group-hover/select:text-emerald-600 transition-colors">Core Curriculum Context</span>
                         <SelectValue placeholder="Select context course" />
                       </div>
                     </SelectTrigger>
                     <SelectContent className="rounded-[1.5rem] p-2 border-slate-100 shadow-2xl">
                       {courses.map((course) => (
                         <SelectItem key={course._id} value={course._id} className="rounded-xl py-3 font-bold text-[13px] focus:bg-emerald-50 focus:text-emerald-700">
                           {course.title}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 
                 <button
                   onClick={exportToCSV}
                   className="h-16 px-10 bg-slate-900 text-white rounded-2xl text-[14px] font-black shadow-xl shadow-indigo-500/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group"
                 >
                   <Download className="h-5 w-5 group-hover:-translate-y-1 transition-transform" strokeWidth={3} />
                   EXPORT REGISTRY
                 </button>
              </div>
            </div>
 
            {/* Real-time Engagement Analytics */}
            <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                <MetricMiniCard label="Total Scholars" value={students.length} icon={<Users color="#4F46E5" />} />
                <MetricMiniCard label="Operational" value={activeStudents} icon={<UserCheck color="#10B981" />} />
                <MetricMiniCard label="Engagement" value={`${avgProgress.toFixed(1)}%`} icon={<Activity color="#3B82F6" />} />
                <MetricMiniCard label="Masters" value={completedStudents} icon={<Award color="#F59E0B" />} />
            </div>
          </div>
        </div>
      </div>
 
      {/* ─── Scholar Stream Surface ───────────────────────────── */}
      <div className="space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 px-6">
           <div className="space-y-2">
              <h3 className="text-[22px] font-black text-slate-900 tracking-tight">Active Scholar Stream</h3>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest italic opacity-70">
                {loading ? "// Synchronizing registry stream..." : `// ${filteredStudents.length} scholar identities identified in current sector`}
              </p>
           </div>
           
           <div className="flex items-center gap-6 flex-wrap">
              <div className="relative group min-w-[420px]">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Intelligence search by identity name or locator..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-16 w-full pl-16 pr-6 bg-white border border-slate-200 rounded-[1.8rem] text-[15px] font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-[8px] focus:ring-emerald-500/5 focus:border-emerald-500/30 transition-all shadow-sm"
                />
              </div>
           </div>
        </div>
 
        {/* Scholar Intelligence Grid */}
        <AnimatePresence mode="wait">
          {loading && students.length === 0 ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 p-4"
            >
              {[1, 2, 3].map(i => (
                <div key={i} className="h-44 bg-slate-50 border border-slate-100 rounded-[3.5rem] animate-pulse" />
              ))}
            </motion.div>
          ) : filteredStudents.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-48 text-center bg-white rounded-[4rem] border border-dashed border-slate-200 m-4"
            >
              <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mb-10 border border-slate-100">
                <Users className="h-10 w-10 text-slate-200" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">REGISTRY VOID</h3>
              <p className="text-[17px] font-medium text-slate-400 max-w-sm mx-auto leading-relaxed mb-12 italic opacity-80">
                The current tactical search returned zero scholarly identities from the registry for this curriculum context.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="stream"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 p-4"
            >
              {filteredStudents.map((s, index) => (
                <PeakScholarCard key={s._id} s={s} index={index} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
 
function PeakScholarCard({ s, index }: { s: Student, index: number }) {
  const statusColors: any = {
    active: "bg-emerald-50 text-emerald-600 border-emerald-100",
    inactive: "bg-slate-50 text-slate-400 border-slate-100",
    completed: "bg-indigo-50 text-indigo-600 border-indigo-100",
  }
 
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.7 }}
      className="group relative"
    >
      <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12 hover:border-emerald-500/30 hover:shadow-[0_48px_96px_-24px_rgba(16,185,129,0.08)] transition-all duration-700 cursor-default border-l-4 hover:border-l-emerald-500">
        <div className="flex-1 flex flex-col md:flex-row md:items-center gap-10">
          {/* Identity Core */}
          <div className="flex items-center gap-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-slate-900 font-black text-3xl group-hover:bg-emerald-600 group-hover:text-white group-hover:rotate-6 transition-all duration-700 shadow-xl group-hover:shadow-emerald-500/20">
                {s.student.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                 <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <div className="space-y-1.5">
               <h4 className="text-[24px] font-black text-slate-900 tracking-tight leading-none">{s.student.name}</h4>
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                    <Mail className="w-4 h-4 opacity-40" />
                    <span className="text-[14px] font-bold text-slate-400 italic">{s.student.email}</span>
                  </div>
                  <div className={cn("px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", statusColors[s.status] || statusColors.inactive)}>
                    {s.status}
                  </div>
               </div>
            </div>
          </div>
 
          <div className="hidden xl:block w-px h-16 bg-slate-100 mx-4" />
 
          {/* Scholastic Meta Metrics */}
          <div className="flex flex-wrap gap-12 items-center">
             <div className="space-y-2">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Authentication Registry</p>
               <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span className="text-[14px] font-black text-slate-900">{new Date(s.enrolledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
               </div>
             </div>
             <div className="space-y-2">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Intelligence Exposure</p>
               <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span className="text-[14px] font-black text-slate-900">{((s.progress.totalTimeSpent || 0) / 3600).toFixed(1)} <span className="text-slate-400 text-[11px] ml-1 uppercase">Hours Active</span></span>
               </div>
             </div>
          </div>
        </div>
 
        {/* Mastery Analytics Surface */}
        <div className="lg:w-96 p-8 rounded-[2.8rem] bg-slate-50 border border-slate-100 space-y-6 group-hover:bg-white group-hover:border-emerald-100/50 transition-all duration-700">
           <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Curriculum Mastery</p>
              <div className="flex items-baseline gap-1">
                 <span className="text-[20px] font-black text-slate-900 tracking-tighter">{s.progress.completionPercentage?.toFixed(0) || 0}</span>
                 <span className="text-[12px] font-black text-slate-300">%</span>
              </div>
           </div>
           <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${s.progress.completionPercentage || 0}%` }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full shadow-lg transition-all",
                  s.progress.completionPercentage === 100 ? "bg-emerald-500 shadow-emerald-500/20" : "bg-indigo-600 shadow-indigo-500/20"
                )} 
              />
           </div>
           {s.progress.completionPercentage === 100 && (
             <div className="flex items-center gap-2 justify-center">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] italic">Full Certification Active</span>
             </div>
           )}
        </div>
        
        <button className="h-20 w-20 flex items-center justify-center rounded-[2.5rem] bg-slate-50 border border-slate-100 text-slate-300 hover:text-emerald-600 hover:bg-white hover:rotate-90 hover:scale-110 transition-all duration-500 group-hover:shadow-xl">
           <ArrowUpRight className="w-7 h-7" strokeWidth={3} />
        </button>
      </div>
    </motion.div>
  )
}
 
export default function StudentsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="relative">
          <div className="h-20 w-20 border-[6px] border-emerald-500/10 border-t-emerald-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Users className="w-6 h-6 text-emerald-600 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
           <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.3em]">Synchronizing Scholar Matrix</p>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic animate-pulse">Establishing scholastic link...</p>
        </div>
      </div>
    }>
      <StudentsContent />
    </Suspense>
  )
}
 
function MetricMiniCard({ label, value, icon }: any) {
  return (
    <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-5 hover:bg-white hover:border-emerald-200 hover:shadow-lg transition-all cursor-default group">
       <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
          {icon}
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
          <p className="text-[24px] font-black text-slate-900 leading-none tracking-tighter">{value}</p>
       </div>
    </div>
  )
}
