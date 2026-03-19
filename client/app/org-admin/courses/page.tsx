"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BookOpen, CheckCircle2, Clock3, GraduationCap, RefreshCw, Search } from "lucide-react"
import { useAuth } from "../../../lib/auth-context"
import { collegeApi } from "../../../lib/api"
import { Button } from "../../../components/ui/button"
import { toast } from "sonner"
import { cn } from "../../../lib/utils"

interface CourseRecord {
  _id: string
  title: string
  description?: string
  category?: string
  level?: string
  status?: "draft" | "pending_review" | "published" | "archived" | string
  enrollmentCount?: number
  createdAt?: string
  instructor_id?: {
    _id?: string
    email?: string
    name?: string
    profile?: {
      firstName?: string
      lastName?: string
    }
  }
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  hint: string
  icon: typeof BookOpen
  tone: "blue" | "green" | "orange"
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <div className={cn("rounded-2xl border p-3", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function getInstructorName(course: CourseRecord) {
  const profile = course.instructor_id?.profile
  const fullName = `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()
  return course.instructor_id?.name || fullName || course.instructor_id?.email || "Unassigned"
}

export default function OrgAdminCoursesPage() {
  const { token } = useAuth()
  const [courses, setCourses] = useState<CourseRecord[]>([])
  const [pendingCourses, setPendingCourses] = useState<CourseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (token) {
      void loadCourseHub()
    } else {
      setLoading(false)
    }
  }, [token])

  async function loadCourseHub() {
    if (!token) return

    setLoading(true)
    try {
      const [catalogResponse, pendingResponse] = await Promise.all([
        collegeApi.listCollegeCourses(token),
        collegeApi.listPendingCourses(token),
      ])

      if (!catalogResponse.success) {
        throw new Error(catalogResponse.error || "Failed to load course catalog")
      }

      setCourses(((catalogResponse.data as any)?.courses || []) as CourseRecord[])
      setPendingCourses(((pendingResponse.data as any)?.courses || []) as CourseRecord[])
    } catch (error) {
      console.error("Error loading org-admin courses hub:", error)
      toast.error("Failed to load course management data")
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return courses

    return courses.filter((course) => {
      const instructor = getInstructorName(course).toLowerCase()
      return (
        course.title?.toLowerCase().includes(query) ||
        course.description?.toLowerCase().includes(query) ||
        course.category?.toLowerCase().includes(query) ||
        instructor.includes(query)
      )
    })
  }, [courses, searchTerm])

  const publishedCount = courses.filter((course) => course.status === "published").length
  const draftCount = courses.filter((course) => course.status === "draft").length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-gray-200" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-100">
              Course Oversight
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Instructor Course Pipeline</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Review submitted courses, keep an eye on the published catalog, and make sure instructors are moving from draft to approved without bottlenecks.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={loadCourseHub}
              className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Link href="/org-admin/courses/pending">
              <Button className="bg-orange-500 text-white hover:bg-orange-600">
                <Clock3 className="mr-2 h-4 w-4" />
                Review Pending Courses
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Published Courses"
          value={publishedCount}
          hint="Live in the organization catalog"
          icon={CheckCircle2}
          tone="green"
        />
        <MetricCard
          label="Pending Review"
          value={pendingCourses.length}
          hint="Waiting for admin approval"
          icon={Clock3}
          tone="orange"
        />
        <MetricCard
          label="Draft Courses"
          value={draftCount}
          hint="Still being prepared by instructors"
          icon={BookOpen}
          tone="blue"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Published And In-Progress Catalog</h2>
            <p className="text-sm text-slate-500">Search the instructor course list and jump into the review queue when something needs approval.</p>
          </div>

          <div className="flex w-full max-w-md items-center rounded-xl border border-gray-200 bg-slate-50 px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by title, category, or instructor"
              className="h-11 w-full bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Instructor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Students</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCourses.map((course) => (
                <tr key={course._id} className="transition-colors hover:bg-slate-50/80">
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{course.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                          {course.description || "No description added yet."}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {course.category ? (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                              {course.category}
                            </span>
                          ) : null}
                          {course.level ? (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                              {course.level}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <GraduationCap className="h-4 w-4 text-slate-400" />
                      <span>{getInstructorName(course)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize",
                        course.status === "published" && "border-green-200 bg-green-50 text-green-700",
                        course.status === "pending_review" && "border-orange-200 bg-orange-50 text-orange-700",
                        course.status === "draft" && "border-blue-200 bg-blue-50 text-blue-700",
                        course.status === "archived" && "border-gray-200 bg-gray-100 text-gray-700"
                      )}
                    >
                      {course.status === "pending_review" ? "Pending Review" : course.status || "Unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top text-sm font-semibold text-slate-900">
                    {course.enrollmentCount || 0}
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-slate-500">
                    {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : "Unknown"}
                  </td>
                  <td className="px-4 py-4 text-right align-top">
                    {course.status === "pending_review" ? (
                      <Link href="/org-admin/courses/pending">
                        <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                          Open Review Queue
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/org-admin/applications">
                        <Button variant="ghost" className="text-blue-600 hover:bg-blue-50 hover:text-blue-700">
                          Review Details
                        </Button>
                      </Link>
                    )}
                  </td>
                </tr>
              ))}

              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <div className="mx-auto max-w-md">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <p className="mt-4 text-base font-semibold text-slate-900">No matching courses</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try a different search term or refresh the catalog to pull the latest instructor submissions.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
