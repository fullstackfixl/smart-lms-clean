"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../../lib/auth-context"
import { API_URL } from "../../../lib/config"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
    BookOpen,
    PlayCircle,
    TrendingUp,
    Award,
    Clock,
    ArrowRight,
    Loader2
} from "lucide-react"

export default function PublicDashboard() {
    const { user, token } = useAuth()
    const router = useRouter()
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchPurchasedCourses() {
            if (!token) return
            try {
                const res = await fetch(`${API_URL}/api/student/courses`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
                const data = await res.json()
                if (data.success) {
                    setCourses(data.data || [])
                }
            } catch (err) {
                console.error("Failed to fetch courses", err)
            } finally {
                setLoading(false)
            }
        }
        fetchPurchasedCourses()
    }, [token])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0A0F1E] text-slate-200 p-6 lg:p-12">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <header className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-4xl lg:text-5xl font-black text-white">
                            Welcome back, <span className="text-orange-500">{user?.name}</span>
                        </h1>
                        <p className="text-slate-400 text-lg">Continue your learning journey today.</p>
                    </motion.div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: "My Courses", value: courses.length, icon: BookOpen, color: "text-blue-500" },
                        { label: "Hours Learned", value: "12.5", icon: Clock, color: "text-orange-500" },
                        { label: "Certificates", value: "0", icon: Award, color: "text-emerald-500" }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Courses Section */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <PlayCircle className="w-6 h-6 text-orange-500" />
                            My Purchased Courses
                        </h2>
                        <button
                            onClick={() => router.push("/")}
                            className="text-orange-500 hover:text-orange-400 font-bold text-sm flex items-center gap-2 group"
                        >
                            Browse More <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>

                    {courses.length === 0 ? (
                        <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                                <BookOpen className="w-8 h-8 text-slate-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">No courses yet</h3>
                                <p className="text-slate-500">Explore our marketplace to start learning.</p>
                            </div>
                            <button
                                onClick={() => router.push("/")}
                                className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors"
                            >
                                Go to Marketplace
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {courses.map((course: any, i) => (
                                <motion.div
                                    key={course._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all cursor-pointer"
                                    onClick={() => router.push(`/student/courses/${course._id}`)}
                                >
                                    <img
                                        src={course.thumbnail || "/course-placeholder.jpg"}
                                        alt={course.title}
                                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="p-6 space-y-4">
                                        <h3 className="font-bold text-lg text-white group-hover:text-orange-500 transition-colors">
                                            {course.title}
                                        </h3>
                                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                            <div className="bg-orange-500 h-full w-[10%]" />
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>10% Complete</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 2h left</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}
