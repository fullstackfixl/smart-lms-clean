"use client"
import { API_URL } from '../../lib/config'

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Users, BookOpen, ArrowRight, Tag } from "lucide-react"
import Link from "next/link"


interface Course {
  _id: string
  title: string
  description?: string
  price?: number
  marketplacePrice?: number
  category?: string
  level?: string
  thumbnail?: string
  enrollmentCount?: number
  rating?: { average?: number; count?: number }
  instructor?: { profile?: { firstName?: string; lastName?: string; fullName?: string; avatar?: string } }
  instructor_id?: { profile?: { firstName?: string; lastName?: string; fullName?: string } }
  organization_id?: { name: string }
}

const CATEGORIES = ["All", "AI & ML", "Web Development", "Data Science", "Design", "Business", "Mobile Dev"]

const UNSPLASH_CATEGORY: Record<string, string> = {
  "AI & ML": "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80&fit=crop",
  "Web Development": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&q=80&fit=crop",
  "Data Science": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80&fit=crop",
  "Design": "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&q=80&fit=crop",
  "Business": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80&fit=crop",
  "Mobile Dev": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80&fit=crop",
  "default": "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&q=80&fit=crop",
}

function getThumb(course: Course): string {
  if (course.thumbnail && course.thumbnail.startsWith("http")) return course.thumbnail
  return UNSPLASH_CATEGORY[course.category || "default"] || UNSPLASH_CATEGORY["default"]
}

function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl" style={{ background: "#111827", border: "1px solid rgba(255,153,0,0.12)" }}>
      <div className="lp-skeleton h-44 w-full" />
      <div className="flex flex-col gap-3 p-5">
        <div className="lp-skeleton h-4 w-2/3 rounded" />
        <div className="lp-skeleton h-3 w-1/2 rounded" />
        <div className="lp-skeleton h-3 w-3/4 rounded" />
        <div className="lp-skeleton mt-2 h-9 w-full rounded-lg" />
      </div>
    </div>
  )
}

function CourseCard({ course, i }: { course: Course; i: number }) {
  const instructor =
    course.instructor?.profile?.fullName ||
    (course.instructor_id as any)?.profile?.fullName ||
    `${course.instructor_id?.profile?.firstName || ""} ${course.instructor_id?.profile?.lastName || ""}`.trim() ||
    "Instructor"
  const price = course.marketplacePrice ?? course.price ?? 0
  const rating = course.rating?.average ?? 0
  const enrolled = course.enrollmentCount ?? 0
  const isFree = price === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: i * 0.07 }}
    >
      <Link href={`/course/${course._id}`}>
        <div
          className="group flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300"
          style={{
            background: "#111827",
            border: "1px solid rgba(255,153,0,0.12)",
          }}
          onMouseEnter={(e) => {
            ; (e.currentTarget as HTMLElement).style.transform = "translateY(-5px)"
              ; (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 60px -15px rgba(255,153,0,0.25)"
              ; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,153,0,0.35)"
          }}
          onMouseLeave={(e) => {
            ; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"
              ; (e.currentTarget as HTMLElement).style.boxShadow = "none"
              ; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,153,0,0.12)"
          }}
        >
          {/* Thumbnail */}
          <div className="relative h-44 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getThumb(course)}
              alt={course.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(10,15,30,0.7) 0%, transparent 60%)" }}
            />
            {/* Badges */}
            <div className="absolute left-3 top-3 flex gap-2">
              {isFree && (
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-bold text-white"
                  style={{ background: "#16a34a" }}
                >
                  Free
                </span>
              )}
              {course.category && (
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-medium text-white"
                  style={{ background: "rgba(255,153,0,0.75)" }}
                >
                  {course.category}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-5">
            <h3 className="mb-1 text-sm font-bold leading-tight text-white line-clamp-2">
              {course.title}
            </h3>
            <p className="mb-3 text-xs" style={{ color: "rgba(255,153,0,0.8)" }}>
              {instructor}
            </p>

            {/* Meta */}
            <div className="mt-auto flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {rating.toFixed(1)}
                </span>
              )}
              {enrolled > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {enrolled.toLocaleString()}
                </span>
              )}
              {course.level && (
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {course.level}
                </span>
              )}
            </div>

            {/* Price + Enroll */}
            <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: "rgba(255,153,0,0.12)" }}>
              <span className="flex items-center gap-1 text-base font-bold">
                {isFree ? (
                  <span style={{ color: "#22c55e" }}>Free</span>
                ) : (
                  <>
                    <Tag className="h-3.5 w-3.5" style={{ color: "#FF9900" }} />
                    <span className="text-white">₹{price}</span>
                  </>
                )}
              </span>
              <span
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all"
                style={{ background: "linear-gradient(135deg, #FF9900, #e68a00)" }}
              >
                Enroll Now
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function CourseShowcase() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("All")

  useEffect(() => {
    fetch(`${API_URL}/api/marketplace/courses`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCourses(data.data || [])
      })
      .catch((err) => {
        console.error("Failed to fetch marketplace courses:", err)
        setCourses([])
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered =
    activeCategory === "All"
      ? courses
      : courses.filter((c) => c.category === activeCategory)

  // Extract real categories from DB courses
  const availableCategories = [
    "All",
    ...Array.from(new Set(courses.map((c) => c.category).filter(Boolean))) as string[],
  ]

  const displayCategories = availableCategories.length > 1 ? availableCategories : CATEGORIES

  return (
    <section
      id="courses"
      className="relative py-24 lg:py-32"
      style={{ background: "#0D1426" }}
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#FF9900" }}>
              Explore Courses
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
              Learn from the{" "}
              <span className="lp-gradient-text">Best Institutions</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              Browse thousands of courses uploaded by top instructors from leading institutes, colleges, and schools worldwide.
            </p>
          </div>
          <Link
            href="/register"
            className="hidden items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all md:flex"
            style={{ border: "1px solid rgba(255,153,0,0.3)", background: "transparent" }}
            onMouseEnter={(e) => {
              ; (e.currentTarget as HTMLElement).style.background = "rgba(255,153,0,0.1)"
                ; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,153,0,0.5)"
            }}
            onMouseLeave={(e) => {
              ; (e.currentTarget as HTMLElement).style.background = "transparent"
                ; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,153,0,0.3)"
            }}
          >
            View All Courses
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 mt-8 flex flex-wrap gap-2"
        >
          {displayCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className="rounded-full px-4 py-2 text-sm font-medium transition-all"
              style={
                activeCategory === cat
                  ? {
                    background: "#FF9900",
                    color: "#fff",
                    boxShadow: "0 4px 16px rgba(255,153,0,0.3)",
                  }
                  : {
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.6)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }
              }
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <BookOpen className="mb-4 h-12 w-12" style={{ color: "rgba(255,153,0,0.4)" }} />
            <h3 className="text-lg font-bold text-white">No courses found</h3>
            <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              {activeCategory !== "All"
                ? `No ${activeCategory} courses published yet.`
                : "No public courses have been published yet. Check back soon!"}
            </p>
            <Link
              href="/register"
              className="mt-6 rounded-xl px-6 py-2.5 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #FF9900, #e68a00)" }}
            >
              Create Your First Course
            </Link>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((course, i) => (
                <CourseCard key={course._id} course={course} i={i} />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Mobile View All */}
        <div className="mt-8 text-center md:hidden">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium text-white"
            style={{ border: "1px solid rgba(255,153,0,0.3)", background: "transparent" }}
          >
            View All Courses
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
