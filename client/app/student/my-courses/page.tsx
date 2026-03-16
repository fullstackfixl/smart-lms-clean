"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { BookOpen, CheckCircle, Clock } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs'
import CourseCard from '../../../components/student/CourseCard'
import { toast } from "sonner"
import { useAuth } from '../../../lib/auth-context'
import { collegeApi } from '../../../lib/api'

import { API_URL } from '../../../lib/config'
const getToken = () =>
    typeof window !== "undefined"
        ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
        : null

export default function MyCourses() {
    const { user, token } = useAuth()
    const [enrolled, setEnrolled] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const isCollege = String(user?.organizationType || '').toUpperCase() === 'COLLEGE'

    const fetchMyCourses = useCallback(async () => {
        if (!token) return
        setLoading(true)
        try {
            if (isCollege) {
                const res = await collegeApi.getStudentCourses(token)
                if (res.success) {
                    const payload: any = res.data || {}
                    const courses = payload.courses || []
                    const normalized = courses.map((item: any) => {
                        if (item.course) return item
                        return { course: item, progress: item.progress || 0 }
                    })
                    setEnrolled(normalized)
                } else {
                    toast.error(res.error || "Failed to load your courses")
                }
            } else {
                const r = await fetch(`${API_URL}/student/my-courses`, {
                    headers: { Authorization: `Bearer ${getToken()}` },
                    credentials: "include"
                })
                const data = await r.json()
                if (data.success) {
                    const rawList = data.data?.courses || data.data || []
                    const normalized = rawList.map((item: any) => {
                        if (item.course) return item
                        return { course: item, progress: item.progress || 0 }
                    })
                    setEnrolled(normalized)
                } else {
                    toast.error(data.message || "Failed to load your courses")
                }
            }
        } catch (e) {
            toast.error("Failed to load your courses")
        } finally {
            setLoading(false)
        }
    }, [token, isCollege])

    useEffect(() => {
        fetchMyCourses()
    }, [fetchMyCourses])

    const inProgress = enrolled.filter(c => (c.progress || 0) < 100)
    const completed = enrolled.filter(c => (c.progress || 0) === 100)

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">My Learning</h1>
                <p className="text-slate-500 mt-1">Track your progress and continue where you left off.</p>
            </div>

            <Tabs defaultValue="in-progress" className="space-y-6">
                <TabsList className="bg-slate-100 p-1 border border-slate-200">
                    <TabsTrigger
                        value="in-progress"
                        className="data-[state=active]:bg-white data-[state=active]:text-[#4CAF50] data-[state=active]:shadow-sm px-6 py-2 font-bold"
                    >
                        In Progress ({inProgress.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="completed"
                        className="data-[state=active]:bg-white data-[state=active]:text-[#4CAF50] data-[state=active]:shadow-sm px-6 py-2 font-bold"
                    >
                        Completed ({completed.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="in-progress">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-80 bg-slate-50 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : inProgress.length === 0 ? (
                        <div className="py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-slate-800">No courses in progress</h3>
                            <p className="text-slate-500 mt-1">Visit the catalog to find your next course!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {inProgress.map((item, i) => (
                                <CourseCard
                                    key={item.course?._id || item._id}
                                    course={{ ...item.course, progress: item.progress }}
                                    variant="enrolled"
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="completed">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-80 bg-slate-50 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : completed.length === 0 ? (
                        <div className="py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <CheckCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-slate-800">No completed courses yet</h3>
                            <p className="text-slate-500 mt-1">Finish a course to earn your first certificate!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {completed.map((item, i) => (
                                <CourseCard
                                    key={item.course?._id || item._id}
                                    course={{ ...item.course, progress: item.progress }}
                                    variant="enrolled"
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
