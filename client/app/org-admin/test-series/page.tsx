"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trophy, Edit2, Trash2, Loader2, X } from "lucide-react"
import { testSeriesApi } from '../../../lib/services/orgAdminApi'
import { useAuth } from '../../../lib/auth-context'
import { DataTable, DataTableColumn } from '../../../components/instructor/data-table'
import { toast } from "sonner"

interface TestSeries {
    _id: string
    title: string
    description?: string
    is_active: boolean
}

export default function TestSeriesPage() {
    const { token } = useAuth()
    const [data, setData] = useState<TestSeries[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSeries, setEditingSeries] = useState<TestSeries | null>(null)
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        is_active: true
    })

    useEffect(() => {
        if (token) loadData()
    }, [token])

    async function loadData() {
        setLoading(true)
        try {
            if (!token) return
            const response = await testSeriesApi.list(token)
            if (response.success) {
                setData(response.data)
            }
        } catch (error) {
            console.error("Failed to load test series:", error)
            toast.error("Failed to load test series")
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            if (!token) throw new Error('No authentication token')
            if (editingSeries) {
                await testSeriesApi.update(token, editingSeries._id, formData)
                toast.success("Test series updated successfully")
            } else {
                await testSeriesApi.create(token, formData)
                toast.success("Test series created successfully")
            }
            setIsModalOpen(false)
            loadData()
        } catch (error) {
            toast.error("Operation failed")
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure?")) return
        try {
            if (!token) throw new Error('No authentication token')
            await testSeriesApi.delete(token, id)
            toast.success("Deleted successfully")
            loadData()
        } catch (error) {
            toast.error("Delete failed")
        }
    }

    const columns: DataTableColumn<TestSeries>[] = [
        { key: "title", label: "Title", sortable: true },
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

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-indigo-500" /></div>

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-slate-100">Test Series</h1>
                    <p className="text-slate-400">Manage competitive exam test series</p>
                </div>
                <button
                    onClick={() => { setEditingSeries(null); setFormData({ title: "", description: "", is_active: true }); setIsModalOpen(true); }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-500 transition-all font-medium"
                >
                    Add Series
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <DataTable
                    columns={columns}
                    data={data}
                    actions={(row) => (
                        <div className="flex gap-2">
                            <button onClick={() => {
                                setEditingSeries(row);
                                setFormData({
                                    title: row.title,
                                    description: row.description || "",
                                    is_active: row.is_active
                                });
                                setIsModalOpen(true);
                            }} className="p-2 text-slate-400 hover:text-indigo-400 transition-all">
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(row._id)} className="p-2 text-slate-400 hover:text-red-400 transition-all">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                />
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <h3 className="text-xl font-bold text-slate-100 mb-6">{editingSeries ? "Edit Test Series" : "New Test Series"}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none" required />
                                <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full h-24 p-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 resize-none outline-none" />
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" id="isActive" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-indigo-600" />
                                    <label htmlFor="isActive" className="text-sm text-slate-300">Active Series</label>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl">Save</button>
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
