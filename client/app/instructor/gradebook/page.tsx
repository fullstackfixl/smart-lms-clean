"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    GraduationCap, BookOpen, Search, ChevronDown,
    Save, Loader2, CheckCircle2, AlertCircle, Trophy, Award
} from "lucide-react"
import { getCourses } from "../../../lib/services/instructorApi"
import { toast } from "sonner"

// Inline api call for gradebook
async function fetchGradebook(courseId: string) {
    const token = typeof window !== 'undefined'
        ? window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
        : null
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/instructor/gradebook/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    return res.json()
}

async function saveMarks(data: any) {
    const token = typeof window !== 'undefined'
        ? window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
        : null
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/instructor/gradebook/marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
    })
    return res.json()
}

interface GradeEntry {
    internal_marks: number
    exam_marks: number
    total: number
    grade: string
    gpa_points: number
    credits: number
}

interface Student {
    _id: string
    name: string
    email: string
}

interface GradebookRow {
    student: Student
    record: GradeEntry
}

const GRADE_COLORS: Record<string, string> = {
    A: 'text-emerald-400 bg-emerald-500/20',
    B: 'text-blue-400 bg-blue-500/20',
    C: 'text-yellow-400 bg-yellow-500/20',
    D: 'text-orange-400 bg-orange-500/20',
    F: 'text-red-400 bg-red-500/20',
    I: 'text-slate-400 bg-slate-500/20',
}

