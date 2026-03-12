"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Bell, Search, Check, CheckCheck, Trash2, Loader2, 
  Calendar, BookOpen, Users, Award, AlertCircle
} from "lucide-react"
import { notificationApi } from "../../../lib/api"
import { useAuth } from "../../../lib/auth-context"
import { Button } from "../../../components/ui/button"
import { toast } from "sonner"

interface Notification {
  _id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  link?: string
}

export default function NotificationsPage() {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    if (token) loadNotifications()
  }, [token])

  async function loadNotifications() {
    setLoading(true)
    try {
      if (!token) return
      const response = await notificationApi.list(token)
      if (response.success && response.data) {
        const data = response.data as { notifications?: Notification[] }
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: string) {
    try {
      if (!token) return
      await notificationApi.markAsRead(token, id)
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      )
    } catch (error) {
      toast.error("Failed to mark as read")
    }
  }

  async function markAllAsRead() {
    try {
      if (!token) return
      await notificationApi.markAllAsRead(token)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success("All notifications marked as read")
    } catch (error) {
      toast.error("Failed to mark all as read")
    }
  }

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications

  const unreadCount = notifications.filter(n => !n.isRead).length

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="w-4 h-4" />
      case 'event': return <Calendar className="w-4 h-4" />
      case 'enrollment': return <Users className="w-4 h-4" />
      case 'certificate': return <Award className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'course': return 'bg-blue-50 text-blue-600 border-blue-100'
      case 'event': return 'bg-purple-50 text-purple-600 border-purple-100'
      case 'enrollment': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
      case 'certificate': return 'bg-orange-50 text-orange-600 border-orange-100'
      default: return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-500">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">Stay updated with your organization.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadNotifications} className="border-gray-200">
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2"
      >
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          className={filter === 'all' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-gray-200'}
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          className={filter === 'unread' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-gray-200'}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </Button>
      </motion.div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 rounded-md">
          <Bell className="w-12 h-12 text-slate-300 mb-4" />
          <p className="text-slate-500">No notifications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className={`bg-white border rounded-md p-5 transition-colors hover:border-gray-300 ${
                notification.isRead ? 'border-gray-200' : 'border-blue-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 border ${getTypeColor(notification.type)}`}>
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className={`text-base font-semibold ${notification.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="shrink-0 p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
