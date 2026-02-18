"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TrendingUp, Users, Search } from "lucide-react"
import { adminApi } from "@/lib/api"
import { toast } from "sonner"

export default function AttendancePage() {
  const { user, token, loading } = useAuth()
  const router = useRouter()
  const [summary, setSummary] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'org_admin')) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (token && user?.role === 'org_admin') {
      fetchSummary()
      fetchStudents()
    }
  }, [token, user])

  const fetchSummary = async () => {
    if (!token) return
    
    try {
      const res = await adminApi.attendanceSummary(token)
      if (res.success && res.data) {
        setSummary(res.data)
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error)
      toast.error('Failed to load attendance summary')
    } finally {
      setLoadingData(false)
    }
  }

  const fetchStudents = async () => {
    if (!token) return
    
    try {
      const res = await adminApi.listUsers(token, 'role=student&status=active')
      if (res.success && res.data) {
        setStudents((res.data as any).users || [])
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const viewStudentAttendance = async (studentId: string) => {
    if (!token) return
    
    try {
      const res = await adminApi.studentAttendance(token, studentId)
      if (res.success && res.data) {
        alert(`Attendance Rate: ${(res.data as any).statistics?.attendanceRate}%`)
      }
    } catch (error) {
      toast.error('Failed to load student attendance')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user || user.role !== 'org_admin') return null

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <p className="text-muted-foreground">Track and monitor student attendance</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.overall?.totalRecords || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.overall?.present || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <Users className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.overall?.absent || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.overall?.attendancePercentage || 0}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Student Attendance</CardTitle>
          <div className="mt-4">
            <Label>Search Students</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No students found</div>
          ) : (
            <div className="space-y-2">
              {filteredStudents.map((student: any) => (
                <div key={student.id || student._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div>
                    <p className="font-medium">{student.name || student.profile?.fullName}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => viewStudentAttendance(student.id || student._id)}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course-wise Attendance */}
      {summary?.byCourse && summary.byCourse.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance by Course</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.byCourse.map((course: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{course.courseName}</span>
                    <span>{course.attendanceRate?.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${course.attendanceRate || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
