"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Award, Download, ExternalLink, Calendar, BookOpen } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Link from "next/link"

const API = () => (process.env.NEXT_PUBLIC_API_URL || "https://smart-lms-clean-1.onrender.com").replace(/\/$/, "")
const getToken = () =>
  typeof window !== "undefined"
    ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
    : null

export default function CertificatesPage() {
  const [completedCourses, setCompletedCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCompleted = useCallback(async () => {
    try {
      const r = await fetch(`${API()}/student/my-courses`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: "include"
      })
      const data = await r.json()
      if (data.success) {
        const rawList = data.data?.courses || data.data || []
        // Filter only completed courses
        setCompletedCourses(rawList.filter((c: any) => (c.progress || 0) === 100))
      }
    } catch (e) {
      toast.error("Failed to load certificates")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompleted()
  }, [fetchCompleted])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">My certificates</h1>
        <p className="text-slate-500 mt-2">Display your hard-earned achievements and share them with the world.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-slate-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : completedCourses.length === 0 ? (
        <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
          <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="h-8 w-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No certificates yet</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-2">
            Finish all lessons in a course to earn your official completion certificate.
          </p>
          <Link href="/student/available-courses">
            <Button className="mt-8 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold h-11 px-8 rounded-full">
              Browse Courses
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedCourses.map((item: any) => (
            <motion.div key={item.course?._id} whileHover={{ y: -4 }}>
              <Card className="border-slate-100 bg-white shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="h-2 bg-[#4CAF50]" />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center">
                      <Award className="h-6 w-6 text-[#4CAF50]" />
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-0 font-bold">Earned</Badge>
                  </div>

                  <h3 className="font-bold text-slate-800 group-hover:text-[#4CAF50] transition-colors line-clamp-2 mb-2">
                    {item.course?.title}
                  </h3>

                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <Calendar className="h-3.5 w-3.5" />
                      Issued on {new Date(item.completedAt || item.lastAccessedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <BookOpen className="h-3.5 w-3.5" />
                      Verified by Smart LMS
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <Link href={`/student/certificates/${item.course?._id}`} className="w-full">
                      <Button variant="outline" className="w-full h-10 border-slate-200 text-slate-600 font-bold gap-2 text-xs rounded-lg">
                        <ExternalLink className="h-3.5 w-3.5" /> View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full h-10 border-[#4CAF50] text-[#4CAF50] hover:bg-green-50 font-bold gap-2 text-xs rounded-lg"
                      onClick={() => toast.info("Preparing PDF generation...")}
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
