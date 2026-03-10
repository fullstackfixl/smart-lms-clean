"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  MoreVertical,
  ChevronLeft
} from "lucide-react"
import { Button } from '../../../components/ui/button'
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
  useEffect(() => { if (token) loadCourses() }, [token])
  useEffect(() => {
    const courseId = searchParams.get("courseId")
    if (courseId) setSelectedCourseId(courseId)
  }, [searchParams])
  useEffect(() => { if (selectedCourseId && token) loadStudents() }, [selectedCourseId, token])
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
    } catch (error) { toast.error("Failed to load courses") }
    finally { setLoading(false) }
  }
  async function loadStudents() {
    setLoading(true)
    try {
      const res = await instructorApi.getStudents(token!, selectedCourseId)
      if (res.success && res.data) {
        setStudents((res.data as any).students || [])
      }
    } catch (error) { toast.error("Failed to load students") }
    finally { setLoading(false) }
  }
  function exportToCSV() {
    if (students.length === 0) { toast.error("No data to export"); return }
    const headers = ["Name", "Email", "Status", "Enrolled Date", "Progress %", "Time Spent (hours)"]
    const rows = students.map((s) => [
      s.student.name, s.student.email, s.status,
      new Date(s.enrolledAt).toLocaleDateString(),
      s.progress.completionPercentage?.toFixed(1) || "0",
      ((s.progress.totalTimeSpent || 0) / 3600).toFixed(2),
    ])
    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `student-list-${selectedCourseId}-${Date.now()}.csv`; a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Student list exported successfully")
  }
  const filteredStudents = students.filter(
    (s) => searchQuery === "" || s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.student.email.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const avgProgress = students.length > 0 ? students.reduce((sum, s) => sum + (s.progress.completionPercentage || 0), 0) / students.length : 0
  const activeStudents = students.filter((s) => s.status === "active").length
  const completedStudents = students.filter((s) => s.progress.completionPercentage === 100).length

  return (
    <div className="space-y-10 pb-20">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl opacity-60" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            <Users className="w-3.5 h-3.5" />
            Learner Management
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Student Directory</h1>
          <p className="text-sm text-slate-500 font-medium italic">Monitor individual progress, engagement metrics, and learner success.</p>
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="min-w-[320px]">
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-indigo-500/5 transition-all">
                <SelectValue placeholder="Select Course..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                {courses.map((course) => (
                  <SelectItem key={course._id} value={course._id} className="rounded-xl py-3 font-black text-[10px] uppercase tracking-widest text-slate-600 focus:bg-indigo-50 focus:text-indigo-600">
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="outline"
            onClick={exportToCSV}
            className="rounded-2xl h-14 px-8 border-slate-200 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all"
          >
            <Download className="w-4 h-4 stroke-[3]" />
            Export Data
          </Button>
        </div>
      </div>

      {/* ─── Metrics Quickview ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricMiniCard label="Total Students" value={students.length} icon={<Users className="w-6 h-6 text-blue-600" />} />
        <MetricMiniCard label="Active Status" value={activeStudents} icon={<UserCheck className="w-6 h-6 text-emerald-600" />} />
        <MetricMiniCard label="Avg. Progress" value={`${avgProgress.toFixed(1)}%`} icon={<Activity className="w-6 h-6 text-indigo-600" />} />
        <MetricMiniCard label="Completions" value={completedStudents} icon={<Award className="w-6 h-6 text-orange-600" />} />
      </div>

      {/* ─── Student Registry Table ─── */}
      <SimpleCard className="p-0 overflow-hidden border-slate-100 shadow-sm rounded-[2.5rem]">
        <div className="p-10 border-b border-slate-50 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[3]" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 w-full pl-14 pr-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all font-bold text-slate-900 placeholder:font-medium placeholder:text-slate-400"
            />
          </div>
          <Button variant="ghost" className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 gap-3">
            <Filter className="w-4 h-4 stroke-[3]" />
            Filter Students
          </Button>
        </div>

        <FlatTable>
          <FlatTableHead>
            <FlatTableRow className="bg-slate-50/50">
              <FlatTableCell className="w-[100px] font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6 pl-10">Avatar</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6">Student Details</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6">Enrolled</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6">Course Progress</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6">Engagement</FlatTableCell>
              <FlatTableCell className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] py-6 text-right pr-10">Actions</FlatTableCell>
            </FlatTableRow>
          </FlatTableHead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <FlatTableRow>
                <FlatTableCell colSpan={6} className="h-72 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400 italic font-bold">
                    <Users className="w-12 h-12 mb-4 opacity-10" />
                    No students found in this course.
                  </div>
                </FlatTableCell>
              </FlatTableRow>
            ) : (
              filteredStudents.map((s) => (
                <FlatTableRow key={s._id} className="group transition-all">
                  <FlatTableCell className="pl-10 py-8">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      {s.student.name.charAt(0).toUpperCase()}
                    </div>
                  </FlatTableCell>
                  <FlatTableCell>
                    <div className="space-y-1.5">
                      <p className="text-[15px] font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase">{s.student.name}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">{s.student.email}</p>
                    </div>
                  </FlatTableCell>
                  <FlatTableCell>
                    <div className="flex items-center gap-2 text-slate-600 font-black uppercase tracking-widest tabular-nums text-[11px]">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(s.enrolledAt).toLocaleDateString()}
                    </div>
                  </FlatTableCell>
                  <FlatTableCell className="min-w-[200px]">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] border-0">
                        <span className={s.progress.completionPercentage === 100 ? "text-emerald-600" : "text-slate-500"}>
                          {s.progress.completionPercentage?.toFixed(0)}% Complete
                        </span>
                        {s.progress.completionPercentage === 100 && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />}
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-700 ease-out",
                            s.progress.completionPercentage === 100 ? "bg-emerald-500" : "bg-blue-600"
                          )} 
                          style={{ width: `${s.progress.completionPercentage || 0}%` }}
                        />
                      </div>
                    </div>
                  </FlatTableCell>
                  <FlatTableCell>
                    <div className="flex items-center gap-2 text-slate-600 font-black uppercase tracking-widest tabular-nums text-[11px]">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {((s.progress.totalTimeSpent || 0) / 3600).toFixed(1)} HRS
                    </div>
                  </FlatTableCell>
                  <FlatTableCell className="text-right pr-10">
                    <div className="flex items-center justify-end gap-3">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all">
                        <Mail className="w-4 h-4 stroke-[2.5]" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-50 text-slate-400 transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </FlatTableCell>
                </FlatTableRow>
              ))
            )}
          </tbody>
        </FlatTable>
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

export default function StudentsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="h-14 w-14 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse italic">Loading Learner Registry...</p>
      </div>
    }>
      <StudentsContent />
    </Suspense>
  )
}
