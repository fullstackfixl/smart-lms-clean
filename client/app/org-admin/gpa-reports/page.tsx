"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    BarChart3, TrendingDown, Users, GraduationCap,
    Building2, AlertTriangle, Loader2, RefreshCw,
    Search, Filter, Download, ArrowUpRight, ArrowDownRight
} from "lucide-react"
import { gpaApi } from '../../../lib/services/orgAdminApi'
import { toast } from "sonner"

const COLORS = {
    indigo: "from-indigo-500 to-blue-600",
    purple: "from-purple-500 to-indigo-600",
    red: "from-rose-500 to-red-600",
    emerald: "from-emerald-400 to-teal-600"
}

export default function GPAReportsPage() {
    const [stats, setStats] = useState<any>(null)
    const [atRisk, setAtRisk] = useState<any[]>([])
    const [deptStats, setDeptStats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

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

    const handleRefresh = async () => {
        setRefreshing(true)
        await loadData()
        setRefreshing(false)
        toast.success("Data refreshed")
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
            <p className="text-slate-500 font-medium animate-pulse">Aggregating academic data...</p>
        </div>
    )

    return (
        <div className="space-y-10 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <BarChart3 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
                                GPA & Performance Analytics
                            </h1>
                            <p className="text-slate-400 text-sm">Real-time academic monitoring across your college</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white transition-all hover:bg-slate-800"
                    >
                        <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/20">
                        <Download className="h-4 w-4" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Stats Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard tile="Avg. Percentage" value={`${stats?.avg_percentage || 0}%`} icon={BarChart3} color="indigo" trend="+2.4%" />
                <StatCard title="Avg. GPA" value={stats?.avg_gpa?.toFixed(2) || "0.00"} icon={GraduationCap} color="purple" trend="+0.1" />
                <StatCard title="At-Risk Students" value={atRisk.length} icon={TrendingDown} color="red" trend={`${atRisk.length > 5 ? 'High' : 'Low'}`} isRisk />
                <StatCard title="Total Students" value={stats?.total_students || 0} icon={Users} color="emerald" trend="Active" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* At-Risk Students Table */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-rose-500" />
                            Critical Intervention List
                        </h2>
                        <div className="text-xs font-semibold px-3 py-1 bg-rose-500/10 text-rose-500 rounded-full border border-rose-500/20">
                            Threshold: &lt; 60%
                        </div>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800/50 rounded-3xl overflow-hidden backdrop-blur-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-[10px] text-slate-500 uppercase tracking-widest border-b border-slate-800/50 bg-slate-800/20">
                                        <th className="px-8 py-4 font-bold">Student Identity</th>
                                        <th className="px-6 py-4 font-bold">Course / Subject</th>
                                        <th className="px-6 py-4 font-bold text-center">Current Score</th>
                                        <th className="px-6 py-4 font-bold text-center">Grade</th>
                                        <th className="px-8 py-4 font-bold text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/30">
                                    {atRisk.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-16 text-center text-slate-500">
                                                <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                                <p>No at-risk students identified currently.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        atRisk.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-rose-500/[0.02] transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-200 group-hover:text-white">{row.student_name}</p>
                                                        <p className="text-xs text-slate-500">{row.student_email}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-sm text-slate-400">{row.course_title}</span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-sm font-black text-rose-400">{row.current_percentage}%</span>
                                                        <div className="w-12 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                                                            <div className="h-full bg-rose-500" style={{ width: `${row.current_percentage}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-xs font-black border border-rose-500/20">
                                                        {row.letter_grade}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className="text-[10px] font-bold text-rose-400 uppercase">Action Needed</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Department Statistics */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-indigo-500" />
                        Performance by Department
                    </h2>

                    <div className="space-y-4">
                        {deptStats.map((dept, idx) => (
                            <motion.div
                                key={dept._id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-3xl backdrop-blur-sm group hover:border-indigo-500/30 transition-all hover:bg-slate-900/60"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-slate-200 text-lg group-hover:text-white transition-colors">
                                            {dept._id || "Unassigned"}
                                        </h4>
                                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                                            <Users className="h-3 w-3" />
                                            {dept.student_count} Students Enrolled
                                        </p>
                                    </div>
                                    <div className="bg-indigo-500/10 px-4 py-2 rounded-2xl border border-indigo-500/20">
                                        <span className="text-2xl font-black text-indigo-400">{dept.avg_gpa?.toFixed(2) || "0.00"}</span>
                                        <span className="text-[10px] text-slate-500 ml-1 font-bold">GPA</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-600">
                                        <span>Performance index</span>
                                        <span>{((dept.avg_gpa / 4) * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-[1px]">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(dept.avg_gpa / 4) * 100}%` }}
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {deptStats.length === 0 && (
                            <div className="text-center py-12 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
                                <Building2 className="h-10 w-10 mx-auto mb-3 opacity-10" />
                                <p className="text-slate-600 text-sm italic">Departmental data is being calculated...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, color, trend, isRisk }: any) {
    const colorClass = (COLORS as any)[color] || COLORS.indigo

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-slate-900/40 border border-slate-800/50 p-6 rounded-3xl group hover:border-indigo-500/30 transition-all backdrop-blur-sm shadow-xl"
        >
            <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white shadow-lg shadow-indigo-500/10 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${isRisk ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                    {isRisk ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-4xl font-black text-slate-100 group-hover:text-white transition-colors">{value}</h3>
            </div>
        </motion.div>
    )
}
