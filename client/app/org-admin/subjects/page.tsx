"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    BookOpen, Plus, Search, MoreVertical, Edit2, Trash2,
    CheckCircle2, XCircle, Loader2, Filter, ChevronRight,
    GraduationCap, Building2, Layers
} from "lucide-react"
import {
    subjectApi,
    departmentApi,
    semesterApi
} from "../../../lib/services/orgAdminApi"
import { useAuth } from "../../../lib/auth-context"
import { toast } from "sonner"

interface Subject {
    _id: string
    name: string
    code: string
    department_id: any
    semester_id: any
    credits: number
    description: string
    isActive: boolean
}

export default function SubjectsPage() {
    const { token } = useAuth()
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [departments, setDepartments] = useState<any[]>([])
    const [semesters, setSemesters] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
    const [submitting, setSubmitting] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        department_id: "",
        semester_id: "",
        credits: 3,
        description: "",
        isActive: true
    })

    useEffect(() => {
        if (token) loadData()
    }, [token])

    const loadData = async () => {
        setLoading(true)
        try {
            if (!token) return
            const [subs, deps, sems] = await Promise.all([
                subjectApi.list(token),
                departmentApi.list(token),
                semesterApi.list(token)
            ])
            // Handle the different response formats (sometimes data is nested)
            setSubjects(subs.data?.subjects || subs.data || [])
            setDepartments(deps.data?.departments || deps.data || [])
            setSemesters(sems.data?.semesters || sems.data || [])
        } catch (err) {
            toast.error("Failed to load data")
        }
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            if (!token) throw new Error('No authentication token')
            if (editingSubject) {
                await subjectApi.update(token, editingSubject._id, formData)
                toast.success("Subject updated successfully")
            } else {
                await subjectApi.create(token, formData)
                toast.success("Subject created successfully")
            }
            setIsModalOpen(false)
            setEditingSubject(null)
            setFormData({ name: "", code: "", department_id: "", semester_id: "", credits: 3, description: "", isActive: true })
            loadData()
        } catch (err: any) {
            toast.error(err.message || "Operation failed")
        }
        setSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this subject?")) return
        try {
            if (!token) throw new Error('No authentication token')
            await subjectApi.delete(token, id)
            toast.success("Subject deleted")
            loadData()
        } catch (err) {
            toast.error("Failed to delete subject")
        }
    }

    const openEditModal = (subject: Subject) => {
        setEditingSubject(subject)
        setFormData({
            name: subject.name,
            code: subject.code,
            department_id: typeof subject.department_id === 'object' ? subject.department_id?._id : subject.department_id,
            semester_id: typeof subject.semester_id === 'object' ? subject.semester_id?._id : subject.semester_id,
            credits: subject.credits,
            description: subject.description,
            isActive: subject.isActive
        })
        setIsModalOpen(true)
    }

    const filtered = subjects.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-md bg-blue-600 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Academic Subjects
                        </h1>
                    </div>
                    <p className="text-slate-500 text-sm">Manage subject catalog, credit units, and department links</p>
                </div>

                <button
                    onClick={() => {
                        setEditingSubject(null)
                        setFormData({ name: "", code: "", department_id: "", semester_id: "", credits: 3, description: "", isActive: true })
                        setIsModalOpen(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    Add Subject
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 p-2 bg-white border border-gray-200 rounded-md">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or code..."
                        className="w-full pl-11 pr-4 py-3 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                    />
                </div>
                <div className="h-8 w-px bg-gray-200" />
                <button className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-900 transition-colors">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Filter</span>
                </button>
            </div>

            {/* Subjects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-48 rounded-md bg-white animate-pulse border border-gray-200" />
                    ))
                ) : filtered.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-white rounded-md border border-dashed border-gray-200">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500">No subjects found.</p>
                    </div>
                ) : (
                    filtered.map((subject, idx) => (
                        <motion.div
                            key={subject._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group bg-white border border-gray-200 hover:border-gray-300 rounded-md p-6 transition-colors relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex gap-2">
                                    <button onClick={() => openEditModal(subject)} className="p-2 rounded-md bg-white hover:bg-slate-50 text-slate-500 hover:text-blue-700 transition-colors border border-gray-200">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(subject._id)} className="p-2 rounded-md bg-white hover:bg-slate-50 text-slate-500 hover:text-red-600 transition-colors border border-gray-200">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 mb-4">
                                <div className="h-12 w-12 rounded-md bg-slate-50 flex items-center justify-center text-blue-700 border border-gray-200 font-bold text-sm">
                                    {subject.code}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        {subject.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-medium text-slate-600 px-2 py-0.5 rounded-full bg-slate-50 border border-gray-200">
                                            {subject.credits} Credits
                                        </span>
                                        {!subject.isActive && (
                                            <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
                                                <XCircle className="h-3 w-3" /> Inactive
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Building2 className="h-4 w-4" />
                                    <span className="truncate">
                                        {typeof subject.department_id === 'object' ? subject.department_id?.name : 'No Department'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Layers className="h-4 w-4" />
                                    <span>
                                        {typeof subject.semester_id === 'object' ? `Semester ${subject.semester_id?.number || '?'}` : 'No Semester'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <p className="text-xs text-slate-500 max-w-[70%] truncate">
                                    {subject.description || "No description provided"}
                                </p>
                                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <ChevronRight className="h-4 w-4" />
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-7 border-b border-slate-100 bg-gradient-to-b from-orange-50/60 to-white">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-[20px] font-black text-slate-900 tracking-tight">
                                            {editingSubject ? "Edit Subject" : "Add New Subject"}
                                        </h2>
                                        <p className="text-[13px] font-medium text-slate-500 mt-1">
                                            Define subject metadata and academic mapping.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                    >
                                        <XCircle className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-7">
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Subject Code</label>
                                            <input
                                                required
                                                value={formData.code}
                                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                                placeholder="CS101"
                                                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/15 focus:border-orange-500/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Credits</label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.credits}
                                                onChange={e => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                                                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/15 focus:border-orange-500/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Subject Name</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Introduction to Computer Science"
                                            className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/15 focus:border-orange-500/50"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Department</label>
                                            <select
                                                required
                                                value={formData.department_id}
                                                onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                                                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/15 focus:border-orange-500/50 appearance-none"
                                            >
                                                <option value="">Select Dept</option>
                                                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Semester</label>
                                            <select
                                                required
                                                value={formData.semester_id}
                                                onChange={e => setFormData({ ...formData, semester_id: e.target.value })}
                                                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/15 focus:border-orange-500/50 appearance-none"
                                            >
                                                <option value="">Select Sem</option>
                                                {semesters.map(s => <option key={s._id} value={s._id}>Sem {s.number} - {s.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Description</label>
                                        <textarea
                                            rows={3}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Brief overview of the subject..."
                                            className="w-full min-h-[110px] px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/15 focus:border-orange-500/50 resize-none"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            checked={formData.isActive}
                                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="h-4 w-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500/20"
                                        />
                                        <label htmlFor="isActive" className="text-sm text-slate-600">Subject is active and linkable</label>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="flex-1 h-11 border border-slate-200 text-slate-700 rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={submitting}
                                            className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[12px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                            {editingSubject ? "Update Subject" : "Create Subject"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
