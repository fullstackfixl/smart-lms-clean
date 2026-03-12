"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Users, Edit2, Trash2, Loader2, X, RefreshCw } from "lucide-react"
import { batchApi } from '../../../lib/services/orgAdminApi'
import { collegeApi } from '../../../lib/api'
import { useAuth } from '../../../lib/auth-context'
import { DataTable, DataTableColumn } from '../../../components/instructor/data-table'
import { Button } from "../../../components/ui/button"
import { toast } from "sonner"

interface Batch {
    _id: string
    name: string
    code: string
    description?: string
    isActive: boolean
}

export default function BatchesPage() {
    const { token, organization } = useAuth()
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

    const orgType = organization?.type?.toUpperCase() || 'COLLEGE'
    const isCollege = orgType === 'COLLEGE' || orgType === 'UNIVERSITY'

    useEffect(() => {
        if (token) loadData()
    }, [token])

    async function loadData() {
        setLoading(true)
        try {
            if (!token) return
            let response
            if (isCollege) {
                response = await collegeApi.listBatches(token)
            } else {
                response = await batchApi.list(token)
            }
            if (response.success) {
                setData(response.data || [])
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
                if (isCollege) {
                    await collegeApi.updateBatch(token, editingBatch._id, formData)
                } else {
                    await batchApi.update(token, editingBatch._id, formData)
                }
                toast.success("Batch updated successfully")
            } else {
                if (isCollege) {
                    await collegeApi.createBatch(token, formData)
                } else {
                    await batchApi.create(token, formData)
                }
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
            if (isCollege) {
                await collegeApi.deleteBatch(token, id)
            } else {
                await batchApi.delete(token, id)
            }
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Batches</h1>
                    <p className="text-slate-500 mt-1">Manage learning groups and batches for your institute.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadData} className="border-gray-200">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => {
                            setEditingBatch(null)
                            setFormData({ name: "", code: "", description: "", isActive: true })
                            setIsModalOpen(true)
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4 stroke-[1.5]" />
                        Add Batch
                    </Button>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
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
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                />
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white border border-gray-200 rounded-md p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-slate-900">
                                    {editingBatch ? "Edit Batch" : "New Batch"}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-900">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Batch Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Evening Batch 2024"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Batch Code</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. B-01"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full min-h-[100px] p-3 bg-white border border-gray-200 rounded-md text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500/20"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                                        Active Batch
                                    </label>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <Button type="button" variant="outline" className="flex-1 border-gray-200" onClick={() => setIsModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                                        {editingBatch ? "Save Changes" : "Create Batch"}
                                    </Button>
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
