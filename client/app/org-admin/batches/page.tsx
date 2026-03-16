"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Users, Edit2, Trash2, Loader2, X, RefreshCw, Building2, BookOpen, Calendar, GraduationCap } from "lucide-react"
import { batchApi } from '../../../lib/services/orgAdminApi'
import { collegeApi } from '../../../lib/api'
import { useAuth } from '../../../lib/auth-context'
import { Button } from "../../../components/ui/button"
import { toast } from "sonner"

interface Batch {
    _id: string
    name: string
    code: string
    description?: string
    isActive: boolean
    students?: any[]
    instructorIds?: any[]
    // College-specific fields
    programId?: { _id: string; name: string; code: string } | string
    departmentId?: { _id: string; name: string; code: string } | string
    year?: number
    semester?: number
    startDate?: string
    endDate?: string
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
        isActive: true,
        programId: "",
        departmentId: "",
        year: 1,
        semester: 1
    })

    const [programs, setPrograms] = useState<any[]>([])
    const [departments, setDepartments] = useState<any[]>([])

    const orgType = (organization?.organizationType || organization?.type || '').toUpperCase()
    const isCollege = orgType === 'COLLEGE' || orgType === 'UNIVERSITY'

    useEffect(() => {
        if (token) loadData()
    }, [token])

    async function loadData() {
        setLoading(true)
        try {
            if (!token) return
            console.log('[Batches] ========================================')
            console.log('[Batches] Loading data...')
            console.log('[Batches] isCollege:', isCollege)
            
            let response: any
            try {
                if (isCollege) {
                    console.log('[Batches] Calling collegeApi.listBatches...')
                    response = await collegeApi.listBatches(token)
                    console.log('[Batches] listBatches SUCCESS:', response)
                } else {
                    console.log('[Batches] Calling batchApi.list...')
                    response = await batchApi.list(token)
                    console.log('[Batches] batchApi.list SUCCESS:', response)
                }
            } catch (apiError: any) {
                console.error('[Batches] API call FAILED:', apiError)
                console.error('[Batches] Error details:', apiError?.response?.data || apiError?.message || 'No error details')
                toast.error(`Batch API Error: ${apiError?.response?.data?.message || apiError?.message || 'Unknown error'}`)
                setLoading(false)
                return
            }
            
            if (response?.success) {
                const payload = response.data as any
                let batches: any[] = []
                
                if (payload?.batches && Array.isArray(payload.batches)) {
                    batches = payload.batches
                } else if (Array.isArray(payload)) {
                    batches = payload
                } else if (payload?.data?.batches && Array.isArray(payload.data.batches)) {
                    batches = payload.data.batches
                }
                
                console.log('[Batches] Setting data with', batches.length, 'batches')
                batches.forEach((b, i) => {
                    console.log(`[Batches] Batch ${i}: ${b.name}, instructorIds:`, b.instructorIds, 'length:', b.instructorIds?.length)
                })
                setData(batches)
            } else {
                console.error('[Batches] API returned error:', response)
                toast.error("Failed to load batches: " + (response?.message || 'Unknown error'))
            }
            
            if (isCollege) {
                console.log('[Batches] Loading programs and departments...')
                try {
                    const [progRes, deptRes] = await Promise.all([
                        collegeApi.listPrograms(token),
                        collegeApi.listDepartments(token)
                    ])
                    if (progRes.success) {
                        const progs = (progRes.data as any)?.programs || (progRes.data as any) || []
                        setPrograms(Array.isArray(progs) ? progs : [])
                    }
                    if (deptRes.success) {
                        const depts = (deptRes.data as any)?.departments || (deptRes.data as any) || []
                        setDepartments(Array.isArray(depts) ? depts : [])
                    }
                } catch (err: any) {
                    console.error('[Batches] Error loading programs/departments:', err)
                }
            }
        } catch (error) {
            console.error("[Batches] Failed to load batches:", error)
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
                setIsModalOpen(false)
                setEditingBatch(null)
                setFormData({ name: "", code: "", description: "", isActive: true, programId: "", departmentId: "", year: 1, semester: 1 })
                loadData()
            } else {
                let newBatch;
                if (isCollege) {
                    const response = await collegeApi.createBatch(token, formData)
                    newBatch = (response.data as any)?.batch || (response.data as any)
                } else {
                    const response = await batchApi.create(token, formData)
                    newBatch = (response.data as any)?.batch || (response.data as any)
                }
                
                toast.success("Batch created successfully")
                setIsModalOpen(false)
                setEditingBatch(null)
                setFormData({ name: "", code: "", description: "", isActive: true, programId: "", departmentId: "", year: 1, semester: 1 })
                
                if (newBatch) {
                    console.log('[Batches] Optimistically adding new batch:', newBatch)
                    setData(prev => [newBatch, ...prev])
                }
                
                setTimeout(() => {
                    console.log('[Batches] Executing forced reload...')
                    window.location.reload()
                }, 1000)
            }
        } catch (error) {
            console.error('[Batches] Error:', error)
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

    const getProgramName = (batch: Batch) => {
        if (!batch.programId) return '-';
        if (typeof batch.programId === 'object') return batch.programId.name || batch.programId.code || '-';
        const prog = programs.find(p => p._id === batch.programId);
        return prog?.name || prog?.code || '-';
    }

    const getDepartmentName = (batch: Batch) => {
        if (!batch.departmentId) return '-';
        if (typeof batch.departmentId === 'object') return batch.departmentId.name || batch.departmentId.code || '-';
        const dept = departments.find(d => d._id === batch.departmentId);
        return dept?.name || dept?.code || '-';
    }

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
                            setFormData({ name: "", code: "", description: "", isActive: true, programId: "", departmentId: "", year: 1, semester: 1 })
                            setIsModalOpen(true)
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4 stroke-[1.5]" />
                        Add Batch
                    </Button>
                </div>
            </div>

            {/* Horizontal Cards Layout */}
            <div className="space-y-4">
                {data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-md">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 text-lg font-medium">No batches found</p>
                        <p className="text-slate-400 text-sm mt-1">Create a new batch to get started</p>
                    </div>
                ) : (
                    data.map((batch, index) => (
                        <motion.div
                            key={batch._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all"
                        >
                            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                {/* Left: Batch Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold text-lg">{batch.code?.charAt(0) || 'B'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="text-lg font-semibold text-slate-900 truncate">{batch.name}</h3>
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                    batch.isActive 
                                                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                                                        : "bg-red-100 text-red-700 border border-red-200"
                                                )}>
                                                    {batch.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1">{batch.code} • {batch.description || 'No description'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Academic Details */}
                                {isCollege && (
                                    <div className="flex flex-wrap gap-4 lg:border-l lg:border-gray-200 lg:pl-6">
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-xs text-slate-400">Program</p>
                                                <p className="text-sm font-medium text-slate-700">{getProgramName(batch)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-purple-500" />
                                            <div>
                                                <p className="text-xs text-slate-400">Department</p>
                                                <p className="text-sm font-medium text-slate-700">{getDepartmentName(batch)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-orange-500" />
                                            <div>
                                                <p className="text-xs text-slate-400">Year/Sem</p>
                                                <p className="text-sm font-medium text-slate-700">Y{batch.year || 1} • S{batch.semester || 1}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Right: Stats & Actions */}
                                <div className="flex items-center gap-6 lg:border-l lg:border-gray-200 lg:pl-6">
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <div className="flex items-center gap-1 justify-center">
                                                <Users className="w-4 h-4 text-slate-400" />
                                                <span className="text-lg font-semibold text-slate-900">{batch.students?.length || 0}</span>
                                            </div>
                                            <p className="text-xs text-slate-400">Students</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center gap-1 justify-center">
                                                <GraduationCap className="w-4 h-4 text-slate-400" />
                                                <span className="text-lg font-semibold text-slate-900">{batch.instructorIds?.length || 0}</span>
                                            </div>
                                            <p className="text-xs text-slate-400">Instructors</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingBatch(batch)
                                                setFormData({
                                                    name: batch.name,
                                                    code: batch.code,
                                                    description: batch.description || "",
                                                    isActive: batch.isActive,
                                                    programId: typeof batch.programId === 'object' ? batch.programId?._id : batch.programId || "",
                                                    departmentId: typeof batch.departmentId === 'object' ? batch.departmentId?._id : batch.departmentId || "",
                                                    year: batch.year || 1,
                                                    semester: batch.semester || 1
                                                })
                                                setIsModalOpen(true)
                                            }}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="Edit Batch"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(batch._id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete Batch"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
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
                                
                                {isCollege && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 mb-1">Program</label>
                                                <select
                                                    required
                                                    value={formData.programId}
                                                    onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                                                    className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                                                >
                                                    <option value="">Select Program</option>
                                                    {programs.map(p => (
                                                        <option key={p._id} value={p._id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 mb-1">Department</label>
                                                <select
                                                    required
                                                    value={formData.departmentId}
                                                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                                    className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                                                >
                                                    <option value="">Select Department</option>
                                                    {departments.map(d => (
                                                        <option key={d._id} value={d._id}>{d.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 mb-1">Year</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    max="10"
                                                    value={formData.year}
                                                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                                    className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-600 mb-1">Semester</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    max="20"
                                                    value={formData.semester}
                                                    onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                                                    className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                                
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
