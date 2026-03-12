"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Calendar, Edit2, Trash2, Loader2, X, Clock, MapPin, RefreshCw } from "lucide-react"
import { collegeApi } from '../../../lib/api'
import { useAuth } from '../../../lib/auth-context'
import { DataTable, DataTableColumn } from '../../../components/instructor/data-table'
import { Button } from '../../../components/ui/button'
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
                const payload = response.data as any
                const eventsData = payload?.events || payload || []
                setData(Array.isArray(eventsData) ? eventsData : [])
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Events</h1>
                    <p className="text-slate-500 mt-1">Manage organization events and announcements.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadData} className="border-gray-200">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => {
                            setEditingEvent(null)
                            setFormData({ title: "", description: "", date: "", endDate: "", location: "", departmentId: "", eventType: "general" })
                            setIsModalOpen(true)
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4 stroke-[1.5]" />
                        Add Event
                    </Button>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Event Title</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date &amp; Time</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Location</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="h-48 text-center text-slate-400">
                                    No events found.
                                </td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr key={row._id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                <span>{row.title}</span>
                                            </div>
                                            {row.description ? (
                                                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{row.description}</p>
                                            ) : null}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {row.eventType || 'general'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <span>{row.date ? new Date(row.date).toLocaleString() : '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {row.location ? (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                                <span className="line-clamp-1">{row.location}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-blue-600 hover:bg-blue-50"
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
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(row._id)}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
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
                                    {editingEvent ? "Edit Event" : "New Event"}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-900">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Event Title</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Annual College Fest"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Event Type</label>
                                    <select
                                        value={formData.eventType}
                                        onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                                        className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="general">General</option>
                                        <option value="academic">Academic</option>
                                        <option value="sports">Sports</option>
                                        <option value="cultural">Cultural</option>
                                        <option value="workshop">Workshop</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Event description..."
                                        className="w-full min-h-[90px] p-3 bg-white border border-gray-200 rounded-md text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Start Date</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">End Date</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            className="w-full h-10 px-3 bg-white border border-gray-200 rounded-md text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Location</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Main Auditorium"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full h-10 px-4 bg-white border border-gray-200 rounded-md text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <Button type="button" variant="outline" className="flex-1 border-gray-200" onClick={() => setIsModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                                        {editingEvent ? "Save Changes" : "Create Event"}
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
