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
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                            Academic Subjects
                        </h1>
                    </div>
                    <p className="text-slate-400 text-sm">Manage subject catalog, credit units, and department links</p>
                </div>

                <button
                    onClick={() => {
                        setEditingSubject(null)
                        setFormData({ name: "", code: "", department_id: "", semester_id: "", credits: 3, description: "", isActive: true })
                        setIsModalOpen(true)
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/20"
                >
                    <Plus className="h-5 w-5" />
                    Add Subject
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 p-2 bg-slate-900/40 border border-slate-800/50 rounded-2xl backdrop-blur-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or code..."
                        className="w-full pl-11 pr-4 py-3 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
                    />
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <button className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Filter</span>
                </button>
            </div>

            {/* Subjects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-48 rounded-3xl bg-slate-800/20 animate-pulse border border-slate-800/50" />
                    ))
                ) : filtered.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-700" />
                        <p className="text-slate-500">No subjects found. Start by adding one!</p>
                    </div>
                ) : (
                    filtered.map((subject, idx) => (
                        <motion.div
                            key={subject._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group bg-slate-900/40 border border-slate-800/50 hover:border-indigo-500/30 rounded-3xl p-6 transition-all backdrop-blur-sm relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex gap-2">
                                    <button onClick={() => openEditModal(subject)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(subject._id)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 mb-4">
                                <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700 shadow-inner font-bold text-sm">
                                    {subject.code}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-white transition-colors">
                                        {subject.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-medium text-slate-500 px-2 py-0.5 rounded-full bg-slate-800/50">
                                            {subject.credits} Credits
                                        </span>
                                        {!subject.isActive && (
                                            <span className="text-xs font-semibold text-red-400 flex items-center gap-1">
                                                <XCircle className="h-3 w-3" /> Inactive
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-800/50">
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Building2 className="h-4 w-4" />
                                    <span className="truncate">
                                        {typeof subject.department_id === 'object' ? subject.department_id?.name : 'No Department'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Layers className="h-4 w-4" />
                                    <span>
                                        {typeof subject.semester_id === 'object' ? `Semester ${subject.semester_id?.number || '?'}` : 'No Semester'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <p className="text-xs text-slate-500 italic max-w-[70%] truncate">
                                    {subject.description || "No description provided"}
                                </p>
                                <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
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
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">
                                    {editingSubject ? "Edit Subject" : "Create New Subject"}
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subject Code</label>
                                            <input
                                                required
                                                value={formData.code}
                                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                                placeholder="CS101"
                                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Credits</label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.credits}
                                                onChange={e => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subject Name</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Introduction to Computer Science"
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Department</label>
                                            <select
                                                required
                                                value={formData.department_id}
                                                onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                                            >
                                                <option value="">Select Dept</option>
                                                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Semester</label>
                                            <select
                                                required
                                                value={formData.semester_id}
                                                onChange={e => setFormData({ ...formData, semester_id: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                                            >
                                                <option value="">Select Sem</option>
                                                {semesters.map(s => <option key={s._id} value={s._id}>Sem {s.number} - {s.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                                        <textarea
                                            rows={3}
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Brief overview of the subject..."
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            checked={formData.isActive}
                                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500/50"
                                        />
                                        <label htmlFor="isActive" className="text-sm text-slate-400">Subject is active and linkable</label>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="flex-1 px-6 py-3 border border-slate-700 text-slate-300 rounded-xl font-medium hover:bg-slate-800 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            disabled={submitting}
                                            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
