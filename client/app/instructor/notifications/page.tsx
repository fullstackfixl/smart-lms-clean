"use client"

import { useState, useEffect } from "react"
import {
  Bell, Check, CheckCheck, Trash2, Filter, AlertCircle,
  Info, CheckCircle2, XCircle, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { API_URL } from "@/lib/config"

interface Notification {
  _id: string
  type: string
  title: string
  message: string
  status: 'pending' | 'sent' | 'read' | 'dismissed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  sender_id?: {
    name: string
    email: string
  }
  created_at: string
  metadata?: any
}

export default function InstructorNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
  }, [statusFilter])

  async function loadNotifications() {
    setLoading(true)
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) return

      const params = new URLSearchParams({
        limit: '50'
      })
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/instructor/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setNotifications(data.data.notifications || [])
          setUnreadCount(data.data.unreadCount || 0)
        }
      }
    } catch (error) {
      toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) return

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await fetch(`${API_URL}/instructor/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success("Notification marked as read")
        loadNotifications()
      }
    } catch (error) {
      toast.error("Failed to mark notification as read")
    }
  }

  async function markAllAsRead() {
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) return

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await fetch(`${API_URL}/instructor/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success("All notifications marked as read")
        loadNotifications()
      }
    } catch (error) {
      toast.error("Failed to mark all as read")
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      const token = window.sessionStorage.getItem('instatute_token') || window.localStorage.getItem('instatute_token')
      if (!token) return

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const response = await fetch(`${API_URL}/instructor/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success("Notification deleted")
        loadNotifications()
      }
    } catch (error) {
      toast.error("Failed to delete notification")
    }
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'bg-gray-500/10 text-gray-500',
      medium: 'bg-blue-500/10 text-blue-500',
      high: 'bg-orange-500/10 text-orange-500',
      urgent: 'bg-red-500/10 text-red-500'
    }
    return (
      <Badge className={variants[priority as keyof typeof variants] || variants.medium}>
        {priority}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const isUnread = (notification: Notification) => {
    return notification.status === 'pending' || notification.status === 'sent'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="bg-orange-500 text-white">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">Stay updated with important information</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Notifications</SelectItem>
            <SelectItem value="pending">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border bg-muted/20">
          <Bell className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium">No notifications</p>
          <p className="text-sm text-muted-foreground">
            {statusFilter !== 'all' ? 'Try changing the filter' : 'You\'re all caught up!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={cn(
                "p-4 rounded-xl border transition-all duration-200 hover:shadow-md",
                isUnread(notification)
                  ? "bg-orange-500/5 border-orange-500/20"
                  : "bg-card border-border/50"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getTypeIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {notification.title}
                        </h3>
                        {isUnread(notification) && (
                          <div className="h-2 w-2 rounded-full bg-orange-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>
                    
                    {/* Priority Badge */}
                    {getPriorityBadge(notification.priority)}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(notification.created_at).toLocaleString()}
                    </div>
                    {notification.sender_id && (
                      <div>
                        From: {notification.sender_id.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isUnread(notification) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification._id)}
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotification(notification._id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
