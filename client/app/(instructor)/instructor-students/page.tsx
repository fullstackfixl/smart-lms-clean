"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Download, Search, Users, Mail, User } from "lucide-react"
import { PageHeader } from '../../../components/instructor/page-header'
import { DataTable, DataTableColumn } from '../../../components/instructor/data-table'
import { EmptyState } from '../../../components/instructor/empty-state'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Card } from '../../../components/ui/card'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Progress } from '../../../components/ui/progress'
import { getInitials, formatRelativeTime } from '../../../lib/utils'
import { getCourses, getCourseStudents } from '../../../lib/services/instructorApi'
import { toast } from "sonner"

interface Student {
  _id: string
  student: {
    _id: string
    name: string
    email: string
    profile?: any
  }
  status: string
  enrolledAt: string
  progress?: {
    completionPercentage?: number
    totalTimeSpent?: number
  }
}

interface Course {
  _id: string
  title: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (courseFilter !== 'all') {
      fetchStudents(courseFilter)
    }
  }, [courseFilter])

  const fetchCourses = async () => {
    try {
      const response = await getCourses({ limit: 50 })
      if (response.success && response.data) {
        setCourses(response.data.courses || [])
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error)
      toast.error('Failed to load courses')
    }
  }

  const fetchStudents = async (courseId: string) => {
    try {
      setLoading(true)
      const response = await getCourseStudents(courseId)
      if (response.success && response.data) {
        setStudents(response.data.students || [])
      } else {
        toast.error('Failed to load students')
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter((student) =>
    student.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.student.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const columns: DataTableColumn<Student>[] = [
    {
      key: 'student',
      label: 'Student',
      sortable: true,
      render: (value: any) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
              {getInitials(value.name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{value.name}</span>
        </div>
      ),
    },
    {
      key: 'student',
      label: 'Email',
      sortable: true,
      render: (value: any) => value.email,
    },
    {
      key: 'enrolledAt',
      label: 'Enrollment Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
    {
      key: 'progress',
      label: 'Progress',
      sortable: true,
      render: (value: any) => {
        const progress = value?.completionPercentage || 0
        return (
          <div className="w-32">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className="capitalize">{value}</span>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Students"
        actions={
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      <Card className="p-6 border border-gray-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course._id} value={course._id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {courseFilter === 'all' ? (
        <Card className="border border-gray-200 dark:border-slate-700">
          <EmptyState
            icon={Users}
            title="Select a course to view students"
            subtitle="Choose a course from the dropdown above"
          />
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card className="border border-gray-200 dark:border-slate-700">
          <EmptyState
            icon={Users}
            title="No students enrolled"
            subtitle="Share your course to get students"
          />
        </Card>
      ) : (
        <Card className="border border-gray-200 dark:border-slate-700">
          <DataTable
            columns={columns}
            data={filteredStudents}
            actions={(student) => (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => toast.info('View profile feature coming soon')}>
                  <User className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => window.location.href = `mailto:${student.student.email}`}>
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        </Card>
      )}
    </motion.div>
  )
}
