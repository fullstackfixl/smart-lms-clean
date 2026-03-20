"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  BookOpen, 
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Progress } from "../../../components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../components/ui/collapsible"
import { API_URL } from "../../../lib/api"
import { getToken } from "../../../lib/auth"

interface AttendanceRecord {
  _id: string
  subject: {
    _id: string
    name: string
    code: string
  }
  batch: {
    _id: string
    name: string
    code: string
  }
  date: string
  startTime: string
  endTime: string
  status: "present" | "absent" | "late" | "excused"
  lateMinutes: number
  notes: string
  markedBy: {
    full_name: string
  }
}

interface SubjectSummary {
  subject: {
    _id: string
    name: string
    code: string
  }
  totalClasses: number
  present: number
  absent: number
  late: number
  excused: number
  percentage: number
}

interface AttendanceData {
  attendance_records: AttendanceRecord[]
  subject_summary: SubjectSummary[]
  overall_summary: {
    totalSubjects: number
    totalClasses: number
    present: number
    absent: number
    late: number
    excused: number
    overallPercentage: number
  }
}

export default function StudentAttendancePage() {
  const [data, setData] = useState<AttendanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)  late: number
  excused: number
  overallPercentage: number
}

type TabView = "overview" | "detail"

function getPercentageColor(pct: number) {
  if (pct >= 75) return "text-green-600"
  if (pct >= 60) return "text-amber-600"
  return "text-red-500"
}

function getPercentageBg(pct: number) {
  if (pct >= 75) return "bg-green-500"
  if (pct >= 60) return "bg-amber-500"
  return "bg-red-500"
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    present: { label: "Present", cls: "bg-green-100 text-green-700 border-green-200" },
    absent:  { label: "Absent",  cls: "bg-red-50 text-red-600 border-red-200" },
    late:    { label: "Late",    cls: "bg-amber-50 text-amber-600 border-amber-200" },
    excused: { label: "Excused", cls: "bg-blue-50 text-blue-600 border-blue-200" },
    unknown: { label: "—",       cls: "bg-slate-50 text-slate-400 border-slate-200" },
  }
  const s = map[status] || map.unknown
  return (
    <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full border", s.cls)}>
      {s.label}
    </span>
  )
}

