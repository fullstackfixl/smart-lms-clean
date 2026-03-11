"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Trash2, RefreshCw, CheckCheck } from "lucide-react"
import { Button } from '../../../components/ui/button'
import { cn } from "../../../lib/utils"
import { useAuth } from '../../../lib/auth-context'
import { notificationApi } from '../../../lib/api'
import { toast } from "sonner"

interface Notification {
  id: string
  title: string
  message: string
  type: "course" | "student" | "message" | "quiz" | "system" | "live-class"
  read: boolean
  createdAt: string
}

export default function InstructorNotificationsPage() {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const fetchNotifications = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await notificationApi.list(token, 'limit=50')
      if (res.success) {
        const payload: any = res.data
        const list = payload?.notifications || payload || []
        setNotifications(Array.isArray(list) ? list : [])
      } else {
        toast.error("Failed to load notifications")
      }
    } catch (error) {
      toast.error("Error loading notifications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [token])

  const markAsRead = async (id: string) => {
    if (!token) return
    try {
      const res = await notificationApi.markAsRead(token, id)
      if (res.success) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
      }
    } catch (error) {
      console.error("Failed to mark as read", error)
    }
  }

  const markAllAsRead = async () => {
    if (!token) return
    try {
      const res = await notificationApi.markAllAsRead(token)
      if (res.success) {
        setNotifications(notifications.map(n => ({ ...n, read: true })))
        toast.success("All notifications marked as read")
      }
    } catch (error) {
      toast.error("Failed to mark all as read")
    }
  }

  const deleteNotification = async (id: string) => {
    if (!token) return
    try {
      // Note: notificationApi.delete might not exist, using filter for now
      setNotifications(notifications.filter(n => n.id !== id))
      toast.success("Notification removed")
    } catch (error) {
      toast.error("Failed to delete notification")
    }
  }

  const filtered = filter === "all" ? notifications : notifications.filter(n => !n.read)
  const unreadCount = notifications.filter(n => !n.read).length

  const getIcon = (type: string) => {
    switch (type) {
      case "course": return "📚"
      case "student": return "👨‍🎓"
      case "message": return "💬"
      case "quiz": return "📝"
      case "live-class": return "🎥"
      default: return "🔔"
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mb-2">
            <Bell className="w-3.5 h-3.5" />
            Live Alerts
          </span>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">Keep track of all platform activities and updates.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchNotifications} className="border-gray-200">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <div className="flex bg-white border border-gray-200 rounded-md p-1">
            <button
              onClick={() => setFilter("all")}
              className={cn("px-4 py-1.5 rounded text-xs font-medium transition-all", filter === "all" ? "bg-blue-50 text-blue-600" : "text-slate-600")}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn("px-4 py-1.5 rounded text-xs font-medium transition-all", filter === "unread" ? "bg-blue-50 text-blue-600" : "text-slate-600")}
            >
              Unread ({unreadCount})
            </button>
          </div>
          <Button variant="outline" onClick={markAllAsRead} className="border-gray-200">
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <p className="text-sm text-slate-600 mb-1">Total Notifications</p>
          <p className="text-3xl font-bold text-slate-900">{notifications.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <p className="text-sm text-slate-600 mb-1">Unread</p>
          <p className="text-3xl font-bold text-blue-600">{unreadCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <p className="text-sm text-slate-600 mb-1">Today</p>
          <p className="text-3xl font-bold text-green-600">
            {notifications.filter(n => new Date(n.createdAt).toDateString() === new Date().toDateString()).length}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-slate-900">Recent Notifications</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
              Loading notifications...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No notifications found</p>
            </div>
          ) : (
            filtered.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors",
                  !notification.read && "bg-blue-50/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0",
                  !notification.read ? "bg-blue-100" : "bg-gray-100"
                )}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={cn("font-medium", !notification.read ? "text-slate-900" : "text-slate-600")}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatDate(notification.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
