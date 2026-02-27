"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Book, Edit2, Trash2, Loader2, X } from "lucide-react"
import { subjectApi, departmentApi } from "@/lib/services/orgAdminApi"
import { DataTable, DataTableColumn } from "@/components/instructor/data-table"
import { toast } from "sonner"

interface Subject {
    _id: string
    name: string
    code: string
    department_id?: {
        _id: string
        name: string
    }
    description?: string
    credits?: number
}

export default function SubjectsPage() {
    const [data, setData] = useState<Subject[]>([])
    const [departments, setDepartments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        department_id: "",
        description: "",
        credits: 3
    })

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [subjectsRes, deptsRes] = await Promise.all([
                subjectApi.list(),
                departmentApi.list()
            ])

            if (subjectsRes.success) setData(subjectsRes.data)
            if (deptsRes.success) setDepartments(deptsRes.data)
        } catch (error) {
            console.error("Failed to load subjects:", error)
            toast.error("Failed to load subjects")
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            if (editingSubject) {
                await subjectApi.update(editingSubject._id, formData)
                toast.success("Subject updated successfully")
            } else {
                await subjectApi.create(formData)
                toast.success("Subject created successfully")
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
            await subjectApi.delete(id)
            toast.success("Deleted successfully")
            loadData()
        } catch (error) {
            toast.error("Delete failed")
        }
    }

    const columns: DataTableColumn<Subject>[] = [
        { key: "code", label: "Code", sortable: true },
        { key: "name", label: "Subject Name", sortable: true },
        {
            key: "department_id",
            label: "Department",
            render: (val) => val?.name || "General"
        },
        { key: "credits", label: "Credits" }
    ]

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-4xl font-bold text-slate-100">Subjects</h1>
                <button
                    onClick={() => { setEditingSubject(null); setIsModalOpen(true); }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl"
                >
                    Add Subject
                </button>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
                <DataTable
                    columns={columns}
                    data={data}
                    actions={(row) => (
                        <div className="flex gap-2">
                            <button onClick={() => {
                                setEditingSubject(row);
                                setFormData({
                                    name: row.name,
                                    code: row.code,
                                    department_id: row.department_id?._id || "",
                                    description: row.description || "",
                                    credits: row.credits || 3
                                });
                                setIsModalOpen(true);
                            }} className="p-2 text-slate-400 hover:text-indigo-400"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(row._id)} className="p-2 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    )}
                />
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
                            <h3 className="text-xl font-bold text-slate-100 mb-6">{editingSubject ? "Edit Subject" : "New Subject"}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input type="text" placeholder="Subject Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none" required />
                                <input type="text" placeholder="Subject Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none" required />
                                <select value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none">
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                </select>
                                <input type="number" placeholder="Credits" value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })} className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none" required />
                                <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full h-24 p-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 resize-none outline-none" />
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
