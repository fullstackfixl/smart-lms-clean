"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Filter, Star, Users, Clock, Play } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { courseApi } from "@/lib/api"
import Link from "next/link"

export default function CatalogPage() {
  const { token } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("All")
  const [priceFilter, setPriceFilter] = useState("all")

  useEffect(() => {
    if (!token) return

    const fetchCourses = async () => {
      try {
        const res = await courseApi.list(token)
        if (res.success && res.data) {
          setCourses(Array.isArray(res.data) ? res.data : [])
        }
      } catch (error) {
        console.error("Error fetching courses:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [token])

  const categories = ["All", ...Array.from(new Set(courses.map(c => c.category).filter(Boolean)))]

  const filtered = courses.filter((c) => {
    const matchSearch = c.title?.toLowerCase().includes(search.toLowerCase()) || 
                       c.instructor_id?.name?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = category === "All" || c.category === category
    const matchPrice = priceFilter === "all" || 
                      (priceFilter === "free" && (!c.price || c.price === 0)) || 
                      (priceFilter === "paid" && c.price > 0)
    return matchSearch && matchCategory && matchPrice
  })

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Course Catalog</h1>
        <p className="mt-1 text-muted-foreground">Explore and enroll in courses from top institutes and instructors</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses or instructors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-border bg-secondary pl-10 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full border-border bg-secondary text-foreground sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-border bg-card">
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priceFilter} onValueChange={setPriceFilter}>
          <SelectTrigger className="w-full border-border bg-secondary text-foreground sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-border bg-card">
            <SelectItem value="all">All Prices</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Category Pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              category === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((course, i) => {
            const thumbnailColors = ["bg-primary/15", "bg-accent/15", "bg-chart-3/15", "bg-chart-5/15", "bg-chart-4/15"]
            const isFree = !course.price || course.price === 0
            
            return (
              <motion.div
                key={course._id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link href={`/dashboard/courses/${course._id}`}>
                  <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30">
                    <div className={`flex h-36 items-center justify-center ${thumbnailColors[i % 5]}`}>
                      <Play className="h-10 w-10 text-muted-foreground/30 transition-transform group-hover:scale-110 group-hover:text-primary/50" />
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-2 flex items-center gap-2">
                        {course.category && (
                          <Badge variant="secondary" className="bg-secondary text-xs text-muted-foreground">
                            {course.category}
                          </Badge>
                        )}
                        {course.level && (
                          <Badge variant="secondary" className="bg-secondary text-xs text-muted-foreground">
                            {course.level}
                          </Badge>
                        )}
                      </div>
                      <h3 className="mb-1 text-sm font-semibold text-foreground">{course.title || "Untitled Course"}</h3>
                      <p className="mb-3 text-xs text-muted-foreground">
                        {course.instructor_id?.name || "Instructor"}
                      </p>
                      <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                        {course.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-accent" />
                            {course.rating}
                          </span>
                        )}
                        {course.enrolled_count !== undefined && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {course.enrolled_count}
                          </span>
                        )}
                        {course.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {course.duration}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 border-t border-border pt-3">
                        {isFree ? (
                          <span className="text-sm font-bold text-primary">Free</span>
                        ) : (
                          <span className="text-sm font-bold text-foreground">${course.price}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">No courses found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}
