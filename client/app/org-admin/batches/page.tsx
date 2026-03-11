"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Users, Edit2, Trash2, Loader2, X } from "lucide-react"
import { batchApi } from '../../../lib/services/orgAdminApi'
import { useAuth } from '../../../lib/auth-context'
import { DataTable, DataTableColumn } from '../../../components/instructor/data-table'
import { toast } from "sonner"

interface Batch {
    _id: string
    name: string
    code: string
    description?: string
    isActive: boolean
}

export default function BatchesPage() {
    const { token } = useAuth()
    const [data, setData] = useState<Batch[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
        isActive: true
    })

    useEffect(() => {
        if (token) loadData()
    }, [token])

    async function loadData() {
        setLoading(true)
        try {
            if (!token) return
            const response = await batchApi.list(token)
            if (response.success) {
                setData(response.data)
            }
        } catch (error) {
            console.error("Failed to load batches:", error)
            toast.error("Failed to load batches")
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            if (!token) throw new Error('No authentication token')
            if (editingBatch) {
                await batchApi.update(token, editingBatch._id, formData)
                toast.success("Batch updated successfully")
            } else {
                await batchApi.create(token, formData)
                toast.success("Batch created successfully")
            }
            setIsModalOpen(false)
            setEditingBatch(null)
            setFormData({ name: "", code: "", description: "", isActive: true })
            loadData()
        } catch (error) {
            toast.error(editingBatch ? "Failed to update" : "Failed to create")
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this batch?")) return
        try {
            if (!token) throw new Error('No authentication token')
            await batchApi.delete(token, id)
            toast.success("Deleted successfully")
            loadData()
        } catch (error) {
            toast.error("Failed to delete")
        }
    }

    const columns: DataTableColumn<Batch>[] = [
        { key: "code", label: "Batch Code", sortable: true },
        { key: "name", label: "Batch Name", sortable: true },
        { key: "description", label: "Description" },
        {
            key: "isActive",
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
                        Batches
                    </h1>
                    <p className="text-slate-400">Manage learning groups and batches for your institute</p>
                </div>
                <button
                    onClick={() => {
                        setEditingBatch(null)
                        setFormData({ name: "", code: "", description: "", isActive: true })
                        setIsModalOpen(true)
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-indigo-500/40 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Batch
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
                                    setEditingBatch(row)
                                    setFormData({
                                        name: row.name,
                                        code: row.code,
                                        description: row.description || "",
                                        isActive: row.isActive
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
                                    {editingBatch ? "Edit Batch" : "New Batch"}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Batch Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Evening Batch 2024"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Batch Code</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. B-01"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
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
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500/50"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium text-slate-300">
                                        Active Batch
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
                                        {editingBatch ? "Save Changes" : "Create Batch"}
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
