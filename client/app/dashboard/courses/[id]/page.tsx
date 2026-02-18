"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  Play, Clock, Users, Star, BookOpen, CheckCircle,
  Lock, ChevronDown, ChevronRight, Video, FileText,
  Download, Award, ArrowLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

const courseSections = [
  {
    title: "Getting Started",
    lessons: [
      { id: "1", title: "Introduction to the Course", type: "video", duration: "12 min", completed: true },
      { id: "2", title: "Setting Up Your Environment", type: "video", duration: "18 min", completed: true },
      { id: "3", title: "Course Resources & Materials", type: "pdf", duration: "5 min", completed: true },
    ],
  },
  {
    title: "Core Concepts",
    lessons: [
      { id: "4", title: "Understanding the Fundamentals", type: "video", duration: "25 min", completed: true },
      { id: "5", title: "Working with Components", type: "video", duration: "30 min", completed: false },
      { id: "6", title: "State Management Deep Dive", type: "video", duration: "35 min", completed: false },
      { id: "7", title: "Practice Exercise 1", type: "quiz", duration: "15 min", completed: false },
    ],
  },
  {
    title: "Advanced Topics",
    lessons: [
      { id: "8", title: "Performance Optimization", type: "video", duration: "28 min", completed: false },
      { id: "9", title: "Testing Strategies", type: "video", duration: "22 min", completed: false },
      { id: "10", title: "Deployment Best Practices", type: "video", duration: "20 min", completed: false },
      { id: "11", title: "Final Assessment", type: "quiz", duration: "30 min", completed: false },
      { id: "12", title: "Course Summary", type: "pdf", duration: "10 min", completed: false },
    ],
  },
]

export default function CourseDetailPage() {
  const { id } = useParams()
  const [expandedSections, setExpandedSections] = useState<number[]>([0, 1])
  const [activeLesson, setActiveLesson] = useState<string | null>("5")

  const totalLessons = courseSections.reduce((acc, s) => acc + s.lessons.length, 0)
  const completedLessons = courseSections.reduce((acc, s) => acc + s.lessons.filter((l) => l.completed).length, 0)
  const progress = Math.round((completedLessons / totalLessons) * 100)

  const toggleSection = (index: number) => {
    setExpandedSections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  const getLessonIcon = (type: string, completed: boolean) => {
    if (completed) return <CheckCircle className="h-4 w-4 text-primary" />
    switch (type) {
      case "video": return <Play className="h-4 w-4 text-muted-foreground" />
      case "pdf": return <FileText className="h-4 w-4 text-muted-foreground" />
      case "quiz": return <BookOpen className="h-4 w-4 text-muted-foreground" />
      default: return <Play className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div>
      <Link href="/dashboard/courses" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to courses
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Video Player Area */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex aspect-video items-center justify-center rounded-xl border border-border bg-card"
          >
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Play className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Working with Components</p>
              <p className="text-xs text-muted-foreground/60">Click to play</p>
            </div>
          </motion.div>

          {/* Course Info Tabs */}
          <Tabs defaultValue="curriculum" className="w-full">
            <TabsList className="border-b border-border bg-transparent">
              <TabsTrigger value="curriculum" className="text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-primary">Curriculum</TabsTrigger>
              <TabsTrigger value="overview" className="text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-primary">Overview</TabsTrigger>
              <TabsTrigger value="reviews" className="text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-primary">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="curriculum" className="mt-4">
              <div className="flex flex-col gap-2">
                {courseSections.map((section, si) => (
                  <div key={si} className="overflow-hidden rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => toggleSection(si)}
                      className="flex w-full items-center justify-between bg-secondary/50 px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-2">
                        {expandedSections.includes(si) ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-semibold text-foreground">{section.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {section.lessons.filter((l) => l.completed).length}/{section.lessons.length} lessons
                      </span>
                    </button>
                    {expandedSections.includes(si) && (
                      <div className="flex flex-col">
                        {section.lessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => setActiveLesson(lesson.id)}
                            className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                              activeLesson === lesson.id
                                ? "bg-primary/5 border-l-2 border-primary"
                                : "hover:bg-secondary/30"
                            }`}
                          >
                            {getLessonIcon(lesson.type, lesson.completed)}
                            <span className={`flex-1 text-sm ${lesson.completed ? "text-muted-foreground" : "text-foreground"}`}>
                              {lesson.title}
                            </span>
                            <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="overview" className="mt-4">
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="mb-3 text-lg font-semibold text-foreground">About This Course</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                  This comprehensive course covers everything you need to know from beginner to advanced levels. 
                  You will learn through hands-on projects, real-world examples, and interactive quizzes designed 
                  to reinforce your understanding.
                </p>
                <h4 className="mb-2 text-sm font-semibold text-foreground">What you will learn</h4>
                <ul className="flex flex-col gap-2">
                  {["Core fundamentals and best practices", "Advanced patterns and architecture", "Testing and deployment strategies", "Performance optimization techniques"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-3.5 w-3.5 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-4">
              <div className="flex flex-col gap-4">
                {[
                  { name: "Alex J.", rating: 5, text: "Excellent course! Clear explanations and great projects.", date: "2 weeks ago" },
                  { name: "Maria G.", rating: 4, text: "Very comprehensive. Would love more advanced examples.", date: "1 month ago" },
                  { name: "Sam K.", rating: 5, text: "Best course I have taken. The instructor is amazing.", date: "1 month ago" },
                ].map((review, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{review.name.charAt(0)}</div>
                        <span className="text-sm font-medium text-foreground">{review.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: review.rating }).map((_, j) => (
                          <Star key={j} className="h-3 w-3 fill-accent text-accent" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground/60">{review.date}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-4"
        >
          {/* Progress Card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Your Progress</h3>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{completedLessons} of {totalLessons} lessons</span>
              <span className="font-semibold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 mb-4" />
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Play className="mr-2 h-4 w-4" />
              Continue Learning
            </Button>
          </div>

          {/* Course Details */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Course Details</h3>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Duration</span>
                <span className="text-foreground">24 hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground"><BookOpen className="h-3.5 w-3.5" /> Lessons</span>
                <span className="text-foreground">{totalLessons}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground"><Users className="h-3.5 w-3.5" /> Students</span>
                <span className="text-foreground">1,250</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground"><Star className="h-3.5 w-3.5" /> Rating</span>
                <span className="text-foreground">4.8/5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground"><Award className="h-3.5 w-3.5" /> Certificate</span>
                <span className="text-primary">Yes</span>
              </div>
            </div>
          </div>

          {/* Instructor */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Instructor</h3>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">SC</div>
              <div>
                <p className="text-sm font-medium text-foreground">Dr. Sarah Chen</p>
                <p className="text-xs text-muted-foreground">Senior Instructor</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
