"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    FileText, GraduationCap, Calendar, Award,
    Download, Loader2, BookOpen, TrendingUp, History
} from "lucide-react"
import { getTranscript } from "../../../lib/services/studentApi"
import { toast } from "sonner"

interface CourseRecord {
    courseId: string
    courseTitle: string
    credits: number
    grade: string
    gpaPoints: number
    total: number
}

interface SemesterTranscript {
    semesterId: string
    semesterName: string
    semesterNumber: number
    courses: CourseRecord[]
    sgpa: number
    totalCredits: number
}

interface TranscriptData {
    student: {
        name: string
        email: string
    }
    semesters: SemesterTranscript[]
    cgpa: number
    totalCredits: number
}

export default function TranscriptPage() {
    const [data, setData] = useState<TranscriptData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getTranscript().then(r => {
            if (r.success) {
                setData(r.data)
            } else {
                toast.error(r.message || "Failed to load transcript")
            }
            setLoading(false)
        })
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
        )
    }

    if (!data || data.semesters.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
                <History className="h-16 w-16 mb-4 opacity-20" />
                <h2 className="text-xl font-semibold">No Academic Records Found</h2>
                <p className="max-w-xs text-center mt-2">Your academic transcript will appear here once your instructors finalize your grades.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-12">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-100">Academic Transcript</h1>
                            <p className="text-slate-400 text-sm">Official record of your academic performance</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="px-6 py-4 rounded-2xl bg-slate-900/60 border border-slate-800/50 backdrop-blur-sm text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">CGPA</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            {data.cgpa.toFixed(2)}
                        </p>
                    </div>
                    <div className="px-6 py-4 rounded-2xl bg-slate-900/60 border border-slate-800/50 backdrop-blur-sm text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Credits</p>
                        <p className="text-3xl font-bold text-slate-100">{data.totalCredits}</p>
                    </div>
                </div>
            </div>

            {/* Semesters */}
            <div className="space-y-10">
                {data.semesters.map((sem, idx) => (
                    <motion.div
                        key={sem.semesterId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative"
                    >
                        <div className="flex items-center gap-4 mb-4 ml-2">
                            <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                                {sem.semesterNumber}
                            </div>
                            <h2 className="text-xl font-bold text-slate-200">{sem.semesterName}</h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent ml-4" />
                            <div className="text-sm font-medium text-slate-400">
                                SGPA: <span className="text-blue-400 font-bold">{sem.sgpa.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="bg-slate-900/40 rounded-3xl border border-slate-800/50 overflow-hidden backdrop-blur-sm">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800/50">
                                        <th className="px-8 py-4 font-semibold">Subject / course</th>
                                        <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">Credits</th>
                                        <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">Grade</th>
                                        <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">Grade Points</th>
                                        <th className="px-8 py-4 font-semibold text-right whitespace-nowrap">Marks (%)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/30">
                                    {sem.courses.map((course, cidx) => (
                                        <tr key={cidx} className="hover:bg-slate-800/20 transition-colors">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-slate-800/50">
                                                        <BookOpen className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-200">{course.courseTitle}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm text-slate-300">{course.credits}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${course.grade === 'A' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                        course.grade === 'B' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                            course.grade === 'C' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                                'bg-slate-800 text-slate-400'
                                                    }`}>
                                                    {course.grade}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono text-sm text-slate-400">
                                                {course.gpaPoints.toFixed(2)}
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="text-sm font-semibold text-slate-100">{course.total}%</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="bg-slate-800/20 px-8 py-4 flex justify-between items-center text-sm border-t border-slate-800/30">
                                <span className="text-slate-500">Semester Totals</span>
                                <div className="flex gap-8">
                                    <span className="text-slate-400">Credits Earned: <span className="text-slate-100 font-semibold">{sem.totalCredits}</span></span>
                                    <span className="text-slate-400">Semester GPA: <span className="text-blue-400 font-bold">{sem.sgpa.toFixed(2)}</span></span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Footer Info */}
            <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
                <Award className="h-6 w-6 text-blue-400 flex-shrink-0" />
                <div>
                    <h3 className="text-sm font-semibold text-blue-300">Degree Progress Information</h3>
                    <p className="text-xs text-blue-200/60 mt-1 leading-relaxed">
                        This transcript reflects all credits earned towards your degree. CGPA is calculated based on the weighted average of grade points across all completed semesters. Contact the registrar's office for official hardcopies or verification.
                    </p>
                </div>
            </div>
        </div>
    )
}
