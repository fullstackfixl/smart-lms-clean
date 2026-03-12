"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, LayoutGrid, ListTree, Edit2, Trash2, Loader2, X, Users } from "lucide-react"
import { schoolGradeApi } from '../../../lib/services/orgAdminApi'
import { useAuth } from '../../../lib/auth-context'
import { DataTable, DataTableColumn } from '../../../components/instructor/data-table'
import { toast } from "sonner"

interface GradeLevel {
    _id: string
    name: string
    code: string
    order: number
}

interface GradeSection {
    _id: string
    name: string
    grade_level_id: any
    room_number?: string
    capacity?: number
}

export default function GradesSectionsPage() {
    const { token } = useAuth()
    const [activeTab, setActiveTab] = useState<"levels" | "sections">("levels")
    const [levels, setLevels] = useState<GradeLevel[]>([])
    const [sections, setSections] = useState<GradeSection[]>([])
    const [loading, setLoading] = useState(true)
    const [isLevelModalOpen, setIsLevelModalOpen] = useState(false)
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false)

    const [editingLevel, setEditingLevel] = useState<GradeLevel | null>(null)
    const [levelFormData, setLevelFormData] = useState({ name: "", code: "", order: 1 })

    const [editingSection, setEditingSection] = useState<GradeSection | null>(null)
    const [sectionFormData, setSectionFormData] = useState({
        name: "",
        grade_level_id: "",
        room_number: "",
        capacity: 30
    })

    useEffect(() => {
        if (token) loadData()
    }, [token])

    async function loadData() {
        setLoading(true)
        try {
            if (!token) return
            const [levelsRes, sectionsRes] = await Promise.all([
                schoolGradeApi.listLevels(token),
                schoolGradeApi.listSections(token)
            ])
            if (levelsRes.success) setLevels(levelsRes.data)
            if (sectionsRes.success) setSections(sectionsRes.data)
        } catch (error) {
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    async function handleLevelSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            if (!token) throw new Error('No authentication token')
            if (editingLevel) {
                await schoolGradeApi.updateLevel(token, editingLevel._id, levelFormData)
                toast.success("Grade Level updated")
            } else {
                await schoolGradeApi.createLevel(token, levelFormData)
                toast.success("Grade Level created")
            }
            setIsLevelModalOpen(false)
            loadData()
        } catch (error) {
            toast.error("Operation failed")
        }
    }

    async function handleSectionSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            if (!token) throw new Error('No authentication token')
            if (editingSection) {
                await schoolGradeApi.updateSection(token, editingSection._id, sectionFormData)
                toast.success("Section updated")
            } else {
                await schoolGradeApi.createSection(token, sectionFormData)
                toast.success("Section created")
            }
            setIsSectionModalOpen(false)
            loadData()
        } catch (error) {
            toast.error("Operation failed")
        }
    }

    const levelColumns: DataTableColumn<GradeLevel>[] = [
        { key: "order", label: "Order", sortable: true },
        { key: "code", label: "Code", sortable: true },
        { key: "name", label: "Grade Name", sortable: true },
    ]

    const sectionColumns: DataTableColumn<GradeSection>[] = [
        { key: "name", label: "Section Name", sortable: true },
        {
            key: "grade_level_id",
            label: "Grade Level",
            render: (val) => val?.name || "N/A"
        },
        { key: "room_number", label: "Room" },
        { key: "capacity", label: "Capacity" },
    ]

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-indigo-500" /></div>

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-slate-100">Grades & Sections</h1>
                    <p className="text-slate-400">Manage school classes and their divisions</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => { setEditingLevel(null); setLevelFormData({ name: "", code: "", order: levels.length + 1 }); setIsLevelModalOpen(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 transition-all border border-slate-700"
                    >
                        <Plus className="w-4 h-4" /> Grade Level
                    </button>
                    <button
                        onClick={() => { setEditingSection(null); setSectionFormData({ name: "", grade_level_id: "", room_number: "", capacity: 30 }); setIsSectionModalOpen(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                    >
                        <Plus className="w-4 h-4" /> Section
                    </button>
                </div>
            </div>

            <div className="flex gap-1 p-1 bg-slate-900/50 border border-slate-800 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab("levels")}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium transition-all",
                        activeTab === "levels" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:text-slate-200"
                    )}
                >
                    <ListTree className="w-4 h-4" /> Grade Levels
                </button>
                <button
                    onClick={() => setActiveTab("sections")}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium transition-all",
                        activeTab === "sections" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-slate-400 hover:text-slate-200"
                    )}
                >
                    <LayoutGrid className="w-4 h-4" /> Sections
                </button>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
                {activeTab === "levels" ? (
                    <DataTable
                        columns={levelColumns}
                        data={levels}
                        actions={(row) => (
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingLevel(row); setLevelFormData({ name: row.name, code: row.code, order: row.order }); setIsLevelModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-400"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => schoolGradeApi.deleteLevel(token!, row._id).then(loadData)} className="p-2 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        )}
                    />
                ) : (
                    <DataTable
                        columns={sectionColumns}
                        data={sections}
                        actions={(row) => (
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingSection(row); setSectionFormData({ name: row.name, grade_level_id: row.grade_level_id?._id || "", room_number: row.room_number || "", capacity: row.capacity || 30 }); setIsSectionModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-400"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => schoolGradeApi.deleteSection(token!, row._id).then(loadData)} className="p-2 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        )}
                    />
                )}
            </div>

            <AnimatePresence>
                {isLevelModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
                            <h3 className="text-xl font-bold text-slate-100 mb-6">{editingLevel ? "Edit Grade Level" : "New Grade Level"}</h3>
                            <form onSubmit={handleLevelSubmit} className="space-y-4">
                                <input type="text" placeholder="Grade Name (e.g. Grade 10)" value={levelFormData.name} onChange={(e) => setLevelFormData({ ...levelFormData, name: e.target.value })} className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none" required />
                                <input type="text" placeholder="Code (e.g. G10)" value={levelFormData.code} onChange={(e) => setLevelFormData({ ...levelFormData, code: e.target.value.toUpperCase() })} className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none" required />
                                <input type="number" placeholder="Sort Order" value={levelFormData.order} onChange={(e) => setLevelFormData({ ...levelFormData, order: parseInt(e.target.value) })} className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none" required />
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setIsLevelModalOpen(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl">Save</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isSectionModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
                            <h3 className="text-xl font-bold text-slate-100 mb-6">{editingSection ? "Edit Section" : "New Section"}</h3>
                            <form onSubmit={handleSectionSubmit} className="space-y-4">
                                <select value={sectionFormData.grade_level_id} onChange={(e) => setSectionFormData({ ...sectionFormData, grade_level_id: e.target.value })} className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none" required>
                                    <option value="">Select Grade Level</option>
                                    {levels.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                </select>
                                <input type="text" placeholder="Section Name (e.g. Section A)" value={sectionFormData.name} onChange={(e) => setSectionFormData({ ...sectionFormData, name: e.target.value })} className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none" required />
                                <input type="text" placeholder="Room Number (Optional)" value={sectionFormData.room_number} onChange={(e) => setSectionFormData({ ...sectionFormData, room_number: e.target.value })} className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none" />
                                <input type="number" placeholder="Capacity" value={sectionFormData.capacity} onChange={(e) => setSectionFormData({ ...sectionFormData, capacity: parseInt(e.target.value) })} className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 outline-none" required />
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setIsSectionModalOpen(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
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
