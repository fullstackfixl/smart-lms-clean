"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
    Calendar, Clock, CheckCircle, XCircle,
    Loader2, BookOpen, TrendingUp, ChevronRight,
    Monitor, Info, RefreshCw
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Progress } from "../../../components/ui/progress"
import { toast } from "sonner"
import { API_URL } from "../../../lib/config"
import { useAuth } from "../../../lib/auth-context"
import { collegeApi } from "../../../lib/api"
import Link from "next/link"

export default function StudentAttendancePage() {
    const { user, token } = useAuth()
    const [courses, setCourses] = useState<any[]>([])
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
    const [attendanceData, setAttendanceData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [loadingDetails, setLoadingDetails] = useState(false)

    const isCollege = String(user?.organizationType || '').toUpperCase() === 'COLLEGE'

    const fetchCourses = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try {
            if (isCollege) {
                const res = await collegeApi.getStudentCourses(token)
                if (res.success) {
                    const payload: any = res.data || {}
                    const enrolledCourses = payload?.courses || payload || []
                    setCourses(enrolledCourses)
                    if (enrolledCourses.length > 0) {
                        const firstId = enrolledCourses[0].course?._id || enrolledCourses[0]._id
                        setSelectedCourseId(firstId)
                        fetchAttendance(firstId)
                    }
                }
            } else {
                const r = await fetch(`${API_URL}/api/courses/my-courses`, {
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: "include"
                })
                const data = await r.json()
                if (data.success) {
                    const enrolledCourses = data.data?.courses || data.data || []
                    setCourses(enrolledCourses)
                    if (enrolledCourses.length > 0) {
                        const firstId = enrolledCourses[0].course?._id || enrolledCourses[0]._id
                        setSelectedCourseId(firstId)
                        fetchAttendance(firstId)
                    }
                }
            }
        } catch {
            toast.error("Failed to load courses")
        } finally {
            setLoading(false)
        }
    }, [token, isCollege])

    const fetchAttendance = async (courseId: string) => {
        if (!token) return
        setLoadingDetails(true)
        try {
            if (isCollege) {
                const res = await collegeApi.getStudentAttendance(token)
                if (res.success) {
                    setAttendanceData(res.data)
                }
            } else {
                const r = await fetch(`${API_URL}/attendance/student/course/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: "include"
                })
                const data = await r.json()
                if (data.success) {
                    setAttendanceData(data.data)
                }
            }
        } catch {
            toast.error("Failed to load attendance summary")
        } finally {
            setLoadingDetails(false)
        }
    }

    useEffect(() => {
        fetchCourses()
    }, [fetchCourses])

    useEffect(() => {
        if (selectedCourseId) {
            fetchAttendance(selectedCourseId)
        }
    }, [selectedCourseId])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#4CAF50]" />
                <p className="text-slate-500 font-medium">Fetching your attendance records...</p>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        My <span className="text-[#4CAF50]">Attendance</span>
                    </h1>
                    <p className="text-slate-500 mt-1">Track your participation in live sessions</p>
                </div>

                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="px-3 py-1 border-blue-100 bg-blue-50 text-blue-700 font-bold gap-2">
                        <Info className="h-3.5 w-3.5" /> 60% Attendance Required
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Course Sidebar */}
                <div className="lg:col-span-4 space-y-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-2">Select Course</h2>
                    <div className="space-y-2">
                        {courses.map((item) => {
                            const course = item.course || item
                            const isSelected = selectedCourseId === course._id
                            return (
                                <button
                                    key={course._id}
                                    onClick={() => setSelectedCourseId(course._id)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${isSelected
                                            ? "bg-[#4CAF50] border-[#4CAF50] shadow-lg shadow-green-100 ring-2 ring-green-100"
                                            : "bg-white border-slate-100 hover:border-green-200 hover:bg-green-50/50"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-green-50 text-[#4CAF50] group-hover:bg-green-100"
                                            }`}>
                                            <BookOpen className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-bold text-sm truncate ${isSelected ? "text-white" : "text-slate-900"}`}>
                                                {course.title}
                                            </p>
                                            <p className={`text-[10px] font-semibold uppercase tracking-wider ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                                                {course.courseCode || "Live Sessions"}
                                            </p>
                                        </div>
                                        <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isSelected ? "text-white translate-x-1" : "text-slate-300"
                                            }`} />
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Attendance Content */}
                <div className="lg:col-span-8 space-y-6">
                    {loadingDetails ? (
                        <div className="bg-white rounded-3xl p-12 border border-slate-100 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-[#4CAF50]" />
                            <p className="text-slate-400 font-medium">Loading session history...</p>
                        </div>
                    ) : attendanceData ? (
                        <>
                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="border-0 shadow-lg shadow-slate-100 rounded-3xl overflow-hidden bg-gradient-to-br from-white to-slate-50/50">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center">
                                                <Monitor className="h-5 w-5 text-[#4CAF50]" />
                                            </div>
                                            <Badge className="bg-green-100 text-green-700 border-green-200">
                                                {attendanceData.summary.presentCount}/{attendanceData.summary.totalClasses}
                                            </Badge>
                                        </div>
                                        <p className="text-3xl font-extrabold text-slate-900">{attendanceData.summary.attendancePercentage}%</p>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Average Attendance</p>
                                        <Progress value={attendanceData.summary.attendancePercentage} className="h-1.5 mt-4 bg-slate-100" />
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-lg shadow-slate-100 rounded-3xl overflow-hidden bg-gradient-to-br from-white to-slate-50/50">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                                <CheckCircle className="h-5 w-5 text-blue-500" />
                                            </div>
                                        </div>
                                        <p className="text-3xl font-extrabold text-slate-900">{attendanceData.summary.presentCount}</p>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Sessions Present</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-0 shadow-lg shadow-slate-100 rounded-3xl overflow-hidden bg-gradient-to-br from-white to-slate-50/50">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center">
                                                <TrendingUp className="h-5 w-5 text-orange-500" />
                                            </div>
                                        </div>
                                        <p className="text-3xl font-extrabold text-slate-900">{attendanceData.summary.totalClasses}</p>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Total Classes</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* History Table */}
                            <Card className="border-0 shadow-xl shadow-slate-100 rounded-3xl overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-[#4CAF50]" />
                                        Sessions History
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/30 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">SESSIONS DETAILS</th>
                                                <th className="px-6 py-4">TIME SPENT</th>
                                                <th className="px-6 py-4">STATUS</th>
                                                <th className="px-6 py-4 text-right">JOIN TIME</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {attendanceData.records.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-20 text-center">
                                                        <div className="h-16 w-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                                            <Calendar className="h-8 w-8 text-slate-200" />
                                                        </div>
                                                        <p className="text-slate-400 font-medium">No sessions attended yet for this course.</p>
                                                        <Link href="/student/live-classes">
                                                            <Button variant="link" className="text-[#4CAF50] mt-2">Join a Live Class</Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ) : (
                                                attendanceData.records.map((record: any) => (
                                                    <tr key={record._id} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-6 py-5">
                                                            <p className="font-bold text-slate-900 text-sm">{record.classId?.title}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Calendar className="h-3 w-3 text-slate-400" />
                                                                <span className="text-[11px] text-slate-500">
                                                                    {new Date(record.classId?.scheduled_date || record.date).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                                <span className="font-bold text-sm text-slate-700">{record.duration} min</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            {record.status === 'present' ? (
                                                                <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                                                    Present
                                                                </Badge>
                                                            ) : (
                                                                <Badge className="bg-red-50 text-red-600 border-red-100 hover:bg-red-50 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                                                                    Absent
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            <p className="text-xs font-bold text-slate-800">
                                                                {new Date(record.joinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400">Join Time</p>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center">
                            <p className="text-slate-400">Select a course to view your attendance history.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
