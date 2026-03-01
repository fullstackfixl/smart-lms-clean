"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, ListFilter, Edit2, Trash2, Loader2, X } from "lucide-react"
import { semesterApi } from '../../../lib/services/orgAdminApi'
import { DataTable, DataTableColumn } from '../../../components/instructor/data-table'
import { toast } from "sonner"

interface Semester {
    _id: string
    name: string
    number: number
    description?: string
    is_active: boolean
}

export default function SemestersPage() {
    const [data, setData] = useState<Semester[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSemester, setEditingSemester] = useState<Semester | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        number: 1,
        description: "",
        is_active: true
    })

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const response = await semesterApi.list()
            if (response.success) {
                setData(response.data)
            }
        } catch (error) {
            console.error("Failed to load semesters:", error)
            toast.error("Failed to load semesters")
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            if (editingSemester) {
                await semesterApi.update(editingSemester._id, formData)
                toast.success("Semester updated successfully")
            } else {
                await semesterApi.create(formData)
                toast.success("Semester created successfully")
            }
            setIsModalOpen(false)
            setEditingSemester(null)
            setFormData({ name: "", number: 1, description: "", is_active: true })
            loadData()
        } catch (error) {
            toast.error(editingSemester ? "Failed to update" : "Failed to create")
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this semester?")) return
        try {
            await semesterApi.delete(id)
            toast.success("Deleted successfully")
            loadData()
        } catch (error) {
            toast.error("Failed to delete")
        }
    }

    const columns: DataTableColumn<Semester>[] = [
        { key: "number", label: "Semester No.", sortable: true },
        { key: "name", label: "Name", sortable: true },
        { key: "description", label: "Description" },
        {
            key: "is_active",
            label: "Status",
            render: (val) => (
                <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    val ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                )}>
                    {val ? "Active" : "Inactive"}
                </span>
            )
        }
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-2">
                        Semesters
                    </h1>
                    <p className="text-slate-400">Manage academic semesters for your college</p>
                </div>
                <button
                    onClick={() => {
                        setEditingSemester(null)
                        setFormData({ name: "", number: data.length + 1, description: "", is_active: true })
                        setIsModalOpen(true)
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-indigo-500/40 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Semester
                </button>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800/50 rounded-2xl overflow-hidden">
                <DataTable
                    columns={columns}
                    data={data}
                    actions={(row) => (
                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => {
                                    setEditingSemester(row)
                                    setFormData({
                                        name: row.name,
                                        number: row.number,
                                        description: row.description || "",
                                        is_active: row.is_active
                                    })
                                    setIsModalOpen(true)
                                }}
                                className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50 rounded-lg transition-all"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(row._id)}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                />
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-slate-100">
                                    {editingSemester ? "Edit Semester" : "New Semester"}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Semester Number</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.number}
                                        onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })}
                                        className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Display Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Fall 2024"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full min-h-[100px] p-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500/50"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium text-slate-300">
                                        Active Semester
                                    </label>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 h-12 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 h-12 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all"
                                    >
                                        {editingSemester ? "Save Changes" : "Create Semester"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
