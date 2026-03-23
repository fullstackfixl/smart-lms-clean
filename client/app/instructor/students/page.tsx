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
  UserCheck,
  GraduationCap,
  MoreVertical,
  ChevronLeft,
  BookOpen,
  RefreshCw,
  MessageSquare,
  Eye,
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
import { toast } from "sonner"
import { cn } from "../../../lib/utils"
import { instructorApi, collegeApi, messagingApi } from '../../../lib/api'
import { UserAvatar } from "../../../components/ui/UserAvatar"

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

function StudentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token, user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const isCollege = String(user?.organizationType || '').toUpperCase() === 'COLLEGE'

  useEffect(() => {
    if (token) loadCourses()
  }, [token])

  useEffect(() => {
    const courseId = searchParams.get("courseId")
    if (courseId) setSelectedCourseId(courseId)
  }, [searchParams])

  useEffect(() => {
    if (selectedCourseId && token) loadStudents()
  }, [selectedCourseId, token])

  async function loadCourses() {
    setLoading(true)
    try {
      const res = isCollege
        ? await collegeApi.getInstructorCourses(token!)
        : await instructorApi.listCourses(token!, "limit=100")
      if (res.success && res.data) {
        const courseList = (res.data as any).courses || (res.data as any) || []
        setCourses(courseList)
        if (courseList.length > 0 && !selectedCourseId && !searchParams.get("courseId")) {
          setSelectedCourseId(courseList[0]._id)
        }
      }
    } catch (error) {
      toast.error("Failed to load courses")
    } finally {
      setLoading(false)
    }
  }

  async function loadStudents() {
    setLoading(true)
    try {
      const res = isCollege
        ? await collegeApi.getInstructorStudents(token!)
        : await instructorApi.getStudents(token!, selectedCourseId)
      if (res.success && res.data) {
        setStudents((res.data as any).students || [])
      }
    } catch (error) {
      toast.error("Failed to load students")
    } finally {
      setLoading(false)
    }
  }

  const handleStartChat = async (studentUserId: string) => {
    if (!token) return
    const toastId = toast.loading("Opening chat...")
    try {
      const res = await messagingApi.startConversation(token, studentUserId)
      if (res.success && res.data) {
        const conv = res.data as any
        toast.success("Redirecting...", { id: toastId })
        router.push(`/instructor/messages?conversation=${conv._id}`)
      } else {
        toast.error(res.error || "Failed to start chat", { id: toastId })
      }
    } catch (err) {
      toast.error("Network error", { id: toastId })
    }
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-2">
            <Users className="w-3.5 h-3.5" />
            Learner Management
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Student Directory</h1>
          <p className="text-slate-500 mt-1">Monitor individual progress, engagement metrics, and learner success.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadStudents} className="border-gray-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <div className="min-w-[220px]">
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="h-10 border-gray-200">
                <SelectValue placeholder="Select Course..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course._id} value={course._id}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={exportToCSV} className="border-gray-200">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Total Students" value={students.length} icon={Users} color="blue" />
        <MetricCard label="Active Status" value={activeStudents} icon={UserCheck} color="green" />
        <MetricCard label="Avg. Progress" value={`${avgProgress.toFixed(1)}%`} icon={Activity} color="orange" />
        <MetricCard label="Completions" value={completedStudents} icon={Award} color="indigo" />
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[1.5]" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full pl-10 pr-4 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Student</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Enrolled</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Progress</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Time Spent</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="h-48 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    Loading students...
                  </div>
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="h-48 text-center text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  No students found.
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr key={s._id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar 
                        name={s.student.name} 
                        src={(s.student as any).profilePicture || s.student.profile?.avatar} 
                        size="md" 
                      />
                      <div>
                        <p 
                          className="font-medium text-slate-900 hover:text-blue-600 cursor-pointer transition-colors"
                          onClick={() => router.push(`/instructor/students/${s.student._id}`)}
                        >
                          {s.student.name}
                        </p>
                        <p className="text-sm text-slate-500">{s.student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {new Date(s.enrolledAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={s.progress.completionPercentage === 100 ? "text-green-600" : "text-slate-600"}>
                          {s.progress.completionPercentage?.toFixed(0) || 0}%
                        </span>
                      </div>
                      <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full", s.progress.completionPercentage === 100 ? "bg-green-500" : "bg-blue-500")}
                          style={{ width: `${s.progress.completionPercentage || 0}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {((s.progress.totalTimeSpent || 0) / 3600).toFixed(1)} hrs
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-slate-400 hover:text-blue-600"
                        onClick={() => router.push(`/instructor/students/${s.student._id}`)}
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:bg-blue-50"
                        onClick={() => handleStartChat(s.student._id)}
                        title="Message Student"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function StudentsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500">Loading students...</p>
      </div>
    }>
      <StudentsContent />
    </Suspense>
  )
}