export default function StudentAttendancePage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)

  const [subjectSummaries, setSubjectSummaries] = useState<SubjectSummary[]>([])
  const [overallSummary, setOverallSummary] = useState<OverallSummary | null>(null)
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([])

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [subjectRecords, setSubjectRecords] = useState<AttendanceRecord[]>([])
  const [subjectLoading, setSubjectLoading] = useState(false)

  const fetchAttendance = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await collegeApi.getStudentAttendance(token)
      if (res.success) {
        const data = (res.data as any) || {}
        setSubjectSummaries(data.subject_summary || [])
        setOverallSummary(data.overall_summary || null)
        setAllRecords(data.attendance_records || [])
      } else {
        toast.error("Failed to load attendance")
      }
    } catch {
      toast.error("Failed to load attendance")
    } finally {
      setLoading(false)
    }
  }, [token])

  const fetchSubjectAttendance = useCallback(async (subjectId: string) => {
    if (!token) return
    setSubjectLoading(true)
    try {
      const res = await collegeApi.getStudentAttendanceBySubject(token, subjectId)
      if (res.success) {
        const data = (res.data as any) || {}
        setSubjectRecords(data.records || [])
      }
    } catch {
      toast.error("Failed to load subject attendance")
    } finally {
      setSubjectLoading(false)
    }
  }, [token])

  useEffect(() => { fetchAttendance() }, [fetchAttendance])

  function selectSubject(subjectId: string) {
    setSelectedSubjectId(subjectId)
    fetchSubjectAttendance(subjectId)
  }

  const selectedSummary = subjectSummaries.find(s => s.subject._id === selectedSubjectId)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-slate-500 font-medium">Loading your attendance records…</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My <span className="text-indigo-600">Attendance</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Subject-wise attendance tracking. Minimum 75% required.</p>
        </div>
        <Badge
          variant="outline"
          className="self-start md:self-auto px-4 py-1.5 border-amber-200 bg-amber-50 text-amber-700 font-semibold text-xs"
        >
          ⚠ 75% Attendance Required
        </Badge>
      </div>

      {/* Overall Stats */}
      {overallSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Overall %", value: `${overallSummary.overallPercentage}%`, icon: <BarChart2 className="w-5 h-5" />, color: getPercentageColor(overallSummary.overallPercentage), bg: "bg-indigo-50 text-indigo-500" },
            { label: "Total Classes", value: overallSummary.totalClasses, icon: <Calendar className="w-5 h-5" />, color: "text-slate-800", bg: "bg-slate-100 text-slate-500" },
            { label: "Present", value: overallSummary.present, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-700", bg: "bg-green-50 text-green-500" },
            { label: "Absent", value: overallSummary.absent, icon: <XCircle className="w-5 h-5" />, color: "text-red-600", bg: "bg-red-50 text-red-400" },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{card.label}</p>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", card.bg)}>
                  {card.icon}
                </div>
              </div>
              <p className={cn("text-3xl font-extrabold", card.color)}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main content: Subject list + Detail */}
      {subjectSummaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-dashed border-gray-200 text-center p-8">
          <BookOpen className="w-12 h-12 text-slate-200 mb-4" />
          <p className="text-slate-500 font-semibold">No attendance records yet</p>
          <p className="text-slate-400 text-sm mt-1">Attendance will appear here once your instructor starts marking.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Subject Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Select Subject</h2>
            {subjectSummaries.map((item) => {
              const isSelected = selectedSubjectId === item.subject._id
              const pct = item.percentage
              return (
                <button
                  key={item.subject._id}
                  onClick={() => selectSubject(item.subject._id)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all duration-200 group",
                    isSelected
                      ? "bg-indigo-600 border-indigo-500 shadow-lg"
                      : "bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-semibold text-sm truncate", isSelected ? "text-white" : "text-slate-900")}>
                        {item.subject.name}
                      </p>
                      <p className={cn("text-xs mt-0.5 font-medium", isSelected ? "text-indigo-200" : "text-slate-400")}>
                        {item.subject.code} {item.subject.credits ? `• ${item.subject.credits} cr` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={cn("text-lg font-extrabold",
                        isSelected ? "text-white" : getPercentageColor(pct)
                      )}>
                        {pct}%
                      </p>
                      <p className={cn("text-[10px] font-medium", isSelected ? "text-indigo-300" : "text-slate-400")}>
                        {item.present}/{item.totalClasses} classes
                      </p>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 shrink-0", isSelected ? "text-indigo-200" : "text-slate-300")} />
                  </div>
                  {/* Progress bar */}
                  <div className={cn("mt-3 h-1.5 rounded-full", isSelected ? "bg-indigo-500" : "bg-slate-100")}>
                    <div
                      className={cn("h-full rounded-full transition-all", isSelected ? "bg-white" : getPercentageBg(pct))}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-8">
            {!selectedSubjectId ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-white rounded-xl border border-dashed border-gray-200 text-center p-8">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen className="w-7 h-7 text-indigo-400" />
                </div>
                <p className="text-slate-600 font-semibold">Select a subject to see details</p>
                <p className="text-slate-400 text-sm mt-1">Session history will appear here</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Subject header */}
                {selectedSummary && (
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-5 text-white">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold">{selectedSummary.subject.name}</h3>
                        <p className="text-indigo-200 text-sm mt-0.5">{selectedSummary.subject.code} • {selectedSummary.batch?.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-3xl font-extrabold">{selectedSummary.percentage}%</p>
                        <p className="text-indigo-200 text-xs">{selectedSummary.present}/{selectedSummary.totalClasses} classes attended</p>
                      </div>
                    </div>
                    <Progress value={selectedSummary.percentage} className="h-2 mt-4 bg-indigo-500 [&>div]:bg-white" />
                    <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                      {[
                        { label: "Present", val: selectedSummary.present, color: "text-green-300" },
                        { label: "Absent",  val: selectedSummary.absent,  color: "text-red-300" },
                        { label: "Late",    val: selectedSummary.late,    color: "text-amber-300" },
                        { label: "Excused", val: selectedSummary.excused, color: "text-blue-300" },
                      ].map(s => (
                        <div key={s.label} className="bg-white/10 rounded-lg py-2 px-1">
                          <p className={cn("text-xl font-extrabold", s.color)}>{s.val}</p>
                          <p className="text-indigo-200 text-[10px] font-medium uppercase">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Records */}
                {subjectLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                  </div>
                ) : subjectRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center p-8">
                    <Calendar className="w-10 h-10 text-slate-200 mb-3" />
                    <p className="text-slate-400 font-medium">No session records for this subject</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-[400px]">
                    <table className="w-full">
                      <thead className="bg-slate-50 sticky top-0 border-b border-gray-100">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Topic</th>
                          <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {subjectRecords.map((record) => (
                          <tr key={record._id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-4 text-sm font-medium text-slate-800">
                              {new Date(record.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {record.startTime}–{record.endTime}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-slate-500 max-w-[140px] truncate">
                              {record.topicCovered || <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <StatusBadge status={record.status} />
                              {record.lateMinutes > 0 && (
                                <p className="text-[10px] text-amber-500 mt-0.5">{record.lateMinutes} min late</p>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
