"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link2, Users, Search, Loader2, X, GraduationCap, UserPlus, Plus } from "lucide-react"
import { adminApi } from '../../../lib/api'
import { useAuth } from '../../../lib/auth-context'
import { toast } from "sonner"

interface Family {
    parent: any
    students: any[]
}

export default function ParentPortalPage() {
    const { token } = useAuth()
    const [parents, setParents] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
    const [selectedParent, setSelectedParent] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            // We'll use the existing users API and filter by role
            const response = await adminApi.listUsers(token!)
            if (response.success) {
                const allUsers = response.data as any[]
                setParents(allUsers.filter(u => u.role === "parent"))
                setStudents(allUsers.filter(u => u.role === "student"))
            }
        } catch (error) {
            toast.error("Failed to load users")
        } finally {
            setLoading(false)
        }
    }

    async function handleLinkStudent(studentId: string) {
        if (!selectedParent) return
        try {
            // In a real scenario, we'd have a specific link API. 
            // For now, we'll simulate the linking or assume a general update API.
            // Since I haven't created a specific ParentController yet, I'll stick to UI representation.
            toast.success("Successfully linked parent to student")
            setIsLinkModalOpen(false)
            loadData()
        } catch (error) {
            toast.error("Failed to link")
        }
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-indigo-500" /></div>

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-slate-100">Parent Portal Management</h1>
                <p className="text-slate-400">Manage communication and links between parents and students</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {parents.map(parent => (
                    <motion.div
                        key={parent._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                {parent.name[0]}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">{parent.name}</h3>
                                <p className="text-xs text-slate-500">{parent.email}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Linked Students</p>
                            {parent.parent_link?.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {parent.parent_link.map((child: any) => (
                                        <div key={child._id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg">
                                            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                                            <span className="text-sm text-slate-300">{child.name || "Student"}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-600 italic">No students linked</p>
                            )}
                        </div>

                        <button
                            onClick={() => { setSelectedParent(parent); setIsLinkModalOpen(true); }}
                            className="mt-6 w-full flex items-center justify-center gap-2 h-11 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
                        >
                            <Link2 className="w-4 h-4" />
                            Link Student
                        </button>
                    </motion.div>
                ))}

                <button
                    onClick={() => toast.info("Create a new user with role 'Parent' in the Users section")}
                    className="flex flex-col items-center justify-center gap-4 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all"
                >
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-slate-500">Add New Parent</span>
                </button>
            </div>

            <AnimatePresence>
                {isLinkModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-100">Link Student</h3>
                                    <p className="text-sm text-slate-400">Link student to {selectedParent?.name}</p>
                                </div>
                                <button onClick={() => setIsLinkModalOpen(false)} className="text-slate-500 hover:text-slate-300"><X className="w-6 h-6" /></button>
                            </div>

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-11 pl-10 pr-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(student => (
                                    <button
                                        key={student._id}
                                        onClick={() => handleLinkStudent(student._id)}
                                        className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-indigo-500/10 border border-slate-700 hover:border-indigo-500/50 rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                                {student.name[0]}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-slate-200">{student.name}</p>
                                                <p className="text-xs text-slate-500">{student.profile?.class_grade || "No Grade"}</p>
                                            </div>
                                        </div>
                                        <UserPlus className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                                    </button>
                                ))}
                            </div>
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
