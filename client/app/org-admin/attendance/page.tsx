"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Users, CheckCircle2, XCircle, Clock, Search, Filter, ChevronRight, Loader2, AlertCircle } from "lucide-react"
import { attendanceApi, getCourses } from "@/lib/services/orgAdminApi"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { format } from "date-fns"

export default function AttendancePage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>("")
  const [attendanceData, setAttendanceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [markingMode, setMarkingMode] = useState(false)
  const [records, setRecords] = useState<any[]>([])

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      loadAttendance()
    }
  }, [selectedCourse])

  async function loadCourses() {
    try {
      const response = await getCourses()
      if (response.success) {
        setCourses(response.data.courses)
        if (response.data.courses.length > 0) {
          setSelectedCourse(response.data.courses[0]._id)
        }
      }
    } catch (error) {
      toast.error("Failed to load courses")
    } finally {
      setLoading(false)
    }
  }

  async function loadAttendance() {
    setLoading(true)
    try {
      const response = await attendanceApi.getCourseAttendance(selectedCourse)
      if (response.success) {
        setAttendanceData(response.data)
      }
    } catch (error) {
      toast.error("Failed to load attendance")
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkAttendance() {
    // This would typically manifest as a list of students for the selected course
    // For demonstration, we'll show the current state
    toast.info("Select a session to view or update attendance")
  }

  if (loading && !attendanceData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-2">
            Attendance Management
          </h1>
          <p className="text-slate-400">Monitor and track student engagement across courses</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="h-12 px-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          >
            {courses.map(course => (
              <option key={course._id} value={course._id}>{course.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Avg. Attendance"
          value={`${attendanceData?.course_statistics?.average_attendance_percentage || 0}%`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard
          title="Total Sessions"
          value={attendanceData?.course_statistics?.total_sessions || 0}
          icon={Calendar}
          color="blue"
        />
        <StatsCard
          title="Low Attendance"
          value={attendanceData?.course_statistics?.students_below_threshold || 0}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Attendance Sessions */}
      <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-200">Recent Sessions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800/30 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Date & Time</th>
                <th className="px-6 py-4 font-medium">Session Title</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Present</th>
                <th className="px-6 py-4 font-medium">Absent</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {attendanceData?.attendance_records?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No attendance records found for this course
                  </td>
                </tr>
              ) : (
                attendanceData?.attendance_records?.map((session: any) => (
                  <tr key={session._id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex flex-col items-center justify-center text-slate-300">
                          <span className="text-[10px] uppercase font-bold">{format(new Date(session.session_date), "MMM")}</span>
                          <span className="text-sm font-black">{format(new Date(session.session_date), "dd")}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{session.start_time} - {session.end_time}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-300">{session.session_title || "Untitled Session"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-[10px] font-bold uppercase tracking-wider">
                        {session.session_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-400 font-bold">{session.attendance_records.filter((r: any) => r.status === 'present').length}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-red-400 font-bold">{session.attendance_records.filter((r: any) => r.status === 'absent').length}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-indigo-400 hover:text-indigo-300 font-medium text-sm inline-flex items-center gap-1">
                        View <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    emerald: "from-emerald-500 to-teal-600 bg-emerald-500/10 text-emerald-400",
    blue: "from-blue-500 to-indigo-600 bg-blue-500/10 text-blue-400",
    red: "from-rose-500 to-red-600 bg-red-500/10 text-red-400",
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-slate-800 p-6 rounded-2xl"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colors[color].split(' ')[2]} ${colors[color].split(' ')[3]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-100">{value}</h3>
    </motion.div>
  )
}