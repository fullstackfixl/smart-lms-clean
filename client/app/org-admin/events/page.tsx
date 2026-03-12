"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Calendar, Edit2, Trash2, Loader2, X, Clock, MapPin } from "lucide-react"
import { collegeApi } from '../../../lib/api'
import { useAuth } from '../../../lib/auth-context'
import { DataTable, DataTableColumn } from '../../../components/instructor/data-table'
import { toast } from "sonner"

interface Event {
    _id: string
    title: string
    description?: string
    date: string
    endDate?: string
    location?: string
    departmentId?: {
        _id: string
        name: string
    }
    eventType?: string
    isActive: boolean
}

export default function EventsPage() {
    const { token, organization } = useAuth()
    const [data, setData] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        endDate: "",
        location: "",
        departmentId: "",
        eventType: "general"
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
                response = await collegeApi.listAdminEvents(token)
            } else {
                response = { success: true, data: [] }
            }
            if (response.success) {
                setData(response.data || [])
            }
        } catch (error) {
            console.error("Failed to load events:", error)
            toast.error("Failed to load events")
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const loadingToast = toast.loading(editingEvent ? "Updating event..." : "Creating event...")
        try {
            if (!token) throw new Error('No authentication token')
            const submitData = {
                ...formData,
                date: new Date(formData.date).toISOString(),
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined
            }
            if (editingEvent) {
                await collegeApi.updateEvent(token, editingEvent._id, submitData)
                toast.success("Event updated successfully", { id: loadingToast })
            } else {
                await collegeApi.createEvent(token, submitData)
                toast.success("Event created successfully", { id: loadingToast })
            }
            setIsModalOpen(false)
            setEditingEvent(null)
            setFormData({ title: "", description: "", date: "", endDate: "", location: "", departmentId: "", eventType: "general" })
            loadData()
        } catch (error) {
            toast.error(editingEvent ? "Failed to update" : "Failed to create", { id: loadingToast })
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this event?")) return
        const loadingToast = toast.loading("Deleting event...")
        try {
            if (!token) throw new Error('No authentication token')
            await collegeApi.deleteEvent(token, id)
            toast.success("Deleted successfully", { id: loadingToast })
            loadData()
        } catch (error) {
            toast.error("Failed to delete", { id: loadingToast })
        }
    }

    const columns: DataTableColumn<Event>[] = [
        { key: "title", label: "Event Title", sortable: true },
        { key: "eventType", label: "Type", sortable: true },
        { 
            key: "date", 
            label: "Date & Time",
            render: (val) => (
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{new Date(val).toLocaleDateString()}</span>
                </div>
            )
        },
        { 
            key: "location", 
            label: "Location",
            render: (val) => val ? (
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{val}</span>
                </div>
            ) : <span className="text-slate-500">-</span>
        },
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
                        Events
                    </h1>
                    <p className="text-slate-400">Manage organization events and announcements</p>
                </div>
                <button
                    onClick={() => {
                        setEditingEvent(null)
                        setFormData({ title: "", description: "", date: "", endDate: "", location: "", departmentId: "", eventType: "general" })
                        setIsModalOpen(true)
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-indigo-500/40 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Add Event
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
                                    setEditingEvent(row)
                                    setFormData({
                                        title: row.title,
                                        description: row.description || "",
                                        date: row.date ? new Date(row.date).toISOString().slice(0, 16) : "",
                                        endDate: row.endDate ? new Date(row.endDate).toISOString().slice(0, 16) : "",
                                        location: row.location || "",
                                        departmentId: row.departmentId?._id || "",
                                        eventType: row.eventType || "general"
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
                                    {editingEvent ? "Edit Event" : "New Event"}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Event Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Annual College Fest"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Event Type</label>
                                    <select
                                        value={formData.eventType}
                                        onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                                        className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    >
                                        <option value="general">General</option>
                                        <option value="academic">Academic</option>
                                        <option value="sports">Sports</option>
                                        <option value="cultural">Cultural</option>
                                        <option value="workshop">Workshop</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Event description..."
                                        className="w-full min-h-[80px] p-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Start Date</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">End Date (Optional)</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Location</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Main Auditorium"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full h-11 px-4 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
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
                                        {editingEvent ? "Save Changes" : "Create Event"}
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
