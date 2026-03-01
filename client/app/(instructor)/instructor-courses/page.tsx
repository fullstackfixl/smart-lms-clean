"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Search, BookOpen, MoreVertical, Edit, Copy, Trash2, BarChart3 } from "lucide-react"
import { PageHeader } from '../../../components/instructor/page-header'
import { DataTable, DataTableColumn } from '../../../components/instructor/data-table'
import { EmptyState } from '../../../components/instructor/empty-state'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import { Badge } from '../../../components/ui/badge'
import { Card } from '../../../components/ui/card'
import { cn, formatCurrency } from '../../../lib/utils'
import { getCourses, deleteCourse, publishCourse } from '../../../lib/services/instructorApi'
import { toast } from "sonner"

interface Course {
  _id: string
  title: string
  thumbnail?: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced'
  status: 'draft' | 'published' | 'archived'
  price: number
  createdAt: string
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export default function ManageCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchCourses()
  }, [statusFilter])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await getCourses({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 50
      })
      
      if (response.success && response.data) {
        setCourses(response.data.courses || [])
      } else {
        toast.error('Failed to load courses')
      }
    } catch (error) {
      console.error('Courses fetch error:', error)
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter
    return matchesSearch && matchesCategory && matchesLevel && matchesStatus
  })

  const columns: DataTableColumn<Course>[] = [
    {
      key: 'title',
      label: 'Course',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{value}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
    },
    {
      key: 'level',
      label: 'Level',
      sortable: true,
      render: (value) => value.charAt(0).toUpperCase() + value.slice(1),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Badge className={cn('font-medium', statusColors[value as keyof typeof statusColors])}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    },
  ]

  const handleEdit = (course: Course) => {
    window.location.href = `/instructor-courses/${course._id}/edit`
  }

  const handleDuplicate = async (course: Course) => {
    toast.info('Duplicate feature coming soon')
  }

  const handleDelete = async (course: Course) => {
    if (!confirm(`Are you sure you want to delete "${course.title}"?`)) {
      return
    }

    try {
      const response = await deleteCourse(course._id)
      if (response.success) {
        toast.success('Course deleted successfully')
        fetchCourses()
      } else {
        toast.error('Failed to delete course')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete course')
    }
  }

  const handleViewAnalytics = (course: Course) => {
    window.location.href = `/instructor-courses/${course._id}/analytics`
  }

  const handlePublish = async (course: Course) => {
    try {
      const response = await publishCourse(course._id)
      if (response.success) {
        toast.success('Course published successfully')
        fetchCourses()
      } else {
        toast.error('Failed to publish course')
      }
    } catch (error) {
      console.error('Publish error:', error)
      toast.error('Failed to publish course')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading courses...</p>
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
        title="My Courses"
        actions={
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        }
      />

      {/* Filters */}
      <Card className="p-6 border border-gray-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Web Development">Web Development</SelectItem>
              <SelectItem value="Programming">Programming</SelectItem>
              <SelectItem value="Backend">Backend</SelectItem>
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Published">Published</SelectItem>
              <SelectItem value="Archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Courses Table */}
      {filteredCourses.length === 0 && searchQuery === '' && categoryFilter === 'all' && levelFilter === 'all' && statusFilter === 'all' ? (
        <Card className="border border-gray-200 dark:border-slate-700">
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            subtitle="Create your first course to get started"
            action={{
              label: "Create Course",
              onClick: () => console.log('Create course'),
            }}
          />
        </Card>
      ) : (
        <Card className="border border-gray-200 dark:border-slate-700">
          <DataTable
            columns={columns}
            data={filteredCourses}
            actions={(course) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(course)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  {course.status === 'draft' && (
                    <DropdownMenuItem onClick={() => handlePublish(course)}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Publish
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => handleDuplicate(course)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleViewAnalytics(course)}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDelete(course)}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </Card>
      )}
    </motion.div>
  )
}
