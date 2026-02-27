"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Calendar, Edit2, Trash2, Loader2, AlertCircle, X, Check } from "lucide-react"
import { academicYearApi } from "@/lib/services/orgAdminApi"
import { DataTable, DataTableColumn } from "@/components/instructor/data-table"
import { toast } from "sonner"
import { format } from "date-fns"

interface AcademicYear {
    _id: string
    name: string
    start_date: string
    end_date: string
    status: 'upcoming' | 'current' | 'completed'
    is_active: boolean
}

export default function AcademicYearPage() {
    const [data, setData] = useState<AcademicYear[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingYear, setEditingYear] = useState<AcademicYear | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        start_date: "",
        end_date: "",
        status: "upcoming"
    })

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const response = await academicYearApi.list()
            if (response.success) {
                setData(response.data)
            }
        } catch (error) {
            console.error("Failed to load academic years:", error)
            toast.error("Failed to load academic years")
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            if (editingYear) {
                await academicYearApi.update(editingYear._id, formData)
                toast.success("Academic year updated successfully")
            } else {
                await academicYearApi.create(formData)
                toast.success("Academic year created successfully")
            }
            setIsModalOpen(false)
            setEditingYear(null)
            setFormData({ name: "", start_date: "", end_date: "", status: "upcoming" })
            loadData()
        } catch (error) {
            toast.error(editingYear ? "Failed to update" : "Failed to create")
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this academic year?")) return
        try {
            await academicYearApi.delete(id)
            toast.success("Deleted successfully")
            loadData()
        } catch (error) {
            toast.error("Failed to delete")
        }
    }

    const columns: DataTableColumn<AcademicYear>[] = [
        { key: "name", label: "Name", sortable: true },
        {
            key: "start_date",
            label: "Start Date",
            render: (val) => format(new Date(val), "MMM dd, yyyy")
        },
        {
            key: "end_date",
            label: "End Date",
            render: (val) => format(new Date(val), "MMM dd, yyyy")
        },
        {
            key: "status",
            label: "Status",
            render: (val) => (
                <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    val === 'current' ? "bg-emerald-500/20 text-emerald-400" :
                        val === 'upcoming' ? "bg-blue-500/20 text-blue-400" :
                            "bg-slate-500/20 text-slate-400"
                )}>
                    {val.charAt(0).toUpperCase() + val.slice(1)}
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
                        Academic Years
                    </h1>
                    <p className="text-slate-400">Manage school sessions and academic periods</p>
                </div>
                <button
                    onClick={() => {
                        setEditingYear(null)
                        setFormData({ name: "", start_date: "", end_date: "", status: "upcoming" })
                        setIsModalOpen(true)
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-indigo-500/40 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Year
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
                                    setEditingYear(row)
                                    setFormData({
                                        name: row.name,
                                        start_date: row.start_date.split('T')[0],
                                        end_date: row.end_date.split('T')[0],
                                        status: row.status
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

            {/* Modal - Basic implementation */}
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
                                    {editingYear ? "Edit Academic Year" : "New Academic Year"}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Name (e.g., 2024-25)</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    >
                                        <option value="upcoming">Upcoming</option>
                                        <option value="current">Current</option>
                                        <option value="completed">Completed</option>
                                    </select>
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
                                        {editingYear ? "Save Changes" : "Create Year"}
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
