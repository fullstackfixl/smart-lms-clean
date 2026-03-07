"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
    ChevronLeft, Plus, Edit, Trash2,
    BookOpen, Users, Clock, Loader2,
    AlertCircle, X, Send, UserCheck,
    GraduationCap
} from "lucide-react"
import {
    subjectApi,
    programApi,
    listInstructors
} from '../../../../../lib/services/orgAdminApi'
import { toast } from "sonner"

interface Subject {
    _id: string
    name: string
    code: string
    semester: number
    description: string
    instructor_id?: {
        _id: string
        profile: { fullName: string }
        email: string
    }
    contentCourseId?: {
        _id: string
        title: string
    }
}

interface Program {
    _id: string
    name: string
    code: string
    total_semesters: number
}

export default function SubjectManagementPage() {
    const params = useParams()
    const router = useRouter()
    const courseId = params.courseId as string

    const [program, setProgram] = useState<Program | null>(null)
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [instructors, setInstructors] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        code: "",
        semester: 1,
        description: "",
        instructor_id: "",
        program_id: courseId,
        department_id: "" // Will be set from program
    })

    useEffect(() => {
        if (courseId) {
            loadInitialData()
        }
    }, [courseId])

    async function loadInitialData() {
        setLoading(true)
        try {
            const token = sessionStorage.getItem('instatute_token') || localStorage.getItem('instatute_token') || ""
            const [progRes, subRes, instRes] = await Promise.all([
                programApi.get(courseId),
                subjectApi.list(courseId),
                listInstructors(token)
            ])

            if (progRes.success) {
                setProgram(progRes.data)
                setFormData(prev => ({ ...prev, department_id: progRes.data.department_id._id || progRes.data.department_id }))
            }
            if (subRes.success) {
                setSubjects(subRes.data)
            }
            if (instRes.success) {
                setInstructors(instRes.data)
            }
        } catch (error) {
            console.error('Error loading subjects:', error)
            toast.error("Failed to load subject data")
        } finally {
            setLoading(false)
        }
    }

    async function handleCreateSubject(e: React.FormEvent) {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const response = await subjectApi.create(formData)
            if (response.success) {
                toast.success("Subject added successfully")
                setShowCreateModal(false)
                setFormData({
                    ...formData,
                    name: "",
                    code: "",
                    semester: 1,
                    description: "",
                    instructor_id: ""
                })
                loadInitialData()
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to create subject")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-white">Manage Subjects</h1>
                    <p className="text-slate-400">
                        {program?.name} ({program?.code}) • {program?.total_semesters} Semesters
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="ml-auto flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Subject
                </button>
            </div>

            {/* Subjects Grid by Semester */}
            {Array.from({ length: program?.total_semesters || 0 }).map((_, i) => {
                const semester = i + 1
                const semesterSubjects = subjects.filter(s => s.semester === semester)

                return (
                    <section key={semester} className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-300 flex items-center gap-3">
                            <GraduationCap className="w-5 h-5 text-indigo-400" />
                            Semester {semester}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {semesterSubjects.length === 0 ? (
                                <div className="md:col-span-2 lg:col-span-3 py-10 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 text-sm">
                                    <BookOpen className="w-8 h-8 mb-2 opacity-20" />
                                    No subjects added for this semester
                                </div>
                            ) : (
                                semesterSubjects.map(subject => (
                                    <motion.div
                                        key={subject._id}
                                        whileHover={{ y: -4 }}
                                        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-100">{subject.name}</h3>
                                                <p className="text-xs text-slate-500 font-mono tracking-wider uppercase">{subject.code}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"><Edit className="w-4 h-4" /></button>
                                                <button className="p-2 text-slate-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                                    <UserCheck className="w-4 h-4 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Instructor</p>
                                                    <p className="text-xs text-slate-300 font-medium">
                                                        {subject.instructor_id?.profile?.fullName || 'Not Assigned'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </section>
                )
            })}

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCreateModal(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-800">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-white">Add New Subject</h2>
                                    <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleCreateSubject} className="p-8 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Subject Name</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Subject Code</label>
                                        <input
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Semester</label>
                                        <select
                                            value={formData.semester}
                                            onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                                            className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                                        >
                                            {Array.from({ length: program?.total_semesters || 0 }).map((_, i) => (
                                                <option key={i} value={i + 1}>Semester {i + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Instructor</label>
                                        <select
                                            value={formData.instructor_id}
                                            onChange={(e) => setFormData({ ...formData, instructor_id: e.target.value })}
                                            className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                                        >
                                            <option value="">Select Instructor</option>
                                            {instructors.map(inst => (
                                                <option key={inst._id} value={inst._id}>
                                                    {inst.profile?.fullName || inst.email}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Description</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-12 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                    Add Subject
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
