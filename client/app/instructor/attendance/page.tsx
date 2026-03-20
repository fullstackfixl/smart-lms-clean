"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  UserCheck, Users, Calendar, Clock, ChevronRight, CheckCircle,
  XCircle, AlertCircle, RefreshCw, Video, BookOpen, History,
  ExternalLink, Loader2, Check, X, Timer
} from "lucide-react"
import { collegeApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"
import { toast } from "sonner"
import { Button } from "../../../components/ui/button"
import { cn } from "../../../lib/utils"

type AttendanceStatus = "present" | "absent" | "late"

interface Student {
  _id: string
  full_name: string
  email: string
  roll_number?: string
}

interface Subject { _id: string; name: string; code: string }
interface Batch { _id: string; name: string; code: string }

interface Session {
  _id: string
  subject: Subject
  batch: Batch
  program?: { _id: string; name: string }
  day: string
  startTime: string
  endTime: string
  room?: string
  meetingLink?: string
  attendanceMarked: boolean
  attendanceId?: string
}

interface HistoryRecord {
  _id: string
  session_date: string
  start_time: string
  end_time: string
  subjectId?: Subject
  batchId?: Batch
  session_title?: string
  attendance_records: Array<{
    student_id: Student | string
    status: AttendanceStatus
    late_minutes?: number
  }>
}

type TabView = "mark" | "history"

export default function InstructorAttendancePage() {
  const { token, user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabView>("mark")

  // Today's sessions
  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  // Selected session + students
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [submitting, setSubmitting] = useState(false)

  // History
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const loadSessions = useCallback(async () => {
    if (!token) return
    setSessionsLoading(true)
    try {
      const res = await collegeApi.getAssignedSessions(token)
      if (res.success) {
        const data = (res.data as any) || []
        setSessions(Array.isArray(data) ? data : [])
      }
    } catch {
      toast.error("Failed to load today's sessions")
    } finally {
      setSessionsLoading(false)
    }
  }, [token])

  const loadStudents = useCallback(async (session: Session) => {
    if (!token) return
    setStudentsLoading(true)
    setStudents([])
    setAttendance({})
    try {
      const res = await collegeApi.getStudentsForAttendance(token, session.subject._id, session.batch._id)
      if (res.success) {
        const data = (res.data as any) || {}
        const list: Student[] = data.students || []
        setStudents(list)
        // Default all to absent
        const defaults: Record<string, AttendanceStatus> = {}
        list.forEach((s) => { defaults[s._id] = "absent" })
        setAttendance(defaults)
      } else {
        toast.error("Failed to load students")
      }
    } catch {
      toast.error("Failed to load students")
    } finally {
      setStudentsLoading(false)
    }
  }, [token])

  const loadHistory = useCallback(async () => {
    if (!token) return
    setHistoryLoading(true)
    try {
      const res = await collegeApi.getInstructorAttendance(token)
      if (res.success) {
        const data = (res.data as any) || {}
        setHistoryRecords(data.records || [])
      }
    } catch {
      toast.error("Failed to load history")
    } finally {
      setHistoryLoading(false)
    }
  }, [token])

  useEffect(() => { loadSessions() }, [loadSessions])
  useEffect(() => {
    if (activeTab === "history") loadHistory()
  }, [activeTab, loadHistory])

  function selectSession(session: Session) {
    setSelectedSession(session)
    loadStudents(session)
  }

  function toggleStatus(studentId: string, status: AttendanceStatus) {
    setAttendance((prev) => ({ ...prev, [studentId]: status }))
  }

  function markAll(status: AttendanceStatus) {
    const all: Record<string, AttendanceStatus> = {}
    students.forEach((s) => { all[s._id] = status })
    setAttendance(all)
  }

  async function handleSubmit() {
    if (!selectedSession || !token) return
    setSubmitting(true)
    try {
      const records = students.map((s) => ({
        student_id: s._id,
        status: attendance[s._id] || "absent"
      }))

      const startTime = selectedSession.startTime || "09:00"
      const endTime = selectedSession.endTime || "10:00"

      const res = await collegeApi.markAttendance(token, {
        subjectId: selectedSession.subject._id,
        batchId: selectedSession.batch._id,
        programId: selectedSession.program?._id,
        session_date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        session_title: `${selectedSession.subject.name} - ${selectedSession.batch.name}`,
        attendance_records: records
      })

      if (res.success) {
        toast.success("Attendance marked successfully!")
        // Mark the session as done
        setSessions((prev) =>
          prev.map((s) => s._id === selectedSession._id ? { ...s, attendanceMarked: true } : s)
        )
        setSelectedSession(null)
        setStudents([])
      } else {
        toast.error((res as any).error || "Failed to mark attendance")
      }
    } catch {
      toast.error("Failed to mark attendance")
    } finally {
      setSubmitting(false)
    }
  }

  const presentCount = students.filter((s) => attendance[s._id] === "present").length
  const absentCount = students.filter((s) => attendance[s._id] === "absent").length
  const lateCount = students.filter((s) => attendance[s._id] === "late").length

  // Generate Jitsi link
  function getJitsiLink(session: Session) {
    if (session.meetingLink) return session.meetingLink
    const org = (user as any)?.organizationCode || "org"
    const batch = session.batch.code.replace(/\s+/g, "-")
    const subject = session.subject.code.replace(/\s+/g, "-")
    return `https://meet.jit.si/${org}-${batch}-${subject}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-600" /> Attendance
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Mark and manage student attendance for your sessions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("mark")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "mark"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white border border-gray-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <Users className="inline w-4 h-4 mr-1.5" />Mark Attendance
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === "history"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white border border-gray-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            <History className="inline w-4 h-4 mr-1.5" />History
          </button>
        </div>
      </div>

      {activeTab === "mark" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Session List */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Today's Sessions
              </h2>
              <button onClick={loadSessions} className="text-slate-400 hover:text-slate-600 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {sessionsLoading ? (
              <div className="flex items-center justify-center h-40 bg-white rounded-xl border border-gray-200">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 bg-white rounded-xl border border-gray-200 text-center p-6">
                <Calendar className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm text-slate-400 font-medium">No sessions scheduled for today</p>
                <p className="text-xs text-slate-300 mt-1">Check your timetable for upcoming sessions</p>
              </div>
            ) : (
              sessions.map((session) => {
                const isSelected = selectedSession?._id === session._id
                return (
                  <button
                    key={session._id}
                    onClick={() => selectSession(session)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all duration-200 group",
                      isSelected
                        ? "bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-100"
                        : session.attendanceMarked
                        ? "bg-green-50 border-green-200 hover:border-green-300"
                        : "bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("font-semibold text-sm truncate", isSelected ? "text-white" : "text-slate-900")}>
                            {session.subject.name}
                          </p>
                          {session.attendanceMarked && !isSelected && (
                            <span className="shrink-0 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">
                              Done
                            </span>
                          )}
                        </div>
                        <p className={cn("text-xs mt-0.5 font-medium", isSelected ? "text-indigo-200" : "text-slate-500")}>
                          {session.batch.name} • {session.subject.code}
                        </p>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 shrink-0 mt-0.5", isSelected ? "text-white" : "text-slate-300")} />
                    </div>
                    <div className={cn("flex items-center gap-3 mt-2 text-xs", isSelected ? "text-indigo-200" : "text-slate-400")}>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.startTime} – {session.endTime}
                      </span>
                      {session.room && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />{session.room}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Attendance Marking Panel */}
          <div className="lg:col-span-3">
            {!selectedSession ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-white rounded-xl border border-dashed border-gray-200 text-center p-8">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                  <UserCheck className="w-7 h-7 text-indigo-400" />
                </div>
                <p className="text-slate-600 font-semibold">Select a session to mark attendance</p>
                <p className="text-slate-400 text-sm mt-1">Choose a session from the left panel to get started</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Session Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-5 text-white">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="text-lg font-bold">{selectedSession.subject.name}</h3>
                      <p className="text-indigo-200 text-sm mt-0.5">{selectedSession.batch.name} • {selectedSession.subject.code}</p>
                      <div className="flex items-center gap-3 mt-2 text-indigo-100 text-xs">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selectedSession.startTime} – {selectedSession.endTime}</span>
                        {selectedSession.room && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{selectedSession.room}</span>}
                      </div>
                    </div>
                    <a
                      href={getJitsiLink(selectedSession)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                      <Video className="w-4 h-4" />Start Class
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Date Picker */}
                  <div className="flex items-center gap-2 mt-3">
                    <label className="text-indigo-200 text-xs font-medium">Date:</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="h-8 px-3 bg-white/20 border border-white/30 rounded-lg text-white text-xs placeholder:text-indigo-300 focus:outline-none focus:bg-white/30"
                    />
                  </div>
                </div>

                {/* Stats bar */}
                {students.length > 0 && (
                  <div className="grid grid-cols-3 border-b border-gray-100">
                    <div className="px-4 py-3 text-center border-r border-gray-100">
                      <p className="text-xl font-bold text-green-600">{presentCount}</p>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Present</p>
                    </div>
                    <div className="px-4 py-3 text-center border-r border-gray-100">
                      <p className="text-xl font-bold text-red-500">{absentCount}</p>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Absent</p>
                    </div>
                    <div className="px-4 py-3 text-center">
                      <p className="text-xl font-bold text-amber-500">{lateCount}</p>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Late</p>
                    </div>
                  </div>
                )}

                {/* Bulk action bar */}
                {students.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-gray-100">
                    <span className="text-xs font-medium text-slate-500 mr-1">Mark All:</span>
                    <button onClick={() => markAll("present")} className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors flex items-center gap-1">
                      <Check className="w-3 h-3" />Present
                    </button>
                    <button onClick={() => markAll("absent")} className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1">
                      <X className="w-3 h-3" />Absent
                    </button>
                    <button onClick={() => markAll("late")} className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1">
                      <Timer className="w-3 h-3" />Late
                    </button>
                  </div>
                )}

                {/* Student List */}
                <div className="overflow-y-auto max-h-[400px]">
                  {studentsLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                    </div>
                  ) : students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center p-6">
                      <Users className="w-10 h-10 text-slate-200 mb-3" />
                      <p className="text-sm text-slate-400">No students enrolled in this batch</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {students.map((student, idx) => {
                        const status = attendance[student._id] || "absent"
                        return (
                          <div key={student._id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">{student.full_name}</p>
                              <p className="text-xs text-slate-400 truncate">{student.roll_number || student.email}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => toggleStatus(student._id, "present")}
                                className={cn(
                                  "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                                  status === "present"
                                    ? "bg-green-500 text-white shadow-sm scale-110"
                                    : "bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600"
                                )}
                                title="Present"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleStatus(student._id, "absent")}
                                className={cn(
                                  "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                                  status === "absent"
                                    ? "bg-red-500 text-white shadow-sm scale-110"
                                    : "bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500"
                                )}
                                title="Absent"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleStatus(student._id, "late")}
                                className={cn(
                                  "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                                  status === "late"
                                    ? "bg-amber-500 text-white shadow-sm scale-110"
                                    : "bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-600"
                                )}
                                title="Late"
                              >
                                <AlertCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Submit footer */}
                {students.length > 0 && (
                  <div className="px-4 py-4 border-t border-gray-100 bg-slate-50 flex items-center justify-between gap-4">
                    <p className="text-sm text-slate-500">
                      <span className="font-semibold text-slate-700">{students.length}</span> students •{" "}
                      <span className="text-green-600 font-medium">{presentCount} present</span>
                    </p>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || students.length === 0}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6"
                    >
                      {submitting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</>
                      ) : (
                        <><CheckCircle className="w-4 h-4 mr-2" />Submit Attendance</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          {historyLoading ? (
            <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-gray-200">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          ) : historyRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 bg-white rounded-xl border border-dashed border-gray-200 text-center p-8">
              <History className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-slate-500 font-medium">No attendance records yet</p>
              <p className="text-slate-400 text-sm mt-1">Records will appear here after you mark attendance</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Batch</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Students</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Present</th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Absent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyRecords.map((record) => {
                      const present = record.attendance_records.filter((r) => r.status === "present").length
                      const absent = record.attendance_records.filter((r) => r.status === "absent").length
                      const total = record.attendance_records.length
                      const pct = total > 0 ? Math.round((present / total) * 100) : 0
                      return (
                        <tr key={record._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 text-sm text-slate-700 font-medium">
                            {new Date(record.session_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-800">{(record.subjectId as Subject)?.name || "—"}</p>
                            <p className="text-xs text-slate-400">{(record.subjectId as Subject)?.code}</p>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">{(record.batchId as Batch)?.name || "—"}</td>
                          <td className="px-5 py-4 text-sm text-slate-500">{record.start_time} – {record.end_time}</td>
                          <td className="px-5 py-4 text-center text-sm font-semibold text-slate-800">{total}</td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center gap-1 text-green-700 text-sm font-semibold">
                              {present}
                              <span className="text-xs text-green-500 font-normal">({pct}%)</span>
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center text-sm font-semibold text-red-500">{absent}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
