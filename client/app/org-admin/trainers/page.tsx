"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, Mail, BookOpen, Edit2, Loader2, X, Award } from "lucide-react"
import { trainerApi } from '../../../lib/services/orgAdminApi'
import { useAuth } from '../../../lib/auth-context'
import { DataTable, DataTableColumn } from '../../../components/instructor/data-table'
import { toast } from "sonner"

export default function TrainersPage() {
    const { token } = useAuth()
    const [trainers, setTrainers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTrainer, setEditingTrainer] = useState<any>(null)
    const [formData, setFormData] = useState({ expertise: "", bio: "" })

    useEffect(() => {
        if (token) loadData()
    }, [token])

    async function loadData() {
        setLoading(true)
        try {
            if (!token) return
            const response = await trainerApi.list(token)
            if (response.success) {
                setTrainers(response.data)
            }
        } catch (error) {
            toast.error("Failed to load trainers")
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            if (!token) throw new Error('No authentication token')
            await trainerApi.updateExpertise(token, editingTrainer._id, formData)
            toast.success("Trainer profile updated")
            setIsModalOpen(false)
            loadData()
        } catch (error) {
            toast.error("Failed to update")
        }
    }

    const columns: DataTableColumn<any>[] = [
        {
            key: "name",
            label: "Trainer",
            render: (val, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">
                        {val[0]}
                    </div>
                    <div>
                        <p className="font-medium text-slate-200">{val}</p>
                        <p className="text-xs text-slate-500">{row.email}</p>
                    </div>
                </div>
            )
        },
        {
            key: "profile",
            label: "Expertise",
            render: (val) => (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/20">
                    {val?.expertise || "Not Set"}
                </span>
            )
        },
        {
            key: "status",
            label: "Status",
            render: (val) => (
                <span className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                    val === "active" ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-500"
                )}>
                    {val}
                </span>
            )
        }
    ]

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-indigo-500" /></div>

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-slate-100">Institute Trainers</h1>
                <p className="text-slate-400">Manage and oversee trainer expertise and profiles</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <DataTable
                    columns={columns}
                    data={trainers}
                    actions={(row) => (
                        <button
                            onClick={() => {
                                setEditingTrainer(row)
                                setFormData({
                                    expertise: row.profile?.expertise || "",
                                    bio: row.profile?.bio || ""
                                })
                                setIsModalOpen(true)
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-400 transition-all"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                />
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-100 italic">Edit Profile</h3>
                                    <p className="text-sm text-slate-400">{editingTrainer?.name}</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300"><X className="w-6 h-6" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Expertise</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Full Stack Web Development"
                                        value={formData.expertise}
                                        onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                                        className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Bio</label>
                                    <textarea
                                        placeholder="Short professional biography..."
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className="w-full h-32 p-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 resize-none outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-medium">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-600/20">Save Profile</button>
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
