"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Award, Download, ChevronLeft, Loader2, CheckCircle, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

const API = () => (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "")
const getToken = () =>
    typeof window !== "undefined"
        ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
        : null

interface CertificateData {
    studentName: string
    studentEmail: string
    courseTitle: string
    instructorName: string
    organizationName: string
    completionDate: string
    enrollmentId: string
    progress: number
}

export default function CertificatePage() {
    const router = useRouter()
    const params = useParams()
    const courseId = params?.courseId as string

    const [loading, setLoading] = useState(true)
    const [certificate, setCertificate] = useState<CertificateData | null>(null)
    const [error, setError] = useState<string | null>(null)

    const fetchCertificate = useCallback(async () => {
        if (!courseId) return
        setLoading(true)
        try {
            const r = await fetch(`${API()}/student/certificate/${courseId}`, {
                headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
                credentials: "include"
            })
            const data = await r.json()
            if (data.success) {
                setCertificate(data.data.certificate)
            } else {
                setError(data.message || "Certificate not available")
            }
        } catch {
            setError("Failed to load certificate")
        } finally {
            setLoading(false)
        }
    }, [courseId])

    useEffect(() => { fetchCertificate() }, [fetchCertificate])

    const handlePrint = () => {
        window.print()
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            year: "numeric", month: "long", day: "numeric"
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !certificate) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <Award className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Certificate Not Available</h2>
                    <p className="text-muted-foreground mb-6">{error || "You haven't completed this course yet."}</p>
                    <Button onClick={() => router.push("/student/dashboard")}>
                        <ChevronLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6">
            {/* Actions (hidden in print) */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between print:hidden">
                <Button variant="outline" onClick={() => router.back()}>
                    <ChevronLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button onClick={handlePrint}>
                    <Download className="h-4 w-4 mr-2" /> Download Certificate
                </Button>
            </div>

            {/* Certificate */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl mx-auto"
            >
                <Card className="shadow-2xl border-4 border-yellow-400/60 relative overflow-hidden">
                    {/* Decorative corners */}
                    <div className="absolute top-0 left-0 w-32 h-32 border-r-4 border-b-4 border-yellow-400/40 rounded-br-full" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 border-l-4 border-t-4 border-yellow-400/40 rounded-tl-full" />

                    <CardContent className="p-12 text-center relative z-10">
                        {/* Header */}
                        <div className="flex justify-center mb-6">
                            <div className="p-4 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500">
                                <Award className="h-14 w-14 text-white" />
                            </div>
                        </div>

                        <div className="mb-2">
                            <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                {certificate.organizationName}
                            </span>
                        </div>

                        <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                            Certificate of Completion
                        </h1>

                        <p className="text-muted-foreground mb-8 text-sm">This is to certify that</p>

                        <div className="border-b-2 border-yellow-400/60 mx-auto w-64 mb-4">
                            <h2 className="text-3xl font-bold text-foreground pb-2">{certificate.studentName}</h2>
                        </div>

                        <p className="text-muted-foreground mb-2 text-sm">has successfully completed the course</p>

                        <h3 className="text-2xl font-bold text-primary mb-8 max-w-lg mx-auto">
                            "{certificate.courseTitle}"
                        </h3>

                        <div className="flex justify-center gap-2 flex-wrap mb-8">
                            {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            ))}
                        </div>

                        <div className="flex justify-center gap-3 flex-wrap mb-10">
                            <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-1 rounded-full">
                                <CheckCircle className="h-4 w-4" /> 100% Complete
                            </div>
                        </div>

                        {/* Footer details */}
                        <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto border-t pt-8">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Instructor</p>
                                <p className="font-semibold text-sm">{certificate.instructorName}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Completion Date</p>
                                <p className="font-semibold text-sm">{formatDate(certificate.completionDate)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Certificate ID</p>
                                <p className="font-semibold text-sm font-mono text-xs">{certificate.enrollmentId.slice(-10).toUpperCase()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
        </div>
    )
}
