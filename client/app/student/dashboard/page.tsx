"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen, Clock, TrendingUp, Award, Loader2, PlayCircle,
  Search, Star, ChevronRight, CheckCircle, GraduationCap, Users
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

const API = () => (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "")
const getToken = () =>
  typeof window !== "undefined"
    ? window.sessionStorage.getItem("instatute_token") || window.localStorage.getItem("instatute_token")
    : null

async function apiGet(path: string) {
  const r = await fetch(`${API()}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
    credentials: "include"
  })
  return r.json()
}

async function apiPost(path: string, body?: object) {
  const r = await fetch(`${API()}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined
  })
  return r.json()
}

interface Course {
  _id: string
  title: string
  description: string
  thumbnail?: string
  instructor_id?: { name: string }
  duration?: number
  rating?: { average: number; count: number }
  category?: string
  level?: string
  enrollmentCount?: number
  price?: number
}

interface EnrolledCourse {
  enrollmentId: string
  course: Course
  progress: number
  completedLessons: number
  totalLessons: number
  status: "active" | "completed"
  completedAt?: string
}

export default function StudentDashboardPage() {
  const [tab, setTab] = useState("my-learning")
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [myCourses, setMyCourses] = useState<EnrolledCourse[]>([])
  const [loadingAvail, setLoadingAvail] = useState(false)
  const [loadingMy, setLoadingMy] = useState(false)
  const [enrollingId, setEnrollingId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const router = useRouter()

  const fetchMyCourses = useCallback(async () => {
    setLoadingMy(true)
    try {
      const data = await apiGet("/student/my-courses")
      if (data.success) setMyCourses(data.data.courses || [])
      else toast.error(data.message || "Failed to load your courses")
    } catch { toast.error("Failed to load your courses") }
    finally { setLoadingMy(false) }
  }, [])

  const fetchAvailableCourses = useCallback(async () => {
    setLoadingAvail(true)
    try {
      const params = new URLSearchParams({ limit: "20" })
      if (search) params.append("search", search)
      const data = await apiGet(`/student/available-courses?${params}`)
      if (data.success) setAvailableCourses(data.data.courses || [])
      else toast.error(data.message || "Failed to load courses")
    } catch { toast.error("Failed to load available courses") }
    finally { setLoadingAvail(false) }
  }, [search])

  useEffect(() => { fetchMyCourses() }, [fetchMyCourses])
  useEffect(() => { if (tab === "available") fetchAvailableCourses() }, [tab, fetchAvailableCourses])

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId)
    try {
      const data = await apiPost(`/student/enroll/${courseId}`)
      if (data.success) {
        toast.success("Enrolled successfully!")
        await fetchMyCourses()
        await fetchAvailableCourses()
        setTab("my-learning")
      } else {
        toast.error(data.error || data.message || "Enrollment failed")
      }
    } catch { toast.error("Enrollment failed") }
    finally { setEnrollingId(null) }
  }

  // Stats
  const totalCourses = myCourses.length
  const completedCourses = myCourses.filter(c => c.status === "completed").length
  const avgProgress = totalCourses > 0
    ? Math.round(myCourses.reduce((sum, c) => sum + c.progress, 0) / totalCourses)
    : 0

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">Student Dashboard</h1>
          <p className="text-muted-foreground">Track your learning and discover new courses</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Enrolled Courses", value: totalCourses, icon: BookOpen, color: "blue" },
            { label: "Completed", value: completedCourses, icon: Award, color: "green" },
            { label: "Avg Progress", value: `${avgProgress}%`, icon: TrendingUp, color: "purple" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/20 flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="my-learning" className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" /> My Learning
              {totalCourses > 0 && <Badge variant="secondary" className="ml-1">{totalCourses}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="available" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Available Courses
            </TabsTrigger>
          </TabsList>

          {/* MY LEARNING */}
          <TabsContent value="my-learning">
            {loadingMy ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : myCourses.length === 0 ? (
              <div className="text-center py-20">
                <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-6">Browse available courses and start learning</p>
                <Button onClick={() => setTab("available")}>Explore Courses</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myCourses.map((item, i) => (
                  <motion.div key={item.enrollmentId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex gap-5">
                          <div className="flex-shrink-0 w-28 h-20 rounded-lg overflow-hidden bg-muted">
                            {item.course?.thumbnail
                              ? <img src={item.course.thumbnail} alt={item.course.title} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center"><BookOpen className="h-8 w-8 text-muted-foreground" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="font-semibold text-lg leading-tight">{item.course?.title}</h3>
                              {item.status === "completed" && <Badge className="bg-green-500 ml-2 shrink-0">✓ Completed</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{item.course?.instructor_id?.name}</p>
                            <div className="mb-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{item.completedLessons}/{item.totalLessons} lessons ({item.progress}%)</span>
                              </div>
                              <Progress value={item.progress} className="h-2" />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => router.push(`/student/course/${item.course._id}`)}>
                                <PlayCircle className="h-4 w-4 mr-1" />
                                {item.status === "completed" ? "Review" : "Continue"}
                              </Button>
                              {item.status === "completed" && (
                                <Button size="sm" variant="outline" onClick={() => router.push(`/student/certificates/${item.course._id}`)}>
                                  <Award className="h-4 w-4 mr-1" /> Certificate
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* AVAILABLE COURSES */}
          <TabsContent value="available">
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && fetchAvailableCourses()}
                  className="pl-9"
                />
              </div>
              <Button onClick={fetchAvailableCourses} variant="outline">Search</Button>
            </div>

            {loadingAvail ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : availableCourses.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No courses available</h3>
                <p className="text-muted-foreground">Check back later for new courses</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {availableCourses.map((course, i) => (
                  <motion.div key={course._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                      <div className="relative h-44 bg-muted rounded-t-lg overflow-hidden">
                        {course.thumbnail
                          ? <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><BookOpen className="h-12 w-12 text-muted-foreground" /></div>}
                        {course.level && <Badge variant="secondary" className="absolute top-2 left-2 capitalize">{course.level}</Badge>}
                      </div>
                      <CardContent className="p-4 flex-1">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{course.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{course.description}</p>
                        <p className="text-sm font-medium mb-3">{course.instructor_id?.name}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {course.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration}m</span>}
                          {course.rating && course.rating.average > 0 && (
                            <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{course.rating.average.toFixed(1)}</span>
                          )}
                          {course.enrollmentCount !== undefined && (
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.enrollmentCount}</span>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex gap-2">
                        <Button
                          className="flex-1"
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/student/course/${course._id}`)}
                        >
                          Preview
                        </Button>
                        <Button
                          className="flex-1"
                          size="sm"
                          disabled={enrollingId === course._id}
                          onClick={() => handleEnroll(course._id)}
                        >
                          {enrollingId === course._id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enroll Free"}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
