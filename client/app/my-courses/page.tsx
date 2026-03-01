"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BookOpen, PlayCircle, Clock, Award, Loader2, Sparkles, BookMarked } from "lucide-react"
import { useAuth } from "../../lib/auth-context"
import { API_URL } from "../../lib/config"
import Link from "next/link"

interface Enrollment {
    _id: string
    course_id: {
        _id: string
        title: string
        description: string
        thumbnail: string
        category: string
    }
    progress: {
        completionPercentage: number
    }
    enrolledAt: string
}

export default function MyCoursesPage() {
    const { token, isAuthenticated, loading: authLoading } = useAuth()
    const [enrollments, setEnrollments] = useState<Enrollment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isAuthenticated && !authLoading) return

        async function fetchMyCourses() {
            try {
                const res = await fetch(`${API_URL}/api/courses/my/enrollments`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
                const data = await res.json()
                if (data.success) {
                    // Flatten or adapt the response if necessary
                    const list = data.data.courses.map((item: any) => ({
                        _id: item.enrollment._id,
                        course_id: item.course,
                        progress: item.enrollment.progress,
                        enrolledAt: item.enrollment.enrolledAt
                    }))
                    setEnrollments(list)
                }
            } catch (err) {
                console.error("Failed to load enrolled courses")
            } finally {
                setLoading(false)
            }
        }

        if (token) fetchMyCourses()
    }, [token, isAuthenticated, authLoading])

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0A0F1E] text-slate-200">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="w-5 h-5 text-orange-400" />
                        <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Student Portal</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">My Learning Journey</h1>
                    <p className="text-slate-400 mt-2">Access all your purchased courses and track your progress.</p>
                </header>

                {enrollments.length === 0 ? (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-16 text-center">
                        <BookMarked className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-2">No courses yet</h2>
                        <p className="text-slate-500 max-w-sm mx-auto mb-8">
                            You haven't enrolled in any courses from our marketplace yet. Start your learning journey today!
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-orange-500/10"
                        >
                            Browse Marketplace
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrollments.map((enrollment) => (
                            <motion.div
                                key={enrollment._id}
                                whileHover={{ y: -5 }}
                                className="group bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-orange-500/30 transition-all duration-300 flex flex-col"
                            >
                                <div className="aspect-video relative overflow-hidden">
                                    <img
                                        src={enrollment.course_id.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"}
                                        alt={enrollment.course_id.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                                    <div className="absolute bottom-4 left-4">
                                        <span className="px-2 py-1 bg-orange-500 text-white text-[10px] font-black uppercase rounded shadow-lg">
                                            {enrollment.course_id.category || "General"}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-orange-400 transition-colors">
                                        {enrollment.course_id.title}
                                    </h3>

                                    <div className="mt-4 space-y-4 flex-1">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-bold tracking-tight">
                                                <span className="text-slate-500 uppercase">Progress</span>
                                                <span className="text-orange-400">{enrollment.progress?.completionPercentage || 0}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${enrollment.progress?.completionPercentage || 0}%` }}
                                                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>Joined {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Award className="w-3.5 h-3.5" />
                                                <span>Certificate</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/learning/${enrollment.course_id._id}`}
                                        className="mt-6 w-full py-3.5 bg-slate-800 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <PlayCircle className="w-4 h-4 group-hover:fill-current" />
                                        Continue Learning
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
