"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Users, CheckCircle2, XCircle, AlertTriangle,
    Loader2, Filter, Search, BookOpen, Percent
} from "lucide-react"
import { getAcademicAttendance } from "../../../lib/services/studentApi"
import { toast } from "sonner"

interface AttendanceItem {
    _id: string
    courseTitle: string
    total: number
    present: number
    percentage: number
}

export default function StudentAttendancePage() {
    const [attendance, setAttendance] = useState<AttendanceItem[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        getAcademicAttendance().then(r => {
            if (r.success) {
                setAttendance(r.data?.attendance || [])
            } else {
                toast.error("Failed to load attendance records")
            }
            setLoading(false)
        })
    }, [])

    const filtered = attendance.filter(a =>
        a.courseTitle.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-100">Attendance Tracker</h1>
                    </div>
                    <p className="text-slate-400 text-sm">Monitor your attendance performance across all enrolled courses</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search courses..."
                        className="pl-9 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-sm text-slate-200 w-full md:w-64 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Requirement</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-200">75%</span>
                        <span className="text-sm text-slate-500">Minimum</span>
                    </div>
                </div>
                <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Status</p>
                    <div className="flex items-center gap-2">
                        {attendance.some(a => a.percentage < 75) ? (
                            <>
                                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-lg font-semibold text-red-400">Action Required</span>
                            </>
                        ) : (
                            <>
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-lg font-semibold text-emerald-400">All Good</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Total Sessions</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-200">
                            {attendance.reduce((acc, curr) => acc + curr.total, 0)}
                        </span>
                        <span className="text-sm text-slate-500">Recorded</span>
                    </div>
                </div>
            </div>

            {/* Course List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filtered.map((item, idx) => (
                    <motion.div
                        key={item._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-6 rounded-3xl border transition-all ${item.percentage < 75
                            ? "bg-red-500/5 border-red-500/20 shadow-lg shadow-red-500/5"
                            : "bg-slate-900/40 border-slate-800/50 hover:border-slate-700 hover:bg-slate-900/60"
                            }`}
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex gap-4">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${item.percentage < 75 ? "bg-red-500/20" : "bg-indigo-500/10"
                                    }`}>
                                    <BookOpen className={`h-6 w-6 ${item.percentage < 75 ? "text-red-400" : "text-indigo-400"}`} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-100">{item.courseTitle}</h3>
                                    <p className="text-xs text-slate-500">{item.total} total sessions conducted</p>
                                </div>
                            </div>
                            <div className={`text-2xl font-black ${item.percentage < 75 ? "text-red-500" : "text-emerald-500"}`}>
                                {item.percentage.toFixed(0)}%
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-6">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.percentage}%` }}
                                className={`absolute top-0 left-0 h-full rounded-full ${item.percentage < 75 ? "bg-red-500" : "bg-emerald-500"
                                    }`}
                            />
                        </div>

                        {/* Detailed Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Present</p>
                                    <p className="text-sm font-bold text-slate-200">{item.present}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Absent</p>
                                    <p className="text-sm font-bold text-slate-200">{item.total - item.present}</p>
                                </div>
                            </div>
                        </div>

                        {item.percentage < 75 && (
                            <div className="mt-6 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <p className="text-xs font-medium text-red-400">Attendance low. Please attend upcoming sessions.</p>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {attendance.length === 0 && (
                <div className="text-center py-24">
                    <Percent className="h-16 w-16 mx-auto mb-4 text-slate-800" />
                    <p className="text-slate-500">No attendance records found yet.</p>
                </div>
            )}
        </div>
    )
}
