"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Clock, Star, BookOpen, User, CheckCircle, Loader2, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { toast } from "sonner"
import { API_URL } from "@/lib/config"

interface Lesson {
  _id: string
  title: string
  description?: string
  type: string
  duration?: number
  order: number
  isPreview: boolean
}

interface Section {
  _id: string
  title: string
  description?: string
  order: number
  lessons: Lesson[]
}

interface Course {
  _id: string
  title: string
  description: string
  thumbnail?: string
  instructor_id: {
    name: string
    profile?: any
  }
  organization_id: {
    name: string
  }
  duration?: number
  rating?: {
    average: number
    count: number
  }
  category?: string
  level?: string
  totalLessons: number
}

interface CourseProgress {
  completionPercentage: number
  completedLessons: any[]
  totalLessons: number
}

export default function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const router = useRouter()
  const courseId = unwrappedParams.id

  const [course, setCourse] = useState<Course | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [progress, setProgress] = useState<CourseProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    fetchCourseDetails()
  }, [courseId])

  const fetchCourseDetails = async () => {
    setLoading(true)
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) {
        toast.error('Please login first')
        router.push('/login')
        return
      }

      const response = await fetch(
        `${API_URL}/student/course/${courseId}`,
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
        setCourse(data.data.course)
        setSections(data.data.sections)
        setIsEnrolled(data.data.isEnrolled)
        setProgress(data.data.progress)
      } else {
        toast.error(data.message || 'Failed to load course details')
        router.push('/student/courses')
      }
    } catch (error) {
      toast.error('Failed to load course details')
      router.push('/student/courses')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    setEnrolling(true)
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) {
        toast.error('Please login first')
        router.push('/login')
        return
      }

      const response = await fetch(
        `${API_URL}/api/courses/enroll/${courseId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      )

      const data = await response.json()

      if (data.success) {
        toast.success('Successfully enrolled in course!')
        setIsEnrolled(true)
        fetchCourseDetails() // Refresh to get enrollment data
      } else {
        toast.error(data.message || 'Failed to enroll in course')
      }
    } catch (error) {
      toast.error('Failed to enroll in course')
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!course) {
    return null
  }

  const totalLessons = sections.reduce((sum, section) => sum + section.lessons.length, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b">
        <div className="max-w-7xl mx-auto p-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
              <p className="text-muted-foreground mb-4">{course.description}</p>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{course.instructor_id?.name || 'Unknown'}</span>
                </div>
                {course.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{course.duration} minutes</span>
                  </div>
                )}
                {course.rating && course.rating.average > 0 && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{course.rating.average.toFixed(1)} ({course.rating.count} reviews)</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{totalLessons} lessons</span>
                </div>
              </div>

              {course.level && (
                <Badge variant="outline" className="mt-4 capitalize">
                  {course.level}
                </Badge>
              )}
            </div>

            <div>
              <Card>
                <CardContent className="p-6">
                  {course.thumbnail && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}

                  {isEnrolled ? (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span className="font-medium">{progress?.completionPercentage || 0}%</span>
                        </div>
                        <Progress value={progress?.completionPercentage || 0} />
                      </div>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => router.push(`/student/course/${courseId}`)}
                      >
                        <PlayCircle className="h-5 w-5 mr-2" />
                        Continue Learning
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleEnroll}
                      disabled={enrolling}
                    >
                      {enrolling && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
                      Enroll Now
                    </Button>
                  )}

                  <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                    <p>Organization: {course.organization_id?.name}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Course Content</CardTitle>
            <p className="text-sm text-muted-foreground">
              {sections.length} sections • {totalLessons} lessons
            </p>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {sections.map((section, index) => (
                <AccordionItem key={section._id} value={`section-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <span className="font-semibold">{section.title}</span>
                      <Badge variant="secondary">{section.lessons.length} lessons</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pl-4">
                      {section.lessons.map((lesson) => {
                        const isCompleted = progress?.completedLessons?.some(
                          (cl: any) => cl.lessonId === lesson._id
                        )

                        return (
                          <div
                            key={lesson._id}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => router.push(`/student/course/${courseId}?lessonId=${lesson._id}`)}
                          >
                            <div className="flex items-center gap-3">
                              {isCompleted ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <PlayCircle className="h-5 w-5 text-muted-foreground" />
                              )}
                              <div>
                                <p className="font-medium">{lesson.title}</p>
                                {lesson.description && (
                                  <p className="text-sm text-muted-foreground">{lesson.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {lesson.duration && (
                                <span>{lesson.duration} min</span>
                              )}
                              {lesson.isPreview && (
                                <Badge variant="outline">Preview</Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
