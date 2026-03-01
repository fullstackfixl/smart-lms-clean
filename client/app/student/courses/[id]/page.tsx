"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Clock, Star, BookOpen, User, CheckCircle, Loader2, PlayCircle, Trophy, HelpCircle } from "lucide-react"
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Progress } from '../../../../components/ui/progress'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { toast } from "sonner"
import { API_URL } from '../../../../lib/config'


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

interface Quiz {
  _id: string
  title: string
  description: string
  total_marks: number
  max_attempts: number
  timer_minutes: number
  attemptsCount: number
  attemptsLeft: number
  bestScore: number | null
  bestPercentage: number | null
  isCompleted: boolean
}


export default function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params)
  const router = useRouter()
  const courseId = unwrappedParams.id

  const [course, setCourse] = useState<Course | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [progress, setProgress] = useState<CourseProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingQuizzes, setLoadingQuizzes] = useState(false)
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

        if (data.data.isEnrolled) {
          fetchQuizzes(token)
        }
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

  const fetchQuizzes = async (token: string) => {
    setLoadingQuizzes(true)
    try {
      const response = await fetch(
        `${API_URL}/student/course/${courseId}/quizzes`,
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
        setQuizzes(data.data.quizzes)
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error)
    } finally {
      setLoadingQuizzes(false)
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
      <div className="max-w-7xl mx-auto p-6 pb-20">
        <Tabs defaultValue="lessons" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="lessons" className="px-6">Lessons</TabsTrigger>
            <TabsTrigger value="quizzes" className="px-6">Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value="lessons">
            <Card>
              <CardHeader>
                <CardTitle>Course Lessons</CardTitle>
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
          </TabsContent>

          <TabsContent value="quizzes">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingQuizzes ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-32 bg-muted m-6 rounded-lg" />
                    <div className="space-y-3 p-6 pt-0">
                      <div className="h-4 bg-muted w-3/4 rounded" />
                      <div className="h-4 bg-muted w-1/2 rounded" />
                    </div>
                  </Card>
                ))
              ) : quizzes.length > 0 ? (
                quizzes.map((quiz) => (
                  <Card key={quiz._id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={quiz.isCompleted ? "default" : "secondary"}>
                          {quiz.isCompleted ? "PASSED" : "PENDING"}
                        </Badge>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {quiz.timer_minutes} mins
                        </div>
                      </div>
                      <CardTitle className="text-xl">{quiz.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {quiz.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Best Score:</span>
                          <span className="font-semibold">
                            {quiz.bestScore !== null ? `${quiz.bestScore} / ${quiz.total_marks}` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Attempts:</span>
                          <span className="font-semibold">
                            {quiz.attemptsCount} / {quiz.max_attempts}
                          </span>
                        </div>
                        {quiz.bestPercentage !== null && (
                          <div className="pt-2">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs">Highest Score</span>
                              <span className="text-xs font-medium">{quiz.bestPercentage}%</span>
                            </div>
                            <Progress value={quiz.bestPercentage} className="h-1.5" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-4 border-t">
                      <Button
                        className="w-full"
                        variant={quiz.attemptsLeft === 0 ? "outline" : "default"}
                        disabled={quiz.attemptsLeft === 0}
                        onClick={() => router.push(`/student/quiz/${quiz._id}`)}
                      >
                        {quiz.attemptsLeft === 0 ? (
                          <>Max Attempts Reached</>
                        ) : quiz.isCompleted ? (
                          <>Retake Quiz ({quiz.attemptsLeft} left)</>
                        ) : (
                          <>Start Quiz</>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full py-12">
                  <CardContent className="flex flex-col items-center text-center">
                    <div className="bg-primary/5 p-4 rounded-full mb-4">
                      <HelpCircle className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="mb-2">No Quizzes Available</CardTitle>
                    <CardDescription>
                      There are no quizzes published for this course yet.
                    </CardDescription>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

    </div>
  )
}
