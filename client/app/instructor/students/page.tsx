"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  Users, Search, Download, TrendingUp, Clock, Award,
  Mail, Calendar, CheckCircle, Activity
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

export default function StudentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token } = useAuth()

  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>("")
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadCourses()
  }, [token])

  useEffect(() => {
    const courseId = searchParams.get("courseId")
    if (courseId) {
      setSelectedCourseId(courseId)
    }
  }, [searchParams])

  useEffect(() => {
    if (selectedCourseId) {
      loadStudents()
    }
  }, [selectedCourseId, token])

  async function loadCourses() {
    if (!token) return
    setLoading(true)
    try {
      const res = await instructorApi.listCourses(token, "limit=100")
      if (res.success && res.data) {
        const courseList = (res.data as any).courses || []
        setCourses(courseList)
        if (courseList.length > 0 && !selectedCourseId) {
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
    if (!token || !selectedCourseId) return
    setLoading(true)
    try {
      const res = await instructorApi.getStudents(token, selectedCourseId)
      if (res.success && res.data) {
        setStudents((res.data as any).students || [])
      }
    } catch (error) {
      toast.error("Failed to load students")
    } finally {
      setLoading(false)
    }
  }

  function exportToCSV() {
    if (students.length === 0) {
      toast.error("No students to export")
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
    a.download = `students-${selectedCourseId}-${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Students exported successfully")
  }

  const filteredStudents = students.filter(
    (s) =>
      searchQuery === "" ||
      s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedCourse = courses.find((c) => c._id === selectedCourseId)

  const avgProgress =
    students.length > 0
      ? students.reduce((sum, s) => sum + (s.progress.completionPercentage || 0), 0) / students.length
      : 0

  const avgTimeSpent =
    students.length > 0
      ? students.reduce((sum, s) => sum + (s.progress.totalTimeSpent || 0), 0) / students.length / 3600
      : 0

  const activeStudents = students.filter((s) => s.status === "active").length
  const completedStudents = students.filter(
    (s) => s.progress.completionPercentage === 100
  ).length

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium">No courses yet</p>
        <p className="text-sm text-muted-foreground mb-4">Create a course to see enrolled students</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground mt-1">View and manage enrolled students</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course._id} value={course._id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{students.length}</p>
          <p className="text-sm text-muted-foreground">Total Students</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold">{activeStudents}</p>
          <p className="text-sm text-muted-foreground">Active Students</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold">{avgProgress.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground">Avg Progress</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold">{completedStudents}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Students List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading students...</p>
          </div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border bg-muted/20">
          <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium">No students found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "Try adjusting your search" : "Students will appear here once they enroll"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStudents.map((student) => (
            <motion.div
              key={student._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/50 bg-card p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold text-lg">
                    {student.student.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{student.student.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Mail className="h-3 w-3" />
                        {student.student.email}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Enrolled {new Date(student.enrolledAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {((student.progress.totalTimeSpent || 0) / 3600).toFixed(1)}h spent
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          student.status === "active"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-gray-500/10 text-gray-600"
                        }`}
                      >
                        <Activity className="h-3 w-3" />
                        {student.status}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {student.progress.completionPercentage?.toFixed(1) || 0}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all"
                          style={{
                            width: `${student.progress.completionPercentage || 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completion Badge */}
                {student.progress.completionPercentage === 100 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-600">
                    <Award className="h-5 w-5" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
