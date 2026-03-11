"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Trophy, Award, Medal, Crown, Star, Loader2 } from "lucide-react"
import { leaderboardApi } from '../../../lib/services/orgAdminApi'
import { useAuth } from '../../../lib/auth-context'
import { toast } from "sonner"

export default function LeaderboardPage() {
    const { token } = useAuth()
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (token) loadData()
    }, [token])

    async function loadData() {
        setLoading(true)
        try {
            if (!token) return
            const response = await leaderboardApi.getGlobal(token)
            if (response.success) {
                setData(response.data)
            }
        } catch (error) {
            toast.error("Failed to load leaderboard")
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-indigo-500" /></div>

    return (
        <div className="space-y-12">
            <div className="text-center">
                <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent mb-4">
                    Institute Leaderboard
                </h1>
                <p className="text-slate-400 text-lg">Top performers across all courses and tests</p>
            </div>

            <div className="flex flex-wrap justify-center items-end gap-6 mb-16">
                {data.slice(0, 3).map((student, idx) => {
                    const positions: any = {
                        0: { h: "h-64", order: "order-2", color: "from-yellow-400 to-amber-600", icon: Crown, label: "1st" },
                        1: { h: "h-52", order: "order-1", color: "from-slate-300 to-slate-500", icon: Medal, label: "2nd" },
                        2: { h: "h-44", order: "order-3", color: "from-orange-400 to-amber-700", icon: Medal, label: "3rd" }
                    }
                    const pos = positions[idx]
                    const Icon = pos.icon

                    return (
                        <motion.div
                            key={student._id}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.2 }}
                            className={`relative flex flex-col items-center group ${pos.order}`}
                        >
                            <div className="relative mb-6">
                                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-b from-indigo-500 to-purple-600 shadow-2xl overflow-hidden">
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-3xl font-black text-white">
                                        {student.name[0]}
                                    </div>
                                </div>
                                <div className={`absolute -top-4 -right-2 w-10 h-10 rounded-full bg-gradient-to-br ${pos.color} flex items-center justify-center shadow-lg border-4 border-slate-950`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <div className={`w-36 ${pos.h} bg-gradient-to-b from-slate-900 to-slate-950 border-x border-t border-slate-800 rounded-t-3xl flex flex-col items-center pt-8 shadow-2xl`}>
                                <span className="text-2xl font-black text-slate-100 mb-1">{pos.label}</span>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{student.totalPoints} PTS</p>
                                <p className="mt-4 px-2 text-sm font-semibold text-slate-200 text-center line-clamp-1">{student.name}</p>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            <div className="max-w-4xl mx-auto space-y-3">
                {data.slice(3).map((student, idx) => (
                    <motion.div
                        key={student._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                        className="flex items-center gap-6 p-4 bg-slate-900/50 border border-slate-800/50 rounded-2xl hover:bg-slate-900 hover:border-indigo-500/50 transition-all group"
                    >
                        <span className="w-8 text-xl font-black text-slate-600 group-hover:text-indigo-400">#{idx + 4}</span>
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold">
                            {student.name[0]}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-200">{student.name}</h4>
                            <p className="text-xs text-slate-500">{student.email}</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 text-indigo-400">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-lg font-black tracking-tighter">{student.totalPoints}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Points</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
