"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Search, Filter, BookOpen } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import CourseCard from "@/components/student/CourseCard"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { API_URL } from "@/lib/config"
const API = () => API_URL
const getToken = () =>
    typeof window !== "undefined"
        ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
        : null

export default function AvailableCourses() {
    const router = useRouter()
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [enrollingId, setEnrollingId] = useState<string | null>(null)

    const fetchCourses = useCallback(async () => {
        setLoading(true)
        try {
            const r = await fetch(`${API()}/api/courses/student`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                credentials: "include"
            })
            const data = await r.json()
            if (data.success) {
                setCourses(data.data?.courses || data.data || [])
            }
        } catch (e) {
            toast.error("Failed to fetch courses")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCourses()
    }, [fetchCourses])

    const handleEnroll = async (courseId: string) => {
        setEnrollingId(courseId)
        try {
            const r = await fetch(`${API()}/api/courses/enroll/${courseId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    "Content-Type": "application/json"
                },
                credentials: "include"
            })
            const data = await r.json()
            if (data.success) {
                toast.success("Succesfully enrolled!")
                router.push(`/student/course/${courseId}`)
            } else {
                toast.error(data.message || "Enrollment failed")
            }
        } catch {
            toast.error("Network error during enrollment")
        } finally {
            setEnrollingId(null)
        }
    }

    const filteredCourses = courses.filter((c: any) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Explore Courses</h1>
                    <p className="text-slate-500 mt-1">Discover new skills from top instructors worldwide.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search courses..."
                            className="pl-10 h-11 border-slate-200 focus:ring-[#4CAF50] focus:border-[#4CAF50] bg-white text-slate-800"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="h-11 border-slate-200 gap-2 font-medium text-slate-600 bg-white">
                        <Filter className="h-4 w-4" /> Filters
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="h-80 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />
                    ))}
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                        <BookOpen className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No courses found</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mt-2">
                        Try adjusting your search or filters to find what you&apos;re looking for.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCourses.map((course: any) => (
                        <CourseCard
                            key={course._id}
                            course={course}
                            variant="available"
                            onEnroll={handleEnroll}
                            enrolling={enrollingId === course._id}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
