"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Video, Edit, Trash2, ExternalLink } from "lucide-react"
import { PageHeader } from "@/components/instructor/page-header"
import { DataTable, DataTableColumn } from "@/components/instructor/data-table"
import { EmptyState } from "@/components/instructor/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getLiveClasses, cancelLiveClass } from "@/lib/services/instructorApi"
import { CreateLiveClassModal } from "@/components/live-classes/CreateLiveClassModal"
import { toast } from "sonner"

interface LiveClass {
  _id: string
  title: string
  course_id: {
    _id: string
    title: string
  }
  scheduled_date: string
  duration: number
  status: 'scheduled' | 'live' | 'completed' | 'cancelled'
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  live: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export default function LiveClassesPage() {
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchLiveClasses()
  }, [])

  const fetchLiveClasses = async () => {
    try {
      setLoading(true)
      const response = await getLiveClasses()
      
      if (response.success && response.data) {
        setClasses(response.data.liveClasses || response.data || [])
      } else {
        toast.error('Failed to load live classes')
      }
    } catch (error) {
      console.error('Live classes fetch error:', error)
      toast.error('Failed to load live classes')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (classItem: LiveClass) => {
    if (!confirm(`Are you sure you want to cancel "${classItem.title}"?`)) {
      return
    }

    try {
      const response = await cancelLiveClass(classItem._id)
      if (response.success) {
        toast.success('Live class cancelled successfully')
        fetchLiveClasses()
      } else {
        toast.error('Failed to cancel live class')
      }
    } catch (error) {
      console.error('Cancel error:', error)
      toast.error('Failed to cancel live class')
    }
  }

  const handleCreateSuccess = () => {
    fetchLiveClasses()
  }

  const columns: DataTableColumn<LiveClass>[] = [
    {
      key: 'title',
      label: 'Class Details',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            <Video className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{value}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'course_id',
      label: 'Course',
      sortable: true,
      render: (value: any) => value?.title || 'Unknown Course',
    },
    {
      key: 'scheduled_date',
      label: 'Schedule',
      sortable: true,
      render: (value: string) => {
        const date = new Date(value)
        return (
          <div>
            <p className="text-slate-900 dark:text-slate-100">
              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )
      },
    },
    {
      key: 'duration',
      label: 'Duration',
      sortable: true,
      render: (value) => `${value} min`,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Badge className={cn('font-medium', statusColors[value as keyof typeof statusColors])}>
          {value === 'live' && (
            <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          )}
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading live classes...</p>
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
        title="Live Classes"
        actions={
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule New Class
          </Button>
        }
      />

      {classes.length === 0 ? (
        <Card className="border border-gray-200 dark:border-slate-700">
          <EmptyState
            icon={Video}
            title="No live classes scheduled"
            subtitle="Schedule your first live class to connect with your students"
            action={{
              label: "Schedule New Class",
              onClick: () => setShowCreateModal(true),
            }}
          />
        </Card>
      ) : (
        <Card className="border border-gray-200 dark:border-slate-700">
          <DataTable
            columns={columns}
            data={classes}
            actions={(classItem) => (
              <div className="flex items-center gap-2">
                {classItem.status === 'live' && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Join
                  </Button>
                )}
                {classItem.status === 'scheduled' && (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => toast.info('Edit feature coming soon')}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleCancel(classItem)}>
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </>
                )}
              </div>
            )}
          />
        </Card>
      )}

      <CreateLiveClassModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </motion.div>
  )
}
