"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Search, Eye, CheckCircle, XCircle } from "lucide-react"
import { adminApi } from "@/lib/api"
import { toast } from "sonner"
import Link from "next/link"

export default function CourseManagementPage() {
  const { user, token, loading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (!loading && (!user || user.role !== 'org_admin')) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (token && user?.role === 'org_admin') {
      fetchCourses()
    }
  }, [token, user, statusFilter, searchQuery])

  const fetchCourses = async () => {
    if (!token) return
    
    setLoadingCourses(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchQuery) params.append('search', searchQuery)

      const res = await adminApi.listCourses(token, params.toString())
      if (res.success && res.data) {
        setCourses((res.data as any).courses || [])
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      toast.error('Failed to load courses')
    } finally {
      setLoadingCourses(false)
    }
  }

  const handleTogglePublish = async (courseId: string, currentStatus: boolean) => {
    if (!token) return
    
    try {
      const res = await adminApi.publishCourse(token, courseId, !currentStatus)
      if (res.success) {
        toast.success(`Course ${!currentStatus ? 'published' : 'unpublished'} successfully`)
        fetchCourses()
      } else {
        toast.error(res.error || 'Failed to update course status')
      }
    } catch (error) {
      toast.error('Failed to update course status')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user || user.role !== 'org_admin') return null

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Course Management</h1>
          <p className="text-muted-foreground">Manage all courses in your organization</p>
        </div>
        <Link href="/dashboard/manage-courses">
          <Button>Create Course</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loadingCourses ? (
          <div className="col-span-full text-center py-8">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">No courses found</div>
        ) : (
          courses.map((course: any) => (
            <Card key={course._id || course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  {course.isPublished ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description || 'No description'}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.instructor_id?.name || course.instructor_id?.profile?.fullName || 'No instructor'}</span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/courses/${course._id || course.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </Link>
                  <Button
                    variant={course.isPublished ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleTogglePublish(course._id || course.id, course.isPublished)}
                  >
                    {course.isPublished ? 'Unpublish' : 'Publish'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
