"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle2, ArrowRight, Loader2, PartyPopper } from "lucide-react"
import Link from "next/link"

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const sessionId = searchParams.get("session_id")

    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Wait a brief moment to ensure webhook has processed
        const timer = setTimeout(() => {
            setLoading(false)
        }, 2000)
        return () => clearTimeout(timer)
    }, [sessionId])

    return (
        <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-emerald-500/10 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl shadow-emerald-500/5"
            >
                {loading ? (
                    <div className="space-y-6 py-8">
                        <Loader2 className="w-16 h-16 text-emerald-400 animate-spin mx-auto" />
                        <h1 className="text-2xl font-bold text-white tracking-tight">Processing your enrollment...</h1>
                        <p className="text-slate-400 text-sm">We are finalizing your access. Please do not close this window.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/50">
                            <CheckCircle2 className="w-10 h-10 text-white" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                                Order Successful! <PartyPopper className="w-6 h-6 text-orange-400" />
                            </h1>
                            <p className="text-slate-400 leading-relaxed">
                                Thank you for your purchase. You have been automatically enrolled in the course.
                            </p>
                        </div>

                        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 text-left">
                            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                <span>Status</span>
                                <span className="text-emerald-400">Paid & Enrolled</span>
                            </div>
                            <div className="flex justify-between text-sm text-slate-300">
                                <span>Course Access</span>
                                <span className="text-white">Lifetime</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Link
                                href="/my-courses"
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-xl shadow-emerald-500/10"
                            >
                                Go to My Courses
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <Link
                                href="/"
                                className="w-full py-4 text-slate-400 font-bold hover:text-white transition-colors"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
