"use client"
 
import { useState, useEffect, Suspense } from "react"
import {
    GraduationCap, 
    BookOpen, 
    Search, 
    ChevronDown,
    Save, 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    Trophy, 
    Award,
    Star,
    Zap,
    Filter,
    ArrowUpRight,
    CheckCircle,
    MoreVertical
} from "lucide-react"
import { instructorApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"
import { toast } from "sonner"
import { Button } from "../../../components/ui/button"
import { 
  SimpleCard, 
  SimpleBadge,
  FlatTable,
  FlatTableHead,
  FlatTableRow,
  FlatTableCell 
} from '../../../components/platform/ui-standard'
import { Badge } from "../../../components/ui/badge"
import { cn } from "../../../lib/utils"
 
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
 
const GRADE_THEMES: Record<string, { bg: string; text: string; border: string }> = {
    A: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
    B: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
    C: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
    D: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' },
    F: { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20' },
    I: { bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-500/20' },
}
 
function GradebookContent() {
    const { token } = useAuth()
    const [courses, setCourses] = useState<any[]>([])
    const [selectedCourse, setSelectedCourse] = useState<any>(null)
    const [gradebook, setGradebook] = useState<GradebookRow[]>([])
    const [edits, setEdits] = useState<Record<string, Partial<GradeEntry>>>({})
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState<string | null>(null)
    const [search, setSearch] = useState('')
 
    useEffect(() => {
        if (token) {
            loadCourses()
        }
    }, [token])
 
    async function loadCourses() {
        try {
            const r = await instructorApi.listCourses(token!, "limit=100")
            if (r.success) setCourses((r.data as any).courses || [])
        } catch (error) {
            toast.error("Failed to load course registry")
        }
    }
 
    useEffect(() => {
        if (!selectedCourse || !token) return
        setLoading(true)
        instructorApi.getGradebook(token, selectedCourse._id).then(r => {
            if (r.success) {
                setGradebook((r.data as any)?.gradebook || [])
                setEdits({})
            } else {
                toast.error('Failed to synchronize gradebook')
            }
            setLoading(false)
        }).catch(() => {
            toast.error('Gradebook link severed')
            setLoading(false)
        })
    }, [selectedCourse, token])
 
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
            const res = await instructorApi.updateMarks(token!, {
                studentId,
                courseId: selectedCourse._id,
                semesterId: selectedCourse.semester_id,
                internal_marks: current.internal_marks ?? row.record.internal_marks,
                exam_marks: current.exam_marks ?? row.record.exam_marks,
                credits: selectedCourse.course_credits || 3,
            })
            if (res.success) {
                toast.success(`Identity ${row.student.name} synchronized`)
                const refresh = await instructorApi.getGradebook(token!, selectedCourse._id)
                if (refresh.success) setGradebook((refresh.data as any)?.gradebook || [])
                setEdits(prev => { const n = { ...prev }; delete n[studentId]; return n })
            } else {
                toast.error(res.message || 'Synchronization failure')
            }
        } catch {
            toast.error('Grade synchronization failed')
        }
        setSaving(null)
    }
 
    const filtered = gradebook.filter(r =>
        r.student.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.student.email?.toLowerCase().includes(search.toLowerCase())
    )
 
    return (
        <div className="space-y-10 pb-20">
            {/* ─── Page Header ────────────────────────────────────────────── */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl" />
                <div className="relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100">
                        <Award className="w-3.5 h-3.5" />
                        Academic Records
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Gradebook</h1>
                    <p className="text-sm text-slate-500 font-medium italic">Manage student marks and academic performance across your courses.</p>
                </div>
                
                <div className="relative z-10 flex items-center gap-4">
                    <div className="flex items-center gap-8 bg-slate-50/50 px-8 py-4 rounded-[2rem] border border-slate-100 backdrop-blur-sm">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">GPA Scale</p>
                            <p className="text-2xl font-black text-slate-900">4.0</p>
                        </div>
                        <div className="h-10 w-[1px] bg-slate-200" />
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Apex Tier</p>
                            <p className="text-2xl font-black text-blue-600">A+</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Course Selection ─── */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Select Course</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {courses.map(course => (
                        <button
                            key={course._id}
                            onClick={() => setSelectedCourse(course)}
                            className={cn(
                                "group relative overflow-hidden text-left p-8 rounded-[2rem] border transition-all duration-500",
                                selectedCourse?._id === course._id
                                    ? "border-blue-500 bg-blue-50/30 shadow-xl shadow-blue-500/5 translate-y-[-4px]"
                                    : "border-slate-100 bg-white hover:border-blue-200 shadow-sm"
                            )}
                        >
                            <div className="space-y-6">
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                    selectedCourse?._id === course._id ? "bg-blue-600 text-white rotate-12" : "bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:rotate-6"
                                )}>
                                    <BookOpen className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 leading-tight truncate mb-2">{course.title}</h3>
                                    <SimpleBadge className="bg-slate-100 text-slate-600 border-none font-black tracking-widest">
                                        {course.course_credits || 3} CREDITS
                                    </SimpleBadge>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Gradebook Matrix ─── */}
            {selectedCourse ? (
                <SimpleCard className="p-0 overflow-hidden border-slate-100 shadow-sm rounded-[2.5rem]">
                    <div className="p-10 border-b border-slate-50 bg-white flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/20">
                                <Award className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 leading-none mb-2">{selectedCourse.title}</h2>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">
                                    // Viewing {filtered.length} Students
                                </p>
                            </div>
                        </div>
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search student name or email..."
                                className="h-14 w-full pl-12 pr-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all font-bold placeholder:font-medium"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-6">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Loading Gradebook...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <FlatTable>
                                <FlatTableHead>
                                    <FlatTableRow className="bg-slate-50/50">
                                        <FlatTableCell className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] py-6 pl-10">Student</FlatTableCell>
                                        <FlatTableCell className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] py-6 text-center pr-4">Internal (50)</FlatTableCell>
                                        <FlatTableCell className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] py-6 text-center pr-4">Exam (50)</FlatTableCell>
                                        <FlatTableCell className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] py-6 text-center pr-4">Total</FlatTableCell>
                                        <FlatTableCell className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] py-6 text-center pr-4">Grade</FlatTableCell>
                                        <FlatTableCell className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] py-6 text-center pr-4">GPA</FlatTableCell>
                                        <FlatTableCell className="font-black text-slate-500 text-[10px] uppercase tracking-[0.2em] py-6 text-right pr-10">Actions</FlatTableCell>
                                    </FlatTableRow>
                                </FlatTableHead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <FlatTableRow>
                                            <FlatTableCell colSpan={7} className="h-64 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400 italic font-bold">
                                                    <GraduationCap className="w-12 h-12 mb-4 opacity-10" />
                                                    No students found for this course.
                                                </div>
                                            </FlatTableCell>
                                        </FlatTableRow>
                                    ) : (
                                        filtered.map(row => {
                                            const edit = edits[row.student._id] || {}
                                            const internal = edit.internal_marks ?? row.record.internal_marks ?? 0
                                            const exam = edit.exam_marks ?? row.record.exam_marks ?? 0
                                            const isEdited = row.student._id in edits
                                            
                                            return (
                                                <FlatTableRow key={row.student._id} className={cn("group transition-all", isEdited && "bg-blue-50/30")}>
                                                    <FlatTableCell className="py-8 pl-10">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">
                                                                {row.student.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-900 leading-none mb-1.5">{row.student.name}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{row.student.email}</p>
                                                            </div>
                                                        </div>
                                                    </FlatTableCell>
                                                    <FlatTableCell className="text-center">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={50}
                                                            value={internal}
                                                            onChange={e => handleEdit(row.student._id, 'internal_marks', e.target.value)}
                                                            className="w-20 h-10 text-center bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-sm font-black focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 tabular-nums transition-all"
                                                        />
                                                    </FlatTableCell>
                                                    <FlatTableCell className="text-center">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={50}
                                                            value={exam}
                                                            onChange={e => handleEdit(row.student._id, 'exam_marks', e.target.value)}
                                                            className="w-20 h-10 text-center bg-slate-50 border border-slate-100 rounded-xl text-slate-900 text-sm font-black focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 tabular-nums transition-all"
                                                        />
                                                    </FlatTableCell>
                                                    <FlatTableCell className="text-center">
                                                        <p className="text-xl font-black text-slate-900 tabular-nums">
                                                            {(Number(internal) + Number(exam)).toFixed(0)}
                                                        </p>
                                                    </FlatTableCell>
                                                    <FlatTableCell className="text-center">
                                                        <SimpleBadge className={cn(
                                                            "font-black tracking-widest",
                                                            row.record.grade === 'A' ? 'bg-emerald-50 text-emerald-600' : 
                                                            row.record.grade === 'B' ? 'bg-blue-50 text-blue-600' : 
                                                            row.record.grade === 'C' ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-600'
                                                        )}>
                                                            GRADE {row.record.grade}
                                                        </SimpleBadge>
                                                    </FlatTableCell>
                                                    <FlatTableCell className="text-center">
                                                        <p className="font-black text-slate-600 tabular-nums">{row.record.gpa_points?.toFixed(1)}</p>
                                                    </FlatTableCell>
                                                    <FlatTableCell className="text-right pr-10">
                                                        {isEdited ? (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleSave(row)}
                                                                disabled={saving === row.student._id}
                                                                className="h-10 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-900/10 hover:translate-y-[-2px] transition-all"
                                                            >
                                                                {saving === row.student._id ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    <Save className="h-3.5 w-3.5" />
                                                                )}
                                                                Save
                                                            </Button>
                                                        ) : (
                                                            <div className="flex items-center justify-end gap-2 text-emerald-600 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <CheckCircle className="h-4 w-4" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Saved</span>
                                                            </div>
                                                        )}
                                                    </FlatTableCell>
                                                </FlatTableRow>
                                            )
                                        })
                                    )}
                                </tbody>
                            </FlatTable>
                        </div>
                    )}
                </SimpleCard>
            ) : (
                <div className="flex flex-col items-center justify-center py-40 bg-white border border-dashed border-slate-200 rounded-[3rem] opacity-60">
                    <Trophy className="h-20 w-20 mx-auto mb-8 text-slate-100" />
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Select a Course</h3>
                    <p className="text-sm font-medium text-slate-400 italic mt-2">Select a course from the curriculum grid to manage student grades.</p>
                </div>
            )}
        </div>
    )
}

export default function GradebookPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="h-12 w-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Gradebook Matrix...</p>
            </div>
        }>
            <GradebookContent />
        </Suspense>
    )
}
