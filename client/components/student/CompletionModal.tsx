"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Award, Download, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface CompletionModalProps {
    open: boolean
    onClose: () => void
    courseName: string
    courseId: string
}

export default function CompletionModal({ open, onClose, courseName, courseId }: CompletionModalProps) {
    const router = useRouter()
    const confettiRef = useRef(false)

    useEffect(() => {
        if (!open || confettiRef.current) return
        confettiRef.current = true

        const fire = async () => {
            try {
                const confetti = (await import("canvas-confetti")).default
                const duration = 3000
                const end = Date.now() + duration
                const colors = ["#7c3aed", "#6d28d9", "#4f46e5", "#f59e0b", "#22c55e"]

                    ; (function frame() {
                        confetti({
                            particleCount: 4,
                            angle: 60,
                            spread: 55,
                            origin: { x: 0 },
                            colors,
                            scalar: 1.2
                        })
                        confetti({
                            particleCount: 4,
                            angle: 120,
                            spread: 55,
                            origin: { x: 1 },
                            colors,
                            scalar: 1.2
                        })
                        if (Date.now() < end) requestAnimationFrame(frame)
                    })()
            } catch (e) {
                // canvas-confetti not available - skip silently
            }
        }
        fire()
    }, [open])

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Course completion"
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                    {/* Modal */}
                    <motion.div
                        className="relative z-10 bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl shadow-purple-500/20"
                        initial={{ scale: 0.6, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Badge animation */}
                        <motion.div
                            className="mx-auto mb-6 relative"
                            animate={{ rotate: [0, -5, 5, -3, 3, 0] }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                        >
                            <motion.div
                                className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                            >
                                <Award className="h-12 w-12 text-white" />
                            </motion.div>
                            {/* Glow ring */}
                            <motion.div
                                className="absolute inset-0 rounded-full border-4 border-amber-400/30"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1.4, opacity: 0 }}
                                transition={{ delay: 0.3, duration: 1, repeat: Infinity }}
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <h2 className="text-2xl font-bold text-white mb-2">🎉 Congratulations!</h2>
                            <p className="text-slate-400 text-sm mb-1">You've completed</p>
                            <p className="text-white font-semibold text-lg mb-6 line-clamp-2">{courseName}</p>

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={() => { onClose(); router.push(`/student/certificates/${courseId}`) }}
                                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold gap-2"
                                >
                                    <Download className="h-4 w-4" /> View & Download Certificate
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2"
                                >
                                    <Eye className="h-4 w-4" /> Continue Browsing
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
