"use client"

import { useState, useEffect } from "react"
import { Search, BookOpen, Users, Star, Clock, ChevronLeft, ChevronRight, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
import { toast } from "sonner"
import Link from "next/link"
import { motion } from "framer-motion"

interface Course {
  _id: string
  title: string
  description: string
  thumbnail?: string
  category: string
  level: string
  price: number
  instructor: {
    name: string
  }
  totalLectures: number
  enrolledCount: number
  rating: number
  totalReviews: number
  isEnrolled: boolean
}

export default function StudentCatalogPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [level, setLevel] = useState("all")
  const [sort, setSort] = useState("-createdAt")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadCourses()
  }, [category, level, sort, page])

  async function loadCourses() {
    setLoading(true)
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) return

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort
      })

      if (search) params.append('search', search)
      if (category !== 'all') params.append('category', category)
      if (level !== 'all') params.append('level', level)

      const response = await fetch(`${API_URL}/student/courses?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setCourses(data.data.courses || [])
          setTotalPages(data.data.pagination?.pages || 1)
        }
      }
    } catch (error) {
      toast.error("Failed to load courses")
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() {
    setPage(1)
    loadCourses()
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Search Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-semibold text-gray-900 mb-3">
              Discover Your Next Course
            </h1>
            <p className="text-lg text-gray-600">
              Learn from industry experts and advance your career
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-3xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search for courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-12 h-14 text-base rounded-2xl border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500/20"
              />
              <Button 
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6 bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Search
              </Button>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-3 mt-6"
          >
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[160px] rounded-xl border-gray-200">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Programming">Programming</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Data Science">Data Science</SelectItem>
              </SelectContent>
            </Select>

            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-[140px] rounded-xl border-gray-200">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[160px] rounded-xl border-gray-200">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-createdAt">Newest First</SelectItem>
                <SelectItem value="-rating">Highest Rated</SelectItem>
                <SelectItem value="-enrolledCount">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[380px] rounded-2xl" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <BookOpen className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-xl font-medium text-gray-900 mb-2">No courses found</p>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </motion.div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, index) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/student/courses/${course._id}`}>
                    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col">
                      {/* Thumbnail */}
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-16 w-16 text-blue-300" />
                          </div>
                        )}
                        {course.isEnrolled && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-emerald-500 text-white border-0 shadow-lg">
                              <Award className="h-3 w-3 mr-1" />
                              Enrolled
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 flex-1 flex flex-col">
                        {/* Badges */}
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary" className="text-xs font-medium capitalize rounded-lg">
                            {course.level}
                          </Badge>
                          <Badge variant="outline" className="text-xs font-medium rounded-lg">
                            {course.category}
                          </Badge>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {course.title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                          {course.description}
                        </p>

                        {/* Instructor */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                            {course.instructor.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-600">{course.instructor.name}</span>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="font-medium text-gray-900">{course.rating.toFixed(1)}</span>
                              <span className="text-gray-500">({course.totalReviews})</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Users className="h-4 w-4" />
                              <span>{course.enrolledCount}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600 text-sm">
                            <Clock className="h-4 w-4" />
                            <span>{course.totalLectures}</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="mt-4">
                          {course.price === 0 ? (
                            <span className="text-lg font-semibold text-emerald-600">Free</span>
                          ) : (
                            <span className="text-lg font-semibold text-gray-900">₹{course.price}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2 mt-12"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-xl ${page === pageNum ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