export default function GradebookPage() {
    const [courses, setCourses] = useState<any[]>([])
    const [selectedCourse, setSelectedCourse] = useState<any>(null)
    const [gradebook, setGradebook] = useState<GradebookRow[]>([])
    const [edits, setEdits] = useState<Record<string, Partial<GradeEntry>>>({})
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState<string | null>(null)
    const [search, setSearch] = useState('')

    useEffect(() => {
        getCourses().then(r => {
            if (r.success) setCourses(r.data?.courses || r.data || [])
        })
    }, [])

    useEffect(() => {
        if (!selectedCourse) return
        setLoading(true)
        fetchGradebook(selectedCourse._id).then(r => {
            if (r.success) {
                setGradebook(r.data?.gradebook || [])
                setEdits({})
            } else {
                toast.error('Failed to load gradebook')
            }
            setLoading(false)
        })
    }, [selectedCourse])

    const handleEdit = (studentId: string, field: keyof GradeEntry, value: string) => {
        setEdits(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [field]: parseFloat(value) || 0 }
        }))
    }

    const handleSave = async (row: GradebookRow) => {
        const studentId = row.student._id
        const current = edits[studentId] || {}
        setSaving(studentId)
        try {
            const res = await saveMarks({
                studentId,
                courseId: selectedCourse._id,
                semesterId: selectedCourse.semester_id,
                internal_marks: current.internal_marks ?? row.record.internal_marks,
                exam_marks: current.exam_marks ?? row.record.exam_marks,
                credits: selectedCourse.course_credits || 3,
            })
            if (res.success) {
                toast.success(`Marks saved for ${row.student.name}`)
                // Reload gradebook
                const refresh = await fetchGradebook(selectedCourse._id)
                if (refresh.success) setGradebook(refresh.data?.gradebook || [])
                setEdits(prev => { const n = { ...prev }; delete n[studentId]; return n })
            } else {
                toast.error(res.message || 'Failed to save')
            }
        } catch {
            toast.error('Failed to save marks')
        }
        setSaving(null)
    }

    const filtered = gradebook.filter(r =>
        r.student.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.student.email?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Trophy className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                            Gradebook
                        </h1>
                    </div>
                    <p className="text-slate-400 text-sm">Enter and manage student marks for your courses</p>
                </div>
            </div>

            {/* Course Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {courses.map(course => (
                    <motion.button
                        key={course._id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCourse(course)}
                        className={`text-left p-5 rounded-2xl border transition-all ${selectedCourse?._id === course._id
                                ? 'border-orange-500/60 bg-gradient-to-br from-orange-500/10 to-amber-500/5 shadow-lg shadow-orange-500/10'
                                : 'border-slate-800/60 bg-slate-900/60 hover:border-slate-700'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <BookOpen className={`h-5 w-5 ${selectedCourse?._id === course._id ? 'text-orange-400' : 'text-slate-500'}`} />
                            <span className="text-sm font-semibold text-slate-200 truncate">{course.title}</span>
                        </div>
                        {course.course_credits && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                                    {course.course_credits} credits
                                </span>
                                {course.semester_id && (
                                    <span className="text-xs text-slate-500">Semester linked</span>
                                )}
                            </div>
                        )}
                    </motion.button>
                ))}
                {courses.length === 0 && (
                    <div className="col-span-3 text-center py-12 text-slate-500">
                        <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No courses found</p>
                    </div>
                )}
            </div>

            {/* Gradebook Table */}
            <AnimatePresence>
                {selectedCourse && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl overflow-hidden"
                    >
                        {/* Table Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-100">{selectedCourse.title}</h2>
                                <p className="text-sm text-slate-400 mt-0.5">
                                    {filtered.length} student{filtered.length !== 1 ? 's' : ''} enrolled
                                    {selectedCourse.course_credits ? ` · ${selectedCourse.course_credits} credits` : ''}
                                </p>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search students..."
                                    className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-56"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16 text-slate-500">
                                <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p>No students enrolled in this course</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-800/50">
                                            <th className="text-left px-6 py-4">Student</th>
                                            <th className="px-4 py-4 text-center">Internal (50)</th>
                                            <th className="px-4 py-4 text-center">Exam (50)</th>
                                            <th className="px-4 py-4 text-center">Total</th>
                                            <th className="px-4 py-4 text-center">Grade</th>
                                            <th className="px-4 py-4 text-center">GPA Pts</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/30">
                                        {filtered.map(row => {
                                            const edit = edits[row.student._id] || {}
                                            const internal = edit.internal_marks ?? row.record.internal_marks ?? 0
                                            const exam = edit.exam_marks ?? row.record.exam_marks ?? 0
                                            const isEdited = row.student._id in edits
                                            return (
                                                <tr key={row.student._id} className={`transition-colors ${isEdited ? 'bg-orange-500/5' : 'hover:bg-slate-800/20'}`}>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-200">{row.student.name}</p>
                                                            <p className="text-xs text-slate-500">{row.student.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={50}
                                                            value={internal}
                                                            onChange={e => handleEdit(row.student._id, 'internal_marks', e.target.value)}
                                                            className="w-20 h-9 text-center bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-orange-500/50 focus:outline-none focus:border-orange-500/50 transition-all"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={50}
                                                            value={exam}
                                                            onChange={e => handleEdit(row.student._id, 'exam_marks', e.target.value)}
                                                            className="w-20 h-9 text-center bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-orange-500/50 focus:outline-none focus:border-orange-500/50 transition-all"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-sm font-semibold text-slate-100">
                                                            {(Number(internal) + Number(exam)).toFixed(0)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${GRADE_COLORS[row.record.grade] || GRADE_COLORS.I}`}>
                                                            {row.record.grade}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="text-sm text-slate-400">{row.record.gpa_points?.toFixed(1)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {isEdited ? (
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleSave(row)}
                                                                disabled={saving === row.student._id}
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-400 disabled:opacity-50 transition-all shadow-lg shadow-orange-500/20"
                                                            >
                                                                {saving === row.student._id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Save className="h-4 w-4" />
                                                                )}
                                                                Save
                                                            </motion.button>
                                                        ) : (
                                                            <span className="flex items-center justify-end gap-1.5 text-xs text-slate-600">
                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                                Saved
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {!selectedCourse && courses.length > 0 && (
                <div className="text-center py-12 text-slate-500">
                    <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Select a course above to view and enter grades</p>
                </div>
            )}
        </div>
    )
}
