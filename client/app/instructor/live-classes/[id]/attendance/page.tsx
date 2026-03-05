"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
    Users, Calendar, Clock, CheckCircle, XCircle,
    Loader2, ChevronLeft, ShieldAlert, Edit2, Save
} from "lucide-react"
import { Button } from "../../../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card"
import { Badge } from "../../../../../components/ui/badge"
import { toast } from "sonner"
import { API_URL } from "../../../../../lib/config"

const getToken = () =>
    typeof window !== "undefined"
        ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
        : null

export default function InstructorAttendancePage() {
    const { id } = useParams()
    const router = useRouter()
    const [attendance, setAttendance] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [classInfo, setClassInfo] = useState<any>(null)
    const [editingId, setEditingId] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const classRes = await fetch(`${API_URL}/live-classes/${id}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                credentials: "include"
            })
            const classData = await classRes.json()
            if (classData.success) {
                setClassInfo(classData.data)
            }

            const attRes = await fetch(`${API_URL}/attendance/class/${id}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                credentials: "include"
            })
            const attData = await attRes.json()
            if (attData.success) {
                setAttendance(attData.data)
            }
        } catch {
            toast.error("Failed to load attendance data")
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleOverride = async (attId: string, newStatus: string) => {
        try {
            const r = await fetch(`${API_URL}/attendance/${attId}/override`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ status: newStatus })
            })
            const data = await r.json()
            if (data.success) {
                toast.success("Attendance updated")
                setEditingId(null)
                // Refresh local state
                setAttendance(prev => prev.map(a => a._id === attId ? { ...a, status: newStatus } : a))
            } else {
                toast.error(data.message)
            }
        } catch {
            toast.error("Failed to update status")
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                <p className="text-slate-500 font-medium">Loading participants detail...</p>
            </div>
        )
    }

    if (!classInfo) {
        return (
            <div className="p-10 text-center">
                <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold">Class not found</h2>
                <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-1 text-slate-500 hover:text-purple-600 transition-colors text-sm font-medium mb-2"
                    >
                        <ChevronLeft className="h-4 w-4" /> Back to Classes
                    </button>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Class <span className="text-purple-600">Attendance</span>
                    </h1>
                    <p className="text-slate-500 mt-1">{classInfo.title}</p>
                </div>

                <Card className="border-0 shadow-sm rounded-2xl bg-slate-50">
                    <CardContent className="p-4 flex gap-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900">{attendance.length}</p>
                            <p className="text-xs text-slate-500 uppercase font-semibold">Total Joined</p>
                        </div>
                        <div className="w-px bg-slate-200" />
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                                {attendance.filter(a => a.status === 'present').length}
                            </p>
                            <p className="text-xs text-slate-500 uppercase font-semibold">Present</p>
                        </div>
                        <div className="w-px bg-slate-200" />
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-500">
                                {attendance.filter(a => a.status === 'absent').length}
                            </p>
                            <p className="text-xs text-slate-500 uppercase font-semibold">Absent</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-200">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-600" />
                        Participation Records
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Join Time</th>
                                <th className="px-6 py-4">Leave Time</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {attendance.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        No participation recorded yet for this class.
                                        <p className="text-xs mt-1">Students will appear here as they join the live session.</p>
                                    </td>
                                </tr>
                            ) : (
                                attendance.map((att) => (
                                    <tr key={att._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-sm">
                                                    {att.studentId?.name?.charAt(0) || "S"}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{att.studentId?.name}</p>
                                                    <p className="text-xs text-slate-500">{att.studentId?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(att.joinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {att.leaveTime ? new Date(att.leaveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="text-slate-500 font-medium">
                                                {att.duration} min
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingId === att._id ? (
                                                <select
                                                    className="text-sm border rounded px-2 py-1 bg-white outline-none ring-2 ring-purple-100"
                                                    value={att.status}
                                                    onChange={(e) => handleOverride(att._id, e.target.value)}
                                                >
                                                    <option value="present">Present</option>
                                                    <option value="absent">Absent</option>
                                                </select>
                                            ) : (
                                                <Badge className={`${att.status === 'present'
                                                    ? "bg-green-100 text-green-700 border-green-200"
                                                    : "bg-red-100 text-red-700 border-red-200"
                                                    } capitalize`}>
                                                    {att.status}
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {editingId === att._id ? (
                                                <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                                                    Cancel
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setEditingId(att._id)}
                                                    className="hover:text-purple-600"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    )
}
