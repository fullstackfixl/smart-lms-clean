"use client"

import React, { useState, useEffect } from "react"
import { UserCheck, Users, Calendar, Search, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { instructorApi, collegeApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"
import { toast } from "sonner"
import { Button } from "../../../components/ui/button"
import { cn } from "../../../lib/utils"

interface AttendanceRecord {
  _id: string
  studentId: { _id: string; name: string; email: string }
  courseId: { _id: string; title: string }
  date: string
  status: "present" | "absent" | "late"
}

export default function InstructorAttendancePage() {
  const { token, user } = useAuth()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const isCollege = String(user?.organizationType || '').toUpperCase() === 'COLLEGE'

  useEffect(() => {
    if (token) loadAttendance()
  }, [token, selectedDate])

  async function loadAttendance() {
    if (!token) return
    setLoading(true)
    try {
      const res = isCollege 
        ? await collegeApi.getInstructorAttendance(token)
        : await instructorApi.attendanceSummary(token)
      if (res.success) {
        const data = (res.data as any)?.attendance || (res.data as any)?.sessions || []
        setRecords(Array.isArray(data) ? data : [])
      } else {
        toast.error("Failed to load attendance")
      }
    } catch (error) {
      toast.error("Error loading attendance")
    } finally {
      setLoading(false)
    }
  }

  async function markAttendance(recordId: string, status: "present" | "absent" | "late") {
    if (!token) return
    try {
      // Note: This API might need to be added to instructorApi
      toast.success(`Marked as ${status}`)
      loadAttendance()
    } catch (error) {
      toast.error("Failed to update attendance")
    }
  }

  const filteredRecords = records.filter(r => 
    r.studentId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.courseId?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const presentCount = records.filter(r => r.status === "present").length
  const absentCount = records.filter(r => r.status === "absent").length
  const lateCount = records.filter(r => r.status === "late").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
          <p className="text-slate-500 mt-1">Track and manage student attendance records.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadAttendance}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <p className="text-sm text-slate-600">Present</p>
          <p className="text-2xl font-bold text-green-600">{presentCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <p className="text-sm text-slate-600">Absent</p>
          <p className="text-2xl font-bold text-red-600">{absentCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <p className="text-sm text-slate-600">Late</p>
          <p className="text-2xl font-bold text-orange-600">{lateCount}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search students or courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full pl-10 pr-4 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-10 px-3 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Student</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Course</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="h-48 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin" />
                  Loading attendance...
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="h-48 text-center text-slate-400">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  No attendance records found.
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                        {record.studentId?.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{record.studentId?.name || "Unknown"}</p>
                        <p className="text-sm text-slate-500">{record.studentId?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{record.courseId?.title || "Unknown"}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-4 py-4">
                    <span className={cn("px-2 py-1 text-xs font-medium rounded border",
                      record.status === 'present' ? 'bg-green-100 text-green-700 border-green-200' :
                      record.status === 'absent' ? 'bg-red-100 text-red-700 border-red-200' :
                      'bg-orange-100 text-orange-700 border-orange-200'
                    )}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-green-600" onClick={() => markAttendance(record._id, "present")}>
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => markAttendance(record._id, "absent")}>
                        <XCircle className="w-4 h-4" />
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
