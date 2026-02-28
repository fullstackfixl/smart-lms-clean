"use client"
import { motion } from "framer-motion"
import { TrendingUp, Users, BarChart3 } from "lucide-react"

export default function StudentAnalyticsPage() {
    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-2">
                    Student Analytics
                </h1>
                <p className="text-slate-400">In-depth analytics on student engagement, progress, and learning outcomes.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Active Learners", value: "—", icon: Users, color: "from-indigo-500 to-purple-600" },
                    { label: "Avg. Progress", value: "—", icon: TrendingUp, color: "from-emerald-500 to-teal-500" },
                    { label: "Completion Rate", value: "—", icon: BarChart3, color: "from-blue-500 to-cyan-500" },
                ].map((stat) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/80 border border-slate-800/50 rounded-2xl p-6 flex items-center gap-4"
                    >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                            <stat.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
                            <p className="text-sm text-slate-400">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-slate-900/80 border border-slate-800/50 rounded-2xl p-12 text-center">
                <TrendingUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">Student Analytics Coming Soon</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                    Deep dive into individual student progress, dropout points, and engagement heatmaps.
                </p>
            </div>
        </div>
    )
}
