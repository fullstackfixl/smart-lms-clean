"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Bell, BookOpen, User, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/instructor/page-header"
import { EmptyState } from "@/components/instructor/empty-state"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn, formatRelativeTime } from "@/lib/utils"
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/services/instructorApi"
import { toast } from "sonner"

interface Notification {
  _id: string
  type: string
  title: string
  message: string
  created_at: string
  status: string
  priority?: string
}

const iconMap: Record<string, any> = {
  course: BookOpen,
  student: User,
  system: AlertCircle,
  default: Bell,
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await getNotifications({
        status: filter === 'unread' ? 'pending' : filter === 'all' ? undefined : filter,
        limit: 50
      })
      
      if (response.success && response.data) {
        setNotifications(response.data.notifications || [])
      } else {
        toast.error('Failed to load notifications')
      }
    } catch (error) {
      console.error('Notifications fetch error:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await markNotificationRead(notificationId)
      if (response.success) {
        fetchNotifications()
      }
    } catch (error) {
      console.error('Mark as read error:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await markAllNotificationsRead()
      if (response.success) {
        toast.success('All notifications marked as read')
        fetchNotifications()
      }
    } catch (error) {
      console.error('Mark all as read error:', error)
      toast.error('Failed to mark all as read')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading notifications...</p>
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
        title="Notifications"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              Mark All as Read
            </Button>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {notifications.length === 0 ? (
        <Card className="border border-gray-200 dark:border-slate-700">
          <EmptyState
            icon={Bell}
            title="No notifications"
            subtitle="You're all caught up!"
          />
        </Card>
      ) : (
        <Card className="border border-gray-200 dark:border-slate-700 divide-y divide-gray-200 dark:divide-slate-700">
          {notifications.map((notification) => {
            const Icon = iconMap[notification.type] || iconMap.default
            const isUnread = notification.status === 'pending' || notification.status === 'sent'
            
            return (
              <div
                key={notification._id}
                className={cn(
                  "p-6 hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer",
                  isUnread && "bg-blue-50/50 dark:bg-slate-800/50"
                )}
                onClick={() => isUnread && handleMarkAsRead(notification._id)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            {notification.title}
                          </h3>
                          {isUnread && (
                            <span className="h-2 w-2 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {notification.message}
                        </p>
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatRelativeTime(new Date(notification.created_at))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </motion.div>
  )
}
