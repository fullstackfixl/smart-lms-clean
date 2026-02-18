"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Star, Users, Clock, ArrowRight, Play, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const categories = [
  "All",
  "Web Development",
  "Data Science",
  "Design",
  "Business",
  "AI & ML",
  "Mobile Dev",
]

const courses = [
  {
    id: "1",
    title: "Full-Stack Web Development Bootcamp",
    instructor: "Prof. Sarah Chen",
    institution: "TechAcademy",
    price: 49.99,
    rating: 4.8,
    students: 12500,
    duration: "48 hours",
    level: "Beginner",
    category: "Web Development",
    free: false,
    bestseller: true,
  },
  {
    id: "2",
    title: "Machine Learning with Python",
    instructor: "Dr. Ananya Sharma",
    institution: "DataMinds Institute",
    price: 0,
    rating: 4.9,
    students: 8900,
    duration: "36 hours",
    level: "Intermediate",
    category: "AI & ML",
    free: true,
    bestseller: false,
  },
  {
    id: "3",
    title: "UI/UX Design Masterclass",
    instructor: "Emily Rodriguez",
    institution: "Creative Hub",
    price: 39.99,
    rating: 4.7,
    students: 6300,
    duration: "24 hours",
    level: "Beginner",
    category: "Design",
    free: false,
    bestseller: true,
  },
  {
    id: "4",
    title: "Advanced JavaScript Patterns",
    instructor: "James Wilson",
    institution: "CodeSchool Pro",
    price: 79.99,
    rating: 4.9,
    students: 4200,
    duration: "32 hours",
    level: "Advanced",
    category: "Web Development",
    free: false,
    bestseller: false,
  },
  {
    id: "5",
    title: "Data Analytics for Business",
    instructor: "Dr. Michael Park",
    institution: "BizLearn Academy",
    price: 0,
    rating: 4.6,
    students: 15000,
    duration: "20 hours",
    level: "Beginner",
    category: "Business",
    free: true,
    bestseller: false,
  },
  {
    id: "6",
    title: "React Native Mobile Development",
    instructor: "Rajesh Kumar",
    institution: "AppDev Institute",
    price: 59.99,
    rating: 4.8,
    students: 3100,
    duration: "28 hours",
    level: "Intermediate",
    category: "Mobile Dev",
    free: false,
    bestseller: true,
  },
  {
    id: "7",
    title: "Python for Data Science",
    instructor: "Dr. Lisa Wang",
    institution: "DataMinds Institute",
    price: 44.99,
    rating: 4.7,
    students: 9800,
    duration: "30 hours",
    level: "Beginner",
    category: "Data Science",
    free: false,
    bestseller: false,
  },
  {
    id: "8",
    title: "DevOps & Cloud Infrastructure",
    instructor: "Alex Johnson",
    institution: "CloudPro Academy",
    price: 89.99,
    rating: 4.9,
    students: 2100,
    duration: "40 hours",
    level: "Advanced",
    category: "Web Development",
    free: false,
    bestseller: false,
  },
]

const colorMap: Record<string, string> = {
  "Web Development": "bg-primary/15 text-primary",
  "Data Science": "bg-chart-3/15 text-chart-3",
  Design: "bg-chart-5/15 text-chart-5",
  Business: "bg-accent/15 text-accent",
  "AI & ML": "bg-chart-4/15 text-chart-4",
  "Mobile Dev": "bg-primary/15 text-primary",
}

const thumbMap: Record<string, string> = {
  "Web Development": "from-primary/20 to-primary/5",
  "Data Science": "from-chart-3/20 to-chart-3/5",
  Design: "from-chart-5/20 to-chart-5/5",
  Business: "from-accent/20 to-accent/5",
  "AI & ML": "from-chart-4/20 to-chart-4/5",
  "Mobile Dev": "from-primary/20 to-accent/5",
}

export function CourseShowcase() {
  const [activeCategory, setActiveCategory] = useState("All")

  const filtered =
    activeCategory === "All" ? courses : courses.filter((c) => c.category === activeCategory)

  return (
    <section id="courses" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-4 flex items-end justify-between"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Explore Courses
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Learn from the{" "}
              <span className="text-gradient-primary">best institutions</span>
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Browse thousands of courses uploaded by instructors from top institutes, colleges, and schools worldwide.
            </p>
          </div>
          <Link href="/dashboard/catalog" className="hidden lg:block">
            <Button variant="outline" className="border-border bg-transparent text-foreground hover:bg-secondary">
              View All Courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Category Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 mt-8 flex flex-wrap gap-2"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Course Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link href={`/dashboard/courses/${course.id}`}>
                <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  {/* Thumbnail */}
                  <div
                    className={`relative flex h-40 items-center justify-center bg-gradient-to-br ${thumbMap[course.category] || "from-primary/20 to-primary/5"}`}
                  >
                    <BookOpen className="h-10 w-10 text-muted-foreground/20 transition-transform group-hover:scale-110" />
                    {course.bestseller && (
                      <span className="absolute left-3 top-3 rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                        Bestseller
                      </span>
                    )}
                    {course.free && (
                      <span className="absolute left-3 top-3 rounded-md bg-success px-2 py-0.5 text-xs font-bold text-success-foreground">
                        Free
                      </span>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-background/0 opacity-0 transition-all group-hover:bg-background/30 group-hover:opacity-100">
                      <div className="rounded-full bg-primary p-3">
                        <Play className="h-5 w-5 text-primary-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${colorMap[course.category] || "bg-secondary text-muted-foreground"}`}
                      >
                        {course.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{course.level}</span>
                    </div>

                    <h3 className="mb-1 text-sm font-semibold leading-tight text-foreground line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">{course.instructor}</p>
                    <p className="text-xs text-primary/70">{course.institution}</p>

                    <div className="mt-auto flex items-center gap-3 pt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-accent text-accent" />
                        {course.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {course.students.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.duration}
                      </span>
                    </div>

                    <div className="mt-3 border-t border-border pt-3">
                      {course.free ? (
                        <span className="text-base font-bold text-primary">Free</span>
                      ) : (
                        <span className="text-base font-bold text-foreground">
                          ${course.price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-8 text-center lg:hidden">
          <Link href="/dashboard/catalog">
            <Button variant="outline" className="border-border bg-transparent text-foreground hover:bg-secondary">
              View All Courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
