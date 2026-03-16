"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    FileText, GraduationCap, Calendar, Award,
    Download, Loader2, BookOpen, TrendingUp, History
} from "lucide-react"
import { useAuth } from '../../../lib/auth-context'
import { collegeApi } from '../../../lib/api'
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
    const { user, token } = useAuth()
    const [data, setData] = useState<TranscriptData | null>(null)
    const [loading, setLoading] = useState(true)

    const isCollege = String(user?.organizationType || '').toUpperCase() === 'COLLEGE'

    useEffect(() => {
        loadTranscript()
    }, [token])

    async function loadTranscript() {
        if (!token) return
        setLoading(true)
        try {
            let response
            if (isCollege) {
                // For college students, use grades endpoint to build transcript
                const gradesRes = await collegeApi.getStudentGrades(token)
                if (gradesRes.success) {
                    const payload: any = gradesRes.data || {}
                    const grades = payload.grades || []
                    // Transform grades into transcript format
                    const semestersMap = new Map()
                    grades.forEach((g: any) => {
                        const sem = g.semester || 1
                        if (!semestersMap.has(sem)) {
                            semestersMap.set(sem, {
                                semesterId: `sem-${sem}`,
                                semesterName: `Semester ${sem}`,
                                semesterNumber: sem,
                                courses: [],
                                sgpa: 0,
                                totalCredits: 0
                            })
                        }
                        const semData = semestersMap.get(sem)
                        semData.courses.push({
                            courseId: g.course_id?._id || g._id,
                            courseTitle: g.course_id?.title || g.subjectId?.name || 'Unknown',
                            credits: g.credits || 0,
                            grade: g.grade || 'N/A',
                            gpaPoints: calculateGPAPoints(g.grade),
                            total: g.marks || 0
                        })
                        semData.totalCredits += (g.credits || 0)
                    })
                    
                    const semesters = Array.from(semestersMap.values())
                    // Calculate SGPA for each semester
                    semesters.forEach((sem: any) => {
                        if (sem.courses.length > 0) {
                            const totalPoints = sem.courses.reduce((acc: number, c: any) => 
                                acc + (c.gpaPoints * c.credits), 0)
                            sem.sgpa = sem.totalCredits > 0 ? (totalPoints / sem.totalCredits) : 0
                        }
                    })
                    
                    // Calculate CGPA
                    const totalCredits = semesters.reduce((acc: number, s: any) => acc + s.totalCredits, 0)
                    const totalPoints = semesters.reduce((acc: number, s: any) => 
                        acc + (s.sgpa * s.totalCredits), 0)
                    const cgpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0
                    
                    response = {
                        success: true,
                        data: {
                            student: {
                                name: user?.profile?.firstName || user?.name || 'Student',
                                email: user?.email || ''
                            },
                            semesters,
                            cgpa,
                            totalCredits
                        }
                    }
                } else {
                    response = { success: false, message: gradesRes.error || 'Failed to load grades' }
                }
            } else {
                response = await getTranscript()
            }
            
            if (response.success) {
                setData(response.data)
            } else {
                toast.error(response.message || "Failed to load transcript")
            }
        } catch (err) {
            toast.error("Failed to load transcript")
        } finally {
            setLoading(false)
        }
    }

    function calculateGPAPoints(grade: string): number {
        const points: Record<string, number> = {
            'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'F': 0
        }
        return points[grade?.toUpperCase()] || 0
    }

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
                            <h1 className="text-3xl font-bold text-slate-900">Academic Transcript</h1>
                            <p className="text-slate-600 text-sm">Official record of your academic performance</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="px-6 py-4 rounded-2xl bg-white border border-gray-200 shadow-sm text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">CGPA</p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            {data.cgpa.toFixed(2)}
                        </p>
                    </div>
                    <div className="px-6 py-4 rounded-2xl bg-white border border-gray-200 shadow-sm text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Credits</p>
                        <p className="text-3xl font-bold text-slate-900">{data.totalCredits}</p>
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
                            <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                {sem.semesterNumber}
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">{sem.semesterName}</h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-4" />
                            <div className="text-sm font-medium text-slate-600">
                                SGPA: <span className="text-blue-600 font-bold">{sem.sgpa.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs text-slate-600 uppercase tracking-wider border-b border-gray-200 bg-slate-50">
                                        <th className="px-8 py-4 font-semibold">Subject / course</th>
                                        <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">Credits</th>
                                        <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">Grade</th>
                                        <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">Grade Points</th>
                                        <th className="px-8 py-4 font-semibold text-right whitespace-nowrap">Marks (%)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sem.courses.map((course, cidx) => (
                                        <tr key={cidx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-slate-100">
                                                        <BookOpen className="h-4 w-4 text-slate-600" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-900">{course.courseTitle}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm text-slate-700">{course.credits}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold ${course.grade === 'A' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                        course.grade === 'B' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                                            course.grade === 'C' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                                'bg-slate-100 text-slate-600 border border-slate-200'
                                                    }`}>
                                                    {course.grade}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono text-sm text-slate-600">
                                                {course.gpaPoints.toFixed(2)}
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="text-sm font-semibold text-slate-900">{course.total}%</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="bg-slate-50 px-8 py-4 flex justify-between items-center text-sm border-t border-gray-200">
                                <span className="text-slate-600">Semester Totals</span>
                                <div className="flex gap-8">
                                    <span className="text-slate-600">Credits Earned: <span className="text-slate-900 font-semibold">{sem.totalCredits}</span></span>
                                    <span className="text-slate-600">Semester GPA: <span className="text-blue-600 font-bold">{sem.sgpa.toFixed(2)}</span></span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Footer Info */}
            <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-4">
                <Award className="h-6 w-6 text-blue-600 flex-shrink-0" />
                <div>
                    <h3 className="text-sm font-semibold text-blue-900">Degree Progress Information</h3>
                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                        This transcript reflects all credits earned towards your degree. CGPA is calculated based on the weighted average of grade points across all completed semesters. Contact the registrar's office for official hardcopies or verification.
                    </p>
                </div>
            </div>
        </div>
    )
}
