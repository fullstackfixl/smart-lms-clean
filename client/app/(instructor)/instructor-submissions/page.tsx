"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, FileText, Eye, Edit3 } from "lucide-react"
import { PageHeader } from "@/components/instructor/page-header"
import { DataTable, DataTableColumn } from "@/components/instructor/data-table"
import { EmptyState } from "@/components/instructor/empty-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials, cn } from "@/lib/utils"
import { getCourses, getSubmissions } from "@/lib/services/instructorApi"
import { toast } from "sonner"

interface Submission {
  _id: string
  student_id: {
    _id: string
    name: string
    email: string
  }
  course_id: {
    _id: string
    title: string
  }
  assignment_type: string
  submitted_date?: string
  earned_score?: number
  max_score?: number
  graded_by?: any
}

interface Course {
  _id: string
  title: string
}

const statusColors = {
  pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  graded: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (courseFilter !== 'all') {
      fetchSubmissions(courseFilter)
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

  const fetchSubmissions = async (courseId: string) => {
    try {
      setLoading(true)
      const response = await getSubmissions({ courseId, limit: 50 })
      if (response.success && response.data) {
        setSubmissions(response.data.submissions || [])
      } else {
        toast.error('Failed to load submissions')
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error)
      toast.error('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter((submission) =>
    submission.student_id.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const columns: DataTableColumn<Submission>[] = [
    {
      key: 'student_id',
      label: 'Student',
      sortable: true,
      render: (value: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs">
              {getInitials(value.name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{value.name}</span>
        </div>
      ),
    },
    {
      key: 'assignment_type',
      label: 'Assignment',
      sortable: true,
      render: (value: string) => (
        <span className="capitalize">{value.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'submitted_date',
      label: 'Submitted Date',
      sortable: true,
      render: (value?: string) => value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
    },
    {
      key: 'graded_by',
      label: 'Status',
      sortable: true,
      render: (value: any) => (
        <Badge className={cn('font-medium', value ? statusColors.graded : statusColors.pending)}>
          {value ? 'Graded' : 'Pending'}
        </Badge>
      ),
    },
    {
      key: 'earned_score',
      label: 'Grade',
      sortable: true,
      render: (value: number | undefined, row: Submission) => {
        if (value !== undefined && row.max_score) {
          const percentage = (value / row.max_score) * 100
          return `${Math.round(percentage)}%`
        }
        return '-'
      },
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading submissions...</p>
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
      <PageHeader title="Submissions Review" />

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
              placeholder="Search submissions..."
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
            icon={FileText}
            title="Select a course to view submissions"
            subtitle="Choose a course from the dropdown above"
          />
        </Card>
      ) : filteredSubmissions.length === 0 ? (
        <Card className="border border-gray-200 dark:border-slate-700">
          <EmptyState
            icon={FileText}
            title="No submissions found"
            subtitle="Students haven't submitted any work yet"
          />
        </Card>
      ) : (
        <Card className="border border-gray-200 dark:border-slate-700">
          <DataTable
            columns={columns}
            data={filteredSubmissions}
            actions={(submission) => (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => toast.info('View submission feature coming soon')}>
                  <Eye className="h-4 w-4" />
                </Button>
                {!submission.graded_by && (
                  <Button variant="ghost" size="icon" onClick={() => toast.info('Grade submission feature coming soon')}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          />
        </Card>
      )}
    </motion.div>
  )
}
