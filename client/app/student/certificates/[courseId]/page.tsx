"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Download, Share2, ArrowLeft, Award, Loader2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const API = () => (process.env.NEXT_PUBLIC_API_URL || "https://smart-lms-clean-1.onrender.com").replace(/\/$/, "")
const getToken = () =>
    typeof window !== "undefined"
        ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
        : null

interface CertificateData {
    studentName: string
    courseName: string
    instructorName?: string
    organizationName?: string
    completionDate: string
    certificateId: string
    courseId: string
}

export default function CertificatePage() {
    const { courseId } = useParams<{ courseId: string }>()
    const router = useRouter()
    const certRef = useRef<HTMLDivElement>(null)
    const confettiDone = useRef(false)

    const [cert, setCert] = useState<CertificateData | null>(null)
    const [loading, setLoading] = useState(true)
    const [downloading, setDownloading] = useState(false)
    const [copied, setCopied] = useState(false)

    const fetchCert = useCallback(async () => {
        setLoading(true)
        try {
            const r = await fetch(`${API()}/student/certificate/${courseId}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                credentials: "include"
            })
            const data = await r.json()
            if (data.success) {
                // Backend returns: { certificate: { studentName, courseTitle, instructorName, organizationName, completionDate, enrollmentId } }
                const raw = data.data?.certificate || data.data || {}
                setCert({
                    studentName: raw.studentName || "Student",
                    courseName: raw.courseTitle || raw.courseName || "Course",
                    instructorName: raw.instructorName,
                    organizationName: raw.organizationName,
                    completionDate: raw.completionDate || new Date().toISOString(),
                    certificateId: raw.enrollmentId || raw.certificateId || raw._id || "N/A",
                    courseId,
                })
            } else {
                toast.error(data.message || "Certificate not available yet. Complete the course first.")
            }
        } catch { toast.error("Network error") }
        finally { setLoading(false) }
    }, [courseId])

    useEffect(() => { fetchCert() }, [fetchCert])

    // Confetti on first certificate load
    useEffect(() => {
        if (!cert || confettiDone.current) return
        confettiDone.current = true
        const fire = async () => {
            try {
                const confetti = (await import("canvas-confetti")).default
                confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 }, colors: ["#f59e0b", "#7c3aed", "#22c55e", "#fff"] })
                setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.5 } }), 400)
            } catch { }
        }
        fire()
    }, [cert])

    const handleDownload = async () => {
        if (!certRef.current || !cert) return
        setDownloading(true)
        try {
            const html2canvas = (await import("html2canvas")).default
            const { jsPDF } = await import("jspdf")

            const canvas = await html2canvas(certRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#0f172a"
            })
            const imgData = canvas.toDataURL("image/png")
            const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
            const w = pdf.internal.pageSize.getWidth()
            const h = pdf.internal.pageSize.getHeight()
            pdf.addImage(imgData, "PNG", 0, 0, w, h)
            pdf.save(`Certificate_${cert.courseName.replace(/\s+/g, "_")}.pdf`)
            toast.success("Certificate downloaded!")
        } catch (e) {
            toast.error("Download failed. Try again.")
            console.error(e)
        } finally { setDownloading(false) }
    }

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        toast.success("Certificate link copied!")
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
            </div>
        )
    }

    if (!cert) {
        return (
            <div className="text-center py-20 space-y-4">
                <Award className="h-16 w-16 text-slate-600 mx-auto" />
                <h3 className="text-xl font-semibold text-white">Certificate not available</h3>
                <p className="text-slate-400">Complete all lessons in the course to earn your certificate.</p>
                <Button onClick={() => router.push(`/student/course/${courseId}`)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                    Continue Course
                </Button>
            </div>
        )
    }

    const date = new Date(cert.completionDate).toLocaleDateString("en-US", {
        day: "numeric", month: "long", year: "numeric"
    })

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Nav */}
            <div className="flex items-center justify-between">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors" aria-label="Go back">
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyLink}
                        className="border-slate-700 text-slate-300 hover:text-white gap-2"
                        aria-label="Copy shareable link">
                        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copied!" : "Share Link"}
                    </Button>
                    <Button size="sm" onClick={handleDownload} disabled={downloading}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white gap-2"
                        aria-label="Download certificate as PDF">
                        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {downloading ? "Downloading..." : "Download PDF"}
                    </Button>
                </div>
            </div>

            {/* Certificate */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
            >
                {/* Printable area */}
                <div
                    ref={certRef}
                    className="relative overflow-hidden rounded-2xl"
                    style={{
                        background: "linear-gradient(135deg, #0f0a1e 0%, #0f172a 50%, #0a0f1e 100%)",
                        padding: "clamp(24px, 6vw, 64px)",
                        minHeight: "520px",
                        printColorAdjust: "exact",
                        WebkitPrintColorAdjust: "exact",
                    }}
                >
                    {/* Gold border */}
                    <div className="absolute inset-2 rounded-xl border-2 border-amber-500/40 pointer-events-none" />
                    <div className="absolute inset-3 rounded-xl border border-amber-500/20 pointer-events-none" />

                    {/* Decorative corner orbs */}
                    <div className="absolute top-0 left-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Content */}
                    <div className="relative text-center space-y-6" style={{ zIndex: 1 }}>
                        {/* Badge icon */}
                        <div className="flex justify-center">
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/30">
                                <Award className="h-10 w-10 text-white" />
                            </div>
                        </div>

                        {/* Header text */}
                        <div>
                            <p className="text-amber-400 text-xs uppercase tracking-[0.25em] font-semibold mb-2">
                                Certificate of Completion
                            </p>
                            <p className="text-slate-400 text-sm">This is to certify that</p>
                        </div>

                        {/* Student name */}
                        <div>
                            <h1
                                className="font-bold text-white"
                                style={{
                                    fontSize: "clamp(28px, 6vw, 48px)",
                                    textShadow: "0 0 40px rgba(251,191,36,0.3)",
                                    background: "linear-gradient(135deg, #ffffff, #e2d5f8)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                }}
                            >
                                {cert.studentName}
                            </h1>
                            <div className="mx-auto mt-3 h-0.5 w-32 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                        </div>

                        {/* Completion text */}
                        <div className="space-y-2">
                            <p className="text-slate-400 text-sm">has successfully completed</p>
                            <h2
                                className="font-bold text-white"
                                style={{ fontSize: "clamp(18px, 3vw, 28px)" }}
                            >
                                {cert.courseName}
                            </h2>
                        </div>

                        {/* Meta info */}
                        <div className="flex flex-wrap justify-center gap-6 text-sm">
                            {cert.instructorName && (
                                <div className="text-center">
                                    <p className="text-amber-400 text-xs uppercase tracking-wide mb-1">Instructor</p>
                                    <p className="text-white font-medium">{cert.instructorName}</p>
                                </div>
                            )}
                            {cert.organizationName && (
                                <div className="text-center">
                                    <p className="text-amber-400 text-xs uppercase tracking-wide mb-1">Issued by</p>
                                    <p className="text-white font-medium">{cert.organizationName}</p>
                                </div>
                            )}
                            <div className="text-center">
                                <p className="text-amber-400 text-xs uppercase tracking-wide mb-1">Date</p>
                                <p className="text-white font-medium">{date}</p>
                            </div>
                        </div>

                        {/* Certificate ID */}
                        <div className="pt-4 border-t border-slate-700/50">
                            <p className="text-slate-500 text-xs">Certificate ID: <span className="font-mono text-slate-400">{cert.certificateId}</span></p>
                        </div>

                        {/* Org logo placeholder */}
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <div className="h-6 w-6 rounded bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">S</span>
                            </div>
                            <span className="text-slate-400 text-xs">Smart LMS</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Print styles */}
            <style>{`
        @media print {
          body * { visibility: hidden; }
          [data-cert-print], [data-cert-print] * { visibility: visible; }
        }
      `}</style>
        </div>
    )
}
