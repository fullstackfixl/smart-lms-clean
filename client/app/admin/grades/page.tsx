"use client"

import { useEffect, useState } from "react"
import { useAuth } from '../../../lib/auth-context'
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Label } from '../../../components/ui/label'
import { FileText, Download, TrendingUp } from "lucide-react"
import { adminApi } from '../../../lib/api'
import { toast } from "sonner"

export default function GradesPage() {
  const { user, token, loading } = useAuth()
  const router = useRouter()
  const [grades, setGrades] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [statistics, setStatistics] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'org_admin')) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (token && user?.role === 'org_admin') {
      fetchCourses()
      fetchGrades()
    }
  }, [token, user, selectedCourse])

  const fetchCourses = async () => {
    if (!token) return
    
    try {
      const res = await adminApi.listCourses(token)
      if (res.success && res.data) {
        setCourses((res.data as any).courses || [])
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
    }
  }

  const fetchGrades = async () => {
    if (!token) return
    
    setLoadingData(true)
    try {
      const params = selectedCourse !== 'all' ? `courseId=${selectedCourse}` : ''
      const res = await adminApi.listGrades(token, params)
      if (res.success && res.data) {
        setGrades((res.data as any).grades || [])
        setStatistics((res.data as any).statistics || null)
      }
    } catch (error) {
      console.error('Failed to fetch grades:', error)
      toast.error('Failed to load grades')
    } finally {
      setLoadingData(false)
    }
  }

  const handleExport = async () => {
    if (!token) return
    
    try {
      const data = selectedCourse !== 'all' ? { courseId: selectedCourse } : {}
      const res = await adminApi.exportGrades(token, data)
      if (res.success) {
        toast.success('Grades exported successfully')
      } else {
        toast.error('Failed to export grades')
      }
    } catch (error) {
      toast.error('Failed to export grades')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user || user.role !== 'org_admin') return null

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Grades Management</h1>
          <p className="text-muted-foreground">View and manage student grades</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Grades
        </Button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalGrades || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.averageGrade?.toFixed(1) || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Highest Grade</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.highestGrade || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lowest Grade</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.lowestGrade || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div>
            <Label>Filter by Course</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course: any) => (
                  <SelectItem key={course._id || course.id} value={course._id || course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Grades ({grades.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-8">Loading grades...</div>
          ) : grades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No grades found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Student</th>
                    <th className="text-left p-4">Course</th>
                    <th className="text-left p-4">Assignment</th>
                    <th className="text-left p-4">Grade</th>
                    <th className="text-left p-4">Graded By</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        {grade.student_id?.name || grade.student_id?.profile?.fullName || 'N/A'}
                      </td>
                      <td className="p-4">{grade.course_id?.title || 'N/A'}</td>
                      <td className="p-4">{grade.assignment_id?.title || 'N/A'}</td>
                      <td className="p-4">
                        <span className="font-semibold">{grade.grade}</span>
                        <span className="text-muted-foreground">/{grade.maxGrade || 100}</span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {grade.graded_by?.name || grade.graded_by?.profile?.fullName || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}