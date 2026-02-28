"use client"
import { motion } from "framer-motion"
import { Award, Download, Users } from "lucide-react"

export default function CertificatesPage() {
    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-2">
                    Certificates
                </h1>
                <p className="text-slate-400">Manage and issue completion certificates to your students.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Certificates Issued", value: "—", icon: Award, color: "from-yellow-500 to-amber-500" },
                    { label: "Students Certified", value: "—", icon: Users, color: "from-indigo-500 to-purple-600" },
                    { label: "Downloads", value: "—", icon: Download, color: "from-blue-500 to-cyan-500" },
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
                <Award className="w-16 h-16 text-yellow-500/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">Certificate Management Coming Soon</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                    Design, issue, and verify completion certificates for students who finish your courses.
                </p>
            </div>
        </div>
    )
}
