"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Plus, 
  Building2, 
  Edit2, 
  Trash2, 
  Loader2, 
  X, 
  Search, 
  Filter,
  MoreVertical,
  ChevronRight,
  ShieldCheck,
  Building,
  Activity,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { departmentApi } from '../../../lib/services/orgAdminApi'
import { collegeApi } from '../../../lib/api'
import { useAuth } from '../../../lib/auth-context'
import { toast } from "sonner"

interface Department {
    _id: string
    name: string
    code: string
    description?: string
    isActive: boolean
}

function MetricCard({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5 transition-transform group-hover:scale-110" strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{title}</p>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">{value}</h3>
      </div>
    </div>
  )
}

export default function DepartmentsPage() {
    const { token, organization } = useAuth()
    const [data, setData] = useState<Department[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingDept, setEditingDept] = useState<Department | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        description: "",
        isActive: true
    })

    const orgType = organization?.type?.toUpperCase() || 'COLLEGE'
    const isCollege = orgType === 'COLLEGE' || orgType === 'UNIVERSITY'
    
    // Use college API for college tenants, generic API for others
    const api = isCollege ? collegeApi : departmentApi

    useEffect(() => {
        if (token) loadData()
    }, [token])

    async function loadData() {
        setLoading(true)
        try {
            if (!token) return
            let response
            if (isCollege) {
                response = await collegeApi.listDepartments(token)
            } else {
                response = await departmentApi.list(token)
            }
            if (response.success) {
                const payload = response.data as any
                const departments = payload?.departments || payload || []
                setData(Array.isArray(departments) ? departments : [])
            }
        } catch (error) {
            console.error("Failed to load departments:", error)
            toast.error("Failed to load departments")
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const loadingToast = toast.loading(editingDept ? "Updating department..." : "Creating department...")
        try {
            if (!token) throw new Error('No authentication token')
            if (editingDept) {
                if (isCollege) {
                    await collegeApi.updateDepartment(token, editingDept._id, formData)
                } else {
                    await departmentApi.update(token, editingDept._id, formData)
                }
                toast.success("Department updated successfully", { id: loadingToast })
            } else {
                if (isCollege) {
                    await collegeApi.createDepartment(token, formData)
                } else {
                    await departmentApi.create(token, formData)
                }
                toast.success("Department created successfully", { id: loadingToast })
            }
            setIsModalOpen(false)
            setEditingDept(null)
            setFormData({ name: "", code: "", description: "", isActive: true })
            loadData()
        } catch (error) {
            toast.error(editingDept ? "Failed to update" : "Failed to create", { id: loadingToast })
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this department?")) return
        const loadingToast = toast.loading("Deleting department...")
        try {
            if (!token) throw new Error('No authentication token')
            if (isCollege) {
                await collegeApi.deleteDepartment(token, id)
            } else {
                await departmentApi.delete(token, id)
            }
            toast.success("Deleted successfully", { id: loadingToast })
            loadData()
        } catch (error) {
            toast.error("Failed to delete", { id: loadingToast })
        }
    }

    const filteredData = data.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.code.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <p className="text-[13px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Synchronizing Departments...</p>
            </div>
        )
    }

    const activeCount = data.filter(d => d.isActive).length

    return (
        <div className="space-y-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-none">Departments</h1>
                    <p className="text-[14px] text-slate-500 font-medium mt-3">Configure and manage academic divisions for your organization.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingDept(null)
                        setFormData({ name: "", code: "", description: "", isActive: true })
                        setIsModalOpen(true)
                    }}
                    className="flex items-center justify-center gap-2 px-6 h-11 bg-blue-600 text-white rounded-xl text-[13px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
                >
                    <Plus className="w-4.5 h-4.5" strokeWidth={3} />
                    Add Department
                </button>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                    title="Total Departments" 
                    value={data.length} 
                    icon={Building2} 
                    color="bg-blue-50 text-blue-600"
                />
                <MetricCard 
                    title="Active Divisions" 
                    value={activeCount} 
                    icon={CheckCircle2} 
                    color="bg-emerald-50 text-emerald-600"
                />
                <MetricCard 
                    title="Inactive / Pending" 
                    value={data.length - activeCount} 
                    icon={AlertCircle} 
                    color="bg-rose-50 text-rose-600"
                />
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Search by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                         <button className="h-10 px-4 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5" />
                            Filters
                         </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Department</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Code</th>
                                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status</th>
                                <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.length > 0 ? filteredData.map((dept) => (
                                <tr key={dept._id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                                <Building className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-bold text-slate-900 leading-none">{dept.name}</p>
                                                <p className="text-[12px] text-slate-400 font-medium mt-1.5 line-clamp-1">{dept.description || "No description provided."}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-black rounded-lg uppercase tracking-wider">
                                            {dept.code}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${dept.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            <span className={`text-[12px] font-bold ${dept.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {dept.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setEditingDept(dept)
                                                    setFormData({
                                                        name: dept.name,
                                                        code: dept.code,
                                                        description: dept.description || "",
                                                        isActive: dept.isActive
                                                    })
                                                    setIsModalOpen(true)
                                                }}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(dept._id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                            <Building2 className="w-12 h-12 text-slate-300" strokeWidth={1} />
                                            <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest">No departments found matching your search</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal - Redesigned Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white border border-slate-200 rounded-3xl p-8 w-full max-w-lg shadow-2xl flex flex-col gap-8"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Plus className="w-6 h-6" strokeWidth={3} />
                                     </div>
                                     <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                                            {editingDept ? "Update Department" : "Create Department"}
                                        </h3>
                                        <p className="text-[13px] text-slate-500 font-medium mt-2">Enter the details below to Configure the division.</p>
                                     </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Dept Name</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Computer Science"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Dept Code</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. CS"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Description</label>
                                    <textarea
                                        placeholder="Brief overview of the department's focus..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all resize-none placeholder:text-slate-300"
                                    />
                                </div>

                                <div 
                                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                        formData.isActive 
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                        : 'bg-slate-50 border-slate-200 text-slate-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                            formData.isActive ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-transparent'
                                        }`}>
                                            {formData.isActive && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className="text-[13px] font-black uppercase tracking-widest">Active Department</span>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase opacity-60">
                                        {formData.isActive ? 'Visible to Users' : 'Hidden from Users'}
                                    </span>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 h-14 bg-slate-100 text-slate-600 rounded-2xl text-[13px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-2 px-8 h-14 bg-blue-600 text-white rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
                                    >
                                        {editingDept ? "Save Changes" : "Create division"}
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
