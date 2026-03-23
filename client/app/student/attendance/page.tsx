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
import { useAuth } from "../../../lib/auth-context"
import { collegeApi } from "../../../lib/api"

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
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null)
  const { token, user } = useAuth()

  useEffect(() => {
    fetchAttendance()
  }, [])

  const fetchAttendance = async () => {
    if (!token) return

    try {
      const isCollege = String(user?.organizationType || '').toUpperCase() === 'COLLEGE'
      if (!isCollege) {
        toast.error('Attendance view is only available for college tenant currently')
        return
      }

      const res = await collegeApi.getStudentAttendance(token)
      if (res.success) {
        setData(res.data as any)
      } else {
        toast.error((res as any).message || 'Failed to load attendance')
      }
    } catch (error) {
      toast.error('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-emerald-100 text-emerald-700 border-emerald-300"
      case "absent": return "bg-rose-100 text-rose-700 border-rose-300"
      case "late": return "bg-amber-100 text-amber-700 border-amber-300"
      case "excused": return "bg-blue-100 text-blue-700 border-blue-300"
      default: return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present": return <CheckCircle className="w-4 h-4" />
      case "absent": return <XCircle className="w-4 h-4" />
      case "late": return <Clock className="w-4 h-4" />
      default: return null
    }
  }

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return "text-emerald-600"
    if (percentage >= 60) return "text-amber-600"
    return "text-rose-600"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const summary = data?.overall_summary

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Attendance</h1>
        <p className="text-slate-500 mt-1">View your attendance records across all subjects</p>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Overall Attendance</p>
                  <p className={`text-3xl font-bold ${getAttendanceColor(summary.overallPercentage)}`}>
                    {summary.overallPercentage}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
              <Progress value={summary.overallPercentage} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 font-medium">Present</p>
                  <p className="text-3xl font-bold text-emerald-700">{summary.present}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-rose-50 border-rose-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-rose-600 font-medium">Absent</p>
                  <p className="text-3xl font-bold text-rose-700">{summary.absent}</p>
                </div>
                <XCircle className="w-8 h-8 text-rose-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 font-medium">Late</p>
                  <p className="text-3xl font-bold text-amber-700">{summary.late}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {summary && summary.overallPercentage < 75 && (
        <Card className="bg-rose-50 border-rose-200">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
            <div>
              <p className="font-medium text-rose-800">Low Attendance Warning</p>
              <p className="text-sm text-rose-600">
                Your attendance is below 75%. Please attend classes regularly.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-500" />
          Subject-wise Attendance
        </h2>

        {data?.subject_summary.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No attendance records found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {data?.subject_summary.map((subject) => (
              <Collapsible
                key={subject.subject._id}
                open={expandedSubject === subject.subject._id}
                onOpenChange={() => setExpandedSubject(
                  expandedSubject === subject.subject._id ? null : subject.subject._id
                )}
              >
                <Card className={subject.percentage < 75 ? "border-rose-200" : ""}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{subject.subject.name}</CardTitle>
                            <p className="text-sm text-slate-500">{subject.subject.code}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${getAttendanceColor(subject.percentage)}`}>
                              {subject.percentage}%
                            </p>
                            <p className="text-xs text-slate-500">
                              {subject.present + subject.late}/{subject.totalClasses} classes
                            </p>
                          </div>
                          {expandedSubject === subject.subject._id ? (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500" style={{ width: `${(subject.present / subject.totalClasses) * 100}%` }} />
                          <div className="bg-amber-500" style={{ width: `${(subject.late / subject.totalClasses) * 100}%` }} />
                          <div className="bg-rose-500" style={{ width: `${(subject.absent / subject.totalClasses) * 100}%` }} />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="border-t border-slate-100 pt-4 mt-2">
                        <h4 className="text-sm font-medium text-slate-700 mb-3">Class History</h4>
                        <div className="space-y-2">
                          {data?.attendance_records
                            .filter(record => record.subject._id === subject.subject._id)
                            .map(record => (
                              <div key={record._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Badge className={getStatusColor(record.status)}>
                                    {getStatusIcon(record.status)}
                                    <span className="ml-1 capitalize">{record.status}</span>
                                  </Badge>
                                  <div>
                                    <p className="text-sm font-medium text-slate-700">{formatDate(record.date)}</p>
                                    <p className="text-xs text-slate-500">{record.startTime} - {record.endTime}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
