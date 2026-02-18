"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { BookOpen, Clock, TrendingUp, Award, Loader2, PlayCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Enrollment {
  _id: string
  course: {
    _id: string
    title: string
    description: string
    thumbnail?: string
    instructor_id: {
      name: string
    }
    duration?: number
  }
  progress: {
    completionPercentage: number
    completedLessons: any[]
    totalLessons: number
    totalTimeSpent: number
  }
  enrolledAt: string
  lastAccessedAt?: string
  status: string
}

export default function StudentDashboardPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalHours: 0,
    averageProgress: 0
  })
  const router = useRouter()

  useEffect(() => {
    fetchEnrollments()
  }, [])

  const fetchEnrollments = async () => {
    setLoading(true)
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      
      if (!token) {
        toast.error('Please login first')
        router.push('/login')
        return
      }

      const response = await fetch(
        `http://localhost:5000/student/enrollments`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      )

      const data = await response.json()

      if (data.success) {
        const enrollmentsData = data.data.enrollments
        setEnrollments(enrollmentsData)

        // Calculate stats
        const totalCourses = enrollmentsData.length
        const completedCourses = enrollmentsData.filter((e: Enrollment) => e.status === 'completed').length
        const totalMinutes = enrollmentsData.reduce((sum: number, e: Enrollment) => 
          sum + (e.progress?.totalTimeSpent || 0), 0
        )
        const totalHours = Math.round(totalMinutes / 60)
        const averageProgress = totalCourses > 0
          ? Math.round(enrollmentsData.reduce((sum: number, e: Enrollment) => 
              sum + (e.progress?.completionPercentage || 0), 0) / totalCourses)
          : 0

        setStats({
          totalCourses,
          completedCourses,
          totalHours,
          averageProgress
        })
      } else {
        toast.error(data.message || 'Failed to load enrollments')
      }
    } catch (error) {
      console.error('Fetch enrollments error:', error)
      toast.error('Failed to load enrollments')
    } finally {
      setLoading(false)
    }
  }

  const handleContinueLearning = (courseId: string) => {
    router.push(`/student/courses/${courseId}`)
  }

  const handleBrowseCourses = () => {
    router.push('/student/courses')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Track your learning progress and continue your courses</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Courses</p>
                    <p className="text-3xl font-bold">{stats.totalCourses}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Completed</p>
                    <p className="text-3xl font-bold">{stats.completedCourses}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Learning Hours</p>
                    <p className="text-3xl font-bold">{stats.totalHours}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Avg Progress</p>
                    <p className="text-3xl font-bold">{stats.averageProgress}%</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Enrolled Courses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Courses</CardTitle>
              <Button onClick={handleBrowseCourses}>
                Browse Courses
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
                <p className="text-muted-foreground mb-6">Start your learning journey by enrolling in a course</p>
                <Button onClick={handleBrowseCourses}>
                  Explore Courses
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.map((enrollment, index) => (
                  <motion.div
                    key={enrollment._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex gap-6">
                          {/* Thumbnail */}
                          <div className="flex-shrink-0">
                            <div className="w-32 h-24 rounded-lg overflow-hidden bg-muted">
                              {enrollment.course.thumbnail ? (
                                <img
                                  src={enrollment.course.thumbnail}
                                  alt={enrollment.course.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Course Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg mb-1">{enrollment.course.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {enrollment.course.instructor_id?.name || 'Unknown Instructor'}
                                </p>
                              </div>
                              {enrollment.status === 'completed' && (
                                <Badge className="bg-green-500">Completed</Badge>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {enrollment.course.description}
                            </p>

                            {/* Progress */}
                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">
                                  {enrollment.progress?.completionPercentage || 0}%
                                </span>
                              </div>
                              <Progress value={enrollment.progress?.completionPercentage || 0} />
                              <p className="text-xs text-muted-foreground mt-1">
                                {enrollment.progress?.completedLessons?.length || 0} of {enrollment.progress?.totalLessons || 0} lessons completed
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                              <Button
                                onClick={() => handleContinueLearning(enrollment.course._id)}
                                size="sm"
                              >
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Continue Learning
                              </Button>
                              {enrollment.lastAccessedAt && (
                                <span className="text-xs text-muted-foreground">
                                  Last accessed: {new Date(enrollment.lastAccessedAt).toLocaleDateString()}
                                </span>
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
