"use client"
import { motion } from "framer-motion"
import { Globe, BookOpen, TrendingUp } from "lucide-react"

export default function PublicCatalogPage() {
    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-2">
                    Public Catalog
                </h1>
                <p className="text-slate-400">Manage your publicly available course catalog for prospective students.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Published Courses", value: "—", icon: BookOpen, color: "from-indigo-500 to-purple-600" },
                    { label: "Catalog Views", value: "—", icon: Globe, color: "from-blue-500 to-cyan-500" },
                    { label: "Conversion Rate", value: "—", icon: TrendingUp, color: "from-emerald-500 to-teal-500" },
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
                <Globe className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">Public Catalog Coming Soon</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                    Configure which courses appear in your public storefront. Students can browse and enroll directly.
                </p>
            </div>
        </div>
    )
}
