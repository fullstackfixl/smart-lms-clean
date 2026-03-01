"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BarChart3, TrendingDown, Users, GraduationCap, Building2, AlertTriangle, Loader2 } from "lucide-react"
import { gpaApi } from '../../../lib/services/orgAdminApi'
import { DataTable, DataTableColumn } from '../../../components/instructor/data-table'
import { toast } from "sonner"

export default function GPAReportsPage() {
    const [stats, setStats] = useState<any>(null)
    const [atRisk, setAtRisk] = useState<any[]>([])
    const [deptStats, setDeptStats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            const [statsRes, riskRes, deptRes] = await Promise.all([
                gpaApi.getStats(),
                gpaApi.getAtRisk(),
                gpaApi.getDepartments()
            ])
            if (statsRes.success) setStats(statsRes.data)
            if (riskRes.success) setAtRisk(riskRes.data)
            if (deptRes.success) setDeptStats(deptRes.data)
        } catch (error) {
            toast.error("Failed to load reports")
        } finally {
            setLoading(false)
        }
    }

    const riskColumns: DataTableColumn<any>[] = [
        {
            key: "student_name",
            label: "Student",
            render: (val, row) => (
                <div>
                    <p className="font-medium text-slate-200">{val}</p>
                    <p className="text-xs text-slate-500">{row.student_email}</p>
                </div>
            )
        },
        { key: "course_title", label: "Course" },
        {
            key: "current_percentage",
            label: "Score",
            render: (val) => (
                <span className="text-red-400 font-bold">{val}%</span>
            )
        },
        {
            key: "letter_grade",
            label: "Grade",
            render: (val) => (
                <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-xs font-bold">{val}</span>
            )
        }
    ]

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-indigo-500" /></div>

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-slate-100">GPA Reports</h1>
                <p className="text-slate-400">Academic performance analytics for your college</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Avg. Percentage" value={`${stats?.avg_percentage || 0}%`} icon={BarChart3} color="indigo" />
                <StatCard title="Avg. GPA" value={stats?.avg_gpa || "0.0"} icon={GraduationCap} color="purple" />
                <StatCard title="At-Risk Students" value={atRisk.length} icon={TrendingDown} color="red" />
                <StatCard title="Total Students" value={stats?.total_students || 0} icon={Users} color="blue" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            At-Risk Students
                        </h2>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden text-sm">
                        <DataTable columns={riskColumns} data={atRisk} />
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-500" />
                        Performance by Department
                    </h2>
                    <div className="space-y-4">
                        {deptStats.map(dept => (
                            <div key={dept._id} className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h4 className="font-bold text-slate-200">{dept._id || "General"}</h4>
                                        <p className="text-xs text-slate-500">{dept.student_count} Students</p>
                                    </div>
                                    <span className="text-2xl font-black text-indigo-400">{dept.avg_gpa?.toFixed(2) || "0.00"}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(dept.avg_gpa / 4) * 100}%` }}
                                        className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, color }: any) {
    const colors: any = {
        indigo: "from-indigo-500 to-indigo-600 shadow-indigo-500/20",
        purple: "from-purple-500 to-purple-600 shadow-purple-500/20",
        red: "from-red-500 to-red-600 shadow-red-500/20",
        blue: "from-blue-500 to-blue-600 shadow-blue-500/20"
    }
    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl group hover:border-slate-700 transition-all">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white mb-4 shadow-lg`}>
                <Icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-100">{value}</h3>
        </div>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
