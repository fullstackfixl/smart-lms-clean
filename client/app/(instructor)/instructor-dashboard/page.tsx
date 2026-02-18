"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Users, Video, TrendingUp, Plus, Upload, FileText, Calendar } from "lucide-react"
import { PageHeader } from "@/components/instructor/page-header"
import { StatCard } from "@/components/instructor/stat-card"
import { EmptyState } from "@/components/instructor/empty-state"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getDashboardOverview } from "@/lib/services/instructorApi"
import { toast } from "sonner"

interface DashboardData {
  totalCourses: number
  totalStudents: number
  totalLectures: number
  completionRate: number
  upcomingClasses: Array<{
    _id: string
    title: string
    course_id: { title: string }
    scheduled_date: string
    duration: number
  }>
}

const quickActions = [
  {
    icon: Plus,
    label: 'Create Course',
    description: 'Start a new course',
    href: '/instructor-courses/new',
    color: 'blue',
  },
  {
    icon: Upload,
    label: 'Upload Content',
    description: 'Add video lectures',
    href: '/instructor-upload',
    color: 'green',
  },
  {
    icon: FileText,
    label: 'View Submissions',
    description: 'Review student work',
    href: '/instructor-submissions',
    color: 'purple',
  },
  {
    icon: Calendar,
    label: 'Schedule Class',
    description: 'Plan a live session',
    href: '/instructor-live-classes/new',
    color: 'orange',
  },
]

const colorClasses = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30',
  green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30',
  orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30',
}

export default function InstructorDashboard() {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const userName = "Instructor" // TODO: Get from auth context

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await getDashboardOverview()
      
      if (response.success && response.data) {
        setDashboardData(response.data)
      } else {
        toast.error('Failed to load dashboard data')
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">Failed to load dashboard data</p>
          <Button onClick={fetchDashboardData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-10"
    >
      {/* Welcome Message */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Welcome back, {userName}
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400">
          Here's what's happening with your courses today
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Courses"
          value={dashboardData.totalCourses}
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          label="Total Students"
          value={dashboardData.totalStudents}
          icon={Users}
          color="green"
        />
        <StatCard
          label="Total Lectures"
          value={dashboardData.totalLectures}
          icon={Video}
          color="purple"
        />
        <StatCard
          label="Completion Rate"
          value={`${Math.round(dashboardData.completionRate)}%`}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Upcoming Live Classes */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Upcoming Live Classes
          </h2>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Schedule Live Class
          </Button>
        </div>

        {dashboardData.upcomingClasses.length === 0 ? (
          <Card className="border border-gray-200 dark:border-slate-700">
            <EmptyState
              icon={Calendar}
              title="No upcoming classes"
              subtitle="Schedule your first live class to connect with your students"
              action={{
                label: "Schedule Live Class",
                onClick: () => window.location.href = '/instructor-live-classes',
              }}
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {dashboardData.upcomingClasses.map((classItem) => {
              const scheduledDate = new Date(classItem.scheduled_date)
              return (
                <Card
                  key={classItem._id}
                  className="p-6 border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        {classItem.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {classItem.course_id?.title || 'Unknown Course'}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                        <span>
                          {scheduledDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span>
                          {scheduledDate.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>{classItem.duration} min</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Join
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <motion.a
                key={action.label}
                href={action.href}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={cn(
                  "p-6 border border-gray-200 dark:border-slate-700 cursor-pointer transition-all",
                  "hover:shadow-md"
                )}>
                  <div className={cn(
                    "h-12 w-12 rounded-lg flex items-center justify-center mb-4",
                    colorClasses[action.color as keyof typeof colorClasses]
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    {action.label}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {action.description}
                  </p>
                </Card>
              </motion.a>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}