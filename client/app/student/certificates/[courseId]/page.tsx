"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { Download, Share2, Printer, Award, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"

const API = () => (process.env.NEXT_PUBLIC_API_URL || "https://smart-lms-clean-1.onrender.com").replace(/\/$/, "")
const getToken = () =>
    typeof window !== "undefined"
        ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
        : null

export default function CertificateDetail({ params }: { params: { courseId: string } }) {
    const [cert, setCert] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const certRef = useRef<HTMLDivElement>(null)

    const fetchCert = useCallback(async () => {
        try {
            const r = await fetch(`${API()}/student/certificate/${params.courseId}`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                credentials: "include"
            })
            const data = await r.json()
            if (data.success) {
                setCert(data.data.certificate)
            } else {
                toast.error(data.message || "Failed to load certificate")
            }
        } catch (e) {
            toast.error("Network error while loading certificate")
        } finally {
            setLoading(false)
        }
    }, [params.courseId])

    useEffect(() => {
        fetchCert()
    }, [fetchCert])

    const handlePrint = () => {
        window.print()
    }

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="h-10 w-10 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
        </div>
    )

    if (!cert) return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <Award className="h-16 w-16 text-slate-200 mb-4" />
            <h1 className="text-2xl font-bold text-slate-800">Certificate not found</h1>
            <p className="text-slate-500 mt-2">You may need to complete the course first.</p>
            <Link href="/student/my-courses">
                <Button className="mt-6 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold h-11 px-8 rounded-full">
                    Back to My Courses
                </Button>
            </Link>
        </div>
    )

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between no-print">
                <Link href="/student/certificates" className="text-slate-500 hover:text-[#4CAF50] transition-colors flex items-center gap-2 font-bold">
                    <ArrowLeft className="h-4 w-4" /> Back to Certificates
                </Link>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handlePrint} className="rounded-full border-slate-200 text-slate-600 font-bold h-10 px-6 gap-2">
                        <Printer className="h-4 w-4" /> Print
                    </Button>
                    <Button onClick={handlePrint} className="rounded-full bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold h-10 px-8 gap-2 shadow-md">
                        <Download className="h-4 w-4" /> Download PDF
                    </Button>
                </div>
            </div>

            {/* Certificate Frame */}
            <div
                ref={certRef}
                className="certificate-container bg-white shadow-2xl rounded-sm overflow-hidden relative border-[12px] border-double border-slate-100 p-1 md:p-2"
                style={{ aspectRatio: "1.414/1" }} // A4 Landscape ratio
            >
                <div className="h-full w-full border-2 border-slate-800 p-8 md:p-16 flex flex-col items-center text-center relative overflow-hidden">
                    {/* Decorative Corner Ornaments */}
                    <div className="absolute top-4 left-4 h-24 w-24 border-t-4 border-l-4 border-slate-300 opacity-30 rounded-tl-3xl" />
                    <div className="absolute top-4 right-4 h-24 w-24 border-t-4 border-r-4 border-slate-300 opacity-30 rounded-tr-3xl" />
                    <div className="absolute bottom-4 left-4 h-24 w-24 border-b-4 border-l-4 border-slate-300 opacity-30 rounded-bl-3xl" />
                    <div className="absolute bottom-4 right-4 h-24 w-24 border-b-4 border-r-4 border-slate-300 opacity-30 rounded-br-3xl" />

                    {/* Background Watermark Icon */}
                    <Award className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] text-slate-50 opacity-[0.03] pointer-events-none" />

                    {/* Header */}
                    <div className="mb-10 w-full flex flex-col items-center">
                        <div className="h-16 w-16 bg-[#4CAF50] rounded-full flex items-center justify-center mb-6 shadow-lg rotate-12">
                            <Award className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-black text-slate-800 tracking-tight uppercase mb-2">
                            Certificate of Completion
                        </h1>
                        <div className="h-1 w-40 bg-[#4CAF50]/30 mx-auto rounded-full" />
                    </div>

                    <p className="text-lg md:text-xl text-slate-500 font-medium italic mb-10">This is to certify that</p>

                    <h2 className="text-4xl md:text-6xl font-bold text-slate-900 border-b-2 border-slate-800 pb-4 mb-10 min-w-[300px]">
                        {cert.studentName}
                    </h2>

                    <p className="text-lg md:text-xl text-slate-500 font-medium mb-10 max-w-2xl">
                        has successfully completed the requirements for the course
                        <span className="block text-2xl md:text-3xl text-slate-800 font-bold mt-4">
                            &quot;{cert.courseTitle}&quot;
                        </span>
                    </p>

                    <div className="flex-1" />

                    {/* Footer Signatures */}
                    <div className="flex flex-col md:flex-row items-end justify-between w-full mt-10 md:px-12 gap-10">
                        <div className="text-left">
                            <div className="h-px w-48 bg-slate-400 mb-2" />
                            <p className="font-bold text-slate-800">{cert.instructorName}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-widest">Lead Instructor</p>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="relative h-24 w-24 mb-2">
                                <div className="absolute inset-0 bg-[#FFC107] opacity-10 rounded-full animate-pulse" />
                                <ShieldCheck className="h-24 w-24 text-[#FFC107]" strokeWidth={1} />
                                <CheckCircle2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-[#4CAF50]" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Verified Achievement</p>
                        </div>

                        <div className="text-right">
                            <div className="h-px w-48 bg-slate-400 mb-2" />
                            <p className="font-bold text-slate-800">{new Date(cert.completionDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-widest">Date of Issue</p>
                        </div>
                    </div>

                    {/* Verification Details */}
                    <div className="mt-12 text-[10px] text-slate-300 font-mono flex gap-6">
                        <span>CERT ID: {cert.enrollmentId.toString().toUpperCase()}</span>
                        <span>VERIFY AT: LMS.PLATFORM/VERIFY</span>
                    </div>
                </div>
            </div>

            {/* Share Section (No Print) */}
            <div className="no-print bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">Share your achievement</h3>
                    <p className="text-slate-500 text-sm">Let your network know about your new skill.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-full h-11 px-6 border-slate-200 text-slate-600 font-bold gap-2">
                        <Share2 className="h-4 w-4" /> Share on LinkedIn
                    </Button>
                    <Button variant="outline" className="rounded-full h-11 px-6 border-slate-200 text-slate-600 font-bold gap-2">
                        Twitter
                    </Button>
                </div>
            </div>

            {/* Styles for print */}
            <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .certificate-container { 
            box-shadow: none !important; 
            border-color: #f1f5f9 !important;
            width: 100% !important;
            height: auto !important;
            position: fixed !important;
            top: 0;
            left: 0;
          }
          @page {
            size: landscape;
            margin: 0;
          }
        }
      `}</style>
        </div>
    )
}
