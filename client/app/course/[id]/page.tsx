"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
    Star, Users, Clock, Globe, ShieldCheck,
    ChevronRight, Play, Lock, CheckCircle2,
    ArrowLeft, ShoppingCart, Loader2
} from "lucide-react"
import { useAuth } from "../../../lib/auth-context"
import { API_URL } from "../../../lib/config"

interface Course {
    _id: string
    title: string
    description: string
    marketplacePrice: number
    category: string
    level: string
    thumbnail: string
    enrollmentCount: number
    rating?: { average?: number; count?: number }
    instructor_id?: {
        profile?: { firstName: string; lastName: string; bio?: string; avatar?: string }
    }
    organization_id?: { name: string; description?: string }
}

export default function CourseDetailsPage() {
    const { id } = useParams()
    const router = useRouter()
    const { user, token, isAuthenticated } = useAuth()

    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [buying, setBuying] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchDetails() {
            try {
                const res = await fetch(`${API_URL}/api/marketplace/courses/${id}`)
                const data = await res.json()
                if (data.success) {
                    setCourse(data.data)
                } else {
                    setError(data.message || "Course not found")
                }
            } catch (err) {
                setError("Failed to load course details")
            } finally {
                setLoading(false)
            }
        }
        fetchDetails()
    }, [id])

    const handlePurchase = async () => {
        if (!isAuthenticated) {
            // Redirect to register/login with return url
            router.push(`/login?returnUrl=/course/${id}`)
            return
        }

        setBuying(true)
        try {
            const res = await fetch(`${API_URL}/api/marketplace/create-checkout-session`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ courseId: id })
            })
            const data = await res.json()
            if (data.success && data.data?.url) {
                window.location.href = data.data.url // Redirect to Stripe
            } else {
                alert(data.message || "Failed to initiate payment")
            }
        } catch (err) {
            alert("Network error. Please try again.")
        } finally {
            setBuying(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        )
    }

    if (error || !course) {
        return (
            <div className="min-h-screen bg-[#0A0F1E] flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-white mb-4">{error || "Course not found"}</h1>
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Marketplace
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0A0F1E] text-slate-200 selection:bg-orange-500/30">
            {/* Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
            </div>

            {/* Nav Placeholder / Back Button */}
            <nav className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 py-6">
                <button
                    onClick={() => router.push("/")}
                    className="group flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Marketplace
                </button>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8 pb-20">
                <div className="grid lg:grid-cols-12 gap-12">

                    {/* Left Column: Info */}
                    <div className="lg:col-span-7 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold rounded-full uppercase tracking-wider">
                                    {course.category}
                                </span>
                                <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold rounded-full uppercase tracking-wider">
                                    {course.level}
                                </span>
                            </div>

                            <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                                {course.title}
                            </h1>

                            <p className="text-lg text-slate-400 leading-relaxed">
                                {course.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-6 pt-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex text-yellow-500">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < (course.rating?.average || 5) ? 'fill-current' : 'opacity-30'}`} />
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold text-white">{course.rating?.average || 5.0}</span>
                                    <span className="text-sm text-slate-500">({course.rating?.count || 120} reviews)</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Users className="w-4 h-4" />
                                    <span className="font-medium">{course.enrollmentCount.toLocaleString()} Students Enrolled</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-indigo-500 p-[1px]">
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-orange-400">
                                        {course.instructor_id?.profile?.firstName?.[0] || "I"}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Instructor</p>
                                    <p className="text-sm font-bold text-white">
                                        {course.instructor_id?.profile?.firstName} {course.instructor_id?.profile?.lastName}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Curriculum Preview (Static for now) */}
                        <section className="space-y-6">
                            <h2 className="text-2xl font-bold text-white">Course Curriculum</h2>
                            <div className="space-y-3">
                                {[
                                    { title: "Introduction to the Course", duration: "12:40", isPreview: true },
                                    { title: "Setting up your environment", duration: "25:15", isPreview: true },
                                    { title: "Foundational Concepts", duration: "45:00", isPreview: false },
                                    { title: "Advanced Techniques & Implementation", duration: "1:12:00", isPreview: false },
                                    { title: "Final Project & Certification", duration: "2:00:00", isPreview: false },
                                ].map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-orange-400 transition-colors">
                                                {item.isPreview ? <Play className="w-4 h-4 fill-current" /> : <Lock className="w-4 h-4" />}
                                            </div>
                                            <span className={`text-sm font-medium ${item.isPreview ? 'text-slate-200' : 'text-slate-500'}`}>
                                                {item.title}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-slate-600 font-mono">{item.duration}</span>
                                            {item.isPreview && (
                                                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter border border-orange-500/30 px-1.5 py-0.5 rounded">Preview</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Checkout Card */}
                    <div className="lg:col-span-5">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="sticky top-8 rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl shadow-orange-500/5"
                        >
                            {/* Card Header / Image */}
                            <div className="aspect-video relative group">
                                <img
                                    src={course.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"}
                                    alt={course.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/50">
                                        <Play className="w-6 h-6 fill-current" />
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-8 space-y-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-white">₹{course.marketplacePrice}</span>
                                    <span className="text-slate-500 line-through text-lg">₹{(course.marketplacePrice * 1.5).toFixed(0)}</span>
                                    <span className="text-emerald-500 text-sm font-bold">33% OFF</span>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        onClick={handlePurchase}
                                        disabled={buying}
                                        className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold rounded-2xl shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {buying ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <ShoppingCart className="w-5 h-5" />
                                                Buy This Course
                                            </>
                                        )}
                                    </button>
                                    <p className="text-center text-[11px] text-slate-500">
                                        30-Day Money-Back Guarantee · Lifetime Access
                                    </p>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-800">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">This course includes:</h4>
                                    {[
                                        { icon: Globe, text: "Access on mobile and TV" },
                                        { icon: Clock, text: "Full lifetime access" },
                                        { icon: ShieldCheck, text: "Certificate of completion" },
                                        { icon: CheckCircle2, text: "Curated learning paths" }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm text-slate-400">
                                            <item.icon className="w-4 h-4 text-orange-500" />
                                            <span>{item.text}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4">
                                    <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                        <p className="text-xs text-slate-400 leading-relaxed italic">
                                            "Excellent curriculum designed by {course.organization_id?.name || 'Top Institutions'}. Perfect for career advancement."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </main>
        </div>
    )
}
