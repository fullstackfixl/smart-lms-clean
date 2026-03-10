"use client"
 
import { useState, useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
    ArrowUpRight
} from "lucide-react"
import { instructorApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"
import { toast } from "sonner"
import { Badge } from "../../../components/ui/badge"
 
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
                setGradebook(r.data?.gradebook || [])
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
                if (refresh.success) setGradebook(refresh.data?.gradebook || [])
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
        <div className="max-w-[1580px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20 p-6">
            {/* Premium Gradebook Hero */}
            <div className="relative overflow-hidden rounded-[3.5rem] bg-white dark:bg-[#0B0F1A] border border-slate-100 dark:border-slate-800/50 px-12 py-16 shadow-sm group">
                <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[32rem] h-[32rem] bg-amber-500/5 rounded-full blur-[100px] group-hover:bg-amber-500/10 transition-all duration-1000" />
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-black uppercase tracking-[0.25em] mb-2 border border-amber-100 dark:border-amber-500/20">
                            <Trophy className="w-3.5 h-3.5" />
                            Academic Mastery
                        </div>
                        <h1 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
                            The Master <br /><span className="text-amber-600 font-serif italic tracking-tighter">Gradebook</span>
                        </h1>
                        <p className="text-[17px] font-medium text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                            Audit scholarly achievements with precision. Fine-tune internal metrics, verify examination results, and calculate mastery indices across your entire academic cluster.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="p-6 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center gap-6 shadow-sm">
                            <div className="text-right">
                                <p className="text-[24px] font-black text-slate-900 dark:text-white leading-none">4.0</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Scale Index</p>
                            </div>
                            <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800" />
                            <div className="text-right">
                                <p className="text-[24px] font-black text-amber-600 leading-none">A+</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Peak Grade</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
 
            {/* Course Navigation Grid */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Active Curriculums</p>
                    <div className="flex items-center gap-1">
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-white transition-all"><ArrowUpRight className="w-4 h-4 text-slate-400" /></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {courses.map(course => (
                        <motion.button
                            key={course._id}
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedCourse(course)}
                            className={`group relative overflow-hidden text-left p-8 rounded-[2.5rem] border transition-all duration-500 ${selectedCourse?._id === course._id
                                    ? 'border-amber-500/60 bg-white dark:bg-[#0B0F1A] shadow-2xl shadow-amber-500/10'
                                    : 'border-slate-100 dark:border-slate-800/50 bg-white dark:bg-[#0B0F1A] hover:border-amber-500/30 shadow-sm'
                                }`}
                        >
                            <div className="relative z-10">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-700 ${selectedCourse?._id === course._id ? 'bg-amber-500 text-white rotate-6 scale-110' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:bg-amber-50 dark:group-hover:bg-amber-500/10 group-hover:text-amber-600'}`}>
                                    <BookOpen className="h-6 w-6" />
                                </div>
                                <h3 className={`font-black tracking-tight text-[17px] mb-2 leading-tight truncate ${selectedCourse?._id === course._id ? 'text-slate-900 dark:text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>{course.title}</h3>
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800 text-[9px] px-3 font-black tracking-widest">{course.course_credits || 3} CREDITS</Badge>
                                    {selectedCourse?._id === course._id && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    )}
                                </div>
                            </div>
                            <div className={`absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity ${selectedCourse?._id === course._id ? 'opacity-20' : ''}`}>
                                <Zap className="w-16 h-16 -mr-4 -mb-4" />
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>
 
            {/* Gradebook Architecture */}
            <AnimatePresence mode="wait">
                {selectedCourse ? (
                    <motion.div
                        key={selectedCourse._id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        className="bg-white dark:bg-[#0B0F1A] border border-slate-100 dark:border-slate-800/50 rounded-[3.5rem] shadow-sm overflow-hidden"
                    >
                        {/* Control Bar */}
                        <div className="flex flex-col md:flex-row items-center justify-between p-10 gap-8 border-b border-slate-50 dark:border-slate-800/50">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-[1.8rem] bg-amber-500 text-white flex items-center justify-center shadow-xl shadow-amber-500/20">
                                    <Award className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-[22px] font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">{selectedCourse.title}</h2>
                                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">
                                        Auditing {filtered.length} Scholar Indices
                                    </p>
                                </div>
                            </div>
                            <div className="relative group w-full md:w-80">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-hover:text-amber-500 transition-colors" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Identify scholar..."
                                    className="w-full h-14 pl-16 pr-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[14px] font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/5 transition-all"
                                />
                            </div>
                        </div>
 
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Grade Stream...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-32">
                                <GraduationCap className="h-16 w-16 mx-auto mb-6 text-slate-100" />
                                <p className="text-[16px] font-black text-slate-400 italic">// Zero scholar identities identified for this cluster.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 dark:bg-slate-900/10 border-b border-slate-50 dark:border-slate-800/50">
                                            <th className="text-left px-10 py-6">Scholar Identity</th>
                                            <th className="px-6 py-6 text-center">Internal Audits (50)</th>
                                            <th className="px-6 py-6 text-center">Exam Verification (50)</th>
                                            <th className="px-6 py-6 text-center text-amber-600">Mastery Index</th>
                                            <th className="px-6 py-6 text-center">Tier</th>
                                            <th className="px-6 py-6 text-center">GPA Velocity</th>
                                            <th className="px-10 py-6 text-right">Synchronization</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/30">
                                        {filtered.map(row => {
                                            const edit = edits[row.student._id] || {}
                                            const internal = edit.internal_marks ?? row.record.internal_marks ?? 0
                                            const exam = edit.exam_marks ?? row.record.exam_marks ?? 0
                                            const isEdited = row.student._id in edits
                                            const theme = GRADE_THEMES[row.record.grade] || GRADE_THEMES.I
                                            
                                            return (
                                                <tr key={row.student._id} className={`group transition-colors ${isEdited ? 'bg-amber-500/5' : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/10'}`}>
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-4">
                                                           <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[13px] font-black text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-all">
                                                              {row.student.name.charAt(0)}
                                                           </div>
                                                           <div>
                                                              <p className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">{row.student.name}</p>
                                                              <p className="text-[11px] font-bold text-slate-400 tabular-nums">{row.student.email}</p>
                                                           </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-8 text-center">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={50}
                                                            value={internal}
                                                            onChange={e => handleEdit(row.student._id, 'internal_marks', e.target.value)}
                                                            className="w-24 h-12 text-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1rem] text-slate-900 dark:text-white text-[15px] font-black focus:ring-4 focus:ring-amber-500/5 focus:outline-none focus:border-amber-500/50 transition-all tabular-nums shadow-inner"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-8 text-center">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={50}
                                                            value={exam}
                                                            onChange={e => handleEdit(row.student._id, 'exam_marks', e.target.value)}
                                                            className="w-24 h-12 text-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1rem] text-slate-900 dark:text-white text-[15px] font-black focus:ring-4 focus:ring-amber-500/5 focus:outline-none focus:border-amber-500/50 transition-all tabular-nums shadow-inner"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-8 text-center">
                                                        <p className="text-[20px] font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                                                            {(Number(internal) + Number(exam)).toFixed(0)}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-8 text-center">
                                                        <span className={`text-[11px] font-black px-4 py-1.5 rounded-full border ${theme.bg} ${theme.text} ${theme.border} tracking-widest`}>
                                                            {row.record.grade} TIER
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-8 text-center">
                                                        <p className="text-[15px] font-black text-slate-400 tabular-nums">{row.record.gpa_points?.toFixed(1)}</p>
                                                    </td>
                                                    <td className="px-10 py-8 text-right">
                                                        {isEdited ? (
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleSave(row)}
                                                                disabled={saving === row.student._id}
                                                                className="h-12 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:shadow-xl hover:shadow-amber-500/10 transition-all flex items-center justify-center gap-2"
                                                            >
                                                                {saving === row.student._id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Save className="h-4 w-4" />
                                                                )}
                                                                SYNC DATA
                                                            </motion.button>
                                                        ) : (
                                                            <div className="flex items-center justify-end gap-2 text-emerald-500 group-hover:scale-105 transition-transform">
                                                                <CheckCircle2 className="h-4 w-4" strokeWidth={3} />
                                                                <span className="text-[10px] font-black uppercase tracking-[0.15em]">SECURED</span>
                                                            </div>
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
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 bg-white dark:bg-[#0B0F1A] border border-dashed border-slate-200 dark:border-slate-800 rounded-[3.5rem] opacity-60">
                        <Trophy className="h-16 w-16 mx-auto mb-6 text-slate-100" />
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Audit Standby</h3>
                        <p className="text-[14px] font-bold text-slate-400 italic mt-2">Select an academic curriculum above to initialize the gradebook matrix.</p>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
 
export default function GradebookPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="h-12 w-12 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Gradebook Matrix...</p>
            </div>
        }>
            <GradebookContent />
        </Suspense>
    )
}
