"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GraduationCap, Calendar, FileText, Search, Plus, Filter, Download, Loader2, Edit2, Trash2 } from "lucide-react"
import { gradeApi, getCourses } from '../../../lib/services/orgAdminApi'
import { DataTable, DataTableColumn } from '../../../components/instructor/data-table'
import { toast } from "sonner"
import { format } from "date-fns"

export default function ExamsPage() {
    const [courses, setCourses] = useState<any[]>([])
    const [selectedCourse, setSelectedCourse] = useState<string>("")
    const [grades, setGrades] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadCourses()
    }, [])

    useEffect(() => {
        if (selectedCourse) {
            loadGrades()
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
        }
    }

    async function loadGrades() {
        setLoading(true)
        try {
            const response = await gradeApi.getCourseGrades(selectedCourse)
            if (response.success) {
                setGrades(response.data.grades)
            }
        } catch (error) {
            toast.error("Failed to load exam data")
        } finally {
            setLoading(false)
        }
    }

    const columns: DataTableColumn<any>[] = [
        {
            key: "student_id",
            label: "Student",
            render: (val) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400">
                        {val?.profile?.fullName?.[0] || "?"}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-200">{val?.profile?.fullName || "Unknown"}</p>
                        <p className="text-[10px] text-slate-500">{val?.email}</p>
                    </div>
                </div>
            )
        },
        { key: "assignment_title", label: "Exam/Assignment", sortable: true },
        {
            key: "assignment_type",
            label: "Type",
            render: (val) => (
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {val}
                </span>
            )
        },
        {
            key: "earned_score",
            label: "Result",
            render: (val, row) => (
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-200">{val} / {row.max_score}</span>
                    <div className="w-24 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div
                            className={`h-full ${row.percentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${row.percentage}%` }}
                        />
                    </div>
                </div>
            )
        },
        {
            key: "graded_date",
            label: "Date",
            render: (val) => val ? format(new Date(val), "MMM dd, yyyy") : "N/A"
        }
    ]

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-200 bg-clip-text text-transparent mb-2">
                        Exams & Assessments
                    </h1>
                    <p className="text-slate-400">Manage institutional exams, schedules, and grading</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="h-12 px-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                    >
                        {courses.map(course => (
                            <option key={course._id} value={course._id}>{course.title}</option>
                        ))}
                    </select>
                    <button className="h-12 px-6 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center gap-2">
                        <Plus className="w-5 h-5" /> New Exam
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ExamStatCard title="Total Exams" value={new Set(grades.map(g => g.assignment_title)).size} icon={FileText} color="indigo" />
                <ExamStatCard title="Avg. Score" value={`${Math.round(grades.reduce((acc, g) => acc + g.percentage, 0) / (grades.length || 1))}%`} icon={GraduationCap} color="emerald" />
                <ExamStatCard title="Pending Review" value={0} icon={Calendar} color="amber" />
                <ExamStatCard title="Students Graded" value={new Set(grades.map(g => g.student_id?._id)).size} icon={GraduationCap} color="blue" />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <h3 className="text-xl font-bold text-slate-100 italic">Exam Performance Records</h3>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-indigo-400 bg-slate-800 rounded-lg border border-slate-700">
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-500 w-10 h-10" /></div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={grades}
                        actions={(row) => (
                            <div className="flex gap-2">
                                <button className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                <button className="p-2 text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        )}
                    />
                )}
            </div>
        </div>
    )
}

function ExamStatCard({ title, value, icon: Icon, color }: any) {
    const colorMap: any = {
        indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    }
    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl group hover:border-indigo-500/30 transition-all shadow-xl">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border ${colorMap[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500 group-hover:text-slate-400 transition-colors">{title}</p>
            <h3 className="text-3xl font-black text-slate-100 mt-1">{value}</h3>
        </div>
    )
}
